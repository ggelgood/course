/* ═══════════════════════════════════════════════════════════
   資訊素養系列 — 專用互動
   ───────────────────────────────────────────────────────────
   元件 1：藏寶圖路徑探險台（第 1 課）
   元件 2：流程拼圖 fpz（第 2、3 課）
   元件 3：流程圖編輯器 fed（第 2、3 課）

   共用的東西（預測題、打勾清單、揭曉…）在 lesson.js，
   引用順序一定是 lesson.js 在前、literacy.js 在後。
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   元件 1：藏寶圖路徑探險台 —— 資訊素養第 1 課
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


/* ═══════════════════════════════════════════════════════════
   元件 2：流程拼圖（fpz）—— 資訊素養第 2、3 課
   ───────────────────────────────────────────────────────────
   上面一盤打散的符號，下面一張留空的流程圖骨架（含分岔）。
   把符號放進正確的格子裡。

   跟 lesson.css 的 .sortbox 差在哪：.sortbox 只能上下調順序，
   這個可以把任何一塊放進任何一格、互相交換、退回盤子——
   有分岔的流程圖用 .sortbox 根本表達不出來。

   HTML 這樣寫：
     <div class="fpz" data-fpz
          data-msg-ok="✓ 完全正確！…"
          data-msg-empty="還有空格沒放…"          （選填）
          data-msg-nohat="第一格要放…"            （選填，第一格錯才出現）
          data-swap="eat|hw"                      （選填）
          data-msg-swap="這兩塊互換了…"           （選填，配 data-swap）
          data-msg-near="快好了！…">
       <p class="fpz__q">題目…</p>
       <p class="fpz__how">拖曳，或點一下符號再點一下空格。</p>
       <p class="fpz__how" data-note></p>
       <div class="fpz__tray" data-tray>
         <div class="fpc fpc--step" data-k="wash">洗手</div>
         …
       </div>
       <div class="flow">
         <div class="fpz__slot" data-want="start" data-n="1"></div>
         <div class="flow__arrow"></div>
         …分岔用 .flow__branch ＋ .flow__path，跟靜態流程圖同一套…
       </div>
       <div class="fpz__ctl">
         <button class="pbtn" type="button" data-check>檢查看看</button>
         <button class="pbtn" type="button" data-reset>🔄 全部倒回盤子</button>
       </div>
       <p class="verdict"></p>
     </div>

   ⚠️ 出題原則（跟 .sortbox 一樣）：
   1. 盤子裡的順序會被 JS 打散，但**題目文字**還是要把情境講清楚，
      逼學生讀題才知道哪一塊該放哪一格。
   2. data-msg-* 要寫出「放錯的人是哪裡想錯了」，不要只寫「再試一次」。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

document.querySelectorAll('[data-fpz]').forEach(root => {
  const tray  = root.querySelector('[data-tray]');
  const slots = [...root.querySelectorAll('.fpz__slot')];
  const chk   = root.querySelector('[data-check]');
  const reBtn = root.querySelector('[data-reset]');
  const out   = root.querySelector('.verdict');
  const say   = root.querySelector('[data-note]');
  const pieces = [...root.querySelectorAll('.fpc')];
  if (!tray || !slots.length || !chk || !out || !pieces.length) return;

  const zones = [tray, ...slots];
  let held = null;      // 點擊模式：拿在手上的那一塊
  let dragging = null;  // 拖曳模式：正在拖的那一塊

  const tell = t => { if (say) say.textContent = t || ''; };

  /* ── 狀態同步：空盤子／空格子的提示字 ─────────────── */
  function sync() {
    tray.dataset.empty = tray.querySelector('.fpc') ? '0' : '1';
    slots.forEach(s => { s.dataset.empty = s.querySelector('.fpc') ? '0' : '1'; });
    // ⚠️ 保險：把不在拖曳中的碎片的 .lift（半透明）清乾淨。
    //    放下的瞬間我們會把碎片 appendChild 到別的格子，元素換了父節點，
    //    瀏覽器就不一定會再發 dragend——只靠 dragend 清的話，
    //    那一塊會一直是半透明的（就是「第一個放進去的會變淡」那個 bug）。
    pieces.forEach(p => { if (p !== dragging) p.classList.remove('lift'); });
  }
  function clearMarks() {
    slots.forEach(s => delete s.dataset.s);
    out.classList.remove('on');
  }
  function unhot() { zones.forEach(z => z.classList.remove('hot')); }

  /* ── 拿起／放下 ───────────────────────────────── */
  function release() {
    if (held) held.classList.remove('sel');
    held = null;
  }
  function hold(p) {
    if (held === p) { release(); tell('放回去了，再點一次可以重新拿起來。'); return; }
    release();
    held = p;
    p.classList.add('sel');
    tell('拿起「' + p.textContent.trim() + '」了，接著點一個空格把它放下去。');
  }
  function put(piece, zone) {
    if (!piece || !zone) return;
    // 格子裡已經有東西 → 那一塊退回盤子（是「交換」不是「蓋掉」）
    if (zone.classList.contains('fpz__slot')) {
      const sitting = zone.querySelector('.fpc');
      if (sitting && sitting !== piece) tray.appendChild(sitting);
    }
    zone.appendChild(piece);
    piece.classList.remove('lift');      // 搬完就把拖曳中的半透明拿掉，不等 dragend
    dragging = null;
    unhot();
    release();
    clearMarks();
    sync();
    tell(zone === tray ? '倒回盤子了。' : '放好了。放錯還可以再點它一次拿起來換。');
  }

  /* ── 碎片：可拖、可點、可用鍵盤 ────────────────── */
  pieces.forEach(p => {
    p.setAttribute('draggable', 'true');
    p.tabIndex = 0;
    p.addEventListener('dragstart', () => {
      dragging = p; hold(p); setTimeout(() => p.classList.add('lift'), 0);
    });
    p.addEventListener('dragend', () => {
      p.classList.remove('lift'); dragging = null; unhot();
    });
    p.addEventListener('click', e => { e.stopPropagation(); hold(p); });
    p.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(p); }
    });
  });

  /* ── 盤子與格子：都是可以放東西的地方 ──────────── */
  zones.forEach(z => {
    z.tabIndex = 0;
    z.addEventListener('dragover',  e => { e.preventDefault(); z.classList.add('hot'); });
    z.addEventListener('dragleave', e => { if (!z.contains(e.relatedTarget)) z.classList.remove('hot'); });
    z.addEventListener('drop', e => {
      e.preventDefault(); z.classList.remove('hot'); put(dragging, z);
    });
    z.addEventListener('click', () => { if (held) put(held, z); });
    z.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && held) { e.preventDefault(); put(held, z); }
    });
  });

  /* ── 打散盤子裡的順序 ──────────────────────────── */
  function shuffle() {
    const list = pieces.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    list.forEach(p => tray.appendChild(p));
  }

  /* ── 檢查 ─────────────────────────────────────── */
  chk.addEventListener('click', () => {
    release();
    out.classList.add('on');

    if (slots.some(s => !s.querySelector('.fpc'))) {
      out.dataset.k = 'n';
      out.innerHTML = root.dataset.msgEmpty ||
        '還有空格沒放喔！每一格都要放一個符號，再按檢查。';
      return;
    }

    let wrong = 0;
    slots.forEach(s => {
      const ok = s.querySelector('.fpc').dataset.k === s.dataset.want;
      s.dataset.s = ok ? 'hit' : 'miss';
      if (!ok) wrong++;
    });

    if (!wrong) {
      out.dataset.k = 'y';
      out.innerHTML = root.dataset.msgOk || '✓ 完全正確！';
      return;
    }
    out.dataset.k = 'n';

    // 第一格就錯 → 專屬提示（流程圖一定從「開始」出發）
    if (slots[0].dataset.s === 'miss' && root.dataset.msgNohat) {
      out.innerHTML = root.dataset.msgNohat;
      return;
    }
    // 指定的兩塊剛好互換 → 專屬提示
    const sw = root.dataset.swap;
    if (sw && root.dataset.msgSwap) {
      const [a, b] = sw.split('|');
      const sa = slots.find(s => s.dataset.want === a);
      const sb = slots.find(s => s.dataset.want === b);
      if (sa && sb &&
          sa.querySelector('.fpc').dataset.k === b &&
          sb.querySelector('.fpc').dataset.k === a) {
        out.innerHTML = root.dataset.msgSwap;
        return;
      }
    }
    out.innerHTML = (root.dataset.msgNear || '快好了！再讀一次題目。') +
      '（有 <b>' + wrong + '</b> 格放錯了，紅色的那幾格再想想看）';
  });

  if (reBtn) reBtn.addEventListener('click', () => {
    release(); clearMarks(); shuffle(); sync();
    tell('全部倒回盤子了，重新排排看。');
  });

  shuffle();
  sync();
});

})();


/* ═══════════════════════════════════════════════════════════
   元件 3：流程圖編輯器（fed）—— 資訊素養第 2、3 課
   ───────────────────────────────────────────────────────────
   自由擺放版的畫布：按鈕加符號 → 拖到任何位置 → 連箭頭 →
   點兩下改文字。取代原本「在紙上畫一張」那個作業。

   HTML 這樣寫（按鈕想給哪幾種符號就放哪幾顆，
   第 2 課還沒教判斷，就不要放 data-add="decision" 那顆）：
     <div class="fed" data-fed data-mode="move">
       <div class="fed__bar">
         <button class="fbtn fbtn--start"    type="button" data-add="start">➕ 開始</button>
         <button class="fbtn fbtn--step"     type="button" data-add="step">➕ 步驟</button>
         <button class="fbtn fbtn--decision" type="button" data-add="decision">➕ 判斷</button>
         <button class="fbtn"                type="button" data-add="end">➕ 結束</button>
         <span class="fed__sep"></span>
         <button class="fbtn" type="button" data-mode="link" aria-pressed="false">🔗 連箭頭</button>
         <button class="fbtn" type="button" data-act="del">🗑️ 刪掉選到的</button>
         <button class="fbtn" type="button" data-act="clear">🧹 全部清空</button>
       </div>
       <div class="fed__canvas" data-canvas>
         <svg class="fed__wires" data-wires aria-hidden="true"></svg>
       </div>
       <p class="fed__say" data-note></p>
     </div>

   幾個刻意的設計：
   - **箭頭用「模式」而不是拖曳小圓點**：小圓點要拖得很準，
     中年級容易拖歪；改成「點起點、點終點」比較不會失敗。
   - **判斷拉出去的頭兩條箭頭自動標上「是」「否」**：
     這是最常忘記寫的東西，自動補上，點標籤可以循環改。
   - **刪掉一個符號會連它身上的箭頭一起刪掉**，
     不然會留下指向空氣的箭頭。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const KIND = {
  start:    {cls: 'fednode--start',    text: '開始'},
  end:      {cls: 'fednode--end',      text: '結束'},
  step:     {cls: 'fednode--step',     text: '做一件事'},
  decision: {cls: 'fednode--decision', text: '是不是…？'}
};
const HINT = {
  move: '按上面的鈕加符號 · 拖著它可以移到任何地方 · 點兩下可以改字',
  link: '連箭頭中：先點一下箭頭的「起點」，再點一下「終點」。（再按一次「連箭頭」可以離開）'
};

let uid = 0;

document.querySelectorAll('[data-fed]').forEach(root => {
  const canvas = root.querySelector('[data-canvas]');
  const svg    = root.querySelector('[data-wires]');
  const sayEl  = root.querySelector('[data-note]');
  if (!canvas || !svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const me = ++uid;
  const MK = 'fedmk' + me, MKS = 'fedmks' + me;

  svg.innerHTML =
    '<defs>' +
      '<marker id="' + MK + '" class="mk" viewBox="0 0 10 10" refX="9" refY="5" ' +
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z"/></marker>' +
      '<marker id="' + MKS + '" class="mk mk--sel" viewBox="0 0 10 10" refX="9" refY="5" ' +
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
        '<path d="M0,0 L10,5 L0,10 z"/></marker>' +
    '</defs>';

  let nodes = [];
  let edges = [];              // {from, to, label}
  let selNode = null, selEdge = null, src = null, drag = null;
  let mode = 'move';

  const tell = t => { if (sayEl) sayEl.textContent = t || ''; };

  /* ── 幾何：算出箭頭該畫在哪 ─────────────────────── */
  function box(el) {
    const w = el.offsetWidth, h = el.offsetHeight;
    // 菱形的可見範圍比外框小，箭頭要往內收一點才不會停在空白的角落
    const k = el.dataset.kind === 'decision' ? 0.8 : 1;
    return {cx: el.offsetLeft + w / 2, cy: el.offsetTop + h / 2, w: w * k, h: h * k};
  }
  function edgePt(b, tx, ty) {
    const dx = tx - b.cx, dy = ty - b.cy;
    if (!dx && !dy) return {x: b.cx, y: b.cy};
    const s = Math.min(
      dx ? (b.w / 2) / Math.abs(dx) : Infinity,
      dy ? (b.h / 2) / Math.abs(dy) : Infinity
    );
    return {x: b.cx + dx * s, y: b.cy + dy * s};
  }

  /* ── 重畫所有箭頭與標籤 ─────────────────────────── */
  function draw() {
    svg.querySelectorAll('.fedwire').forEach(n => n.remove());
    canvas.querySelectorAll('.fedlab').forEach(n => n.remove());

    edges.forEach(ed => {
      const a = box(ed.from), b = box(ed.to);
      const p1 = edgePt(a, b.cx, b.cy);
      const p2 = edgePt(b, a.cx, a.cy);
      const on = ed === selEdge;

      // 看不見的粗線：只是為了讓細箭頭也點得到（顏色與粗細都在 CSS 裡）
      const hit = document.createElementNS(NS, 'line');
      hit.setAttribute('class', 'fedwire fedwire--hit');
      hit.setAttribute('x1', p1.x); hit.setAttribute('y1', p1.y);
      hit.setAttribute('x2', p2.x); hit.setAttribute('y2', p2.y);
      hit.addEventListener('click', e => {
        e.stopPropagation();
        pickEdge(ed);
      });
      svg.appendChild(hit);

      const line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'fedwire fedwire--line' + (on ? ' is-on' : ''));
      line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
      line.setAttribute('marker-end', 'url(#' + (on ? MKS : MK) + ')');
      svg.appendChild(line);

      // 判斷拉出來的箭頭要標「是」「否」
      if (ed.label || ed.from.dataset.kind === 'decision') {
        const lab = document.createElement('button');
        lab.type = 'button';
        lab.className = 'fedlab';
        lab.textContent = ed.label || '？';
        lab.title = '點一下換成 是 / 否 / 不標';
        lab.style.left = ((p1.x + p2.x) / 2) + 'px';
        lab.style.top  = ((p1.y + p2.y) / 2) + 'px';
        lab.addEventListener('click', e => {
          e.stopPropagation();
          ed.label = ed.label === '是' ? '否' : ed.label === '否' ? '' : '是';
          draw();
        });
        canvas.appendChild(lab);
      }
    });
  }

  /* ── 選取 ───────────────────────────────────────── */
  function pickNode(el) {
    if (selNode) selNode.classList.remove('sel');
    selNode = el || null; selEdge = null;
    if (selNode) selNode.classList.add('sel');
    draw();
  }
  function pickEdge(ed) {
    if (selNode) selNode.classList.remove('sel');
    selNode = null; selEdge = ed;
    draw();
    tell('選到一條箭頭了，按「🗑️ 刪掉選到的」可以把它拿掉。');
  }

  /* ── 位置（不准跑出畫布外）───────────────────────── */
  function place(el, x, y) {
    const mx = Math.max(0, canvas.clientWidth  - el.offsetWidth);
    const my = Math.max(0, canvas.clientHeight - el.offsetHeight);
    el.style.left = Math.min(Math.max(0, x), mx) + 'px';
    el.style.top  = Math.min(Math.max(0, y), my) + 'px';
  }

  /* ── 改文字 ─────────────────────────────────────── */
  function edit(el) {
    const t = el.querySelector('.fednode__t');
    if (!t || el.dataset.edit === '1') return;
    el.dataset.edit = '1';
    t.contentEditable = 'true';
    t.focus();
    const r = document.createRange(); r.selectNodeContents(t);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);

    // ⚠️ 中文組字一定要擋掉：學生用注音打字時，Enter 是「選字」用的，
    //    不是「打完了」。不擋的話，選第一個字就會把編輯關掉。
    //    （跟 typing.js 的輸入框是同一個坑，見 網站/README.md）
    let composing = false;
    const on  = () => { composing = true; };
    const off = () => { composing = false; };

    // 收尾只做一次：blur 事件和按 Enter 都會叫它，重複進來要擋掉
    const done = () => {
      if (el.dataset.edit !== '1') return;
      el.dataset.edit = '0';
      t.removeEventListener('blur', done);
      t.removeEventListener('keydown', key);
      t.removeEventListener('compositionstart', on);
      t.removeEventListener('compositionend', off);
      t.contentEditable = 'false';
      if (document.activeElement === t) t.blur();
      if (!t.textContent.trim()) t.textContent = KIND[el.dataset.kind].text;
      draw();
      tell(HINT[mode]);
    };
    const key = e => {
      e.stopPropagation();                                   // 別讓 Delete 被外面的快捷鍵吃掉
      if (composing || e.isComposing || e.keyCode === 229) return;   // 還在選字，Enter 不算數
      // 直接收尾，不靠 t.blur() 觸發——視窗沒有焦點的時候 blur() 不一定會發事件
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); done(); }
    };
    t.addEventListener('compositionstart', on);
    t.addEventListener('compositionend', off);
    t.addEventListener('blur', done);
    t.addEventListener('keydown', key);
    tell('打字改文字，改完按 Enter，或點旁邊的空白處。');
  }

  /* ── 連箭頭 ─────────────────────────────────────── */
  function linkClick(el) {
    if (!src) {
      src = el; el.classList.add('src');
      tell('起點選好了，再點一下箭頭要指到的那一塊。');
      return;
    }
    if (src === el) {
      src.classList.remove('src'); src = null;
      tell('取消了。' + HINT.link);
      return;
    }
    if (edges.some(ed => ed.from === src && ed.to === el)) {
      tell('這兩塊已經連過了。');
    } else {
      const n = edges.filter(ed => ed.from === src).length;
      const auto = src.dataset.kind === 'decision'
        ? (n === 0 ? '是' : n === 1 ? '否' : '') : '';
      edges.push({from: src, to: el, label: auto});
      tell(auto
        ? '接好了，自動幫你標上「' + auto + '」——標錯的話點那個標籤可以改。'
        : '接好了！' + HINT.link);
    }
    src.classList.remove('src'); src = null;
    draw();
  }

  /* ── 一個節點要綁的所有事件 ─────────────────────── */
  function wire(el) {
    el.addEventListener('pointerdown', e => {
      if (mode === 'link' || el.dataset.edit === '1') return;
      e.stopPropagation();
      drag = {el, sx: e.clientX, sy: e.clientY, x0: el.offsetLeft, y0: el.offsetTop, moved: false};
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      pickNode(el);
    });
    el.addEventListener('pointermove', e => {
      if (!drag || drag.el !== el) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      drag.moved = true;
      place(el, drag.x0 + dx, drag.y0 + dy);
      draw();
    });
    const stop = e => {
      if (!drag || drag.el !== el) return;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      drag = null;
    };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);

    el.addEventListener('click', () => { if (mode === 'link') linkClick(el); });
    el.addEventListener('dblclick', () => { if (mode !== 'link') edit(el); });

    el.addEventListener('keydown', e => {
      if (el.dataset.edit === '1') return;
      const step = e.shiftKey ? 24 : 8;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); place(el, el.offsetLeft - step, el.offsetTop); draw(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); place(el, el.offsetLeft + step, el.offsetTop); draw(); }
      if (e.key === 'ArrowUp')    { e.preventDefault(); place(el, el.offsetLeft, el.offsetTop - step); draw(); }
      if (e.key === 'ArrowDown')  { e.preventDefault(); place(el, el.offsetLeft, el.offsetTop + step); draw(); }
      if (e.key === 'Enter')      { e.preventDefault(); mode === 'link' ? linkClick(el) : edit(el); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); pickNode(el); removeSel(); }
    });
    el.addEventListener('focus', () => { if (mode !== 'link') pickNode(el); });
  }

  /* ── 加一個符號 ─────────────────────────────────── */
  function addNode(kind) {
    const k = KIND[kind];
    if (!k) return;
    const el = document.createElement('div');
    el.className = 'fednode ' + k.cls;
    el.dataset.kind = kind;
    el.dataset.edit = '0';
    el.tabIndex = 0;
    const t = document.createElement('span');
    t.className = 'fednode__t';
    t.textContent = k.text;
    el.appendChild(t);
    canvas.appendChild(el);

    const n = nodes.length;
    place(el, 26 + (n % 3) * 168, 22 + (Math.floor(n / 3) % 4) * 92);
    wire(el);
    nodes.push(el);
    pickNode(el);
    draw();
    tell('加好了——拖著它可以移到任何地方，點兩下可以改上面的字。');
  }

  /* ── 刪掉 ───────────────────────────────────────── */
  function removeSel() {
    if (selEdge) {
      edges = edges.filter(e => e !== selEdge);
      selEdge = null; draw();
      tell('箭頭刪掉了。');
      return;
    }
    if (selNode) {
      edges = edges.filter(e => e.from !== selNode && e.to !== selNode);
      nodes = nodes.filter(n => n !== selNode);
      selNode.remove(); selNode = null; draw();
      tell('刪掉了，連在它身上的箭頭也一起清掉了。');
      return;
    }
    tell('要先點一下想刪掉的符號或箭頭，再按這個鈕。');
  }

  /* ── 模式切換 ───────────────────────────────────── */
  const linkBtn = root.querySelector('[data-mode="link"]');
  function setMode(m) {
    mode = m;
    root.dataset.mode = m;
    if (linkBtn) linkBtn.setAttribute('aria-pressed', String(m === 'link'));
    if (src) { src.classList.remove('src'); src = null; }
    tell(HINT[m]);
  }

  /* ── 工具列 ─────────────────────────────────────── */
  root.querySelectorAll('[data-add]').forEach(b =>
    b.addEventListener('click', () => addNode(b.dataset.add)));
  if (linkBtn) linkBtn.addEventListener('click', () =>
    setMode(mode === 'link' ? 'move' : 'link'));
  const delBtn = root.querySelector('[data-act="del"]');
  if (delBtn) delBtn.addEventListener('click', removeSel);
  const clrBtn = root.querySelector('[data-act="clear"]');
  if (clrBtn) clrBtn.addEventListener('click', () => {
    if (!nodes.length) { tell('本來就是空的。'); return; }
    if (!confirm('確定要把畫布上的東西全部清掉嗎？清掉就救不回來了。')) return;
    nodes.forEach(n => n.remove());
    nodes = []; edges = []; selNode = null; selEdge = null;
    setMode('move'); draw();
    tell('清空了，重新開始畫吧。');
  });

  // 點空白處＝取消選取
  canvas.addEventListener('pointerdown', e => {
    if (e.target === canvas || e.target === svg) {
      pickNode(null);
      if (src) { src.classList.remove('src'); src = null; tell(HINT[mode]); }
    }
  });

  // 視窗變寬變窄時，把跑出去的符號拉回畫布裡，再重畫箭頭
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      nodes.forEach(n => place(n, n.offsetLeft, n.offsetTop));
      draw();
    }).observe(canvas);
  }

  setMode('move');
});

})();
