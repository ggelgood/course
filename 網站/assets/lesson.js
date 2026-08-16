/* ═══════════════════════════════════════════════════════════
   國小電腦課講義 — 共用互動
   ───────────────────────────────────────────────────────────
   所有課共用這一個檔案。這裡只放「每一課都一樣」的行為，
   課別專用的小互動（滑桿、轉盤…）寫在該課 HTML 的 <script> 裡。

   放在 </body> 前，不需要 defer。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ── 頂端閱讀進度條 ─────────────────────────────────────── */
const rail = document.getElementById('rail');
if (rail) {
  const draw = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    rail.style.width = (h > 0 ? Math.min(scrollY / h, 1) * 100 : 0) + '%';
  };
  addEventListener('scroll', draw, {passive:true});
  draw();
}

/* ── 打勾清單（步驟 + 試試看卡片共用）──────────────────────
   HTML：<div class="dobox"> 標題列含 .dobox__count
          裡面放 .steps li 或 .play                          */
document.querySelectorAll('.dobox').forEach(box => {
  const items = [...box.querySelectorAll('.steps li, .play')];
  if (!items.length) return;
  const cnt = box.querySelector('.dobox__count');
  const num = cnt && cnt.querySelector('i');
  const tally = () => {
    if (!num) return;
    const n = items.filter(el => el.dataset.ok === '1').length;
    num.textContent = n;
    cnt.classList.toggle('done', n === items.length);
  };
  items.forEach(el => el.addEventListener('click', () => {
    el.dataset.ok = el.dataset.ok === '1' ? '0' : '1';
    tally();
  }));
  tally();
});

/* ── 先預測再看答案 ─────────────────────────────────────────
   HTML：<div class="predict" data-ans="c">
           <button class="pick" data-v="a" data-say="選這個代表哪裡想錯了">
           <p class="said"></p>
   ⚠️ data-say 一定要寫出「這個選擇背後的誤解」，
      不要只寫「再想想看」—— 那樣學生答錯是沒有收穫的       */
document.querySelectorAll('.predict[data-ans]').forEach(box => {
  const ans  = box.dataset.ans;
  const said = box.querySelector('.said');
  box.querySelectorAll('.pick').forEach(btn => {
    btn.addEventListener('click', () => {
      const ok = btn.dataset.v === ans;
      btn.dataset.s = ok ? 'hit' : 'miss';
      if (said) {
        said.textContent = btn.dataset.say || '';
        said.dataset.k = ok ? 'y' : 'n';
        said.classList.add('on');
      }
      if (ok) box.querySelectorAll('.pick').forEach(b => b.disabled = true);
    });
  });
});

/* ── 積木拖拉排序 ───────────────────────────────────────────
   HTML：<div class="sortbox"
              data-answer="1234"
              data-msg-ok="✓ 完全正確！…"
              data-msg-nohat="再看一次最上面那塊…"
              data-msg-near="快好了！…"
              data-swap="2>3"                （選填）
              data-msg-swap="再讀一次題目…">  （選填）
           <div class="slots"> …積木，每塊帶 data-k="1".. </div>
           <button class="btn" data-check>檢查看看</button>
           <p class="verdict"></p>

   data-swap="2>3" 的意思：如果 2 排在 3 後面，就給 data-msg-swap
   （用來針對「這兩塊順序顛倒」給專屬提示）

   ⚠️ 出題原則：正確順序絕對不能出現在題目上方的積木堆裡，
      而且題目要用文字描述情境 —— 逼學生讀題才排得對。      */
document.querySelectorAll('.sortbox').forEach(box => {
  const slots = box.querySelector('.slots');
  const btn   = box.querySelector('[data-check]');
  const out   = box.querySelector('.verdict');
  if (!slots || !btn || !out) return;

  let held = null;
  const afterEl = y => {
    const rest = [...slots.querySelectorAll('.drag:not(.lift)')];
    return rest.reduce((closest, child) => {
      const r = child.getBoundingClientRect();
      const offset = y - r.top - r.height / 2;
      return (offset < 0 && offset > closest.offset) ? {offset, el: child} : closest;
    }, {offset: Number.NEGATIVE_INFINITY}).el;
  };

  slots.querySelectorAll('.drag').forEach(el => {
    el.setAttribute('draggable', 'true');
    el.addEventListener('dragstart', () => {
      held = el; setTimeout(() => el.classList.add('lift'), 0);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('lift'); slots.classList.remove('hot');
    });
  });

  slots.addEventListener('dragover', e => {
    e.preventDefault(); slots.classList.add('hot');
    if (!held) return;
    const after = afterEl(e.clientY);
    if (after == null) slots.appendChild(held); else slots.insertBefore(held, after);
  });
  slots.addEventListener('dragleave', e => {
    if (!slots.contains(e.relatedTarget)) slots.classList.remove('hot');
  });
  slots.addEventListener('drop', e => {
    e.preventDefault(); slots.classList.remove('hot');
  });

  btn.addEventListener('click', () => {
    const now = [...slots.querySelectorAll('.drag')].map(el => el.dataset.k);
    const ans = box.dataset.answer || '';
    out.classList.add('on');

    if (now.join('') === ans) {
      out.dataset.k = 'y';
      out.textContent = box.dataset.msgOk || '✓ 完全正確！';
      return;
    }
    out.dataset.k = 'n';

    if (now[0] !== ans[0]) {
      out.textContent = box.dataset.msgNohat || '再看一次最上面那塊 —— 程式需要一個「開始的訊號」，哪一塊才是？';
      return;
    }
    // data-swap="2>3"：2 應該在 3 前面，若顛倒就給專屬提示
    const swap = box.dataset.swap;
    if (swap && box.dataset.msgSwap) {
      const [a, b] = swap.split('>');
      if (now.indexOf(a) > now.indexOf(b)) {
        out.textContent = box.dataset.msgSwap;
        return;
      }
    }
    out.textContent = box.dataset.msgNear || '快好了！再讀一次題目，想想剩下幾塊的先後順序。';
  });
});

/* ── 右側進度脊椎 ───────────────────────────────────────────
   自動掃描 main 底下的每個 <section>，用它的 .h2 當標籤，
   在該節的實際位置放一顆圓圈。走過就填綠，目前所在會放大。

   ⚠️ 位置一定要在版面變動時重算 —— 字型載入、圖片載入、
      學生點開揭曉都會讓段落位移。少了這些，圓圈會停在舊位置，
      甚至溢出容器把整頁撐長好幾萬 px。                      */
(() => {
  const main  = document.querySelector('main');
  const spine = document.querySelector('.spine');
  const fill  = spine && spine.querySelector('.spine__fill');
  if (!main || !spine || !fill) return;

  const dots = [...main.querySelectorAll(':scope > section')].map(sec => {
    const el = document.createElement('button');
    el.className = 'spine__dot';
    const h  = sec.querySelector('.h2');
    const bg = h && h.querySelector('b');
    el.dataset.label = h ? h.textContent.replace(bg ? bg.textContent : '', '').trim() : '';
    el.setAttribute('aria-label', el.dataset.label);
    el.addEventListener('click', () => sec.scrollIntoView({behavior:'smooth', block:'start'}));
    spine.appendChild(el);
    return {el, sec, top:0};
  });
  if (!dots.length) return;

  const place = () => dots.forEach(d => {
    const h = d.sec.querySelector('.h2');
    const raw = h ? h.offsetTop + h.offsetHeight / 2 : d.sec.offsetTop + 30;
    d.top = Math.max(0, Math.min(raw, main.offsetHeight));   // 夾在 main 之內
    d.el.style.top = d.top + 'px';
  });

  const paint = () => {
    let eye = scrollY + innerHeight * 0.42 - main.offsetTop;   // 視線高度
    const far = document.documentElement.scrollHeight - innerHeight;
    // 捲到底時視線搆不到最後幾顆，補一把讓它們點亮
    if (far <= 0 || scrollY / far > 0.995) eye = main.offsetHeight + 1;
    fill.style.height = Math.max(0, Math.min(eye, main.offsetHeight)) + 'px';

    let cur = -1;
    dots.forEach((d, i) => {
      const on = eye >= d.top;
      d.el.dataset.on = on ? '1' : '0';
      if (on) cur = i;
    });
    dots.forEach((d, i) => d.el.dataset.now = (i === cur) ? '1' : '0');
  };

  const refresh = () => { place(); paint(); };

  addEventListener('scroll', paint, {passive:true});
  addEventListener('resize', refresh);
  if (document.readyState === 'complete') refresh();
  else addEventListener('load', refresh);
  // 三道保險，缺一個就會有情境算不到：
  document.querySelectorAll('details').forEach(d => d.addEventListener('toggle', refresh)); // 學生點開揭曉
  addEventListener('load', refresh, true);                                                  // 圖片載入（capture 才抓得到 img）
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);            // 字型載入
  if (window.ResizeObserver) new ResizeObserver(refresh).observe(main);
  refresh();
})();

})();
