# 交接：AI 生圖提示詞收藏頁

> 給接手的 Claude。這份只講「AI 生圖提示詞收藏頁」這一件事。
> 專案整體規則（兩台電腦同步、省 token、版本號）仍然以 `START-HERE.md` 為準，
> **先讀完 START-HERE.md 的「接手時第一件事」再回來看這份。**
> 這份**不是** `工作日誌.md`，不要把它併進去；老師說「寫日誌」才寫日誌。

## 一句話現況

頁面骨架、互動、出處標示都做好並推上分支了，**但還沒有任何一張真實的提示詞卡片**，
因為做這件事的雲端 session 連不上 Threads。**接下來唯一的主任務：用 Claude in Chrome 去讀
`@levelsio.ai`，把貼文做成卡片補進去。**

## 老師要的是什麼

- 原話：「Threads 帳號 `@levelsio.ai` 分享很多 AI 生圖提示詞，幫我截取當中的**內容與成果**到我的網站，
  **記得在網頁某處標示出處**，先試著截取看看。」
  帳號網址：`https://www.threads.com/@levelsio.ai?hl=zh-tw`
- 後來補充：「這個章節**不要寫得像講義一樣，直觀地列出成果與提示詞就好**。」
  → 所以這頁是**作品牆**，不是課。不要加說明文字、章節、編號、求救框、練習。
- 成果圖的處理，老師選的是 **「圖存一份在網站上」**（下載進 `網站/media/prompts/` 一起發布），
  不是只放連結。這是老師的決定；我有提過這等於轉載別人的作品，老師仍選這個。
  **所以出處與原貼文連結一定不能省**（見下方）。
- 老師要求用 **Claude in Chrome** 讀貼文（因為 Threads 對未登入者常只給登入牆，
  Chrome 裡有老師的登入狀態）。

## 分支與提交

- 分支：`claude/elegant-galileo-iemsg5`（已 push 到 `origin`）
- 提交：
  - `525af7a` 新增「AI 生圖提示詞收藏」頁面框架
  - `6358035` 提示詞頁改成作品牆，拿掉講義腔
- **沒有開 PR**（老師沒要求）。**不會自動發布**：發布 workflow 只在 push 到 `main` 時跑
  （`.github/workflows/deploy-pages.yml`），這個分支在 merge 進 main 之前網站上看不到。
- 接手第一步：`git fetch origin claude/elegant-galileo-iemsg5` →
  `git checkout claude/elegant-galileo-iemsg5`，然後照 START-HERE 的同步檢查。

## 做了哪些檔案

| 檔案 | 說明 |
|---|---|
| `網站/prompts/AI生圖提示詞收藏.html` | 頁面本體。裡面有一大段註解，是新增卡片的骨架 |
| `網站/assets/prompts.css`（頁面引用 `?v=2`） | 只有這頁用。`.wrap--wide`、`.pcredit`、`.pfilter`、`.pcard*`、`.pcopy`、`.psrc`、`.pempty` |
| `網站/assets/prompts.js`（頁面引用 `?v=1`） | 一鍵複製、依 `data-tags` 自動生篩選鈕、有卡片就隱藏 `.pempty` |
| `網站/index.html` | 側欄底部新增入口 `#course-prompt`（跟「小工具」同一組），內容區新增 `<section id="course-prompt">` |
| `網站/media/prompts/.gitkeep` | 成果圖資料夾（補進圖片後可刪掉 `.gitkeep`） |
| `網站/README.md` | 最後新增「AI 生圖提示詞收藏（`prompts/`）」一節，有完整的加卡片做法 |

這頁**只**載 `lesson.css` ＋ `prompts.css` ＋ `prompts.js`，**沒有載 `lesson.js`**
（沒有揭曉、打勾、進度脊椎、頂端進度條）。**不要把這頁的東西搬進 `lesson.*`。**

## 出處標示（三處都要留）

1. 標題正下方的 `.pcredit` 一行（深色開場區，字亮）
2. **每張卡片下方的 `.psrc`「原貼文 ↗」連結，必須連到「那一篇」貼文的永久連結，不是帳號首頁**
3. 頁尾 `<footer>`

## 怎麼新增一張卡（摘要，完整版看 `網站/README.md`）

```html
<article class="pcard" data-tags="仰拍 復古">
  <figure class="pcard__shot">
    <img src="../media/prompts/風格名稱.webp" width="1200" height="1200"
         alt="描述這張圖的內容" loading="lazy" decoding="async">
  </figure>
  <div class="pcard__body">
    <h2 class="pcard__t">風格名稱</h2>
    <pre class="pcard__pre">提示詞原文，貼齊左邊，整段照抄</pre>
  </div>
  <div class="pcard__foot">
    <button class="pcopy" type="button">複製提示詞</button>
    <a class="psrc" href="該篇貼文永久連結" target="_blank" rel="noopener">原貼文 ↗</a>
  </div>
</article>
```

放進 `.pgrid` 裡面即可。要點：

- **卡片裡不要加說明文字**，這是老師明確要的「直觀」。
- `<pre>` 裡的提示詞**照抄不改字**；`<` `>` `&` 要跳脫成 `&lt;` `&gt;` `&amp;`；
  **內容要貼齊左邊**，不然縮排會被複製按鈕一起複製走。
- `img` 一定要寫 `width`／`height`（原圖像素），否則載入時版面會跳。
- `data-tags` 用空白隔開，篩選鈕自動生成；不到兩種標籤時篩選列自己隱藏。
- 放進第一張卡之後，`.pempty` 佔位會自動隱藏，不用手動刪。

## ⚠️ 要小心的地方

1. **整頁圖片總量**：START-HERE 的原則是整頁不超過約 3 MB（學校網路慢）。
   作品牆圖多，每張請壓到 **150–400 KB 的 webp**，卡片數量視總量取捨；已用 `loading="lazy"`。
   壓縮可以用 `網站/tools/圖片壓縮.html`，或在電腦上用 `cwebp`／Pillow 批次處理。
2. **著作權**：圖是別人的作品、而且存在我們自己的網站上。老師已決定這樣做，
   但請**不要拿掉出處與原貼文連結**；README 與頁面也都沒有宣稱是自己的作品。
   如果老師之後想改成「只放連結不存圖」，把 `pcard__shot` 改成連結即可，其他不用動。
3. **提示詞要照抄**：學生照複製卻生不出圖，通常就是中間被改過字。
4. **不要拿真人臉當範例圖以外的用途**；貼文裡若有明顯是真人、疑似未成年的照片，先問老師再放。
5. **版本號**：依 START-HERE，開發中不要每改一次就 bump。`prompts.css`／`prompts.js`
   只有這頁用，**bump 只需要改 `prompts/AI生圖提示詞收藏.html` 裡這兩個檔的 `?v=`**，
   不用掃全站。收工前再統一加一次。
6. 不要順手去動 17 課、Arduino、Canva 等其他頁面。

## 驗證到哪、沒驗證到哪

**實際驗證過**（用 Playwright 開本機 `python3 -m http.server`）：
- 頁面、CSS、JS 都 200，無 console 錯誤
- 1280px 桌機三欄、390px 手機單欄，皆無橫向溢出
- 首頁側欄點「AI 生圖提示詞」會切到該面板，面板裡的連結指向 `prompts/AI生圖提示詞收藏.html`
- 用**測試時才注入的假卡片**確認過卡片排版（假卡片**沒有寫進專案**）

**沒有驗證**（接手後補上第一批真卡片時請順便實測）：
- **「複製提示詞」按鈕**實際把內容放進剪貼簿（只確認沒報錯；`file://` 開啟時走備援的 `execCommand` 路徑）
- **風格篩選鈕**：測試時卡片是頁面載入後才注入的，所以篩選列當時是隱藏的，**沒有真的點過篩選**
- 真實長提示詞的 `<pre>` 捲動、中英混排折行

預覽方式：`python3 -m http.server 8765 --directory 網站`，開
`http://127.0.0.1:8765/prompts/AI生圖提示詞收藏.html`。

## 為什麼之前讀不到 Threads（給接手的人，省得重踩）

做這頁的 session 跑在 Anthropic 雲端容器：
- `threads.com`／`threads.net` 被網路政策擋掉（CONNECT 403）；`r.jina.ai` 之類的轉讀站也一樣被擋
- WebFetch 對這兩個網域失敗；網路搜尋幾乎搜不到 `@levelsio.ai` 的貼文
- **那個 session 沒有 Claude in Chrome 工具**（它不在老師的電腦上），帳號下只有一個雲端環境
- 所以**沒有抓到任何真實貼文，也沒有編造任何內容**

在老師電腦上的 session 才有機會用 Chrome 讀。若 Chrome 裡也只看到登入牆，
請老師確認 Chrome 已登入 Threads；仍不行就請老師直接貼文字與圖片。

## 建議的下一步

1. 同步分支（見上）。
2. 用 Claude in Chrome 打開 `https://www.threads.com/@levelsio.ai`，往下捲，
   **先挑 3–5 篇「有完整提示詞＋成果圖」的貼文試做**（老師說「先試著截取看看」）。
3. 每篇：複製提示詞原文、下載成果圖（轉 webp、壓到 400 KB 內、存到 `網站/media/prompts/`）、
   記下**該篇貼文的永久連結**。
4. 用上面的骨架補成卡片，實測複製鈕與篩選鈕。
5. 預覽、截圖給老師看；收工前 bump 版本號、commit。
6. **提醒老師用 GitHub Desktop push**（START-HERE 規定，Claude 這邊 push 會卡登入）。
   要不要 merge 進 `main` 發布，由老師決定。
