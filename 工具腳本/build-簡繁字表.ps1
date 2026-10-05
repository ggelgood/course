<#
  ═══════════════════════════════════════════════════════════
  產生 網站/tools/assets/簡繁字表.js
  ───────────────────────────────────────────────────────────
  為什麼需要這支？
    語音逐字稿工具用的 Whisper，中文輸出偏簡體（因為我們只能指定
    language: 'chinese'，這個標籤不分簡繁）。要轉成繁體就需要一份
    對照表，而對照表「不能憑記憶編」——一定會錯。所以這支腳本去抓
    OpenCC 的官方字典資料，編成工具能直接用的格式。

  資料來源：OpenCC (https://github.com/BYVoid/OpenCC)，Apache-2.0。
    產生出來的 .js 檔頭會保留授權聲明（Apache-2.0 要求保留）。

  為什麼是 s2twp 這組而不是 s2t？
    OpenCC 的 s2t 給的是「OpenCC 標準繁體」，麵條會變成「麪條」。
    台灣用的是「麵條」，所以要加上 TWVariants。再加上 TWPhrases*
    還能把用語也轉過來（内存→記憶體、视频→影片），而這組資料
    總共只有 11KB 左右，很划算。

  轉換分兩階段跑（跟 OpenCC 自己的設計一樣）：
    第 1 階段 s2t ：STPhrases 長詞優先，再 STCharacters 逐字
    第 2 階段 tw  ：TWPhrases* 長詞優先，再 TWVariants 逐字

  詞條為什麼只留一部分？
    STPhrases 原始檔 983KB、49238 條，但其中八成「逐字轉換本來就
    會轉對」，留著是冗餘。只保留「逐字會轉錯」的 9788 條，
    189KB，正確性完全一樣。

  用法：
    powershell -ExecutionPolicy Bypass -File 工具腳本\build-簡繁字表.ps1
  ═══════════════════════════════════════════════════════════
#>
[CmdletBinding()]
param(
  [string] $OutFile,
  [string] $CacheDir
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = New-Object Text.UTF8Encoding $false } catch {}

function Say ([string]$t, [string]$c = 'Gray') { Write-Host $t -ForegroundColor $c }

if (-not $OutFile)  { $OutFile  = Join-Path (Split-Path $PSScriptRoot -Parent) '網站\tools\assets\簡繁字表.js' }
if (-not $CacheDir) { $CacheDir = Join-Path $env:TEMP 'opencc-data' }
if (-not (Test-Path $CacheDir)) { New-Item -ItemType Directory -Path $CacheDir | Out-Null }

$files = @('STCharacters.txt', 'STPhrases.txt', 'TWVariants.txt',
           'TWPhrasesIT.txt', 'TWPhrasesName.txt', 'TWPhrasesOther.txt')

# ── 1. 抓資料（抓過就用快取，不用每次重抓）────────────────
Say '取得 OpenCC 字典資料…' 'Cyan'
foreach ($n in $files) {
  $dest = Join-Path $CacheDir $n
  if (Test-Path $dest) { Say "  $n（快取）"; continue }
  Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/opencc-data/data/$n" `
                    -UseBasicParsing -TimeoutSec 120 -OutFile $dest
  Say "  $n（下載）"
}

# ── 2. 讀成對照表 ──────────────────────────────────────────
# OpenCC 的格式是「來源<Tab>候選1 候選2 …」，候選按常用度排，取第一個。
function Read-Dict ([string]$name) {
  $map = [ordered]@{}
  foreach ($l in [IO.File]::ReadAllLines((Join-Path $CacheDir $name), [Text.Encoding]::UTF8)) {
    if (-not $l -or $l.StartsWith('#') -or -not $l.Contains("`t")) { continue }
    $p = $l -split "`t"
    if (-not $map.Contains($p[0])) { $map[$p[0]] = ($p[1] -split ' ')[0] }
  }
  return $map
}

$stChars  = Read-Dict 'STCharacters.txt'
$stPhr    = Read-Dict 'STPhrases.txt'
$twChars  = Read-Dict 'TWVariants.txt'
$twPhr    = [ordered]@{}
foreach ($n in 'TWPhrasesIT.txt', 'TWPhrasesName.txt', 'TWPhrasesOther.txt') {
  foreach ($kv in (Read-Dict $n).GetEnumerator()) { if (-not $twPhr.Contains($kv.Key)) { $twPhr[$kv.Key] = $kv.Value } }
}
Say "STCharacters $($stChars.Count)／STPhrases $($stPhr.Count)／TWVariants $($twChars.Count)／TWPhrases $($twPhr.Count)" 'White'

# ── 3. 篩掉「逐字本來就會轉對」的詞條 ──────────────────────
# 用 StringInfo 走字元，不然 surrogate pair（𠗣 這種）會被拆壞。
function Conv-Chars ([string]$s, $map) {
  $sb = New-Object Text.StringBuilder
  $e = [Globalization.StringInfo]::GetTextElementEnumerator($s)
  while ($e.MoveNext()) {
    $c = $e.GetTextElement()
    if ($map.Contains($c)) { [void]$sb.Append($map[$c]) } else { [void]$sb.Append($c) }
  }
  return $sb.ToString()
}

# ⚠️ 這裡曾經做過一個「只留逐字會轉錯的詞條」的最佳化（49238 → 9788
# 條，省 790KB）。它是錯的，留著當教訓：
#
#   被刪掉的詞條不只在「修字」，還在「擋住更短的錯誤匹配」。
#   例一（前綴陰影）：「这只 → 這隻」逐字會錯所以留著；
#     「这只是 → 這只是」逐字本來就對，被當冗餘刪掉。結果
#     「这只是一只鸟」在位置 0 比到「这只」→「這隻是一隻鳥」。
#   例二（中段陰影）：「一天后 → 一天後」被刪掉後，
#     「天后 → 天后」（天后、歌后那個）在位置 1 搶到匹配，
#     輸出變成「一天后」。
#
#   補「前綴擋位」只修掉例一，例二還在。要真正等價得做不動點迭代，
#   而且就算詞表測試全過，任意文句上仍不保證跟 OpenCC 一致。
#
# 所以改成直接用完整詞表：正確性由構造保證，不靠聰明。
# 多出來的幾百 KB，跟這個工具本來就要下載的 145～250MB 模型相比
# 不是成本。
$needed = $stPhr
Say "詞表：完整收錄 $($needed.Count) 條（不做精簡，理由見原始碼註解）" 'White'

function Convert-Two ([string]$s, $phrases, $chars, [int]$maxLen) {
  $cp = [Globalization.StringInfo]::GetTextElementEnumerator($s)
  $arr = New-Object Collections.Generic.List[string]
  while ($cp.MoveNext()) { $arr.Add($cp.GetTextElement()) }
  $sb = New-Object Text.StringBuilder
  $i = 0
  while ($i -lt $arr.Count) {
    $hit = $null; $len = 0
    $upper = [Math]::Min($maxLen, $arr.Count - $i)
    for ($n = $upper; $n -ge 2; $n--) {
      $cand = -join $arr.GetRange($i, $n)
      if ($phrases.Contains($cand)) { $hit = $phrases[$cand]; $len = $n; break }
    }
    if ($null -ne $hit) { [void]$sb.Append($hit); $i += $len; continue }
    $c = $arr[$i]
    if ($chars.Contains($c)) { [void]$sb.Append($chars[$c]) } else { [void]$sb.Append($c) }
    $i++
  }
  return $sb.ToString()
}

# 自我驗證：拿已知的難案跑兩階段轉換。這些都是「只靠逐字一定會錯」
# 或「OpenCC 標準繁體跟台灣用語不同」的案例，用來擋格式／escape／
# 階段順序寫壞的情況。對不上就不要產出字表。
$spMaxChk = ($needed.Keys | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum
$tpMaxChk = ($twPhr.Keys  | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum
function Convert-S2TWP ([string]$s) {
  $a = Convert-Two $s $needed $stChars $spMaxChk
  return Convert-Two $a $twPhr $twChars $tpMaxChk
}

Say '自我驗證…' 'Cyan'
$cases = @(
  @('头发很干净',   '頭髮很乾淨'),    # 一對多：发→髮/發，干→乾/幹
  @('他发现了',     '他發現了'),      # 同一個字另一個義項
  @('这只是一只鸟', '這只是一隻鳥'),  # 長詞優先的陰影案例
  @('一天后',       '一天後'),        # 中段陰影案例（天后）
  @('绝对',         '絕對'),          # 使用者實際遇到的那個字
  @('面条',         '麵條')           # 台灣用語（OpenCC 標準繁體是「麪條」）
)
$bad = New-Object Collections.Generic.List[string]
foreach ($c in $cases) {
  $got = Convert-S2TWP $c[0]
  if ($got -ne $c[1]) { $bad.Add("$($c[0])：得到「$got」，期望「$($c[1])」") }
  else { Say "  ✓ $($c[0]) → $got" 'DarkGray' }
}
if ($bad.Count -gt 0) {
  Say '❌ 自我驗證失敗：' 'Red'
  $bad | ForEach-Object { Say "   $_" 'Red' }
  exit 1
}
Say '✅ 自我驗證通過。' 'Green'

# ── 4. 輸出 ────────────────────────────────────────────────
# 格式刻意用「純文字＋在瀏覽器端 split」而不是 JSON 物件字面值：
# 一萬四千個 key 的物件字面值會讓 JS 解析器吃掉明顯的時間，
# 字串 split 建 Map 反而快得多，檔案也小一截。
function Join-Pairs ($map) {
  $sb = New-Object Text.StringBuilder
  foreach ($kv in $map.GetEnumerator()) {
    [void]$sb.Append($kv.Key); [void]$sb.Append("`t"); [void]$sb.Append($kv.Value); [void]$sb.Append("`n")
  }
  return $sb.ToString().TrimEnd("`n")
}

$maxPhrase = ($needed.Keys | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum
$maxTwPhr  = ($twPhr.Keys  | ForEach-Object { $_.Length } | Measure-Object -Maximum).Maximum

$esc = {
  param([string]$s)
  $s.Replace('\', '\\').Replace("`t", '\t').Replace("`n", '\n').Replace("'", "\'")
}

$header = @"
/* 簡繁對照表 —— 給 語音逐字稿.html 用的。
   這個檔案是「產生出來的」，不要手改：
   要更新請跑 工具腳本/build-簡繁字表.ps1

   資料來源：OpenCC —— https://github.com/BYVoid/OpenCC
   Copyright: OpenCC contributors
   授權：Apache License 2.0

   轉換分兩階段（跟 OpenCC 的 s2twp 一樣）：
     s2t：sp 長詞優先，再 sc 逐字  —— 简体 → 傳統繁體
     tw ：tp 長詞優先，再 tc 逐字  —— 繁體 → 台灣用語（麪條→麵條、内存→記憶體）

   sp 只收「逐字會轉錯」的詞條（$($needed.Count) / $($stPhr.Count) 條），
   逐字本來就轉得對的沒收，正確性一樣但小很多。
*/
"@

$js = $header + @"

window.OPENCC_TW = {
  sc: '$(& $esc (Join-Pairs $stChars))',
  sp: '$(& $esc (Join-Pairs $needed))',
  tc: '$(& $esc (Join-Pairs $twChars))',
  tp: '$(& $esc (Join-Pairs $twPhr))',
  spMax: $maxPhrase,
  tpMax: $maxTwPhr
};
"@

$dir = Split-Path $OutFile -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
[IO.File]::WriteAllText($OutFile, $js, (New-Object Text.UTF8Encoding $false))

Say ''
Say "✅ 寫好了：$OutFile" 'Green'
Say "   $([math]::Round((Get-Item $OutFile).Length / 1KB, 1)) KB（最長簡體詞 $maxPhrase 字、最長台灣用語詞 $maxTwPhr 字）" 'White'
