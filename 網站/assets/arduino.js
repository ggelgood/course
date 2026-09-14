/* ═══════════════════════════════════════════════════════════
   Arduino 課專用互動 —— 只有這門課的講義會 link 這個檔。
   共用的東西（點擊揭曉、打勾清單、預測題、求救框…）走 lesson.js，
   這裡只放這門課才有的元件。

   引用順序一定是 lesson.css 在前、arduino.css／arduino.js 在後。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ═══ 元件 1：擴展板插入模擬（plugsim）═════════════════════
   為什麼長這樣：真實接線時，三條線是固定在同一個三芯端子裡的，
   順序換不掉；擴展板上也是一整排固定的 G／V／S。學生真正要判斷
   的是「整組插在第幾腳、有沒有轉反、有沒有插歪一格」，而不是
   「紅線該配哪一格」。所以這裡不做一條一條配對，做整組插入。

   三種錯誤都是真的會發生的：
     · 插歪一格 → 模組的 V 直接對到板子的 G ＝ 短路（最危險）
     · 接頭轉 180° → V 還是對到 V，但 G 跟 S 對調 ＝ 零件不動
     · 沒對準     → 根本沒插到

   HTML：
     <div class="plugsim" data-plugsim
          data-rows="G,V,S" data-pins="2,3,4,5,6,7,8"></div>

   ⚠️ data-rows 是「由上到下」的排列順序，要跟你手上那塊擴展板
      絲印的順序一致。板子不一樣就改這個屬性，程式不用動。
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('[data-plugsim]').forEach(root => {

  /* ── 版面座標（SVG 使用者單位）── */
  const P     = 42;                  // 排距＝腳距，正好讓接頭三支腳對上三排
  const COL0  = 215;                 // 第一根腳位的 x（左邊要留給翻面後甩過去的模組）
  const TOP   = 235;                 // 最上面那一排的 y
  const HOMEY = 70;                  // 還沒插進去時，接頭停在板子上方

  const ROWS = (root.dataset.rows || 'G,V,S').split(',').map(s => s.trim());
  const PINS = (root.dataset.pins || '2,3,4,5,6,7,8').split(',').map(s => s.trim());
  const NC   = PINS.length;
  const LAST = ROWS.length - 1;

  const COLOR = { G:'#26282B', V:'#C0392B', S:'#E0A800' };
  const FULL  = { G:'G（黑線・接地）', V:'V（紅線・電源）', S:'S（黃線・訊號）' };

  const colX   = i => COL0 + i * P;
  const stripW = NC * P;
  const homeX  = colX(Math.min(3, NC - 1));

  /* 畫布寬度跟著腳位數走：右邊要放得下模組（接頭往右 204），
     左邊要放得下翻面後甩過去的模組，所以 COL0 不能太小。     */
  const BX  = 110;                       // 板子左緣
  const BW  = stripW + 268;              // 板子寬度
  const VBW = BX + BW + 70;              // viewBox 寬

  /* ── 畫板子 ── */
  let board = '';
  ROWS.forEach((r, i) => {
    const y = TOP + i * P;
    board += '<rect class="ps-strip" x="' + (COL0 - P / 2) + '" y="' + (y - 17) +
             '" width="' + stripW + '" height="34" rx="4" fill="' + (COLOR[r] || '#555') + '"/>';
    board += '<text class="ps-rowlab" x="' + (COL0 - P / 2 - 14) + '" y="' + (y + 7) +
             '" text-anchor="end">' + r + '</text>';
    for (let c = 0; c < NC; c++) {
      board += '<rect class="ps-hole" x="' + (colX(c) - 8) + '" y="' + (y - 8) + '" width="16" height="16" rx="3"/>' +
               '<rect class="ps-pin"  x="' + (colX(c) - 3) + '" y="' + (y - 3) + '" width="6"  height="6"  rx="1"/>';
    }
  });
  let nums = '';
  PINS.forEach((p, c) => {
    nums += '<text class="ps-num" x="' + colX(c) + '" y="' + (TOP - 27) + '" text-anchor="middle">' + p + '</text>';
  });

  /* ── 畫接頭＋模組（原點＝最上面那支腳的圓心）── */
  let plug = '<rect class="ps-shell" x="-19" y="-25" width="38" height="' + (2 * P + 50) + '" rx="7"/>';
  ROWS.forEach((r, k) => {
    plug += '<rect class="ps-slot" x="-10" y="' + (k * P - 10) + '" width="20" height="20" rx="3" fill="' +
            (COLOR[r] || '#555') + '"/>';
  });
  ROWS.forEach((r, k) => {                       // 三條線從接頭側面出去接到模組
    const y = k * P, my = 14 + k * 22;
    plug += '<path class="ps-wire" d="M19 ' + y + ' C 50 ' + y + ', 58 ' + my + ', 88 ' + my +
            '" stroke="' + (COLOR[r] || '#555') + '"/>';
  });
  plug += '<rect class="ps-mod" x="88" y="-8" width="116" height="96" rx="9"/>';
  ROWS.forEach((r, k) => {
    plug += '<text class="ps-modlab" x="98" y="' + (19 + k * 22) + '">' + r + '</text>';
  });
  plug += '<circle class="ps-led" cx="176" cy="24" r="8"/>' +
          '<text class="ps-modname" x="128" y="74">模組</text>' +
          '<rect class="ps-glow" x="-23" y="-29" width="46" height="' + (2 * P + 58) + '" rx="9"/>';

  root.innerHTML =
    '<p class="plugsim__task">任務：把模組的三芯接頭<b>整組</b>插到擴展板上——插對了，程式裡才寫得出腳位號碼。</p>' +
    '<div class="plugsim__stage">' +
    '<svg class="plugsim__svg" viewBox="0 0 ' + VBW + ' 380" role="img"' +
    ' aria-label="擴展板插入模擬：把三芯接頭拖到擴展板上對齊的插槽">' +
      '<rect class="ps-pcb" x="' + BX + '" y="185" width="' + BW + '" height="170" rx="10"/>' +
      '<rect class="ps-pcb-edge" x="' + (BX + 8) + '" y="193" width="' + (BW - 16) + '" height="154" rx="7"/>' +
      '<text class="ps-silk" x="' + (COL0 - P / 2 + stripW + 20) + '" y="' + (TOP + P) + '">SENSOR</text>' +
      '<text class="ps-silk" x="' + (COL0 - P / 2 + stripW + 20) + '" y="' + (TOP + P + 18) + '">SHIELD</text>' +
      '<text class="ps-silk" x="' + (BX + 16) + '" y="' + (TOP - 27) + '">腳位</text>' +
      board + nums +
      '<rect class="ps-zapbox" data-zap x="0" y="0" width="0" height="0" rx="5"/>' +
      '<g class="ps-plug" data-plug tabindex="0" role="button"' +
      ' aria-label="三芯接頭，可以拖曳；也可以用方向鍵移動、Enter 插入、F 翻面">' +
        '<g data-shake>' + plug + '</g>' +
      '</g>' +
    '</svg></div>' +
    '<div class="plugsim__bar">' +
      '<button type="button" class="psbtn" data-flip>🔄 把接頭翻面</button>' +
      '<button type="button" class="psbtn psbtn--go" data-insert>⬇️ 插下去</button>' +
      '<button type="button" class="psbtn" data-reset>↺ 從頭再來</button>' +
    '</div>' +
    '<p class="plugsim__msg" data-msg aria-live="polite">先把接頭拖到你想接的那一腳，對齊三排再插下去。</p>' +
    '<p class="plugsim__hint">用滑鼠或手指拖曳；也可以按 Tab 選到接頭後，用方向鍵移動、Enter 插下去、F 翻面。</p>';

  const svg    = root.querySelector('.plugsim__svg');
  const gPlug  = root.querySelector('[data-plug]');
  const gShake = root.querySelector('[data-shake]');
  const zap    = root.querySelector('[data-zap]');
  const msg    = root.querySelector('[data-msg]');

  /* ── 狀態 ── */
  const st = { col:Math.min(3, NC - 1), off:0, home:true, flipped:false, placed:false,
               drag:false, fx:homeX, fy:HOMEY };

  const where = () => st.drag ? { x:st.fx, y:st.fy }
                    : st.home ? { x:homeX, y:HOMEY }
                              : { x:colX(st.col), y:TOP + st.off * P };

  const draw = () => {
    const p = where();
    gPlug.setAttribute('transform',
      'translate(' + p.x + ' ' + p.y + ')' + (st.flipped ? ' rotate(180 0 ' + P + ')' : ''));
    root.classList.toggle('is-placed', st.placed);
    gPlug.classList.toggle('ps-ok', st.placed);
  };

  const say = (text, kind) => {
    msg.innerHTML = text;
    msg.className = 'plugsim__msg' + (kind ? ' --' + kind : '');
  };

  const shake = () => {
    gShake.classList.remove('ps-shake');
    void gShake.getBoundingClientRect();
    gShake.classList.add('ps-shake');
  };

  /* 把「碰在一起的那兩格」框起來閃紅 */
  const flashShort = (boardRow) => {
    const y = TOP + boardRow * P;
    zap.setAttribute('x', colX(st.col) - 15);
    zap.setAttribute('y', y - 15);
    zap.setAttribute('width', 30);
    zap.setAttribute('height', 30);
    zap.classList.remove('ps-zap');
    void zap.getBoundingClientRect();
    zap.classList.add('ps-zap');
  };

  /* ── 判定：接頭上第 k 支腳（由上往下數）是模組的哪一條線 ── */
  const pinAt = k => st.flipped ? ROWS[LAST - k] : ROWS[k];

  const judge = () => {
    if (st.home) { say('接頭還浮在板子上面，先拖下來對準一排再插。'); return; }

    /* 對齊、方向也對 → 成功 */
    if (st.off === 0 && !st.flipped) {
      st.placed = true; draw();
      say('✅ 插對了！三支腳分別對到 ' + ROWS.join('、') + '，而且你接的是 <b>' + PINS[st.col] + ' 號腳</b>——' +
          '等一下程式裡要寫的就是這個數字。<br>換一腳也完全可以，只要程式裡的號碼跟著改。', 'ok');
      return;
    }

    /* 對齊但轉了 180° → V 還是 V，G 跟 S 對調 */
    if (st.off === 0) {
      shake();
      say('❌ 接頭轉反了。中間那支剛好還是 V 對 V，但模組的' + FULL[pinAt(0)] + '接到了板子的 ' + ROWS[0] +
          '、' + FULL[pinAt(LAST)] + '接到了板子的 ' + ROWS[LAST] + '——<b>訊號線跟接地線對調</b>，' +
          '零件不會動，訊號腳還可能被燒掉。轉回來再插一次。', 'bad');
      return;
    }

    /* 插歪一格 → 一定有一支腳懸空，而且 V 會碰到 G ＝ 短路 */
    shake();
    let hitRow = null, modPin = null, boardPin = null, floating = null;
    for (let k = 0; k <= LAST; k++) {
      const br = st.off + k;
      if (br < 0 || br > LAST) { floating = pinAt(k); continue; }
      const m = pinAt(k), b = ROWS[br];
      if ((m === 'V' && b === 'G') || (m === 'G' && b === 'V')) {
        hitRow = br; modPin = m; boardPin = b;
      }
    }
    if (hitRow !== null) flashShort(hitRow);
    const head = modPin
      ? '⚡ 差一格！模組的' + FULL[modPin] + '直接對到板子的' + FULL[boardPin] + '，'
      : '⚡ 差一格！三支腳沒有各自對到一排，';
    const tail = modPin
      ? '<b>V 碰到 G 就是短路</b>——通電的話會發燙、冒煙，零件可能直接燒掉。' +
        '這就是為什麼接完一定要先檢查，才插 USB。'
      : '零件不會動；而且只要再歪一點點，V 就會碰到 G 變成短路。';
    say(head + '最' + (st.off > 0 ? '下' : '上') + '面那支' + FULL[floating] + '還懸空沒插到。<br>' +
        tail, 'bad');
  };

  /* ── 滑鼠／手指拖曳 ── */
  const toSvg = (e) => {
    const r = svg.getBoundingClientRect();
    const k = VBW / r.width;                       // viewBox 寬 ÷ 實際寬
    return { x:(e.clientX - r.left) * k, y:(e.clientY - r.top) * k };
  };

  let grab = null;
  svg.addEventListener('pointerdown', e => {
    if (!e.target.closest('[data-plug]')) return;
    const p = toSvg(e), w = where();
    grab = { dx:p.x - w.x, dy:p.y - w.y };
    st.drag = true; st.home = false; st.placed = false;
    st.fx = w.x; st.fy = w.y;
    svg.setPointerCapture(e.pointerId);
    gPlug.focus();
    draw(); e.preventDefault();
  });

  svg.addEventListener('pointermove', e => {
    if (!st.drag) return;
    const p = toSvg(e);
    st.fx = Math.max(COL0 - 30, Math.min(colX(NC - 1) + 30, p.x - grab.dx));
    st.fy = Math.max(20, Math.min(TOP + P, p.y - grab.dy));
    draw();
  });

  const drop = (e) => {
    if (!st.drag) return;
    st.drag = false;
    if (svg.hasPointerCapture && svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    /* 放手：吸附到最近的腳位與最近的一排 */
    st.col = Math.max(0, Math.min(NC - 1, Math.round((st.fx - COL0) / P)));
    if (st.fy < TOP - P * 1.2) {                   // 丟在板子外面＝還沒插
      st.home = true; draw();
      say('接頭還浮在板子上面，先拖下來對準一排再插。');
      return;
    }
    st.off = Math.max(-1, Math.min(1, Math.round((st.fy - TOP) / P)));
    draw();
    judge();
  };
  svg.addEventListener('pointerup', drop);
  svg.addEventListener('pointercancel', drop);

  /* ── 鍵盤操作（跟拖曳共用同一套狀態）── */
  gPlug.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      st.home = false; st.placed = false;
      st.col = Math.max(0, Math.min(NC - 1, st.col + (k === 'ArrowRight' ? 1 : -1)));
    } else if (k === 'ArrowDown' || k === 'ArrowUp') {
      st.placed = false;
      if (st.home) { st.home = false; st.off = 0; }
      else st.off = Math.max(-1, Math.min(1, st.off + (k === 'ArrowDown' ? 1 : -1)));
    } else if (k === 'Enter' || k === ' ') {
      judge();
    } else if (k === 'f' || k === 'F') {
      st.flipped = !st.flipped; st.placed = false;
    } else return;
    e.preventDefault();
    draw();
  });

  /* ── 按鈕 ── */
  root.querySelector('[data-flip]').addEventListener('click', () => {
    st.flipped = !st.flipped; st.placed = false; draw();
    say(st.flipped ? '接頭轉了 180°——線改成從下面出去了。這樣插下去會怎樣？'
                   : '轉回來了，線從上面出去。');
  });
  root.querySelector('[data-insert]').addEventListener('click', judge);
  root.querySelector('[data-reset]').addEventListener('click', () => {
    st.col = Math.min(3, NC - 1); st.off = 0;
    st.home = true; st.flipped = false; st.placed = false; st.drag = false;
    draw();
    say('先把接頭拖到你想接的那一腳，對齊三排再插下去。');
  });

  draw();
});

})();
