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
- 出題模式：**題庫（AI 預製）**（預設）｜**程式模板**（fallback）
- **逐步拖拉**：每一步拖入正確下一式（KaTeX）
- **方程／算式編輯器**：分數、根號、上標工具列
- 提示、完整詳解、跳過、統計與錯題類型
- Anti-repeat：題庫以 item `id` 追蹤已用題；程式模板另以 generator／指紋視窗避重

## AI 預製題庫（離線、免 API）

題目預先寫入靜態 JSON，由 SPA 以相對路徑載入，**無需 API Key、無即時 AI 呼叫**，GitHub Pages／本機皆可免費使用。

| 檔案 | 說明 |
|------|------|
| `bank/change-subject.json` | 主項變換題庫 |
| `bank/indices.json` | 指數化簡題庫 |

每題含 `id`、`level`、`type`、`errTag`、`prompt`、逐步 `steps`（含 distractors／tip）、`finalAnswer`、`accepted`。DSE Level（level 1）主項變換另有 `ref`（如「參考自 2016 卷一 Q2（題型）」）——僅標示題型風格，**非歷屆原文**。

程式內建 generator 僅在下列情況使用：使用者切換至「程式模板」、題庫載入失敗，或該難度題庫暫時無法抽出新題。

### 重新產生題庫（可選）

```bash
node scripts/generate-banks.js
```

會覆寫 `bank/*.json`。請保持題目為**原創**係數／結構，勿 verbatim 複製受版權保護的 HKDSE 原文。

## 主項變換

貼近卷一甲(1)「令 … 成為公式 … 的主項」風格；題庫含兩邊主項抽公因、分母主項、分式公式等（模擬／預製，非歷屆原文）。

## 指數化簡

提示語：`化簡 …，並以正指數表示答案。`  
題庫涵蓋同底乘除、方之方、積的方、負／零指數、嵌套積的方與三字母繁式；最終答案以正指數為準。

## 本地預覽

```bash
npx --yes serve .
# 或 python3 -m http.server 8080
```

（`fetch` 題庫需要透過 HTTP 開啟，勿直接用 `file://`。）

## 授權

供教學溫習使用。題目為隨機模擬／AI 預製操練項，僅供溫習。
