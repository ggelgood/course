/* ═══════════════════════════════════════════════════════════
   變數模擬台 —— 進階第 4、5、6、7 課共用
   ───────────────────────────────────────────────────────────
   一塊假的「舞台監看框」。按鈕代表一段小程式，按下去就照順序
   執行，數字跟著變，模擬「設為」「改變」「重複」在做的事。

   HTML 這樣寫：
     <div class="varlab" data-varlab data-vars='{"分數":0}'>
       <div class="varlab__panel">
         <label class="varlab__chk"><input type="checkbox" checked data-show="分數"> 在舞台上顯示「分數」</label>
         <div class="varlab__mons" data-mons></div>
       </div>
       <div class="varlab__ctl">
         <button class="pbtn pbtn--go" data-run='[{"op":"set","name":"分數","val":0}]'>🚩 綠旗被點擊</button>
       </div>
       <p class="varlab__say" data-say></p>
     </div>

   data-run 是一小段「程式」，陣列裡每一項是一個動作：
     {"op":"set","name":"分數","val":0}          設為
     {"op":"change","name":"分數","val":1}       改變
     {"op":"repeat","n":10,"body":[...]}          重複 N 次
     {"op":"wait","ms":500}                        等待（純粹讓動畫慢下來看得清楚）
     {"op":"say","text":"…"}                       在下面那行字打一句話

   ⚠️ 改完這個檔，記得把用到它的講義裡 varlab.js?v= 的數字 +1。
   ═══════════════════════════════════════════════════════════ */
(() => {
'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));

document.querySelectorAll('[data-varlab]').forEach(root => {
  let vars = {};
  try { vars = JSON.parse(root.dataset.vars || '{}'); } catch (e) {}

  const mons = root.querySelector('[data-mons]');
  const say  = root.querySelector('[data-say]');
  const chips = {};
  let busy = false;

  if (mons) {
    Object.keys(vars).forEach(name => {
      const chip = document.createElement('div');
      chip.className = 'varlab__mon';
      chip.innerHTML = '<span class="varlab__label">' + name + '</span><span class="varlab__val"></span>';
      mons.appendChild(chip);
      chips[name] = chip.querySelector('.varlab__val');
      chips[name].textContent = vars[name];
    });
  }

  const setVal = (name, v, flash) => {
    vars[name] = v;
    const el = chips[name];
    if (!el) return;
    el.textContent = v;
    if (flash) {
      const mon = el.closest('.varlab__mon');
      mon.classList.remove('varlab__mon--flash');
      void mon.offsetWidth;                 /* 重新觸發動畫 */
      mon.classList.add('varlab__mon--flash');
    }
  };

  async function runOps(ops) {
    for (const op of ops) {
      if (op.op === 'set') { setVal(op.name, op.val, true); await sleep(300); }
      else if (op.op === 'change') { setVal(op.name, (+vars[op.name] || 0) + op.val, true); await sleep(300); }
      else if (op.op === 'wait') { await sleep(op.ms || 500); }
      else if (op.op === 'say') { if (say) say.textContent = op.text; await sleep(200); }
      else if (op.op === 'repeat') { for (let i = 0; i < op.n; i++) await runOps(op.body); }
    }
  }

  root.querySelectorAll('[data-run]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      root.querySelectorAll('[data-run]').forEach(b => b.disabled = true);
      let ops = [];
      try { ops = JSON.parse(btn.dataset.run); } catch (e) {}
      await runOps(ops);
      root.querySelectorAll('[data-run]').forEach(b => b.disabled = false);
      busy = false;
    });
  });

  /* 勾選框：模擬「舞台上顯示／不顯示」這個監看框 */
  root.querySelectorAll('[data-show]').forEach(cb => {
    cb.addEventListener('change', () => {
      const el = chips[cb.dataset.show];
      if (!el) return;
      el.closest('.varlab__mon').classList.toggle('varlab__mon--hidden', !cb.checked);
    });
  });
});

})();
