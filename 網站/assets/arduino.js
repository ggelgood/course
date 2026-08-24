/* ═══════════════════════════════════════════════════════════
   Arduino 課專用互動 —— 只有這門課的講義會 link 這個檔。
   共用的東西（點擊揭曉、打勾清單、預測題、求救框…）走 lesson.css，
   這裡只放這門課才有的元件。

   引用順序一定是 lesson.css 在前、arduino.css／arduino.js 在後。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ═══ 元件 1：GVS 插槽配對（gvsmatch）══════════════════════
   點一條線、再點一個插槽，配對正確就固定住、變綠色；
   配對錯誤會短暫閃紅色，兩邊都取消選取，可以重來。

   HTML：
     <div class="gvsmatch" data-gvsmatch>
       <div class="gvsmatch__wires" data-wires>
         <button class="gwire" data-id="v" data-color="#E5484D">紅色線<small>電源</small></button>
         <button class="gwire" data-id="g" data-color="#2B2119">黑色線<small>接地</small></button>
         <button class="gwire" data-id="s" data-color="#FFBF00">黃色線<small>訊號</small></button>
       </div>
       <div class="gvsmatch__slots" data-slots>
         <button class="gslot" data-id="s">S</button>
         <button class="gslot" data-id="v">V</button>
         <button class="gslot" data-id="g">G</button>
       </div>
       <p class="gvsmatch__msg" data-msg></p>
     </div>

   ⚠️ 插槽的 data-slots 順序刻意跟 data-wires 不一樣（不是 v,g,s 對 v,g,s），
      不然學生用「位置」對位置就能矇對，不用真的讀字。
   ═══════════════════════════════════════════════════════════ */
document.querySelectorAll('[data-gvsmatch]').forEach(root => {
  const wires = root.querySelector('[data-wires]');
  const slots = root.querySelector('[data-slots]');
  const msg   = root.querySelector('[data-msg]');
  if (!wires || !slots) return;

  let picked = null;   // 目前選中的線
  let done = new Set();

  const clearPick = () => {
    wires.querySelectorAll('.gwire').forEach(b => b.classList.remove('gwire--pick'));
    picked = null;
  };

  wires.querySelectorAll('.gwire').forEach(btn => {
    btn.style.setProperty('--wc', btn.dataset.color || '#999');
    btn.addEventListener('click', () => {
      if (done.has(btn.dataset.id)) return;
      clearPick();
      picked = btn.dataset.id;
      btn.classList.add('gwire--pick');
      if (msg) msg.textContent = '';
    });
  });

  slots.querySelectorAll('.gslot').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!picked || done.has(btn.dataset.id)) return;
      if (picked === btn.dataset.id) {
        done.add(picked);
        wires.querySelector('.gwire[data-id="' + picked + '"]').classList.add('gwire--ok');
        btn.classList.add('gslot--ok');
        if (msg) msg.innerHTML = done.size >= 3
          ? '🎉 三條線都接對了！這就是 GVS。'
          : '接對了，繼續下一條。';
      } else {
        btn.classList.add('gslot--bad');
        setTimeout(() => btn.classList.remove('gslot--bad'), 400);
        if (msg) msg.textContent = '接錯了，再想想這條線是做什麼用的。';
      }
      clearPick();
    });
  });
});

})();
