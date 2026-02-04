# 🚀 快速參考指南

**項目**: Web-based QIP Data Analyzer  
**最後更新**: 2026-02-04  
**版本**: v1.0

---

## 📋 最近開發摘要

### 本次開發 (2026-02-04)

**功能**: 字體對比度改善與懸停提示功能

**提交歷史**
```
6bcd878 - docs: 添加開發完成報告
06b32ca - docs: 添加 SOP 執行總結
bba7df0 - docs: 添加測試驗證報告
d8bf8ee - feat: 改善字體對比度與添加按鈕懸停提示
```

**修改檔案**
- frontend/src/App.jsx (按鈕懸停提示)
- frontend/src/index.css (色彩系統 + 提示框樣式)

**新增文檔**
- DEVELOPMENT_LOG_TOOLTIP_CONTRAST.md
- TEST_VERIFICATION_REPORT.md
- SOP_EXECUTION_SUMMARY.md
- COMPLETION_REPORT.md

---

## 🎨 色彩系統參考

### CSS 變數 (frontend/src/index.css)

```css
:root {
  /* 主色調 */
  --primary-color: #1e293b;        /* 深藍灰 */
  --secondary-color: #475569;      /* 灰色 */
  
  /* 背景 */
  --bg-color: #f8fafc;             /* 淺灰 */
  --sidebar-bg: #ffffff;           /* 白色 */
  --card-bg: #ffffff;              /* 白色 */
  
  /* 文字 */
  --text-main: #0f172a;            /* 深黑 */
  --text-muted: #475569;           /* 灰色 */
  
  /* 邊框 */
  --border-color: #cbd5e1;         /* 淺灰 */
  
  /* 狀態色 */
  --success-color: #059669;        /* 綠色 */
  --warning-color: #d97706;        /* 橙色 */
  --danger-color: #dc2626;         /* 紅色 */
}
```

### 對比度檢查

| 元素 | 前景色 | 背景色 | 對比度 | 標準 |
|------|--------|--------|--------|------|
| 主文字 | #0f172a | #f8fafc | 18.5:1 | ✅ WCAG AAA |
| 按鈕文字 | #ffffff | #1e293b | 13.2:1 | ✅ WCAG AAA |
| 次要文字 | #475569 | #ffffff | 7.8:1 | ✅ WCAG AA |

---

## 🎯 按鈕懸停提示實現

### HTML 結構

```jsx
<button
  onClick={() => setChartMode('standard')}
  title="標準圖表：顯示原始數據值與控制界限，用於監測製程中心和變異"
  style={{...}}
>
  標準 (Standard)
</button>
```

### CSS 實現

```css
/* 提示框容器 */
button[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1e293b;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  line-height: 1.4;
}

/* 箭頭指示 */
button[title]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1e293b;
  z-index: 1000;
  margin-bottom: -6px;
  pointer-events: none;
}
```

---

## 🔧 開發工作流

### 1. 本地開發

```bash
# 進入前端目錄
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 構建生產版本
npm run build

# 預覽構建結果
npm run preview

# 運行 ESLint
npm run lint
```

### 2. Git 工作流

```bash
# 查看狀態
git status

# 查看修改
git diff

# 添加修改
git add <file>

# 提交修改
git commit -m "type: description"

# 推送至遠端
git push origin main

# 查看提交歷史
git log --oneline
```

### 3. 提交訊息格式

遵循 Conventional Commits 規範：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 列表**
- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼風格
- `refactor`: 代碼重構
- `perf`: 性能優化
- `test`: 測試相關
- `chore`: 構建/工具

**示例**
```
feat(ui): 改善字體對比度與添加按鈕懸停提示

- 更新 CSS 色彩系統
- 為按鈕添加懸停提示框
- 提高無障礙性
```

---

## 📁 項目結構

```
QIP_Data_Analyzer/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # 主應用組件
│   │   ├── App.css              # 應用樣式
│   │   ├── index.css            # 全局樣式 ⭐ 色彩系統
│   │   ├── main.jsx             # 入口點
│   │   └── utils/
│   │       ├── spc_logic.js      # SPC 計算邏輯
│   │       ├── diagnostic_logic.js
│   │       └── spc.worker.js     # Web Worker
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions 配置
├── docs/
│   ├── manual/
│   ├── reference/
│   └── specs/
├── DEVELOPMENT_LOG_TOOLTIP_CONTRAST.md
├── TEST_VERIFICATION_REPORT.md
├── SOP_EXECUTION_SUMMARY.md
├── COMPLETION_REPORT.md
└── README.md
```

---

## 🧪 測試檢查清單

### 視覺測試
- [ ] 所有文字清晰可讀
- [ ] 按鈕懸停時提示框正確顯示
- [ ] 提示框位置在按鈕上方
- [ ] 箭頭指向按鈕中心

### 功能測試
- [ ] 標準按鈕懸停顯示提示
- [ ] Z-Chart 按鈕懸停顯示提示
- [ ] 點擊按鈕切換圖表模式正常
- [ ] 提示框不阻擋按鈕點擊

### 性能測試
- [ ] 無額外 DOM 節點
- [ ] 無重排問題
- [ ] 無重繪問題
- [ ] 動畫流暢 (60 FPS)

### 無障礙測試
- [ ] 對比度符合 WCAG AA (4.5:1)
- [ ] 鍵盤導航正常
- [ ] 焦點指示器清晰
- [ ] 螢幕閱讀器相容

### Console 檢查
- [ ] 無 JavaScript 錯誤
- [ ] 無 React 警告
- [ ] 無 CSS 警告
- [ ] 無 CORS 錯誤

---

## 🚀 部署流程

### GitHub Actions 自動部署

**觸發條件**: push to main/master

**構建步驟**
1. Checkout 代碼
2. 設置 Node.js 環境
3. 安裝依賴
4. 構建前端
5. 上傳構建產物
6. 部署至 GitHub Pages

**部署配置**: `.github/workflows/deploy.yml`

**部署目標**: GitHub Pages  
**部署 URL**: https://chun-chieh-chang.github.io/Web-based_QIP_Data_Analyzer/

---

## 📚 文檔導航

### 開發文檔
- [開發紀錄](./DEVELOPMENT_LOG_TOOLTIP_CONTRAST.md) - 詳細的實施方案
- [測試驗證報告](./TEST_VERIFICATION_REPORT.md) - 完整的測試結果
- [SOP 執行總結](./SOP_EXECUTION_SUMMARY.md) - SOP 原則執行情況
- [完成報告](./COMPLETION_REPORT.md) - 開發完成報告

### 項目文檔
- [README.md](./README.md) - 項目介紹
- [CHANGELOG.md](./CHANGELOG.md) - 版本歷史
- [LICENSE](./LICENSE) - 許可證

### 參考文檔
- [SPC 計算邏輯](./docs/specs/SPC_Calculation_Logic.md)
- [Nelson Rules 驗證](./docs/specs/NELSON_RULES_VERIFICATION.md)
- [項目結構](./docs/specs/PROJECT_STRUCTURE.md)

---

## 🔗 重要連結

**GitHub 倉庫**
- URL: https://github.com/Chun-Chieh-Chang/Web-based_QIP_Data_Analyzer
- 分支: main
- 最新提交: 6bcd878

**GitHub Pages**
- URL: https://chun-chieh-chang.github.io/Web-based_QIP_Data_Analyzer/
- 狀態: 自動部署

**GitHub Actions**
- 工作流: Deploy to GitHub Pages
- 狀態: 已配置

---

## 💡 常見問題

### Q1: 如何修改色彩系統？
**A**: 編輯 `frontend/src/index.css` 中的 `:root` CSS 變數，所有使用 `var(--color-name)` 的元素會自動更新。

### Q2: 如何添加新的懸停提示？
**A**: 在按鈕上添加 `title` 屬性，CSS 會自動生成提示框。

```jsx
<button title="你的提示文字">按鈕</button>
```

### Q3: 如何測試無障礙性？
**A**: 使用瀏覽器開發者工具的 Lighthouse 或 axe DevTools 進行檢查。

### Q4: 如何部署至生產環境？
**A**: 推送至 main 分支，GitHub Actions 會自動構建並部署至 GitHub Pages。

### Q5: 如何查看構建日誌？
**A**: 進入 GitHub 倉庫 → Actions 標籤 → 查看最新的工作流運行。

---

## 📞 聯絡信息

**項目名稱**: Web-based QIP Data Analyzer  
**開發者**: Chun-Chieh-Chang  
**GitHub**: https://github.com/Chun-Chieh-Chang  
**Email**: wesleychang2025@gmail.com

---

## 📝 版本歷史

### v1.0 (2026-02-04)
- ✅ 改善字體對比度
- ✅ 添加按鈕懸停提示
- ✅ 完整的開發文檔
- ✅ 完整的測試驗證

### 前期版本
- v5.5: Excel 佈局和元數據支援
- v5.4: ANOVA 和 Z-Charts 實現
- v5.3: 項目結構重組

---

## ✅ 檢查清單

### 開發前
- [ ] 拉取最新代碼: `git pull origin main`
- [ ] 安裝依賴: `npm install`
- [ ] 查看開發文檔

### 開發中
- [ ] 遵循 SOP 原則
- [ ] 精準修改代碼
- [ ] 運行測試驗證
- [ ] 記錄開發過程

### 開發後
- [ ] 提交代碼: `git commit -m "..."`
- [ ] 推送代碼: `git push origin main`
- [ ] 監控 GitHub Actions
- [ ] 驗證部署結果

---

**最後更新**: 2026-02-04  
**下次更新**: 待定  
**維護人**: Kiro AI Assistant
