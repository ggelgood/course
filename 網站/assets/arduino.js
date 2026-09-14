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

  /* 板子三排塑膠座的顏色（照實際的擴展板：黑／紅／白）*/
  const BOARD = { G:'#26282B', V:'#C0392B', S:'#EFEDE6' };
  /* 線的顏色（教室這套是灰／紅／橘）。刻意跟板子不同色——
     線色本來就會換，講義要學生看字不是看顏色。            */
  const WIRE  = { G:'#9AA0A6', V:'#C0392B', S:'#E8842A' };
  /* 模組那端印的是 GND／VCC／SIG，不是 G／V／S */
  const MODLAB = { G:'GND', V:'VCC', S:'SIG' };
  const FULL  = { G:'G（接地）', V:'V（電源）', S:'S（訊號）' };

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
             '" width="' + stripW + '" height="34" rx="4" fill="' + (BOARD[r] || '#555') + '"/>';
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
            (WIRE[r] || '#555') + '"/>';
  });
  ROWS.forEach((r, k) => {                       // 三條線從接頭側面出去接到模組
    const y = k * P, my = 14 + k * 22;
    plug += '<path class="ps-wire" d="M19 ' + y + ' C 50 ' + y + ', 58 ' + my + ', 88 ' + my +
            '" stroke="' + (WIRE[r] || '#555') + '"/>';
  });
  plug += '<rect class="ps-mod" x="88" y="-8" width="116" height="96" rx="9"/>';
  ROWS.forEach((r, k) => {
    plug += '<text class="ps-modlab" x="98" y="' + (19 + k * 22) + '">' + MODLAB[r] + '</text>';
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
      ? '<b>V 碰到 G 就是短路</b>——通電的瞬間電流會衝到最大，板子通常會直接斷電保護自己，接點也會發燙。' +
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


/* ═══ 元件 2：接錯線通電的後果（zapsim）═══════════════════
   第 4 課本來要老師犧牲一顆零件現場示範，改成在畫面上模擬：
   選一種接法 → 按「插上 USB」→ 看板子與模組的反應。

   ⚠️ 內容刻意寫真實會發生的現象，不是戲劇化的冒煙：
      UNO 用 USB 供電時，V-G 短路多半是電腦的 USB 過流保護
      或板子上的保護元件先跳掉，**板子斷電**而不是燒起來。
      「保護機制救了你」本身就是這一課要教的事；真正危險的是
      改用外接電源，那時候沒有東西幫你擋。
      LED 模組接反通常也只是不亮（LED 反向不導通），但裡面有
      晶片的感測器模組接反就會發燙、燒毀——這個差別要講清楚，
      不能讓學生記成「接反沒關係」。

   HTML：<div class="zapsim" data-zapsim></div>
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('[data-zapsim]').forEach(root => {

  const BOARD = { G:'#26282B', V:'#C0392B', S:'#EFEDE6' };
  const WIRE  = { G:'#9AA0A6', V:'#C0392B', S:'#E8842A' };
  const MY = { G:135, V:160, S:185 };          // 模組那端三個接點的 y
  const BY = { G:150, V:180, S:210 };          // 板子那端三排的 y

  /* 一條從模組接點彎到板子某一排的線 */
  const wire = (from, toY, extra) =>
    '<path class="zs-wire' + (extra || '') + '" stroke="' + WIRE[from] + '"' +
    ' d="M520 ' + MY[from] + ' C 486 ' + MY[from] + ', 452 ' + toY + ', 420 ' + toY + '"/>';

  /* 四種接法：線怎麼連、通電後板子與模組什麼反應、要學生看懂什麼 */
  const CASES = {
    ok: {
      tab:'✅ 三條都接對',
      wires: wire('G', BY.G) + wire('V', BY.V) + wire('S', BY.S),
      hot:null, power:'on', led:'blink',
      sign:'電源燈亮著，模組的 LED 照程式一閃一閃。',
      why:'電從 V 進去、穿過模組、再從 G 流回板子，S 負責傳「亮還是暗」這個訊息。三條各司其職，電路才走得通。',
      todo:'<strong>這就是正常的樣子，先記住它</strong>——之後哪裡不對，你才認得出來哪裡不一樣。'
    },
    rev: {
      tab:'🔄 V 和 G 接反',
      wires: wire('G', BY.V) + wire('V', BY.G) + wire('S', BY.S),
      hot:null, power:'on', led:'off',
      sign:'板子的電源燈<strong>還是亮的</strong>，但模組的 LED <strong>完全沒反應</strong>。',
      why:'電被反過來灌進模組。LED 這種零件<strong>反著接就不導電</strong>，所以只是不亮。' +
          '<strong style="color:#B2270E">但這不代表接反沒關係</strong>——換成裡面有晶片的模組（溫溼度、超音波那種），' +
          '反接會發燙，嚴重的話直接燒掉。',
      todo:'電源燈亮＝板子本身沒事，問題在模組這一端。<strong>拔掉 USB</strong>，對著 V／G／S 重接一次。'
    },
    short: {
      tab:'⚡ V 和 G 直接相碰',
      wires: wire('G', BY.G) + wire('V', BY.V) + wire('S', BY.S) +
             '<path class="zs-wire zs-jump" stroke="' + WIRE.V + '" d="M420 ' + BY.V + ' C 448 ' + BY.V + ', 452 168, 468 165"/>' +
             '<path class="zs-wire zs-jump" stroke="' + WIRE.G + '" d="M420 ' + BY.G + ' C 448 ' + BY.G + ', 452 162, 468 165"/>',
      hot:[468,165], power:'trip', led:'off',
      sign:'<strong>板子的電源燈突然熄掉，或一直閃</strong>；電腦可能跳出「USB 裝置電力過載」；碰在一起的接點會發燙。',
      why:'電流中間沒有任何零件擋一下，會瞬間衝到最大。' +
          '<strong>電腦的 USB 埠和板子上的保護元件會自己切斷電源</strong>，所以多半不會真的冒煙——' +
          '<strong style="color:#B2270E">但那是保護機制在救場，不是沒事</strong>。' +
          '如果改用外接電源（例如 9V 電池盒），就沒有電腦幫你擋了。',
      todo:'<strong>馬上拔掉 USB</strong>，把碰在一起的線分開，檢查過一次再插回去。'
    },
    off: {
      tab:'↕️ 整組插歪一格',
      wires: '<path class="zs-wire zs-air" stroke="' + WIRE.G + '" d="M520 ' + MY.G + ' C 490 ' + MY.G + ', 462 128, 446 124"/>' +
             '<circle class="zs-air-end" cx="446" cy="124" r="5"/>' +
             wire('V', BY.G) + wire('S', BY.V),
      hot:[420,150], power:'trip', led:'off',
      sign:'跟上一種一模一樣：<strong>電源燈熄掉或閃爍</strong>，板子像是沒插電。',
      why:'整組往上歪了一格，模組的 <strong>V 就壓到板子的 G</strong>——效果跟拿一條線把 V、G 接起來完全一樣，' +
          '就是短路。而且最邊邊那支腳還<strong>懸空沒插到</strong>。',
      todo:'拔掉 USB，<strong>蹲下來讓視線跟板子同高</strong>，確認三支腳各自對到一排，這個角度最看得出有沒有歪。'
    }
  };
  const KEYS = Object.keys(CASES);

  /* ── 舞台：電腦 → USB 線 → UNO → 模組 ── */
  let rows = '';
  ['G','V','S'].forEach(r => {
    rows += '<rect class="zs-strip" x="300" y="' + (BY[r] - 11) + '" width="120" height="22" rx="4" fill="' + BOARD[r] + '"/>' +
            '<text class="zs-rowlab" x="292" y="' + (BY[r] + 6) + '" text-anchor="end">' + r + '</text>';
  });

  root.innerHTML =
    '<div class="zapsim__pick" data-pick role="tablist">' +
      KEYS.map((k, i) => '<button type="button" class="zstab' + (i === 0 ? ' is-on' : '') +
        '" data-case="' + k + '">' + CASES[k].tab + '</button>').join('') +
    '</div>' +
    '<div class="zapsim__stage">' +
    '<svg class="zapsim__svg" viewBox="0 0 660 300" role="img" aria-label="接錯線通電後果模擬">' +
      /* 電腦 */
      '<rect class="zs-mac" x="16" y="70" width="112" height="78" rx="7"/>' +
      '<rect class="zs-screen" x="25" y="79" width="94" height="60" rx="3"/>' +
      '<rect class="zs-mac" x="4" y="150" width="136" height="10" rx="5"/>' +
      '<g class="zs-warn" data-warn>' +
        '<rect x="8" y="16" width="164" height="40" rx="8"/>' +
        '<text x="90" y="41" text-anchor="middle">⚠ USB 裝置電力過載</text>' +
      '</g>' +
      /* USB 線 */
      '<path class="zs-usb" d="M128 110 C 170 110, 176 130, 210 130"/>' +
      '<path class="zs-usb zs-flow" d="M128 110 C 170 110, 176 130, 210 130"/>' +
      /* 板子 */
      '<rect class="zs-pcb" x="210" y="60" width="210" height="190" rx="10"/>' +
      '<text class="zs-silk" x="228" y="84">Arduino UNO</text>' +
      '<circle class="zs-onled" data-on cx="240" cy="110" r="8"/>' +
      '<text class="zs-silk" x="256" y="115">ON 電源燈</text>' +
      rows +
      /* 接線（依情境重畫） */
      '<g data-wires></g>' +
      /* 短路發熱點。外層只負責「放在哪裡」，內層才做動畫——
         CSS 的 transform 會蓋掉 SVG 的 transform 屬性，兩件事
         寫在同一個 <g> 上，發熱點會被拉回原點。               */
      '<g data-hot><g class="zs-hot"><circle class="zs-hot-glow" r="20"/><circle class="zs-hot-core" r="7"/></g></g>' +
      /* 模組 */
      '<rect class="zs-mod" x="520" y="110" width="112" height="92" rx="9"/>' +
      '<circle class="zs-led" data-led cx="576" cy="150" r="14"/>' +
      '<text class="zs-modname" x="576" y="190" text-anchor="middle">LED 模組</text>' +
      ['G','V','S'].map(r => '<rect class="zs-port" x="514" y="' + (MY[r] - 7) + '" width="12" height="14" rx="2" fill="' + WIRE[r] + '"/>').join('') +
    '</svg></div>' +
    '<div class="zapsim__bar">' +
      '<button type="button" class="psbtn psbtn--go" data-go>🔌 插上 USB 通電</button>' +
      '<button type="button" class="psbtn" data-off>⏏️ 拔掉 USB</button>' +
    '</div>' +
    '<div class="zapsim__out" data-out aria-live="polite">' +
      '<p class="zapsim__idle">選一種接法，再按「插上 USB 通電」，看看板子會有什麼反應。</p>' +
    '</div>';

  const svg   = root.querySelector('.zapsim__svg');
  const gw    = root.querySelector('[data-wires]');
  const hot   = root.querySelector('[data-hot]');
  const out   = root.querySelector('[data-out]');
  let key = KEYS[0];

  const paint = () => {
    const c = CASES[key];
    gw.innerHTML = c.wires;
    if (c.hot) { hot.setAttribute('transform', 'translate(' + c.hot[0] + ' ' + c.hot[1] + ')'); }
    root.dataset.hot   = c.hot ? '1' : '0';
    root.dataset.power = c.power;
    root.dataset.led   = c.led;
  };

  const power = (on) => {
    /* 先拿掉再加回去，動畫才會從頭播——通電中換接法也看得到反應 */
    root.classList.remove('is-live');
    void root.offsetWidth;
    if (on) root.classList.add('is-live');
    const c = CASES[key];
    out.innerHTML = on
      ? '<p class="zapsim__line"><b>看到什麼</b>' + c.sign + '</p>' +
        '<p class="zapsim__line"><b>為什麼</b>' + c.why + '</p>' +
        '<p class="zapsim__line zapsim__line--do"><b>怎麼辦</b>' + c.todo + '</p>'
      : '<p class="zapsim__idle">選一種接法，再按「插上 USB 通電」，看看板子會有什麼反應。</p>';
  };

  root.querySelectorAll('[data-case]').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-case]').forEach(b => b.classList.toggle('is-on', b === btn));
      key = btn.dataset.case;
      paint();
      power(root.classList.contains('is-live'));   // 通電中換接法，結果立刻跟著換
    });
  });
  root.querySelector('[data-go]').addEventListener('click', () => power(true));
  root.querySelector('[data-off]').addEventListener('click', () => power(false));

  paint();
});

})();
