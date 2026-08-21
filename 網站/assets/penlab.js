/* ═══════════════════════════════════════════════════════════
   畫筆工作台 —— 進階第 2、3、12 課共用
   ───────────────────────────────────────────────────────────
   一台網頁版的小烏龜：角色在舞台上走，筆壓下去就留下線。

   HTML 這樣寫：
     <div class="penlab" data-penlab [data-full="1"]>
       <div class="cxstage penlab__stage" data-stage>
         <canvas class="penlab__cv" data-cv></canvas>
         <i class="penlab__dir" data-dir></i>
         <span class="cxcat penlab__cat" data-cat>🐱</span>
       </div>
       <div class="penlab__ctl"> …<button data-act="pen|move|turn|clear|corners|poly|random"> </div>
       <span data-swatches></span> <input data-size> <b data-sizeval>   （data-full 才需要）
       <input data-sides> <input data-angle>                            （data-act="poly" 才需要，第 3、12 課）
       <input data-len> <input data-cx> <input data-cy> <input type="checkbox" data-keep>   （第 12 課才需要：邊長、中心位置、疊加不清版）
       <p class="penlab__state" data-state></p>
     </div>

   座標跟 Scratch 一樣：x −240～240、y −180～180，面朝 90 度是右邊。

   ⚠️ 畫好的線存在 strokes 陣列裡，不是只存在 canvas 上——
      視窗一縮放 canvas 就會被清空，沒有這份紀錄畫好的圖會消失。
   ⚠️ 改完這個檔，記得把用到它的講義裡 penlab.js?v= 的數字 +1。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const XMAX = 240, YMAX = 180;
const COLORS = ['#4C97FF','#E5484D','#FF6B1A','#FFBF00','#12A594','#9966FF'];
const clamp = (v, m) => Math.max(-m, Math.min(m, v));
const rad = d => d * Math.PI / 180;

document.querySelectorAll('[data-penlab]').forEach(root => {
  const stage = root.querySelector('[data-stage]');
  const cv    = root.querySelector('[data-cv]');
  const cat   = root.querySelector('[data-cat]');
  const arrow = root.querySelector('[data-dir]');
  const info  = root.querySelector('[data-state]');
  if (!stage || !cv || !cat) return;
  const ctx = cv.getContext('2d');

  /* ── 狀態 ─────────────────────────────────────────────── */
  let x = 0, y = 0, head = 90, down = false;
  let color = COLORS[0], size = root.dataset.full ? 3 : 3;
  let strokes = [];          /* 每一段線都留著，縮放時重畫 */
  let dots = [];             /* 隨機落點留的小圓點（第 6 課用）*/
  let busy = false;

  /* ── 畫布 ─────────────────────────────────────────────── */
  const px = v => (v + XMAX) / (XMAX * 2) * cv.clientWidth;
  const py = v => (YMAX - v) / (YMAX * 2) * cv.clientHeight;

  /* ⚠️ 頁面剛載入時舞台可能還沒有寬高（字型、樣式還在套）。
     這時候設 canvas 尺寸會設成 0，之後畫什麼都看不到，
     所以量到 0 就先跳過，下一格再試。 */
  const fit = () => {
    if (!cv.clientWidth || !cv.clientHeight) { requestAnimationFrame(fit); return; }
    const dpr = window.devicePixelRatio || 1;
    cv.width  = Math.round(cv.clientWidth  * dpr);
    cv.height = Math.round(cv.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  };

  const line = s => {
    ctx.strokeStyle = s.c;
    /* 粗細也要跟著舞台縮放，不然小螢幕上會變成一坨 */
    ctx.lineWidth = s.w * (cv.clientWidth / (XMAX * 2));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px(s.x1), py(s.y1));
    ctx.lineTo(px(s.x2), py(s.y2));
    ctx.stroke();
  };

  const dot = d => {
    ctx.fillStyle = '#FFBF00';
    ctx.beginPath();
    ctx.arc(px(d.x), py(d.y), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#CC9900'; ctx.stroke();
  };

  function redraw() {
    ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
    strokes.forEach(line);
    dots.forEach(dot);
  }

  /* ── 畫面更新 ─────────────────────────────────────────── */
  const show = () => {
    const L = (x + XMAX) / (XMAX * 2) * 100, T = (YMAX - y) / (YMAX * 2) * 100;
    cat.style.left = L + '%';   cat.style.top = T + '%';
    if (arrow) {
      arrow.style.left = L + '%'; arrow.style.top = T + '%';
      arrow.style.transform = 'rotate(' + (head - 90) + 'deg)';
    }
    if (info) {
      info.innerHTML =
        '位置 (<b>' + String(x).replace('-','−') + '</b>, <b>' + String(y).replace('-','−') + '</b>)' +
        '　面朝 <b>' + head + '</b> 度' +
        '　筆：<b style="color:' + (down ? '#0C7268' : '#B24A12') + '">' +
        (down ? '壓著（會畫）' : '提起來（不會畫）') + '</b>';
    }
  };
  /* 「下筆／停筆」是同一顆按鈕，字要跟著狀態換 */
  const penBtn = () => root.querySelectorAll('[data-act="pen"]').forEach(b => {
    b.textContent = down ? '停筆' : '下筆';
    b.dataset.on = down ? '1' : '0';
  });

  /* ── 走一段（會動畫，才看得到「邊走邊畫」）───────────── */
  const glide = (nx, ny) => new Promise(done => {
    /* 一定要取整數。sin/cos 算出來會有 −0.000000000000004 這種尾巴，
       直接顯示會變成「位置 (60, 3.67e−15)」，學生看了只會困惑。 */
    nx = Math.round(clamp(nx, XMAX)); ny = Math.round(clamp(ny, YMAX));
    const x0 = x, y0 = y, t0 = performance.now();
    const dist = Math.hypot(nx - x0, ny - y0);
    const span = Math.min(600, Math.max(140, dist * 2.2));
    const seg = {x1:x0, y1:y0, x2:nx, y2:ny, c:color, w:size};
    cat.dataset.drag = '1';                    /* 動畫期間關掉 CSS 過渡 */

    /* 分頁被切到背景時瀏覽器會停掉 requestAnimationFrame。
       不處理的話動畫永遠跑不完，按鈕就一直卡在停用狀態。
       這種時候不做動畫，直接跳到終點。 */
    const jump = () => {
      x = nx; y = ny; show();
      if (down) { strokes.push(seg); redraw(); }
      cat.dataset.drag = '0';
      done();
    };
    if (document.hidden) { jump(); return; }

    const step = now => {
      const k = Math.min(1, (now - t0) / span);
      x = Math.round(x0 + (nx - x0) * k);
      y = Math.round(y0 + (ny - y0) * k);
      show();
      if (down) { redraw(); line({...seg, x2:x, y2:y}); }
      if (k < 1) { requestAnimationFrame(step); return; }
      jump();
    };
    requestAnimationFrame(step);
  });

  const forward = n => glide(x + Math.sin(rad(head)) * n, y + Math.cos(rad(head)) * n);
  const turnBy = deg => { head = ((head + deg) % 360 + 360) % 360; show(); };

  /* ── 一連串動作（走四個角落、畫多邊形用）───────────────── */
  const lock = on => {
    busy = on;
    root.querySelectorAll('.pbtn').forEach(b => b.disabled = on);
  };
  const run = async steps => {
    if (busy) return;
    lock(true);
    for (const s of steps) {
      if (s.pen !== undefined) { down = s.pen; penBtn(); show(); }
      if (s.go) await glide(s.go[0], s.go[1]);
      if (s.face !== undefined) { head = s.face; show(); }
      if (s.fwd !== undefined) await glide(x + Math.sin(rad(head)) * s.fwd, y + Math.cos(rad(head)) * s.fwd);
      if (s.turn !== undefined) turnBy(s.turn);
    }
    lock(false);
  };

  /* ── 按鈕 ─────────────────────────────────────────────── */
  root.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', async () => {
    if (busy && btn.dataset.act !== 'clear') return;
    switch (btn.dataset.act) {
      case 'pen':
        down = !down; penBtn(); show();
        break;
      case 'move':
        lock(true); await forward(60); lock(false);
        break;
      case 'turn':
        head = (head + 90) % 360; show();
        break;
      case 'clear':
        strokes = []; dots = []; redraw();
        break;
      case 'random': {
        /* 第 6 課：隨機取數塞進定位到 x y。落點留一個小點，
           連按幾次就變成一片隨機分布的星星。 */
        const nx = Math.round((Math.random() * 2 - 1) * XMAX);
        const ny = Math.round((Math.random() * 2 - 1) * YMAX);
        lock(true);
        const wasDown = down; down = false; penBtn();
        await glide(nx, ny);
        down = wasDown; penBtn();
        dots.push({x:nx, y:ny}); redraw();
        lock(false);
        break;
      }
      case 'corners':
        strokes = []; redraw();
        await run([
          {pen:false}, {face:90}, {go:[-200, 150]}, {pen:true},
          {go:[200, 150]}, {go:[200, -150]}, {go:[-200, -150]}, {go:[-200, 150]},
          {pen:false}, {go:[0, 0]}
        ]);
        break;
      case 'poly': {
        /* 第 3、12 課：重複畫多邊形。邊數／角度是學生自己填的，
           填錯角度（例如用內角而不是 360÷邊數）圖形就會歪掉或收不回來
           —— 這是故意的，錯了才有討論的東西。 */
        const sidesEl = root.querySelector('[data-sides]');
        const angleEl = root.querySelector('[data-angle]');
        const lenEl   = root.querySelector('[data-len]');
        const cxEl    = root.querySelector('[data-cx]');
        const cyEl    = root.querySelector('[data-cy]');
        const keepEl  = root.querySelector('[data-keep]');
        const sides = Math.max(3, Math.min(12, Math.round(+((sidesEl && sidesEl.value) || 4)) || 4));
        const angle = Math.max(1, Math.min(180, +((angleEl && angleEl.value) || 90)));
        if (sidesEl) sidesEl.value = sides;
        /* 第 12 課多了「邊長」「中心位置」「疊加」——一幅圖要畫好幾個圖形，
           不能每次都清版、也不能都畫在正中間。 */
        const len = lenEl ? Math.max(10, Math.min(120, +lenEl.value || 50))
                           : Math.max(18, Math.min(70, Math.round(260 / sides)));
        const cx = cxEl ? clamp(+cxEl.value || 0, XMAX) : 0;
        const cy = cyEl ? clamp(+cyEl.value || 0, YMAX) : 0;
        const keep = !!(keepEl && keepEl.checked);
        const steps = [{pen:false}, {face:90}, {go:[cx - len/2, cy - len/2]}, {pen:true}];
        for (let i = 0; i < sides; i++) { steps.push({fwd:len}); steps.push({turn:angle}); }
        steps.push({pen:false});
        if (!keep) { strokes = []; dots = []; redraw(); }
        await run(steps);
        break;
      }
    }
  }));

  /* ── 用滑鼠拖著走（筆壓著就會畫）───────────────────────
     這也是課本裡那個「我只是拖一下，怎麼多一條線」的情境。 */
  let dragging = false;
  const at = e => {
    const r = stage.getBoundingClientRect();
    return [clamp(Math.round((e.clientX - r.left) / r.width  * (XMAX*2) - XMAX), XMAX),
            clamp(Math.round(YMAX - (e.clientY - r.top) / r.height * (YMAX*2)), YMAX)];
  };
  stage.addEventListener('pointerdown', e => {
    if (busy) return;
    dragging = true; cat.dataset.drag = '1';
    stage.setPointerCapture(e.pointerId);
    [x, y] = at(e); show(); e.preventDefault();
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const [nx, ny] = at(e);
    if (down && (nx !== x || ny !== y)) {
      strokes.push({x1:x, y1:y, x2:nx, y2:ny, c:color, w:size});
      line(strokes[strokes.length - 1]);
    }
    x = nx; y = ny; show();
  });
  const drop = () => { dragging = false; cat.dataset.drag = '0'; };
  stage.addEventListener('pointerup', drop);
  stage.addEventListener('pointercancel', drop);

  /* ── 顏色與粗細（只有 data-full 的工作台才有）─────────── */
  const swat = root.querySelector('[data-swatches]');
  if (swat) {
    COLORS.forEach(c => {
      const b = document.createElement('button');
      b.className = 'pswatch'; b.style.background = c;
      b.setAttribute('aria-label', '筆的顏色');
      b.setAttribute('aria-pressed', String(c === color));
      b.addEventListener('click', () => {
        color = c;
        swat.querySelectorAll('.pswatch').forEach(o =>
          o.setAttribute('aria-pressed', String(o === b)));
      });
      swat.appendChild(b);
    });
  }
  const sz = root.querySelector('[data-size]'), szv = root.querySelector('[data-sizeval]');
  if (sz) {
    size = +sz.value;
    sz.addEventListener('input', () => {
      size = +sz.value;
      if (szv) szv.textContent = sz.value;
    });
  }

  /* ── 起步 ─────────────────────────────────────────────── */
  penBtn(); show();
  /* observer 要留著參照，不然可能被回收，之後縮放就不會重畫 */
  if (window.ResizeObserver) {
    root._ro = new ResizeObserver(fit);
    root._ro.observe(stage);
  }
  addEventListener('resize', fit);
  addEventListener('load', fit);                                   /* 圖片載完版面會位移 */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);   /* 字型載完也會 */
  fit();
});

})();
