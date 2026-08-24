/* ═══════════════════════════════════════════════════════════
   藏寶圖路徑探險台 —— 資訊素養第 1 課
   ───────────────────────────────────────────────────────────
   點資料夾往下走，路徑列即時把走過的名字接起來，
   走到「藏寶箱」（treasure: true 的檔案）就算過關。

   HTML 這樣寫：
     <div class="pathmap" data-pathmap
          data-tree='{"name":"本機","children":[
            {"name":"桌面","children":[
              {"name":"遊戲.exe"},
              {"name":"暑假作業","children":[
                {"name":"國語習作.docx","treasure":true}
              ]}
            ]},
            {"name":"下載","children":[{"name":"貓咪.jpg"}]}
          ]}'>
       <p class="pathmap__clue" data-clue>你的作業存在「桌面 › 暑假作業」裡，去找出來！</p>
       <div class="pathmap__crumb" data-crumb></div>
       <div class="pathmap__grid" data-grid></div>
       <div class="pathmap__ctl">
         <button class="pbtn" type="button" data-act="up">⬆ 上一層</button>
         <button class="pbtn" type="button" data-act="restart">🔄 重新開始</button>
       </div>
       <p class="pathmap__msg" data-msg></p>
     </div>

   規則：
   - 一個節點有 "children" 陣列＝資料夾，沒有＝檔案。
   - 檔案節點加 "treasure":true 就是這一關的目標。
   - 點到不是目標的檔案，只會提示「這裡沒有」，不會扣分、不會卡關——
     這是給中年級的探索型練習，不是考試，鼓勵他們亂點亂找。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const isFolder = n => Array.isArray(n.children);

document.querySelectorAll('[data-pathmap]').forEach(root => {
  let tree;
  try { tree = JSON.parse(root.dataset.tree); } catch (e) { return; }

  const grid   = root.querySelector('[data-grid]');
  const crumb  = root.querySelector('[data-crumb]');
  const msg    = root.querySelector('[data-msg]');
  const upBtn  = root.querySelector('[data-act="up"]');
  const reBtn  = root.querySelector('[data-act="restart"]');
  if (!grid || !crumb) return;

  let stack = [tree];

  function render() {
    crumb.innerHTML = stack.map((n, i) =>
      '<span class="pathmap__seg' + (i === stack.length - 1 ? ' pathmap__seg--now' : '') + '">' +
      n.name + '</span>'
    ).join('<i class="pathmap__sep">›</i>');

    const cur = stack[stack.length - 1];
    grid.innerHTML = '';
    (cur.children || []).forEach(node => {
      const folder = isFolder(node);
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'pmtile ' + (folder ? 'pmtile--folder' : 'pmtile--file');
      tile.innerHTML =
        '<span class="pmtile__ic">' + (folder ? '📁' : (node.treasure ? '📜' : '📄')) + '</span>' +
        '<span class="pmtile__name">' + node.name + '</span>';
      tile.addEventListener('click', () => onPick(node));
      grid.appendChild(tile);
    });

    if (upBtn) upBtn.disabled = stack.length <= 1;
    root.classList.remove('pathmap--won');
  }

  function onPick(node) {
    if (isFolder(node)) {
      stack.push(node);
      if (msg) msg.textContent = '';
      render();
      return;
    }
    if (node.treasure) {
      const full = stack.map(n => n.name).join(' › ') + ' › ' + node.name;
      if (msg) msg.innerHTML = '🎉 找到了！完整路徑：<b>' + full + '</b>';
      grid.querySelectorAll('.pmtile').forEach(t => t.disabled = true);
      root.classList.add('pathmap--won');
    } else if (msg) {
      msg.textContent = '這裡沒有喔，再找找看。';
    }
  }

  if (upBtn) upBtn.addEventListener('click', () => {
    if (stack.length > 1) { stack.pop(); if (msg) msg.textContent = ''; render(); }
  });
  if (reBtn) reBtn.addEventListener('click', () => {
    stack = [tree]; if (msg) msg.textContent = ''; render();
  });

  render();
});

})();
