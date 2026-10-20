# DSE 數學操練 · 主項變換 & 指數化簡

香港中學文憑試（DSE）數學卷一甲(1)常見題型互動操練。單頁 HTML／JavaScript，用瀏覽器直接開啟（需 CDN 載入 [KaTeX](https://katex.org/)）。

## GitHub Pages

| 工具 | 連結 |
|------|------|
| 主項變換 | https://tlc-cmyk.github.io/dse-math-change-subject/ |
| 指數化簡 | https://tlc-cmyk.github.io/dse-math-change-subject/indices.html |

本地檔案：`index.html`／`主項變換操練.html`、`indices.html`／`指數化簡操練.html`（成對內容相同）。

## 共同功能

- 難度：**簡單 | DSE Level | 進階**（預設 DSE Level）
- **逐步拖拉**：每一步拖入正確下一式（KaTeX）
- **方程／算式編輯器**：分數、根號、上標工具列
- 提示、完整詳解、跳過、統計與錯題類型
- Anti-repeat：同一難度內優先未用題型、避免連續同一 generator、最近指紋視窗

## 主項變換

貼近卷一甲(1)「令 … 成為公式 … 的主項」風格；題庫含兩邊主項抽公因、分母主項、分式公式等（模擬生成，非歷屆原文）。

## 指數化簡

提示語：`化簡 …，並以正指數表示答案。`  
題庫涵蓋同底乘除、方之方、積的方、負／零指數、嵌套積的方與三字母繁式；最終答案以正指數為準。

## 本地預覽

```bash
npx --yes serve .
# 或 python3 -m http.server 8080
```

## 授權

供教學溫習使用。題目為隨機模擬，僅供操練。
