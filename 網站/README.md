# 講義網站 — 結構與維護說明

## 資料夾

```
網站/
├── assets/
│   ├── lesson.css      ← 所有樣式（改這裡，全部的課一起變）
│   ├── lesson.js       ← 所有共用互動
│   ├── home.css        ← 只有首頁 index.html 用
│   ├── home.js         ← 只有首頁 index.html 用（側欄切換課程）
│   ├── typing.css      ← 只有「中文打字」那幾課用
│   └── typing.js       ← 只有「中文打字」那幾課用
├── lessons/            ← Scratch 入門 17 課，01 到 17
│   ├── 01-讓小貓動起來.html
│   ├── …
│   └── 17-期末專題-完成與發表.html
├── typing/             ← 中文打字 4 課
│   └── 01-鍵盤大導覽.html
├── media/              ← 截圖與 GIF（講義裡會顯示出來的圖）
├── files/              ← 學生下載的 .sb3 範例檔
└── README.md           ← 這份檔案
```

**`media/` 和 `files/` 是分開的**：`media` 是講義裡會顯示的圖，
`files` 是學生要下載的檔案。兩個資料夾現在都還是空的，
而 git 不追蹤空資料夾，所以在 GitHub 上看不到它們，這是正常的。

## ⚠️ 改完樣式一定要做的事：把版本號 +1

每一課的 HTML 都是這樣引用共用檔的：

```html
<link rel="stylesheet" href="../assets/lesson.css?v=1">
<script src="../assets/lesson.js?v=1"></script>
```

後面那個 `?v=1` 是**擋快取用的**。瀏覽器會把 CSS/JS 記在本機，
你改了 `lesson.css` 但學生的電腦可能還在用舊的——這個坑我們已經踩過一次。

**所以：只要改了 `assets/` 裡的檔案，就把所有課的 `?v=1` 全部改成 `?v=2`。**

⚠️ **課頁不只在 `lessons/` 一個資料夾了**，`typing/` 底下也有課，
還有首頁 `index.html`。下面的指令三個地方一起改（在 `網站` 資料夾底下執行，
把 1 和 2 換成實際的數字）：

```bash
powershell -Command "Get-ChildItem lessons\*.html, typing\*.html, index.html | ForEach-Object { $t=Get-Content $_.FullName -Raw -Encoding UTF8; $t=$t -replace 'lesson\.css\?v=1','lesson.css?v=2' -replace 'lesson\.js\?v=1','lesson.js?v=2'; [System.IO.File]::WriteAllText($_.FullName,$t,(New-Object System.Text.UTF8Encoding $false)) }"
```

改到 `typing.css` / `typing.js` / `home.css` 的話，把上面指令裡的檔名換掉就好
（它們各自有自己的版本號，不用跟 `lesson.*` 同步）。

**每一課的 HTML 只放內容**，樣式與互動都來自 `assets/`。
新增一課時**絕對不要複製樣式**，只要在 `<head>` 裡 link 就好。

---

## 怎麼預覽

**方法一：直接開檔案。** 雙擊 `lessons/` 裡任何一個 HTML，瀏覽器就會打開，相對路徑會正常運作。

**方法二：本機伺服器**（要測下載附件時用）：

```bash
python -m http.server 8765 --directory 課程講義/網站
```

然後開 `http://localhost:8765/lessons/01-讓小貓動起來.html`。

---

## 新增一課的骨架

複製任一課的 HTML，把 `<main>` 裡的內容換掉即可。開頭固定是：

```html
<link rel="stylesheet" href="../assets/lesson.css">
```

結尾固定是：

```html
<script src="../assets/lesson.js"></script>
```

課別專用的小互動（滑桿、轉盤那類）寫在 `lesson.js` **後面**的 `<script>` 裡，
不要塞進 `lesson.js`——那個檔案只放每一課都一樣的東西。

---

## 互動元件怎麼用

### 點擊揭曉

```html
<details class="reveal">
  <summary>問題<span class="peek">點我看答案</span></summary>
  <div class="reveal__in">答案</div>
</details>
```

### 步驟打勾

外面一定要包 `.dobox`，標題列會告訴學生「這可以點」——
沒有標題列的話學生根本不知道那能打勾。

```html
<div class="dobox">
  <div class="dobox__head">
    <b>✋ 動手做</b>
    <span class="dobox__tip">做完一步，就點一下下面的格子打勾 👇</span>
    <span class="dobox__count"><i>0</i> / 3</span>
  </div>
  <ol class="steps">
    <li>第一步</li><li>第二步</li><li>第三步</li>
  </ol>
</div>
```

`<i>0</i>` 裡的數字會自動更新，但 `/ 3` 要自己寫對。

### 先預測再看答案

```html
<div class="predict" data-ans="c">
  <p class="predict__q">問題</p>
  <p class="predict__hint">先猜猜看，選一個。</p>
  <div class="picks">
    <button class="pick" data-v="a" data-say="選這個代表哪裡想錯了">選項 A</button>
    ...
  </div>
  <p class="said"></p>
</div>
```

⚠️ **`data-say` 一定要寫出「這個選擇背後的誤解」**，不要只寫「再想想看」。
學生答錯時要有收穫，你巡堂時也才能從他選了什麼看出他卡在哪。

### 積木拖拉排序（資料驅動）

```html
<div class="sortbox"
     data-answer="1234"
     data-swap="2>3"                              (選填)
     data-msg-ok="✓ 完全正確！…"
     data-msg-nohat="再看一次最上面那塊…"
     data-msg-swap="再讀一次題目…"                (選填)
     data-msg-near="快好了！…">
  <p class="predict__hint">情境描述（用文字，逼學生讀題）</p>
  <div class="slots">
    <div class="blk blk--motion drag" data-k="3">移動 <i>50</i> 點</div>
    ...
  </div>
  <button class="btn" data-check>檢查看看</button>
  <p class="verdict"></p>
</div>
```

- `data-answer` = 正確順序（把每塊的 `data-k` 依序串起來）
- `data-swap="2>3"` = 若第 2 塊排在第 3 塊後面，就給 `data-msg-swap`（針對「這兩塊顛倒」的專屬提示）

⚠️ **出題原則（很重要）**：
1. **正確順序絕對不能出現在題目上方的積木堆裡**——不然學生往上瞄一眼就照抄，這題完全沒有價值。
2. **用文字描述情境**，而且順序要跟課文裡教的**不一樣**，逼學生讀題。
3. 兩塊內容不同但外型相同的積木（例如兩個「說出」）效果最好——不讀字根本分不出來。

### 試試看卡片（自由玩一玩）

```html
<div class="dobox dobox--bare">
  <div class="dobox__head">
    <b>🎲 試試看</b>
    <span class="dobox__tip">不用照順序，挑喜歡的做 👇</span>
    <span class="dobox__count"><i>0</i> / 6</span>
  </div>
  <div class="playgrid">
    <div class="play"><b>標題</b><small>說明</small></div>
    ...
  </div>
</div>
```

這是**用「變化」填課堂時間**的主力：同一組積木的不同玩法。
不要在這裡加新概念——加變化不加概念。

### 截圖／GIF 預留位

```html
<figure class="shot shot--gif">        <!-- shot--gif 是紫標；不加就是深色的截圖標 -->
  <span class="shot__kind">🎬 GIF 動畫</span>
  <b class="shot__what">要拍什麼</b>
  <p class="shot__how">怎麼拍、拍多久、重點在哪</p>
  <div class="shot__box">🎞️</div>
</figure>
```

- 加 `shot--key` 會把標籤變成橘色「最重要」
- 比例：預設 16:9，`shot--wide` 是 16:10，`shot--tall` 是 4:3
- **截好圖之後**，把 `<div class="shot__box">🎞️</div>` 換成 `<img src="../files/xxx.png" alt="...">` 就好

### 偷看 Python

```html
<details class="pypeek">
  <summary>偷看一下：…<span class="peek">好奇再點</span></summary>
  <div class="pypeek__in">
<pre><span class="f">forward</span>(<span class="n">10</span>)   <span class="c"># 移動 10 點</span></pre>
    <p class="pypeek__note">說明</p>
  </div>
</details>
```

上色用的 class：`k` 關鍵字、`f` 函式、`n` 數字、`s` 字串、`c` 註解。

⚠️ **規則**：
- **只在積木第一次出現時附**，同一塊積木之後不重複
- **Python 沒有對應寫法的就不要附**（綠旗、廣播、當按鍵被按下、碰到邊緣反彈…）
  —— 不要寫「Python 沒有這個東西」那種只有註解的空面板
- 用真的能跑的 `turtle` 程式，不要寫假的虛擬碼

### 常駐求救框

```html
<div class="sos">
  <h3>⚠️ 卡住了？先看這裡</h3>
  <ul><li>…</li></ul>
</div>
```

⚠️ **故障排除絕對不要放進 `<details>`**。學生卡住時的反應是舉手，
不是去點開一個他不知道存在的區塊。藏起來的求救資訊等於沒有。

---

---

## 中文打字系列專用元件（`typing.css` / `typing.js`）

只有 `typing/` 底下那幾課會 link 這兩個檔，Scratch 的 17 課用不到
——**不要把這些東西搬進 `lesson.css` / `lesson.js`**，那會讓 17 課多載入用不到的程式。

引用順序固定是 **`lesson.*` 在前、`typing.*` 在後**。

### 鍵盤全圖

```html
<div class="kbdbox">
  <div class="kbd__tabs">
    <button class="ktab" data-go="all">全部</button>
    <button class="ktab" data-go="main">① 打字區</button>   <!-- fn / edit / num / lamp -->
  </div>
  <div class="kbdwrap">
    <div class="kbd" data-zone="all">
      <div class="kbd__deck">
        <div class="kzone kzone--main" data-z="main">
          <div class="krow">
            <b class="kk">A</b>                                  <!-- 不能點的鍵 -->
            <button class="kk kk--star kk--txt" style="--w:2"
                    data-name="Backspace" data-say="說明…">⌫ Backspace</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <p class="kbd__say" data-idle="還沒點任何鍵時顯示這句"></p>
</div>
```

- `--w` 是鍵寬，單位是「幾顆標準鍵」（Backspace 是 2、空白鍵是 6.25）
- `kk--star` = 這一課的重點鍵（淡黃色）
- `kk--txt` = **標籤字母多的鍵一定要加**（PrtSc、Home、PgUp、NumLk、Backspace…），
  不加的話字會被裁掉變成「Hor」「PrtS」
- 有 `data-say` 的鍵才可以點，說明會出現在 `.kbd__say`

> ⚠️ **踩過的坑**：「某一區亮、其他區變暗」那組 CSS，
> 亮起來的選擇器 specificity 必須跟變暗的那條**一樣重**（所以多寫一個 `.kzone`），
> 否則會被壓過去，變成連選中的那一區也一起變暗，整個鍵盤糊掉。

### 三顆燈實驗

```html
<div class="lamp" data-say-on="…" data-say-off="…" data-say-idle="…">
  <button class="lamp__bulb" aria-pressed="true">Num Lock<small>（點我開關）</small></button>
  <div class="lamp__pad">
    <button class="lamp__key" data-on="7" data-emit-on="7"
            data-off="Home" data-emit-off="" data-dead-say="數字沒出來，因為…"></button>
  </div>
  <output class="lamp__out"></output>
  <button class="btn" data-clear>清空框框</button>
  <p class="lamp__say"></p>
</div>
```

`data-emit-*` 留空 = 這顆鍵在那個狀態下**打不出東西**，按下去會顯示 `data-dead-say`。
這就是「Num Lock 關掉，數字就消失」那個效果。

### 游標實驗室（Backspace / Delete / Home / End / Insert）

```html
<div class="caret" data-text="小貓在公園裡跑步" data-pos="3" data-type="新">
  <div class="caret__line"></div>
  <div class="caret__btns">
    <button class="caret__btn" data-act="left">← 往左</button>
    <!-- data-act：left / right / home / end / back / del / type / ins / reset -->
  </div>
  <p class="caret__say"></p>
</div>
```

`data-text` 是預設那行字、`data-pos` 是游標一開始停在第幾個字後面、
`data-type` 是按「打一個字」時插入的字。訊息全部由 `typing.js` 產生，不用自己寫。

### 演變時間軸

```html
<ol class="tline">
  <li class="tline__it"><span class="tline__yr">1947 年</span>
    <b class="tline__t">標題</b><p>內容</p></li>
  <li class="tline__it tline__it--punch">…最後一格「所以呢」，會變綠色…</li>
</ol>
```

**刻意不做成點開才看得到的**——故事要一眼讀完，藏起來學生就不會讀。

### 兩相對照卡 ＋ 內文按鍵

```html
<div class="vs">
  <div class="vs__c vs__c--a"><h4>⌫ Backspace</h4><p>…</p></div>
  <div class="vs__c vs__c--b"><h4>Delete</h4><p>…</p></div>
</div>

內文裡提到某顆鍵：按 <span class="k">Home</span> 就好了
```

### 注音鍵盤（滑過會亮整條直行）

第 2 課的主角。學生要看見的是「**一條直行剛好是一組注音**」，
所以滑到任何一顆鍵，**整條直行**要一起亮，不是只亮那一顆。

```html
<div class="bpmbox">
  <div class="kbd__tabs">          <!-- 沿用鍵盤全圖那套切換鈕 -->
    <button class="ktab" data-go="all">全部</button>
    <button class="ktab" data-go="short">只有三個的直行</button>
    <button class="ktab" data-go="tone">聲調鍵</button>
  </div>
  <div class="bpmwrap">
    <div class="bpm" data-focus="all">
      <div class="bpmrow">
        <button class="bk" data-col="1" data-kind="full"
                data-en="1" data-bpm="ㄅ"><i>1</i><b>ㄅ</b></button>
        <b class="bk bk--off">`</b>          <!-- 沒有注音的鍵，只是讓鍵盤看起來完整 -->
        <b class="bk bk--lab" style="--w:2">⌫ Backspace</b>
      </div>
    </div>
  </div>
  <p class="bpm__say" data-idle="…"></p>
</div>
```

- `data-col`：屬於哪一直行（1～11），**同一個 col 的鍵會一起亮**
- `data-kind`：`full`（完整四個）／`short`（只有三個，空格放聲調）／`one`（ㄦ）
  每一直行的說明由 `data-kind` 自動推出來，**不用在 41 顆鍵上各寫一份**
- `data-tone`：標在四顆聲調鍵（3 4 6 7）和空白鍵上，給 `data-focus="tone"` 用
- 滑過去＝暫時亮，點下去＝鎖住（手機沒有 hover，靠點的也能用）
- 第二張放 `<div class="bpmbox" data-copy="tone"></div>`，**不要複製 HTML**，
  `data-copy` 的值就是要預選的那一群（同 `.kbdbox` 的做法）

> ⚠️ **每一排都要剛好 15u 寬**（實體鍵盤就是這樣對齊的）。
> 加減鍵的時候要用 `style="--w:1.5"` 把總和補回 15，不然整排會對不齊。

### 兩種打法的按鍵次數對照

「一個字一個字選」對上「整串打完再選」。學生自己按完兩邊，
最後用**數字**看到差多少，比直接跟他說「這樣比較快」有用得多。

```html
<div class="wpick" data-say="慢的按了 {慢} 下，快的只按了 {快} 下，少按 {差} 下。">
  <div class="wpick__grid">
    <div class="wp wp--slow">
      <h4>❶ 一個字一個字選</h4>
      <output class="wp__scr"><b></b><i></i></output>
      <ol class="wp__log">
        <li data-n="6" data-out="電" data-pend="">打 ㄉㄧㄢˋ → 空白鍵 → 選「電」</li>
      </ol>
      <div class="wp__foot">
        <span class="wp__n">按了 <b>0</b> 下</span>
        <button class="wp__go" type="button">下一步 ▸</button>
      </div>
    </div>
    <div class="wp wp--fast">…同樣結構…</div>
  </div>
  <p class="wpick__say"></p>
</div>
```

- `data-n`＝這一步按了幾下、`data-out`＝記事本上會有的字、`data-pend`＝還在組字中那一行
- `data-say` 裡的 `{慢}` `{快}` `{差}` 會自動換成數字
- **兩邊都走完才會出現結論** —— 先看到答案就沒有比的意思了

### 整句打字練習

```html
<div class="trace" data-done="🎉 三句都打完了！">
  <div class="trow" data-want="電腦教室" data-tip="打對之後補一句話">
    <div class="trow__want"></div>          <!-- 字格由 JS 生，不要自己寫 -->
    <div class="trow__in">
      <input type="text" aria-label="打出電腦教室">
      <span class="trow__mark"></span>
    </div>
    <p class="trow__say"></p>
  </div>
  <p class="trace__score"></p>
</div>
```

- 打對的字會一格一格亮起來，下一個該打的字會畫一圈
- **刻意不計時、不算速度**。課程地圖寫得很清楚：排名會變成比賽，慢的學生直接放棄

> ⚠️ **中文組字一定要處理**。學生打注音時輸入框會先出現「ㄉㄧㄢˋ」，
> 這時候比對必定判錯。`.trace` 和 `.symtest` 都是靠
> `compositionstart` / `compositionend` 擋掉組字中的狀態，**只在組字結束後才比對**。
> 這是整個打字系列最容易做壞的地方，做新元件如果有輸入框，一定要照抄這個處理。

### 補充框（知道就好，不是功課）

跟 `.sos`（⚠️ 出事了怎麼辦）**刻意長得不一樣**，
學生要能一眼分出「這段是延伸知識」還是「這段是我等一下要做的事」。

```html
<div class="tipbox">
  <span class="tipbox__tag">補充知識 · 知道就好</span>
  <h3>標題</h3>
  <p>內容</p>
</div>
```

### 迷你鍵盤

只放示範會用到的那幾顆鍵，跟大鍵盤同一套視覺。

```html
<div class="minibd">
  <div class="krow">
    <b class="kk kk--home">A</b>                  <!-- 基本鍵，黃色 -->
    <b class="kk kk--home kk--bump">F</b>         <!-- 定位鍵，鍵面下緣有凸起 -->
    <b class="kk">G</b>
  </div>
</div>
```

> ⚠️ 不能直接沿用三顆燈實驗的 `.lampbd`——那組樣式裡混了燈泡按鈕專用的規則。

### 連連看

一個字一組：左邊三個標籤、右邊三個打散的碼。
點左邊一個、再點右邊一個就**連一條線**（線是 SVG 畫的）。
連對兩邊一起變綠、線留著；連錯閃一下紅色、放掉選取，可以再試。

```html
<div class="link">
  <p class="link__q">範</p>
  <div class="link__grid">
    <svg class="link__wires" aria-hidden="true"></svg>
    <div class="link__col">
      <button class="lnode" type="button" data-pair="bpm">注音</button>
      <button class="lnode" type="button" data-pair="pin">拼音</button>
      <button class="lnode" type="button" data-pair="cj">倉頡</button>
    </div>
    <div class="link__col">
      <button class="lslot" type="button" data-pair="cj">竹十弓山</button>
      <button class="lslot" type="button" data-pair="bpm">ㄈㄢˋ</button>
      <button class="lslot" type="button" data-pair="pin">fan</button>
    </div>
  </div>
</div>
```

- `.lnode` 是左邊、`.lslot` 是右邊，靠 `data-pair` 的值配對
- **右邊的順序要故意跟左邊不一樣**，不然照著排就連完了
- 空的 `<svg class="link__wires">` 一定要放，線畫在裡面
- 線的座標是量出來的，視窗縮放時會自動重畫（`ResizeObserver`）

### 總成績

測驗頁最底下那一條，會自己去數整頁**所有題目**答對了幾題，
釘在畫面下緣（sticky），學生答對一題就跳一次。

```html
<div class="tally" data-done="全部答對，太厲害了 🎉"></div>
```

裡面的內容是 JS 生的，HTML 只要放這一個空的 `<div>`。
它認得的題型是 `.sym`／`.trow`／`.hkrow`／`.lnode`——
這四種答對時都會被各自的元件標上 `data-s="hit"`，
所以**新增題型時，只要那個元件也用 `data-s="hit"` 標答對，就會自動被算進去**
（要記得把新的 selector 加進 `typing.js` 元件 13 的 `SEL`）。

> 刻意不做「送出」和「分數」——課程地圖寫得很清楚：考試感會讓慢的學生放棄。
> 這裡只是把散在各大題的即時回饋加總起來。

### 測驗頁怎麼把「提示」關掉

測驗頁（`typing/05-總測驗.html`）跟講義用的是**同一套元件**，
差別只在**HTML 少放幾個容器**——元件找不到就不會輸出，不需要另外寫參數：

| 不想要什麼 | 就不要放這個 |
|---|---|
| 每格答完的文字說明 | `<p class="sym__say">`／`<p class="trow__say">` |
| 各大題自己的計分列 | `.symtest__score`／`.trace__score`／`.hotkey__score` |
| 答對後告訴你按哪幾顆鍵 | `data-key` |
| 答錯時的引導文字 | `data-miss` |
| 答對後的補充說明 | `data-tip` |

答對變綠、答錯變紅、`✓`／`✗` 記號是元件本身的視覺回饋，會留著。

> 快捷鍵那一大題是例外，`.hkrow__say` 要留著——
> 學生得知道「點框、按住不放」這個操作方式，不然根本按不出來。

---

## 右側進度脊椎

**不用手動寫**。`lesson.js` 會自動掃描 `<main>` 底下每一個 `<section>`，
用它的 `.h2` 當標籤，在該節的實際位置放一顆圓圈。

每一課的 HTML 只要放這一段容器：

```html
<div class="spine">
  <div class="spine__line"><i class="spine__fill"></i></div>
</div>
```

**已知的坑**（已修，別再踩回去）：圓圈位置必須在版面變動時重算。
字型載入、圖片載入、學生點開揭曉都會讓段落位移。少了重算，
圓圈會停在舊位置，甚至溢出容器把整頁撐長好幾萬 px。
`lesson.js` 裡綁了 toggle / load / fonts.ready / ResizeObserver 四道保險。

---

## 改樣式的注意事項

- 想調整整體風格，改 `lesson.css` 開頭的 `:root` 變數就夠了
- **Scratch 積木色不要改**——顏色＝分類，是學生要學的訊號
- 基礎字級 `--base: 18px` 是為中年級設定的，不要調小

---

## 首頁（`index.html`）的結構

首頁是**左邊釘住的課程側欄 ＋ 右邊只顯示選中的那一門課**。
課程再多，側欄自己捲，右邊永遠只有一門課的份量，不用捲整頁去找課。

```
.shell
├── aside.side           ← 側欄：課程清單（進行中／準備中／給老師）
│   └── a.cnav[data-panel="course-xxx"]
└── main.panel
    └── section.course#course-xxx   ← 一門課一個 section，一次只顯示一個
        └── details.unit            ← 單元，可收合
            └── ul.ls               ← 該單元的課
```

### 新增一門課

**兩個地方各加一段，id 對上就會自動運作**，樣式和切換都不用另外寫：

1. 側欄加一條連結（`進行中` 或 `準備中` 那一組裡面）：

```html
<a class="cnav" href="#course-newone" data-panel="course-newone">
  <span class="cnav__dot"></span>
  <span class="cnav__t">課程名稱</span>
  <span class="cnav__n">6</span>
</a>
```

2. 內容區加一個 section（`id` 要跟上面的 `data-panel` 一模一樣）：

```html
<section class="course" id="course-newone">
  <header class="course__head">
    <div class="course__title">
      <h1 tabindex="-1">課程名稱</h1>
      <span class="badge badge--live">進行中</span>
    </div>
    <p class="course__meta">年段 · 共 N 節</p>
  </header>
  <div class="course__tools"><button class="toggleall" type="button">全部展開</button></div>

  <details class="unit" open>
    <summary class="unit__sum">
      <span class="unit__n">單元一</span>
      <span class="unit__t">單元標題</span>
      <small class="unit__s">一句話說明</small>
      <span class="unit__c">2 堂</span>
      <span class="unit__chev"><!-- 直接複製別的單元的箭頭 svg --></span>
    </summary>
    <ul class="ls">
      <li><a href="lessons/xx-課名.html">
        <span class="ls__n">1</span>
        <span class="ls__txt"><b class="ls__t">課名</b><small class="ls__s">副標</small></span>
        <!-- 直接複製別的課的箭頭 svg -->
      </a></li>
    </ul>
  </details>
</section>
```

課的種類用 `<li>` 的 class 區分：一般課不用加，作品課加 `ls--work`（綠），
期末專題加 `ls--final`（橘），再在標題後面放 `<span class="tag tag--work">作品</span>`。

準備中的課程不用 `details`／`ls`，直接放一個 `<div class="soon">` 寫預告就好。

### 首頁的互動是怎麼運作的

- **單元收合**用原生的 `<details>`，完全不靠 JS，鍵盤也能操作
- **課程切換**才用 `home.js`。它刻意做成「加分用」的：JS 沒載到的話，
  側欄連結就是普通錨點，點下去捲到那門課，所有課程也都看得到——**功能不會壞**
- 動效（滑過浮起、箭頭滑出、收合過渡、切換淡入）全部包在
  `@media (prefers-reduced-motion: reduce)` 的保護裡，
  使用者在系統關掉動畫就會全部安靜下來

---

## 教學設計原則（來自 `docs/課程地圖.md`）

做新課之前先讀課程地圖。三個核心原則：

1. **每節最多一個「重概念」**（事件、迴圈、廣播、條件），或 2–3 個「輕概念」（移動、轉彎、尺寸、造型、音效）
2. **時間用「變化」填，不用「概念」填**
3. **每個單元用一個「作品」收尾**

## 你要準備的素材（截圖與 GIF）

Scratch 17 課總共留了 **50 個素材位置：39 個 GIF ＋ 11 張截圖**。
中文打字第 1 課另外留了 **6 個**（多半是實體鍵盤的照片，不是螢幕截圖）。
完整清單與檔名在 `素材清單.md`。

分布是刻意不平均的——**前 8 課佔了 38 個**，因為新手最需要看動作；
第 10 課以後每課 1～2 個，因為那時學生已經上手，而且那幾課的互動示範本身就在替代說明。

**優先順序**：先拍標成 <span>「最重要」</span>（橘色標籤）的那幾個，
其餘的先留白也不影響上課——虛線框裡已經寫清楚那裡本來要放什麼。

---

## 做完一課之後的自我檢查

1. **排序題的答案有沒有外洩**（正確順序出現在題目上方了嗎）
2. **有沒有偷跑到後面的課**（教了地圖上屬於後面課次的東西）
3. **跨課指涉對不對**（「下一課」「上禮拜」「第 N 課」有沒有寫錯）
