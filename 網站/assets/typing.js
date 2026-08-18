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

/* ── 元件 6：注音鍵盤（直行規律）─────────────────────────────
   第 2 課的主角。學生要看見的是「一條直行剛好是一組注音」，
   所以滑到任何一顆鍵，<strong>整條直行</strong>要一起亮起來，
   而不是只亮那一顆。

   HTML：<div class="bpmbox">
           <div class="kbd__tabs"><button class="ktab" data-go="full">…</button></div>
           <div class="bpmwrap">
             <div class="bpm" data-focus="all">
               <div class="bpmrow">
                 <button class="bk" data-col="1" data-kind="full"
                         data-en="1" data-bpm="ㄅ"><i>1</i><b>ㄅ</b></button>
               </div>
             </div>
           </div>
           <p class="bpm__say" data-idle="…"></p>
         </div>

   ‧ data-col：屬於哪一直行（1～11），同一個 col 的鍵會一起亮
   ‧ data-kind：full＝完整四個／short＝只有三個（空格放聲調）／one＝ㄦ
   ‧ 滑過去＝暫時亮，點下去＝鎖住（再點一次解開）                */

/* 同一張注音鍵盤在課文裡會出現兩次（講規律一次、講聲調一次）。
   比照鍵盤全圖的做法：課文放 <div class="bpmbox" data-copy="tone"></div>，
   這裡自動把第一張複製過去，data-copy 的值就是要預選的那一群。
   ⚠️ 一定要在下面的繫結迴圈「之前」跑完。 */
(() => {
  const src = document.querySelector('.bpmbox:not([data-copy])');
  if (!src) return;
  document.querySelectorAll('.bpmbox[data-copy]').forEach(dst => {
    dst.innerHTML = src.innerHTML;
    dst.querySelectorAll('.bk').forEach(k => k.classList.remove('hot', 'pick'));
    const bpm = dst.querySelector('.bpm');
    if (bpm) bpm.dataset.focus = dst.dataset.copy || 'all';
    const say = dst.querySelector('.bpm__say');
    if (say) { say.classList.remove('on'); say.innerHTML = say.dataset.idle || ''; }
  });
})();

document.querySelectorAll('.bpmbox').forEach(box => {
  const bpm = box.querySelector('.bpm');
  const say = box.querySelector('.bpm__say');
  if (!bpm) return;

  /* 上面那排切換鈕（沿用鍵盤全圖那套 .ktab） */
  const tabs = [...box.querySelectorAll('.ktab')];
  const mark = z => tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.go === z ? 'true' : 'false'));
  tabs.forEach(tab => tab.addEventListener('click', () => {
    bpm.dataset.focus = tab.dataset.go;
    mark(tab.dataset.go);
  }));
  if (tabs.length) mark(bpm.dataset.focus || 'all');

  const keys = [...bpm.querySelectorAll('.bk[data-col]')];
  if (!keys.length) return;

  const colOf = c => keys.filter(k => k.dataset.col === c);
  const lightOnly = c => keys.forEach(k => k.classList.toggle('hot', !!c && k.dataset.col === c));

  /* 每一直行的註解直接由 data-kind 推出來，不用在 37 顆鍵上各寫一份 */
  const note = {
    full : '這一直行剛好是<b>完整的四個</b>。',
    short: '這一直行<b>只有三個</b>注音，空出來的第一格拿來<b>放聲調</b>。',
    one  : 'ㄦ 是注音符號表的<b>最後一個</b>，自己站一格。'
  };

  const tell = k => {
    if (!say) return;
    const ks = colOf(k.dataset.col);
    say.classList.add('on');
    say.innerHTML =
      '<b>' + ks.map(x => x.dataset.en).join(' ') + '</b>' +
      '這一直行由上往下是 <strong>' + ks.map(x => x.dataset.bpm).join(' ') + '</strong><br>' +
      (note[k.dataset.kind] || '');
  };

  const idle = () => {
    if (!say) return;
    say.classList.remove('on');
    say.innerHTML = say.dataset.idle || '';
  };

  let locked = null;                     // 被點住的那一直行

  keys.forEach(k => {
    /* 滑過去：暫時亮，移開就回到鎖住的那一行（沒鎖就全滅） */
    k.addEventListener('mouseenter', () => {
      if (locked) return;
      lightOnly(k.dataset.col);
      tell(k);
    });
    k.addEventListener('mouseleave', () => {
      if (locked) return;
      lightOnly(null);
      idle();
    });

    /* 點下去：鎖住這一直行（手機沒有 hover，靠這個也能用） */
    k.addEventListener('click', () => {
      const same = locked === k.dataset.col;
      keys.forEach(o => o.classList.remove('pick'));
      if (same) {                         // 再點一次就解開
        locked = null;
        lightOnly(null);
        return idle();
      }
      locked = k.dataset.col;
      lightOnly(locked);
      colOf(locked).forEach(o => o.classList.add('pick'));
      tell(k);
    });
  });

  idle();
});

/* ── 元件 7：兩種打法的按鍵次數對照 ─────────────────────────
   「一個字一個字選」對上「整串打完再選」。
   學生自己按下一步走完兩邊，最後用<strong>數字</strong>看到差多少 ——
   比直接跟他說「這樣比較快」有用得多。

   HTML：<div class="wpick" data-say="…兩邊都走完才出現的結論…">
           <div class="wpick__grid">
             <div class="wp wp--slow">
               <h4>…</h4>
               <output class="wp__scr"><b></b><i></i></output>
               <ol class="wp__log">
                 <li data-n="6" data-out="電" data-pend="">…這一步在做什麼…</li>
               </ol>
               <div class="wp__foot">
                 <span class="wp__n">按了 <b>0</b> 下</span>
                 <button class="wp__go">下一步 ▸</button>
               </div>
             </div>
           </div>
           <p class="wpick__say"></p>
         </div>

   data-n    ＝ 這一步按了幾下鍵
   data-out  ＝ 走完這一步，記事本上會有的字
   data-pend ＝ 還在組字中／候選字那一行（沒有就留空）      */
document.querySelectorAll('.wpick').forEach(box => {
  const sides = [...box.querySelectorAll('.wp')];
  const say   = box.querySelector('.wpick__say');
  if (!sides.length) return;

  const runs = sides.map(side => {
    const steps = [...side.querySelectorAll('.wp__log li')];
    const scr   = side.querySelector('.wp__scr');
    const out   = scr && scr.querySelector('b');
    const pend  = scr && scr.querySelector('i');
    const num   = side.querySelector('.wp__n b');
    const go    = side.querySelector('.wp__go');
    let at = 0, total = 0;

    const step = () => {
      const li = steps[at];
      if (!li) return;
      li.dataset.on = '1';
      total += +(li.dataset.n || 0);
      at++;
      if (num) num.textContent = total;
      if (out)  out.textContent  = li.dataset.out  || '';
      if (pend) pend.textContent = li.dataset.pend || '';
      if (at >= steps.length && go) {
        go.disabled = true;
        go.textContent = '打完了 ✓';
      }
      done();
    };

    if (go) go.addEventListener('click', step);
    return {
      get over(){ return at >= steps.length; },
      get n(){ return total; }
    };
  });

  /* 兩邊都走完，才把結論放出來 —— 先看到答案就沒有比的意思了 */
  function done(){
    if (!say || !runs.every(r => r.over)) return;
    const slow = runs[0].n, fast = runs[1] ? runs[1].n : 0;
    say.dataset.k = 'all';
    say.innerHTML = (box.dataset.say || '')
      .replace('{慢}', '<b>' + slow + '</b>')
      .replace('{快}', '<b>' + fast + '</b>')
      .replace('{差}', '<b>' + (slow - fast) + '</b>');
  }
});

/* ── 元件 8：整句打字練習 ───────────────────────────────────
   逐字比對，打對的字一個一個亮起來。
   ⚠️ 刻意<strong>不計時、不算速度</strong> —— 課程地圖寫得很清楚：
      排名會變成比賽，慢的學生直接放棄。只跟自己上次比。

   HTML：<div class="trace" data-done="…全部打完的話…">
           <div class="trow" data-want="電腦教室" data-tip="…">
             <div class="trow__want"></div>          ← 字格由 JS 生
             <div class="trow__in">
               <input type="text" aria-label="…">
               <span class="trow__mark"></span>
             </div>
             <p class="trow__say"></p>
           </div>
           <p class="trace__score"></p>
         </div>

   ⚠️ 中文組字一定要處理：學生打注音時輸入框會先出現「ㄉㄧㄢˋ」，
      這時候比對必定判錯，要等 compositionend 才判。
      這是整個系列最容易做壞的地方。                          */
document.querySelectorAll('.trace').forEach(box => {
  const rows  = [...box.querySelectorAll('.trow')];
  const score = box.querySelector('.trace__score');
  if (!rows.length) return;

  const tally = () => {
    if (!score) return;
    const n = rows.filter(r => r.dataset.s === 'hit').length;
    const all = n === rows.length;
    score.innerHTML = all
      ? (box.dataset.done || '🎉 全部打完了！')
      : '打完 ' + n + ' / ' + rows.length + ' 句。';
    if (all) score.dataset.k = 'all'; else delete score.dataset.k;
  };

  rows.forEach(row => {
    const want  = [...(row.dataset.want || '')];
    const wrap  = row.querySelector('.trow__want');
    const input = row.querySelector('input');
    const mark  = row.querySelector('.trow__mark');
    const say   = row.querySelector('.trow__say');
    if (!want.length || !wrap || !input) return;

    /* 一個字一格，打對就亮 */
    const cells = want.map(ch => {
      const s = document.createElement('span');
      s.className = 'tch';
      s.textContent = ch;
      wrap.appendChild(s);
      return s;
    });

    let composing = false;

    const judge = () => {
      if (composing) return;              // 還在組字，先不要判
      const got = [...input.value];
      let bad = false;

      cells.forEach((c, i) => {
        if (i < got.length) {
          const ok = got[i] === want[i];
          c.dataset.s = ok ? 'ok' : 'bad';
          if (!ok) bad = true;
        } else {
          delete c.dataset.s;
        }
      });
      /* 下一個該打的字畫一圈，學生才知道打到哪了 */
      if (!bad && got.length < want.length) cells[got.length].dataset.s = 'now';

      const full = !bad && got.length === want.length;
      if (full) {
        row.dataset.s = 'hit';
        if (mark) mark.textContent = '✓';
        if (say) say.innerHTML = '打對了！' + (row.dataset.tip || '');
      } else if (bad) {
        row.dataset.s = 'miss';
        if (mark) mark.textContent = '✗';
        if (say) say.innerHTML = '有字不一樣（<b>紅色</b>那格）。用 <b>Backspace</b> 刪掉重打就好。';
      } else {
        delete row.dataset.s;
        if (mark) mark.textContent = '';
        if (say) say.innerHTML = got.length
          ? '繼續，還差 ' + (want.length - got.length) + ' 個字。'
          : '';
      }
      tally();
    };

    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; judge(); });
    input.addEventListener('input', judge);
    judge();
  });

  tally();
});

/* ── 元件 9：組合鍵偵測 ─────────────────────────────────────
   第 3 課主線。學生把手指放上真的鍵盤按組合鍵，對不對由這裡判斷。
   練的是「按住不放、兩顆一起放開」這個動作，不是打字。

   ⚠️ 一定要 preventDefault()，不然 Ctrl+A 會選取整個網頁、
      Ctrl+Z 在某些瀏覽器裡會觸發上一頁，很容易嚇到學生。

   ⚠️ 單獨的 Shift 判斷比較特別：keydown 一定會先收到 Shift 自己，
      但那時候還不知道學生是「只按 Shift」還是「等一下要配別的鍵」。
      要等 keyup 才能確定——如果中途沒有夾雜別的鍵，才算對。

   HTML：<div class="hotkey">
           <div class="hkrow" data-combo="ctrl+z" data-task="…">
             <div class="hkrow__head"><p class="hkrow__task"></p><p class="hkrow__combo"></p></div>
             <div class="hkrow__zone" tabindex="0"></div>
             <p class="hkrow__say"></p>
           </div>
           <p class="hotkey__score"></p>
         </div>                                                */
document.querySelectorAll('.hotkey').forEach(box => {
  const rows  = [...box.querySelectorAll('.hkrow')];
  const score = box.querySelector('.hotkey__score');
  if (!rows.length) return;

  const tally = () => {
    if (!score) return;
    const n = rows.filter(r => r.dataset.s === 'hit').length;
    const all = n === rows.length;
    score.innerHTML = all
      ? (box.dataset.done || '🎉 全部按對了！')
      : '按對 ' + n + ' / ' + rows.length + ' 個。';
    if (all) score.dataset.k = 'all'; else delete score.dataset.k;
  };

  rows.forEach(row => {
    const zone = row.querySelector('.hkrow__zone');
    const say  = row.querySelector('.hkrow__say');
    const want = row.dataset.combo || '';
    if (!zone) return;

    /* 追蹤「只按 Shift」還是中途夾了別的鍵。
       ⚠️ 不能用「再按一次就切換」的邏輯：按住不放的時候，
       瀏覽器會不斷重複觸發 keydown（長按的重複輸入），
       如果每次 keydown 都切換一次狀態，長按到一半就會被自己判成錯的。
       改成「碰過真的按下」就設 true，不會因為重複觸發而反覆橫跳。 */
    let shiftDown = false, otherWhileShift = false;

    const hit = () => {
      row.dataset.s = 'hit';
      if (say) say.innerHTML = '答對了！就是這個組合。' + (row.dataset.tip || '');
      tally();
    };
    const miss = msg => {
      if (row.dataset.s === 'hit') return;   // 已經答對就不要再被蓋掉
      row.dataset.s = 'miss';
      if (say) say.innerHTML = msg || (row.dataset.miss || '再試一次，記得<b>按住不放</b>。');
      tally();
    };

    zone.addEventListener('keydown', e => {
      if (row.dataset.s === 'hit') return;
      e.preventDefault();                    // 擋掉真的觸發 Ctrl+A 全選網頁之類的副作用

      if (want === 'shift') {
        if (e.key === 'Shift') { shiftDown = true; return; }
        if (shiftDown) otherWhileShift = true;   // 中途夾了別的鍵，不算單獨按 Shift
        return;
      }

      const key = e.key.toLowerCase();
      if (['control', 'shift', 'alt', 'meta'].includes(key)) return;  // 修飾鍵本身，先不判
      const parts = [];
      if (e.ctrlKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      parts.push(key);
      const combo = parts.join('+');
      combo === want ? hit() : miss('你按的是 <b>' + combo.replace(/\+/g, ' ＋ ') + '</b>。');
    });

    zone.addEventListener('keyup', e => {
      if (want === 'shift' && e.key === 'Shift' && row.dataset.s !== 'hit') {
        (shiftDown && !otherWhileShift) ? hit() : miss('要<b>只按 Shift</b>，不要配別的鍵一起按。');
        shiftDown = false; otherWhileShift = false;
      }
    });
  });

  tally();
});

})();
