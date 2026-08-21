/* ═══════════════════════════════════════════════════════════
   分身模擬台 —— 進階第 13、14 課共用
   ───────────────────────────────────────────────────────────
   本尊（cxcat）負責「生」，畫布上一堆會掉落的小圓點是「分身」，
   各自獨立下落，互不影響。第 14 課用同一個引擎示範「只生不刪」
   會怎麼爆掉，勾選「飛出就刪除」之後又會怎麼順回來。

   HTML 這樣寫：
     <div class="clonelab" data-clonelab data-limit="300">
       <div class="cxstage clonelab__stage" data-stage>
         <canvas class="clonelab__cv" data-cv></canvas>
         <span class="cxcat clonelab__master" data-master>🐱</span>
       </div>
       <div class="clonelab__ctl">
         <button data-act="rain">🚩 下 20 滴雨</button>
         <button data-act="burst">🔁 只生不刪</button>
         <button data-act="stop">⏸ 停止產生</button>
         <button data-act="reset">全部清空</button>
       </div>
       <label><input type="checkbox" data-delete> 飛出畫面下緣就刪除此分身</label>
       <p class="clonelab__state" data-state></p>
     </div>

   ⚠️ data-limit 只是「模擬上限」，用來重現撞到 300 個的感覺，
      不是真的去逼死瀏覽器——那樣反而沒辦法上課。
   ⚠️ 改完這個檔，記得把用到它的講義裡 clonelab.js?v= 的數字 +1。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const XMAX = 240, YMAX = 180;
const EMOJI = ['💧','⭐','🫧','🍬','🎈'];

document.querySelectorAll('[data-clonelab]').forEach(root => {
  const stage  = root.querySelector('[data-stage]');
  const cv     = root.querySelector('[data-cv]');
  const master = root.querySelector('[data-master]');
  const info   = root.querySelector('[data-state]');
  const delCb  = root.querySelector('[data-delete]');
  if (!stage || !cv) return;
  const ctx = cv.getContext('2d');

  const limit  = +root.dataset.limit || 300;
  const emoji  = root.dataset.emoji || EMOJI[0];
  const speed  = +root.dataset.speed || 3;

  let clones = [];          /* {x, y} 每一個獨立的分身 */
  let spawning = null;      /* 目前跑著的產生計時器 */
  let raf = null;
  let jammed = false;       /* 撞到上限，畫面卡住了 */

  const px = v => (v + XMAX) / (XMAX * 2) * cv.clientWidth;
  const py = v => (YMAX - v) / (YMAX * 2) * cv.clientHeight;

  const fit = () => {
    if (!cv.clientWidth || !cv.clientHeight) { requestAnimationFrame(fit); return; }
    const dpr = window.devicePixelRatio || 1;
    cv.width  = Math.round(cv.clientWidth  * dpr);
    cv.height = Math.round(cv.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const say = () => {
    if (!info) return;
    if (jammed) {
      info.innerHTML = '<b style="color:#B2270E">🔥 分身數量：' + clones.length + ' — 撞到上限了，畫面卡住</b>';
    } else {
      info.innerHTML = '分身數量：<b>' + clones.length + '</b>' + (limit ? (' / ' + limit) : '');
    }
  };

  const spawnOne = () => {
    clones.push({
      x: Math.round((Math.random() * 2 - 1) * XMAX),
      y: YMAX - 4,
      e: emoji === 'mix' ? EMOJI[Math.floor(Math.random() * EMOJI.length)] : emoji
    });
    if (master) master.style.opacity = '0';   /* 本尊生完就藏起來 */
  };

  function tick() {
    const fs = Math.max(14, cv.clientWidth * 0.055);
    ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
    ctx.font = fs + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const willDelete = !!(delCb && delCb.checked);
    clones.forEach(c => { c.y -= speed; });
    if (willDelete) clones = clones.filter(c => c.y > -YMAX - 10);
    clones.forEach(c => ctx.fillText(c.e, px(c.x), py(c.y)));

    if (limit && clones.length >= limit) {
      jammed = true;
      if (spawning) { clearInterval(spawning); spawning = null; }
    }
    say();
    raf = requestAnimationFrame(tick);
  }

  root.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', () => {
    switch (btn.dataset.act) {
      case 'rain': {
        const n = +root.dataset.rainN || 20;
        if (master) master.style.opacity = '0';
        let i = 0;
        if (spawning) clearInterval(spawning);
        spawning = setInterval(() => {
          spawnOne(); i++;
          if (i >= n) { clearInterval(spawning); spawning = null; }
        }, 180);
        break;
      }
      case 'burst':
        jammed = false;
        if (spawning) clearInterval(spawning);
        spawning = setInterval(spawnOne, 90);
        break;
      case 'stop':
        if (spawning) { clearInterval(spawning); spawning = null; }
        break;
      case 'reset':
        if (spawning) { clearInterval(spawning); spawning = null; }
        clones = []; jammed = false;
        if (master) master.style.opacity = '1';
        say();
        break;
    }
  }));

  if (delCb) delCb.addEventListener('change', say);

  if (window.ResizeObserver) { root._ro = new ResizeObserver(fit); root._ro.observe(stage); }
  addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit(); say();
  raf = requestAnimationFrame(tick);
});

})();
