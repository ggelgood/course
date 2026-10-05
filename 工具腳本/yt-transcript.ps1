<#
  ═══════════════════════════════════════════════════════════
  YT 逐字稿小幫手 —— 貼一個 YouTube 網址，幫你弄出逐字稿。
  ───────────────────────────────────────────────────────────
  ⚠️ 這支腳本是「本機自己用」的，不會被發布到網站。
     （deploy-pages.yml 只打包「網站」資料夾，根目錄的東西不會上線。）

  為什麼不做成網頁上的功能？
    瀏覽器的 JS 抓不到 YouTube 的音訊——CORS 擋死，串流網址還是
    簽名的、會過期。要繞過只能架一台代理伺服器，那就等於「影片要
    先經過別人的機器」，剛好打掉語音逐字稿工具最大的賣點（檔案
    不上傳）。所以這件事留在本機做。

  它做的事，照順序試兩條路：
    1. 先看影片「本來有沒有字幕」（作者上傳的或 YouTube 自動產的）。
       有的話直接抓下來轉成 .srt —— 不用跑 AI，幾秒就好。
    2. 沒有字幕，才把音訊抓成 .m4a，讓你拖進
       網站/tools/語音逐字稿.html 用 Whisper 跑。

  ⚠️ 用工具下載 YouTube 影音是違反 YouTube 服務條款的（官方有給
     下載按鈕的情況除外）。所以這支腳本只適合你自己在本機處理，
     不要放到網站上給學員用。學員要逐字稿，教他們用 YouTube 自己
     的「⋯更多 → 顯示文字記錄」就好，那條路完全合規。

  用法：
    .\yt-transcript.ps1 "https://www.youtube.com/watch?v=xxxx"
    .\yt-transcript.ps1                  # 不帶參數會問你要網址
    .\yt-transcript.ps1 <網址> -AudioOnly  # 不管有沒有字幕，直接抓音訊
    .\yt-transcript.ps1 <網址> -SubsOnly   # 只抓字幕，沒有就算了

  需要：yt-dlp（沒裝會教你裝）、ffmpeg（已經在你的電腦上）
  ═══════════════════════════════════════════════════════════
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)] [string] $Url,
  [string] $OutDir,
  [switch] $AudioOnly,
  [switch] $SubsOnly,
  [switch] $NoOpen      # 跑完不要自動開檔案總管（在終端機裡連續跑好幾支時用得到）
)

$ErrorActionPreference = 'Stop'

# 主控台用 UTF-8，不然中文標題會變亂碼
try { [Console]::OutputEncoding = New-Object Text.UTF8Encoding $false } catch {}

function Say  ([string]$t, [string]$c = 'Gray') { Write-Host $t -ForegroundColor $c }
function Head ([string]$t) {
  Write-Host ''
  Write-Host $t -ForegroundColor Cyan
  Write-Host ('-' * 56) -ForegroundColor DarkGray
}

# ── 0. 先確認工具在不在 ────────────────────────────────────
# yt-dlp 可以是放在這個資料夾的 yt-dlp.exe，也可以是裝在 PATH 上的。
# 先找資料夾裡的，這樣不想裝東西的人可以直接丟一個 exe 進來用。
$ytdlp = $null
$localExe = Join-Path $PSScriptRoot 'yt-dlp.exe'
if (Test-Path $localExe) {
  $ytdlp = $localExe
} else {
  $found = Get-Command yt-dlp -ErrorAction SilentlyContinue
  if ($found) { $ytdlp = $found.Source }
}

if (-not $ytdlp) {
  Head '找不到 yt-dlp'
  Say '這支腳本需要 yt-dlp 才能跑。三種裝法選一種：' 'Yellow'
  Say ''
  Say '  (1) winget（最省事，裝完要關掉這個視窗重開）：'
  Say '      winget install yt-dlp.yt-dlp' 'White'
  Say ''
  Say '  (2) pip（你的電腦有 python）：'
  Say '      pip install -U yt-dlp' 'White'
  Say ''
  Say '  (3) 不想裝：去 github.com/yt-dlp/yt-dlp/releases 下載'
  Say '      yt-dlp.exe，丟到這個資料夾裡：'
  Say "      $PSScriptRoot" 'White'
  Write-Host ''
  exit 1
}

$hasFfmpeg = [bool](Get-Command ffmpeg -ErrorAction SilentlyContinue)
if (-not $hasFfmpeg) {
  Say '⚠️ 找不到 ffmpeg。字幕還是抓得到（會是 .vtt 不是 .srt），' 'Yellow'
  Say '   但「抓音訊轉 m4a」這條路會失敗。' 'Yellow'
}

# ── 1. 網址 ────────────────────────────────────────────────
if (-not $Url) {
  Write-Host ''
  $Url = Read-Host '貼上 YouTube 網址'
}
$Url = ($Url + '').Trim().Trim('"')
if (-not $Url) { Say '沒有網址，結束。' 'Yellow'; exit 1 }

# ── 2. 輸出資料夾 ──────────────────────────────────────────
if (-not $OutDir) { $OutDir = Join-Path $PSScriptRoot '逐字稿輸出' }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

# 檔名樣板：留中文標題（不用 --restrict-filenames，那會把中文吃掉），
# 但加 --windows-filenames 把 Windows 不給用的字元換掉，
# 再用 --trim-filenames 避免長標題爆掉路徑長度限制。
# 後面加 [影片 id] 是為了同名影片不會互相蓋掉。
$template = Join-Path $OutDir '%(title)s [%(id)s].%(ext)s'
$common = @('--windows-filenames', '--trim-filenames', '120', '--no-warnings', '-o', $template)

# ── 3. 先問影片資訊，順便確認網址是通的 ────────────────────
Head '查影片資訊'
$title = '(不知道標題)'
$seconds = 0
try {
  $raw = & $ytdlp --skip-download --no-warnings --print '%(title)s|||%(duration)s' $Url
  if ($LASTEXITCODE -ne 0) { throw 'yt-dlp 讀不到這個網址' }
  $parts = (($raw | Select-Object -Last 1) + '') -split '\|\|\|'
  if ($parts.Count -ge 1 -and $parts[0]) { $title = $parts[0] }
  if ($parts.Count -ge 2) { [double]::TryParse($parts[1], [ref]$seconds) | Out-Null }
} catch {
  Say "讀不到影片資訊：$($_.Exception.Message)" 'Red'
  Say '常見原因：網址打錯、影片是私人的／已下架、或要登入才能看。' 'Yellow'
  exit 1
}

Say "標題：$title" 'White'
if ($seconds -gt 0) {
  $mm = [math]::Floor($seconds / 60); $ss = [math]::Floor($seconds % 60)
  Say ("長度：{0} 分 {1} 秒" -f $mm, $ss) 'White'
} else {
  Say '長度：讀不到（可能是直播）' 'White'
}

# ── 4. 第一條路：有現成字幕就用現成的 ──────────────────────
# 這一步不跑 AI。YouTube 的自動字幕品質雖然不穩（中文常常沒標點、
# 人名會錯），但時間軸是準的，拿來當底稿改比從頭聽打快得多。
$gotSubs = @()
if (-not $AudioOnly) {
  Head '第 1 步：找現成字幕'
  $stamp = (Get-Date).AddSeconds(-2)   # 退 2 秒，避免檔案時間戳剛好卡在邊界
  $subArgs = @(
    '--skip-download',
    '--write-subs',        # 作者自己上傳的字幕（品質最好）
    '--write-auto-subs',   # YouTube 自動產的字幕（退而求其次）
    '--sub-langs', 'zh-Hant,zh-TW,zh-HK,zh,zh-Hans,zh-CN,en,en-orig'
  )
  if ($hasFfmpeg) { $subArgs += @('--convert-subs', 'srt') }
  $subArgs += $common
  $subArgs += $Url

  try { & $ytdlp @subArgs } catch { Say "抓字幕時出錯：$($_.Exception.Message)" 'Yellow' }

  $gotSubs = @(Get-ChildItem -Path $OutDir -File -ErrorAction SilentlyContinue |
               Where-Object { $_.Extension -match '^\.(srt|vtt)$' -and $_.LastWriteTime -ge $stamp })

  if ($gotSubs.Count -gt 0) {
    Say ''
    Say "✅ 這支影片本來就有字幕，抓到 $($gotSubs.Count) 個檔，不用跑 AI：" 'Green'
    $gotSubs | ForEach-Object { Say "   $($_.Name)" 'White' }
    Say ''
    Say '檔名裡的語言代碼：zh-Hant/zh-TW 是繁體、zh-Hans/zh-CN 是簡體、en 是英文。' 'DarkGray'
    Say '自動字幕常常沒有標點、人名也會錯，當底稿改比從頭聽打快很多。' 'DarkGray'
  } else {
    Say ''
    Say '這支影片沒有可以抓的字幕。' 'Yellow'
  }
}

# ── 5. 第二條路：抓音訊，交給 Whisper ──────────────────────
$needAudio = $AudioOnly -or ($gotSubs.Count -eq 0 -and -not $SubsOnly)

if ($gotSubs.Count -eq 0 -and $SubsOnly) {
  Say '你指定了 -SubsOnly，所以不抓音訊，到這裡結束。' 'Yellow'
}

if ($needAudio) {
  if (-not $hasFfmpeg) {
    Say ''
    Say '沒有 ffmpeg，沒辦法把音訊轉成 m4a。先裝 ffmpeg 再回來跑。' 'Red'
    exit 1
  }

  Head '第 2 步：抓音訊（之後丟進語音逐字稿工具跑 Whisper）'
  if ($seconds -gt 600) {
    Say "⚠️ 這支影片 $([math]::Floor($seconds/60)) 分鐘，比語音逐字稿工具建議的 10 分鐘長不少。" 'Yellow'
    Say '   瀏覽器可能會跑很久甚至當掉。太長的話先用剪輯軟體切段再轉。' 'Yellow'
  }

  $stamp2 = (Get-Date).AddSeconds(-2)
  $audioArgs = @(
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '-x', '--audio-format', 'm4a'
  ) + $common + @($Url)

  try { & $ytdlp @audioArgs } catch { Say "抓音訊時出錯：$($_.Exception.Message)" 'Red'; exit 1 }

  $gotAudio = @(Get-ChildItem -Path $OutDir -File -Filter '*.m4a' -ErrorAction SilentlyContinue |
                Where-Object { $_.LastWriteTime -ge $stamp2 })

  if ($gotAudio.Count -eq 0) {
    Say ''
    Say '音訊沒有抓下來。可能是影片有年齡限制、要登入，或是地區封鎖。' 'Red'
    exit 1
  }

  Say ''
  Say '✅ 音訊抓好了：' 'Green'
  $gotAudio | ForEach-Object { Say "   $($_.Name)  ($([math]::Round($_.Length/1MB,1)) MB)" 'White' }

  $tool = Join-Path (Split-Path $PSScriptRoot -Parent) '網站\tools\語音逐字稿.html'
  Say ''
  Say '接下來：把上面那個 .m4a 拖進語音逐字稿工具，就會跑出逐字稿和字幕檔。' 'Cyan'
  if (Test-Path $tool) { Say "工具在這裡：$tool" 'White' }
  Say '（第一次用要連網下載 AI 模型，之後就不用了。)' 'DarkGray'
}

# ── 6. 開資料夾給人看 ──────────────────────────────────────
Head '輸出資料夾'
Say $OutDir 'White'
if (-not $NoOpen) { try { Start-Process explorer.exe $OutDir } catch {} }
