/* ═══════════════════════════════════════════════════════════
   AI 生圖提示詞收藏 — 這一頁的互動
   ───────────────────────────────────────────────────────────
   只有 prompts/ 底下那一頁用得到，三件事：
     1. 一鍵複製提示詞
     2. 依風格標籤篩選卡片（鈕是自動生的）
     3. 卡片一張都沒有時，把佔位說明留著；有卡就隱藏

   跟 home.js 一樣刻意做成「加分用」的：這段 JS 沒載到，
   提示詞照樣看得到、也還是可以自己框起來複製，
   原貼文連結也還是普通連結——功能不會壞。

   放在 lesson.js 後面。
   ⚠️ 改完這個檔，記得把頁面裡 prompts.js?v= 的數字 +1。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const cards = [...document.querySelectorAll('.pcard')];

/* ── 1. 一鍵複製 ────────────────────────────────────────── */
// clipboard API 在 file:// 底下不保證能用（Safari 就不行），
// 所以一定要留 execCommand 那條舊路，不然雙擊開檔的人按了沒反應。
const copy = async text => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100vh;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
};

document.querySelectorAll('.pcopy').forEach(btn => {
  const pre = btn.closest('.pcard')?.querySelector('.pcard__pre');
  if (!pre) { btn.hidden = true; return; }          // 找不到提示詞就不要留一顆按不動的鈕

  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    const ok = await copy(pre.textContent.trim());
    btn.textContent = ok ? '已複製 ✓' : '複製不了，請手動選取';
    if (ok) btn.dataset.ok = '';
    setTimeout(() => { btn.textContent = label; delete btn.dataset.ok; }, 2000);
  });
});

/* ── 2. 風格篩選 ────────────────────────────────────────── */
// 標籤來源是每張卡的 data-tags（用空白隔開），
// 所以新增卡片時不用回來改這個檔，也不用手寫按鈕。
const bar = document.querySelector('.pfilter');
if (bar) {
  const tags = [...new Set(cards.flatMap(c => (c.dataset.tags || '').split(/\s+/).filter(Boolean)))];

  if (tags.length < 2) {
    bar.hidden = true;                               // 一張卡都沒有、或只有一種標籤，篩選沒有意義
  } else {
    const mk = (value, text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.dataset.go = value;
      b.setAttribute('aria-pressed', value === 'all' ? 'true' : 'false');
      return b;
    };
    bar.append(mk('all', '全部'), ...tags.map(t => mk(t, t)));

    bar.addEventListener('click', e => {
      const btn = e.target.closest('button[data-go]');
      if (!btn) return;
      const go = btn.dataset.go;
      bar.querySelectorAll('button').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn)));
      cards.forEach(c => {
        c.hidden = go !== 'all' && !(c.dataset.tags || '').split(/\s+/).includes(go);
      });
    });
  }
}

/* ── 3. 有卡片就把佔位說明收起來 ────────────────────────── */
const empty = document.querySelector('.pempty');
if (empty && cards.length) empty.hidden = true;

})();
