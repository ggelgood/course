# 國小電腦課講義專案 — 交接筆記

給 Claude Code：這是延續 claude.ai 網頁版對話的專案。請先讀完這份文件再開始動作。

## 專案背景

- 使用者：國小電腦老師，教 Scratch、Arduino、資訊科技相關課程。
- 講義用途：**學生自己在電腦前操作看** + **老師投影講解**，兩者都要顧。
- 講義發布方式：還沒決定（可能是電腦教室共用資料夾、可能是網址、可能是 Google
  Classroom）。目前策略是「先做成完全自足、可離線開啟的單一 HTML 檔」，
  這樣未來要走哪條路都可以，不綁定任何平台。
- **不印紙本。**

## 已經決定的技術方向（不要重新討論，除非使用者主動提出）

1. **單一 HTML 檔，一課一檔**，CSS/JS 全部內嵌在同一個檔案裡，不依賴外部
   CDN（校園網路常擋外部資源，離線也要能開）。
2. **Scratch 積木一律用 [scratchblocks](https://github.com/scratchblocks/scratchblocks)
   函式庫文字渲染，絕對不要用截圖或手畫積木圖。**
   - 函式庫檔案已內嵌在 `lessons/scratch-01-角色與積木.html` 裡；若要做新課，
     從 `assets/scratchblocks/scratchblocks.min.js` 和 `zh-tw.json` 重新內嵌即可
     （方法見下方「如何內嵌 scratchblocks」）。
   - 語言用 `zh-tw`（繁體中文積木名稱），render 時呼叫：
     ```js
     scratchblocks.renderMatching('pre.blocks', { style:'scratch3', languages:['zh-tw'], scale:1 });
     ```
   - 寫積木語法時，**先用本文件最後附的「已驗證積木對照表」**，或用下方
     「如何驗證新積木語法」的腳本自行驗證，避免打錯字導致積木顯示空白/英文。
3. **不要用電腦操作工具（GUI automation）去開 Scratch/Arduino IDE 截圖。**
   已經跟使用者說明過這條路太慢太不穩定。真正需要的截圖，由老師自己截，
   截完後可以請 Claude（本工具或網頁版皆可）幫忙裁切、加框線、加編號標註、
   統一尺寸。目前檔案裡用 `.shot` 這個 CSS class 做「截圖待補」的視覺佔位框，
   之後老師截圖後手動貼進 `<img>` 或改寫該區塊即可。
4. **互動元件目前只做了這幾種**，都是原生 HTML/CSS/JS（`<details>`、按鈕
   click 事件），沒有用任何前端框架：
   - 點擊揭曉答案（`<details class="reveal">`）
   - 投影模式切換（放大全站字級 / 版面寬度）
   - 步驟打勾（`.steps li` click 切換 `data-done`）
   - 選擇題小測驗（`.quiz` + `.opt` click 判斷對錯給即時回饋）
   - 頁面閱讀進度條
   之後如果要加新的互動元件，維持這個「無框架、純 HTML/CSS/JS、單檔案」
   的作法，方便老師自己看懂、之後自行修改。
5. **視覺風格**：暖白底紙感（`--paper:#FDFBF5`）、主色深青 `#0B6E75` +
   焦橙 `#D9480F`，中文字型用 `"Microsoft JhengHei","微軟正黑體",...`。
   已在第一份講義裡定案，之後新課請沿用同一套 CSS 變數以維持系列一致性
   （直接複製 `<style>` 區塊的 `:root` 變數即可）。

## 目前進度

- ✅ 已完成 1 份原型：`lessons/scratch-01-角色與積木.html`
  （Scratch 入門①：認識角色與積木，內容為草稿，教學流程與深淺待老師確認調整）
- ⬜ 尚未開始：Scratch 進階（變數/迴圈）、Arduino 基礎、其他資訊素養主題
- ⬜ 尚未決定：是否要做一個「課程總覽首頁」把多課連結起來
- ⬜ 尚未決定：投影模式是否要記住學生的步驟打勾狀態（目前重新整理會消失）

## 如何內嵌 scratchblocks（做新課時）

新課的 HTML 裡先寫好內容和 `<pre class="blocks">...</pre>`（純文字積木語法），
在 `</body>` 前留兩個占位註解，之後用腳本把函式庫塞進去：

```html
<script>/*__SCRATCHBLOCKS__*/</script>
<script>/*__LOCALE__*/</script>
```

內嵌腳本（Python，路徑依實際檔名調整）：

```python
import json, pathlib
html = pathlib.Path('新課檔名.html').read_text(encoding='utf-8')
sb = pathlib.Path('assets/scratchblocks/scratchblocks.min.js').read_text(encoding='utf-8')
loc = json.load(open('assets/scratchblocks/zh-tw.json', encoding='utf-8'))
locjs = 'window.scratchblocks.loadLanguages({"zh-tw":' + json.dumps(loc, ensure_ascii=False, separators=(',',':')) + '});'
html = html.replace('/*__SCRATCHBLOCKS__*/', sb).replace('/*__LOCALE__*/', locjs)
pathlib.Path('新課檔名.html').write_text(html, encoding='utf-8')
```

頁面載入時要呼叫（已經寫在範例檔的 `<script>` 尾端，複製過去即可）：

```js
window.addEventListener('load', () => {
  if (window.scratchblocks) {
    scratchblocks.renderMatching('pre.blocks', { style:'scratch3', languages:['zh-tw'], scale:1 });
  }
});
```

## 如何驗證新積木語法（避免打錯字）

寫新的積木文字之前，可以用這個腳本先檢查每一行是不是 scratchblocks
zh-tw 語言檔裡真的有的積木（比直接開瀏覽器看快很多）：

```python
import json, re
d = json.load(open('assets/scratchblocks/zh-tw.json', encoding='utf-8'))

def L(s):
    s = s.replace('_', ' _ ')
    s = re.sub(r' +', ' ', s)
    s = re.sub(r'[,%?:]', '', s)
    return s.strip().lower()

def S(spec):
    return L(re.sub(r'%[a-zA-Z0-9](?:\.[a-zA-Z0-9]+)?', ' _ ', spec))

known = {}
for cid, spec in d['commands'].items():
    known.setdefault(S(spec), []).append(cid)
for al, cid in d['aliases'].items():
    known.setdefault(L(al), []).append(cid)

def norm_line(line):
    t = re.sub(r'\([^()]*\)|\[[^\[\]]*\]|<[^<>]*>', ' _ ', line)
    return L(t)

lines = """在這裡貼上要驗證的積木語法，一行一個""".split('\n')
for ln in lines:
    h = norm_line(ln)
    print(('OK  ' if h in known else 'X   ') + ln)
```

## 已驗證積木對照表（繁中 zh-tw，第一份講義用過的）

| 中文語法 | 對應 ID | 分類/顏色 |
|---|---|---|
| `當 @greenFlag 被點擊` | EVENT_WHENFLAGCLICKED | events（黃） |
| `說出 [文字] 持續 (2) 秒` | LOOKS_SAYFORSECS | looks（紫） |
| `說出 [文字]` | LOOKS_SAY | looks（紫） |
| `重複 (10) 次` | CONTROL_REPEAT | control（黃） |
| `重複無限次` | CONTROL_FOREVER | control（黃） |
| `結束` | scratchblocks:end | （c-block 結尾，無色） |
| `移動 (10) 點` | MOTION_MOVESTEPS | motion（藍） |
| `定位到 x:(0) y:(0)` | MOTION_GOTOXY | motion（藍） |
| `右轉 @turnRight (15) 度` | MOTION_TURNRIGHT | motion（藍） |
| `碰到邊緣就反彈` | MOTION_IFONEDGEBOUNCE | motion（藍） |
| `播放音效 [喵]` | SOUND_PLAY | sound（粉） |
| `當 [空白 v] 鍵被按下` | EVENT_WHENKEYPRESSED | events（黃） |
| `當角色被點擊` | EVENT_WHENTHISSPRITECLICKED | events（黃） |
| `如果 <> 那麼 ... 結束` | CONTROL_IF | control（黃） |
| `造型換成下一個` | LOOKS_NEXTCOSTUME | looks（紫） |

需要更多積木時，優先查 `assets/scratchblocks/zh-tw.json` 裡的 `commands`
和 `aliases` 兩個區塊，不要憑印象亂寫中文積木文字。

## 使用者偏好（來自過往互動記憶，供參考）

- 通常用繁體中文溝通，喜歡簡潔直接的回覆。
- 對 AI 繪圖（Illustrious/NoobAI-XL）、Danbooru tag 風格 prompt 也有興趣，
  但與本專案無關，除非使用者主動要求圖像素材生成再考慮串接。
- 曾建置逐字稿工作台（Transformers.js/Whisper 離線轉錄）與教育 RPG
  遊戲設計專案，風格上同樣偏好「離線可跑、自足、不依賴外部服務」。

## 建議接手時的第一步

1. 讀這份 CONTEXT.md。
2. 打開 `lessons/scratch-01-角色與積木.html` 看目前成品長相與程式碼結構。
3. 問老師：這次要做哪一課？（Scratch 進階 / Arduino 基礎 / 其他）
4. 複製 `scratch-01` 的 `<style>` 區塊（CSS 變數與元件樣式）當新課的骨架，
   保持視覺一致，內容按新課主題重寫。
