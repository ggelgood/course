# 工具腳本

本機自己用的小腳本。**這個資料夾不會被發布到網站**——`.github/workflows/deploy-pages.yml`
只打包「網站」資料夾，根目錄底下的東西不會上線。

---

## YT逐字稿.cmd ／ yt-transcript.ps1

貼一個 YouTube 網址，幫你弄出逐字稿。

**怎麼用**：雙擊 `YT逐字稿.cmd`，貼上網址，按 Enter。
結果會放在同一個資料夾底下的 `逐字稿輸出`（跑完會自動開給你看）。

習慣用終端機的話也可以直接呼叫：

```bash
powershell -ExecutionPolicy Bypass -File 工具腳本\yt-transcript.ps1 "https://www.youtube.com/watch?v=xxxx"
```

### 它會按順序試兩條路

1. **先看影片本來有沒有字幕**（作者上傳的，或 YouTube 自動產的）。
   有的話直接抓成 `.srt`，**不用跑 AI，幾秒就好**。
   自動字幕常常沒有標點、人名也會錯，但時間軸是準的，當底稿改比從頭聽打快很多。
2. **沒有字幕才抓音訊**存成 `.m4a`，你再把它拖進
   [網站/tools/語音逐字稿.html](../網站/tools/語音逐字稿.html)，用 Whisper 跑出逐字稿和字幕檔。

### 參數

| 參數 | 作用 |
| --- | --- |
| `-AudioOnly` | 不管有沒有現成字幕，直接抓音訊（覺得自動字幕太爛、想用 Whisper 重跑時用） |
| `-SubsOnly` | 只抓現成字幕，沒有就算了（不想等 Whisper 時用） |
| `-OutDir <路徑>` | 換輸出資料夾 |

### 需要裝的東西

- **ffmpeg** —— 已經在這台電腦上了（`C:\Program Files\ffmpeg\bin\ffmpeg.exe`）。
- **yt-dlp** —— 還沒裝。三種裝法選一種：

```bash
winget install yt-dlp.yt-dlp
```

或 `pip install -U yt-dlp`，或去 yt-dlp 的 GitHub releases 下載 `yt-dlp.exe`
丟進這個資料夾（腳本會優先找資料夾裡的 exe）。
腳本沒找到 yt-dlp 的時候也會把這三種方法印出來。

---

## ⚠️ 兩件要先知道的事

**1. 為什麼不做成網站上的功能？**
瀏覽器的 JS 抓不到 YouTube 的音訊——CORS 擋死，串流網址還是簽名的、會過期。
要繞過只能架一台代理伺服器，那就等於「影片要先經過別人的機器」，
剛好打掉語音逐字稿工具最大的賣點（檔案不上傳）。所以這件事留在本機做。

**2. 用工具下載 YouTube 影音是違反 YouTube 服務條款的**（官方有給下載按鈕的情況除外）。
所以這支腳本只適合你自己在本機處理，**不要放到網站上給學員用**。

學員要 YouTube 逐字稿，教他們用 YouTube 自己的功能就好，那條路完全合規、也不用裝東西：
影片下方「**⋯更多 → 顯示文字記錄**」，整段文字可以直接複製。
