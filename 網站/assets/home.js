/* ═══════════════════════════════════════════════════════════
   首頁互動 — 側欄切換課程
   ───────────────────────────────────────────────────────────
   只有 index.html 用得到。

   刻意做成「加分用」的：這段 JS 沒載到、或瀏覽器擋掉了，
   側欄的連結還是普通的錨點，點下去會捲到那一門課，
   所有課程也都看得到——功能不會壞，只是少了切換效果。

   單元的收合是原生 <details>，完全不靠這個檔。

   放在 </body> 前，不需要 defer。
   ⚠️ 改完這個檔，記得把 index.html 裡 home.js?v= 的數字 +1。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const navs    = [...document.querySelectorAll('.cnav[data-panel]')];
const panels  = [...document.querySelectorAll('.course[id]')];
if (!navs.length || !panels.length) return;

/* ── 切換到某一門課 ─────────────────────────────────────── */
const show = (id, {focus = false, push = false, animate = false} = {}) => {
  const target = document.getElementById(id);
  if (!target) return;

  const swap = () => {
    panels.forEach(p => { p.hidden = (p !== target); });
    navs.forEach(a => {
      const on = a.dataset.panel === id;
      // aria-current 同時是「選中」的樣式鉤子，CSS 直接吃這個屬性
      if (on) a.setAttribute('aria-current', 'true');
      else    a.removeAttribute('aria-current');
    });
  };

  // View Transitions：讓右邊的內容淡入 + 微微上浮。
  // 開場第一次（animate=false）不做動畫——頁面還在載入時啟動轉場會被瀏覽器中止。
  // 不支援的瀏覽器、或使用者把動畫關掉了，也是直接換，功能相同。
  const canAnimate = animate
    && document.startViewTransition
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canAnimate) {
    const t = document.startViewTransition(swap);
    // 轉場被略過時（分頁在背景、瀏覽器決定不跑動畫…）ready 會 reject，
    // 沒接住的話 console 會噴 InvalidStateError。畫面本身照樣切換，所以吞掉就好。
    t.ready.catch(() => {});
    t.finished.catch(() => {})
      .finally(() => { if (focus) target.querySelector('h1')?.focus(); });
  } else {
    swap();
    if (focus) target.querySelector('h1')?.focus();
  }

  if (push) history.pushState({panel: id}, '', '#' + id);
};

/* ── 側欄點擊 ───────────────────────────────────────────── */
navs.forEach(a => a.addEventListener('click', e => {
  // 讓 Ctrl / ⌘ / 中鍵開新分頁的行為保持正常
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  const id = a.dataset.panel;
  if (document.getElementById(id)?.hidden === false) return;   // 已經在這門課了
  show(id, {focus: true, push: true, animate: true});
  // 窄螢幕時側欄在上面，切課後把內容捲回頂端
  if (matchMedia('(max-width: 56rem)').matches) scrollTo({top: 0, behavior: 'smooth'});
}));

/* ── 上一頁／下一頁 ─────────────────────────────────────── */
addEventListener('popstate', () => {
  show(location.hash.slice(1) || panels[0].id, {animate: true});
});

/* ── 每一門課的「全部展開／收合」 ───────────────────────── */
document.querySelectorAll('.toggleall').forEach(btn => {
  const course = btn.closest('.course');
  if (!course) return;
  const units = [...course.querySelectorAll('.unit')];
  if (!units.length) { btn.hidden = true; return; }

  const label = () => {
    const anyClosed = units.some(u => !u.open);
    btn.textContent = anyClosed ? '全部展開' : '全部收合';
    return anyClosed;
  };
  btn.addEventListener('click', () => {
    const open = units.some(u => !u.open);
    units.forEach(u => { u.open = open; });
    label();
  });
  // 學生自己開合單元時，按鈕字樣要跟著對
  units.forEach(u => u.addEventListener('toggle', label));
  label();
});

/* ── 開場：依網址列的 #，決定先顯示哪一門課 ─────────────── */
show(panels.some(p => p.id === location.hash.slice(1)) ? location.hash.slice(1) : panels[0].id);

})();
