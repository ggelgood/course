/* ═══════════════════════════════════════════════════════════
   中文打字系列 — 專用互動
   ───────────────────────────────────────────────────────────
   只有「中文打字」那幾課會載入這個檔。
   共用的行為（打勾清單、預測題、排序題、進度脊椎…）
   還是走 lesson.js —— 引用順序：lesson.js 在前，typing.js 在後。

   放在 </body> 前，不需要 defer。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ── 元件 1：鍵盤全圖 ───────────────────────────────────────
   HTML：<div class="kbdbox">
           <div class="kbd__tabs"><button class="ktab" data-go="main">…</button></div>
           <div class="kbdwrap"><div class="kbd" data-zone="all"> …五個 .kzone… </div></div>
           <p class="kbd__say"></p>
         </div>

   ‧ .ktab 切換 .kbd 的 data-zone，被選中的那一區亮起來，其他變暗
   ‧ 帶 data-say 的鍵可以點，說明會出現在 .kbd__say
   兩者都是選填 —— 只放鍵盤圖不放 tabs 也能正常顯示。          */
/* 同一張鍵盤圖在課文裡要出現好幾次（每一區講到的時候都放一張）。
   與其複製一大段 150 顆鍵的 HTML，課文裡只要放一個空的
   <div class="kbdbox" data-copy></div>，這裡自動把第一張複製過去。
   ⚠️ 一定要在下面的繫結迴圈「之前」跑完，複製出來的那幾張才會被綁到事件。 */
(() => {
  const src = document.querySelector('.kbdbox:not([data-copy])');
  if (!src) return;
  document.querySelectorAll('.kbdbox[data-copy]').forEach(dst => {
    dst.innerHTML = src.innerHTML;
    dst.querySelectorAll('.kk.on').forEach(k => k.classList.remove('on'));
    const kbd = dst.querySelector('.kbd');
    if (kbd) kbd.dataset.zone = dst.dataset.copy || 'all';   // data-copy="edit" 可預選某一區
    const say = dst.querySelector('.kbd__say');
    if (say) { say.classList.remove('on'); say.innerHTML = say.dataset.idle || ''; }
  });
})();

document.querySelectorAll('.kbdbox').forEach(box => {
  const kbd  = box.querySelector('.kbd');
  const say  = box.querySelector('.kbd__say');
  if (!kbd) return;

  /* 分區切換 */
  const tabs = [...box.querySelectorAll('.ktab')];
  const mark = z => tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.go === z ? 'true' : 'false'));
  tabs.forEach(tab => tab.addEventListener('click', () => {
    kbd.dataset.zone = tab.dataset.go;
    mark(tab.dataset.go);
  }));
  if (tabs.length) mark(kbd.dataset.zone || 'all');

  /* 點某一顆鍵，看它是幹嘛的 */
  if (!say) return;
  const keys = [...kbd.querySelectorAll('.kk[data-say]')];
  keys.forEach(k => k.addEventListener('click', () => {
    const already = k.classList.contains('on');
    keys.forEach(o => o.classList.remove('on'));
    if (already) {                       // 再點一次就收起來
      say.classList.remove('on');
      say.innerHTML = say.dataset.idle || '';
      return;
    }
    k.classList.add('on');
    say.classList.add('on');
    say.innerHTML = '<b>' + (k.dataset.name || k.textContent.trim()) + '</b>' + k.dataset.say;
  }));
  if (say.dataset.idle) say.innerHTML = say.dataset.idle;
});

/* ── 元件 2：三顆燈實驗 ─────────────────────────────────────
   讓學生親手把燈關掉、看著數字真的打不出來、再開回來。
   親手把問題製造出來再修好，比講十遍有用。

   HTML：<div class="lamp" data-say-on="…" data-say-off="…">
           <button class="lamp__bulb" aria-pressed="true">Num Lock<small>…</small></button>
           <div class="lamp__pad">
             <button class="lamp__key"
                     data-on="7"  data-emit-on="7"
                     data-off="Home" data-emit-off=""
                     data-dead-say="…"></button>
           </div>
           <output class="lamp__out"></output>
           <button class="btn" data-clear>清空</button>
           <p class="lamp__say"></p>
         </div>

   data-emit-* 是空字串 = 這顆鍵在這個狀態下「打不出東西」，
   按下去會改成顯示 data-dead-say。                            */
document.querySelectorAll('.lamp').forEach(box => {
  const bulb = box.querySelector('.lamp__bulb');
  const out  = box.querySelector('.lamp__out');
  const say  = box.querySelector('.lamp__say');
  const keys = [...box.querySelectorAll('.lamp__key')];
  if (!bulb || !out) return;

  const isOn = () => bulb.getAttribute('aria-pressed') === 'true';

  const tell = (msg, kind) => {
    if (!say) return;
    say.innerHTML = msg || '';
    if (kind) say.dataset.k = kind; else delete say.dataset.k;
  };

  /* 燈的狀態變了，鍵面上印的字、還有指示燈都要跟著換 */
  const lamps = [...box.querySelectorAll('.klamp[data-lit]')];
  const face = () => {
    const on = isOn();
    keys.forEach(k => {
      const txt  = on ? k.dataset.on   : k.dataset.off;
      const emit = on ? k.dataset.emitOn : k.dataset.emitOff;
      k.textContent = txt || '';
      k.dataset.dead = emit ? '0' : '1';
    });
    lamps.forEach(l => l.classList.toggle('on', on));
  };

  bulb.addEventListener('click', () => {
    const next = !isOn();
    bulb.setAttribute('aria-pressed', next ? 'true' : 'false');
    face();
    tell(next ? box.dataset.sayOn : box.dataset.sayOff, next ? 'on' : 'off');
  });

  keys.forEach(k => k.addEventListener('click', () => {
    const on   = isOn();
    const emit = on ? k.dataset.emitOn : k.dataset.emitOff;
    if (emit) {
      out.textContent += emit;
      tell(box.dataset.sayTyped || '', 'on');
    } else {
      tell(k.dataset.deadSay || '這顆鍵現在打不出東西。', 'off');
    }
  }));

  const clr = box.querySelector('[data-clear]');
  if (clr) clr.addEventListener('click', () => { out.textContent = ''; });

  face();
  tell(box.dataset.sayIdle || '');
});

/* ── 元件 3.5：符號輸入測試 ─────────────────────────────────
   HTML：<div class="symtest">
           <div class="symgrid">
             <label class="sym" data-want="?" data-key="Shift ＋ /">
               <span class="sym__want">?</span>
               <input type="text" maxlength="4" inputmode="text">
               <span class="sym__mark"></span>
               <p class="sym__say"></p>
             </label>
           </div>
           <p class="symtest__score"></p>
         </div>

   ⚠️ 兩個一定要處理的細節：
     1. 中文輸入法打出來是全形（？），英文是半形（?）——
        全形字在 Unicode 的 FF01–FF5E，減 0xFEE0 就是對應的半形，
        換算完再比對，兩種都算對。不然學生打對了卻被判錯。
     2. 打注音時輸入框會先出現「組字中」的注音，這時候不要判定，
        等 compositionend 再看。                                */
document.querySelectorAll('.symtest').forEach(box => {
  const cells = [...box.querySelectorAll('.sym')];
  const score = box.querySelector('.symtest__score');
  if (!cells.length) return;

  /* 全形 → 半形（U+FF01–FF5E 減 0xFEE0 就是對應的半形） */
  const half = s => (s || '').replace(/[！-～]/g,
    c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).trim();

  /* data-want 可以用 | 列出多個都算對的答案。

     加上 data-strict 就「不做全形半形換算」——
     用在中文標點那幾格：我們要的是中文的「，」「。」，
     打出英文的 , . 必須算錯，學生才會發現自己在英文輸入法下。 */
  const shape = (s, strict) => strict ? (s || '').trim() : half(s);
  const wants = cell => (cell.dataset.want || '').split('|')
    .map(w => shape(w, cell.hasAttribute('data-strict'))).filter(Boolean);

  const tally = () => {
    if (!score) return;
    const n = cells.filter(c => c.dataset.s === 'hit').length;
    const all = n === cells.length;
    score.innerHTML = all
      ? (box.dataset.done || '🎉 全部答對！')
      : '答對 ' + n + ' / ' + cells.length + ' 個。';
    if (all) score.dataset.k = 'all'; else delete score.dataset.k;
  };

  cells.forEach(cell => {
    const input = cell.querySelector('input');
    const mark  = cell.querySelector('.sym__mark');
    const say   = cell.querySelector('.sym__say');
    const ok     = wants(cell);
    const key    = cell.dataset.key || '';
    const strict = cell.hasAttribute('data-strict');
    let composing = false;

    const judge = () => {
      if (composing) return;                 // 還在組字，先不要判
      const got = shape(input.value, strict);
      if (!got) {                            // 清空 → 回到未作答
        delete cell.dataset.s;
        if (mark) mark.textContent = '';
        if (say) say.innerHTML = '';
        return tally();
      }
      if (ok.includes(got)) {
        cell.dataset.s = 'hit';
        if (mark) mark.textContent = '✓';
        if (say) say.innerHTML = '答對了！這個要按 <b>' + key + '</b>。';
      } else {
        cell.dataset.s = 'miss';
        if (mark) mark.textContent = '✗';
        if (say) say.innerHTML = '你打出來的是「' + input.value + '」。' +
          (cell.dataset.miss || '再看一次鍵盤，找找看它在哪一顆鍵上。');
      }
      tally();
    };

    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; judge(); });
    input.addEventListener('input', judge);
  });

  tally();
});

/* ── 元件 3：游標實驗室 ─────────────────────────────────────
   第 1 課最重要的互動。要講清楚三件事：
     1. Backspace 刪游標「左邊」、Delete 刪游標「右邊」（剛好相反）
     2. Home / End 一次跳到行首行尾，不用按著方向鍵慢慢移
     3. Insert 被按到之後，新打的字會「蓋掉」後面原本的字
        —— 螢幕上沒有任何提示，學生只會覺得字被吃掉了

   HTML：<div class="caret" data-text="小貓在公園裡跑步" data-pos="4" data-type="新">
           <div class="caret__line"></div>
           <div class="caret__btns"> …data-act 的按鈕… </div>
           <p class="caret__say"></p>
         </div>
   data-act：left / right / home / end / back / del / type / ins / reset  */
document.querySelectorAll('.caret').forEach(box => {
  const line = box.querySelector('.caret__line');
  const say  = box.querySelector('.caret__say');
  if (!line) return;

  const seed = [...(box.dataset.text || '')];
  const typeCh = box.dataset.type || '新';
  let chars, pos, over = false;

  const tell = (msg, kind) => {
    if (!say) return;
    say.innerHTML = msg;
    if (kind) say.dataset.k = kind; else delete say.dataset.k;
  };

  /* 重畫整行字，游標畫成一根會閃的直線 */
  const draw = () => {
    line.textContent = '';
    chars.forEach((c, i) => {
      if (i === pos) line.appendChild(bar());
      const s = document.createElement('span');
      s.className = 'caret__ch';
      s.dataset.i = i;
      s.textContent = c;
      line.appendChild(s);
    });
    if (pos >= chars.length) line.appendChild(bar());
  };
  const bar = () => {
    const b = document.createElement('i');
    b.className = 'caret__bar';
    return b;
  };

  const reset = () => {
    chars = [...seed];
    pos = Math.min(+(box.dataset.pos || 0), chars.length);
    over = false;
    const ins = box.querySelector('[data-act="ins"]');
    if (ins) ins.setAttribute('aria-pressed', 'false');
    draw();
    tell(box.dataset.sayIdle || '游標（會閃的那根線）現在停在字中間。試試看下面的按鈕，看每一顆鍵各做了什麼。');
  };

  const act = {
    left(){
      if (pos === 0) return tell('游標已經在最前面了，再往左也不會動。', 'warn');
      pos--; draw();
      tell('游標往左移了一格。方向鍵只移動游標，<strong>不會刪掉任何字</strong>。');
    },
    right(){
      if (pos === chars.length) return tell('游標已經在最後面了，再往右也不會動。', 'warn');
      pos++; draw();
      tell('游標往右移了一格。');
    },
    home(){
      pos = 0; draw();
      tell('<strong>Home</strong> 一下子就跳到<strong>這一行的最前面</strong> —— 不用按著方向鍵慢慢移過去。', 'ok');
    },
    end(){
      pos = chars.length; draw();
      tell('<strong>End</strong> 一下子就跳到<strong>這一行的最後面</strong>。跟 Home 剛好是一對。', 'ok');
    },
    back(){
      if (pos === 0) return tell('游標前面沒有字了，Backspace 沒東西可以刪。', 'warn');
      const gone = chars[pos - 1];
      chars.splice(pos - 1, 1); pos--; draw();
      tell(`<strong>Backspace</strong> 刪掉了游標<strong>左邊</strong>的「${gone}」。`);
    },
    del(){
      if (pos === chars.length) return tell('游標後面沒有字了，Delete 沒東西可以刪。', 'warn');
      const gone = chars[pos];
      chars.splice(pos, 1); draw();
      tell(`<strong>Delete</strong> 刪掉了游標<strong>右邊</strong>的「${gone}」—— 而且游標<strong>沒有移動</strong>。`);
    },
    type(){
      if (over && pos < chars.length) {
        const eaten = chars[pos];
        chars[pos] = typeCh; pos++; draw();
        return tell(
          `😱 你打了一個「${typeCh}」，可是後面的「${eaten}」<strong>不見了</strong>！<br>` +
          `因為 Insert 是開著的 —— 新的字會<strong>蓋掉</strong>原本的字，而不是擠進去。<br>` +
          `<strong>解法：再按一次 Insert 就好了。</strong>`, 'warn');
      }
      chars.splice(pos, 0, typeCh); pos++; draw();
      tell(`打了一個「${typeCh}」，它<strong>擠進</strong>游標的位置，後面的字往右讓開。這才是正常的樣子。`);
    },
    ins(btn){
      over = !over;
      btn.setAttribute('aria-pressed', over ? 'true' : 'false');
      tell(over
        ? '你按下了 <strong>Insert</strong>。現在畫面上<strong>看不出任何差別</strong> —— 這正是它可怕的地方。<br>接著按一次「打一個字」，看看會發生什麼事。'
        : '再按一次 <strong>Insert</strong> 就恢復正常了。字又會乖乖擠進去，不會蓋掉別人。', over ? 'warn' : 'ok');
    },
    reset(){ reset(); }
  };

  box.querySelectorAll('[data-act]').forEach(btn => {
    const name = btn.dataset.act;
    btn.addEventListener('click', () => act[name] && act[name](btn));

    /* 滑鼠移到刪除鍵上，先把「等一下會被刪掉的那個字」標出來 ——
       學生看得到目標，才分得出 Backspace 和 Delete 差在哪 */
    if (name === 'back' || name === 'del') {
      const target = () => {
        const i = name === 'back' ? pos - 1 : pos;
        return line.querySelector(`.caret__ch[data-i="${i}"]`);
      };
      btn.addEventListener('mouseenter', () => { const t = target(); if (t) t.classList.add('hit'); });
      btn.addEventListener('mouseleave', () => line.querySelectorAll('.hit').forEach(e => e.classList.remove('hit')));
    }
  });

  reset();
});

})();
