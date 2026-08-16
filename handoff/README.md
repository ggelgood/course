# 國小電腦課講義專案

先讀 `CONTEXT.md`，那是給 Claude Code 的交接筆記，記錄了目前的技術決策、
已完成進度、和待辦事項。

## 資料夾結構

```
handoff/
├── CONTEXT.md              ← 先讀這個
├── README.md                ← 這份檔案
├── lessons/                 ← 每一課一個 HTML 檔（自足、可離線開啟）
│   └── scratch-01-角色與積木.html
└── assets/
    └── scratchblocks/       ← Scratch 積木渲染函式庫（做新課要內嵌用）
        ├── scratchblocks.min.js
        └── zh-tw.json
```

## 給老師：怎麼把這個丟給 Claude Code

1. 把整個 `handoff` 資料夾放到你的專案目錄（例如用 Claude Code 開一個新資料夾）。
2. 跟 Claude Code 說：「請先讀 CONTEXT.md，了解這個講義專案的背景後，
   幫我做下一課」，並說明你要哪個主題（Scratch 進階、Arduino 基礎...）。
3. 之後每次要繼續，都可以先請它讀 CONTEXT.md 抓回上下文。
