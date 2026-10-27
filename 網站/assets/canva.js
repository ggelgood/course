/* ──────────────────────────────────────────────
   Canva 系列互動腳本
   ──────────────────────────────────────────────
   共用的捲動進度、摺疊區塊等由 lesson.js 提供，
   這裡只放 Canva 系列自己的互動。
   課程頁 body 結尾的載入順序：
     <script src="../assets/lesson.js?v=4"></script>
     <script src="../assets/canva.js?v=1"></script>
   ────────────────────────────────────────────── */
(() => {
'use strict';

/* ── 圖層實驗室 ─────────────────────────────────────────────
   第 3 課（萬聖節卡片）用。學生在進 Canva 之前，先在這裡
   把「清單順序＝畫面前後」玩過一次。

   HTML 骨架看 canva.css「元件 9」。幾個約定：
     .zlab__stage 裡的 .zlab__o，DOM 順序＝一開始的前後順序
       （寫在前面的在最前面，跟 Canva 圖層清單同方向）
     .zlab[data-lock="castle"]  那一個是被鎖定的，自己不能動，
       但別人可以越過它 —— 跟 Canva 裡「搬別人、不搬城堡」一樣
     過關條件：被鎖定的那個被擠到最後面（＝其他全在它前面）

   ⚠️ 清單是 JS 重建的，不要在 HTML 裡先寫 <li>，
      會在第一次 render 時被整個洗掉。                      */
document.querySelectorAll('.zlab').forEach(lab => {
  const stage = lab.querySelector('.zlab__stage');
  const list  = lab.querySelector('.zlab__list');
  if (!stage || !list) return;

  const say   = lab.querySelector('.zlab__say');
  const reset = lab.querySelector('[data-reset]');

  // key → 舞台上的那個方塊
  const el = new Map();
  stage.querySelectorAll('.zlab__o').forEach(o => el.set(o.dataset.k, o));

  const start = [...el.keys()];          // 前 → 後
  const lock  = lab.dataset.lock || '';
  let order   = start.slice();
  let moved   = null;                    // 這一次動到的是誰（給 pop 動畫用）

  const name = k => (el.get(k) && el.get(k).dataset.name) || k;

  /* 擋在城堡前面的有幾個 */
  const ahead = () => {
    const i = order.indexOf(lock);
    return i < 0 ? 0 : i;               // 城堡前面的數量＝它的索引
  };
  const won = () => order.indexOf(lock) === order.length - 1;

  const tell = () => {
    if (!say) return;
    const total = order.length - 1;     // 城堡以外的物件數
    if (won()) {
      say.classList.add('win');
      say.textContent = '✓ ' + total + ' 個都在城堡前面了！'
        + '清單怎麼排，畫面就怎麼疊 —— 這就是等一下在 Canva 裡要做的事。';
      return;
    }
    say.classList.remove('win');
    const n = ahead();
    say.textContent = n === 0
      ? '城堡壓在最上面，後面 ' + total + ' 個東西完全看不到。用 ▲ 把它們一個一個搬到城堡前面。'
      : '已經有 ' + n + ' 個在城堡前面了，還差 ' + (total - n) + ' 個。';
  };

  const render = () => {
    // 舞台：清單越上面 → z-index 越大
    order.forEach((k, i) => {
      const o = el.get(k);
      if (!o) return;
      o.style.zIndex = String(order.length - i);
      o.classList.toggle('zlab__o--bump', k === moved);
    });
    moved = null;

    // 清單
    list.textContent = '';
    order.forEach((k, i) => {
      const li = document.createElement('li');
      li.className = 'zlab__row' + (k === lock ? ' zlab__row--lock' : '');

      const nm = document.createElement('span');
      nm.textContent = name(k);
      li.appendChild(nm);

      if (k === lock) {
        const tag = document.createElement('small');
        tag.textContent = '🔒 鎖定，搬不動';
        li.appendChild(tag);
      } else {
        li.appendChild(arrow('▲', '把「' + name(k) + '」往前搬', i === 0, () => swap(i, i - 1)));
        li.appendChild(arrow('▼', '把「' + name(k) + '」往後搬', i === order.length - 1, () => swap(i, i + 1)));
      }
      list.appendChild(li);
    });

    tell();
  };

  function arrow(glyph, label, off, run) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'zlab__arr';
    b.textContent = glyph;
    b.setAttribute('aria-label', label);
    b.disabled = off;
    b.addEventListener('click', run);
    return b;
  }

  function swap(a, b) {
    if (b < 0 || b >= order.length) return;
    moved = order[a];
    [order[a], order[b]] = [order[b], order[a]];
    render();
  }

  if (reset) reset.addEventListener('click', () => {
    order = start.slice();
    moved = null;
    render();
  });

  render();
});

})();
