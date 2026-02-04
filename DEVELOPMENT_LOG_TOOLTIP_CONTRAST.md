# 開發紀錄 - 字體對比度改善與懸停提示功能

**日期**: 2026-02-04  
**開發者**: Kiro AI Assistant  
**版本**: v1.0  
**狀態**: 完成待測試

---

## 1. 需求分析

### 用戶反饋
- 字體顏色與背景的對比度很糟
- 需要在按鈕懸停時出現使用說明提示

### 目標
1. 改善全應用程式的字體與背景對比度，符合 WCAG AA 標準
2. 為「標準 (Standard)」和「Z-Chart (標準化)」按鈕添加懸停提示

---

## 2. 實施方案

### 2.1 對比度改善 (frontend/src/index.css)

#### 色彩變更清單

| 元素 | 舊值 | 新值 | 改善說明 |
|------|------|------|---------|
| --primary-color | #334155 | #1e293b | 更深的深藍灰，提高對比度 |
| --secondary-color | #64748b | #475569 | 更深的灰色 |
| --text-main | #1e293b | #0f172a | 更深的黑色，提高可讀性 |
| --text-muted | #64748b | #475569 | 更深的灰色 |
| --border-color | #e2e8f0 | #cbd5e1 | 更明顯的邊框 |
| --success-color | #10b981 | #059669 | 更深的綠色 |
| --warning-color | #f59e0b | #d97706 | 更深的橙色 |
| --danger-color | #ef4444 | #dc2626 | 更深的紅色 |

#### 具體修改

1. **CSS 變數更新** (第 3-16 行)
   - 更新所有主要色彩變數
   - 確保整個應用程式的一致性

2. **按鈕樣式** (第 124-134 行)
   - 按鈕背景漸層：`#1e293b → #334155`
   - 文字顏色：`#fff → #ffffff`（規範化）
   - 懸停陰影：更新 RGBA 值

3. **表單焦點狀態** (第 91-95 行)
   - 邊框顏色：`var(--primary-color) → #1e293b`
   - 陰影：`rgba(51, 65, 85, 0.2) → rgba(30, 41, 59, 0.2)`

4. **統計數據樣式** (第 193-204 行)
   - stat-label：`var(--text-muted) → #334155`
   - stat-value：`var(--text-main) → #0f172a`

5. **能力等級顏色** (第 207-223 行)
   - excellent：`#059669` + `font-weight: 600`
   - good：`#7c3aed` + `font-weight: 600`
   - accept：`#d97706` + `font-weight: 600`
   - fail：`#dc2626` + `font-weight: 600`

6. **嚮導步驟** (第 304-330 行)
   - active 圓圈：`#1e293b` 背景
   - 標籤顏色：`#475569 → #0f172a`（active 時）
   - completed：`#059669`

7. **資訊框邊框** (第 360-362 行)
   - blue：`#bfdbfe → #93c5fd`
   - green：`#bbf7d0 → #86efac`
   - amber：`#fde68a → #fcd34d`

### 2.2 懸停提示功能 (frontend/src/index.css + frontend/src/App.jsx)

#### CSS 新增 (第 365-401 行)

```css
/* Custom Tooltip Styling */
button[title] {
  position: relative;
}

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

#### React 組件修改 (frontend/src/App.jsx 第 686-715 行)

**標準按鈕**
```jsx
<button
  onClick={() => setChartMode('standard')}
  title="標準圖表：顯示原始數據值與控制界限，用於監測製程中心和變異"
  style={{...}}
>
  標準 (Standard)
</button>
```

**Z-Chart 按鈕**
```jsx
<button
  onClick={() => setChartMode('z-chart')}
  title="Z-Chart（標準化圖表）：將數據標準化為Z分數，便於比較不同量綱的製程數據"
  style={{...}}
>
  Z-Chart (標準化)
</button>
```

**容器改進**
- 添加 `gap: '4px'` 以改善按鈕間距
- 添加 `transition: 'all 0.2s ease'` 以提供平滑的懸停效果

---

## 3. 測試計畫

### 3.1 視覺測試
- [ ] 檢查所有文字與背景的對比度
- [ ] 驗證按鈕懸停時提示框正確顯示
- [ ] 確認提示框位置和箭頭指向正確
- [ ] 測試不同螢幕尺寸的響應式表現

### 3.2 功能測試
- [ ] 標準按鈕懸停顯示正確提示
- [ ] Z-Chart 按鈕懸停顯示正確提示
- [ ] 點擊按鈕切換圖表模式正常
- [ ] 提示框不影響按鈕點擊功能

### 3.3 瀏覽器開發者工具檢查
- [ ] Console 無錯誤訊息
- [ ] 無 CSS 警告
- [ ] 無 React 警告
- [ ] 網路請求正常

### 3.4 無障礙檢查
- [ ] 對比度符合 WCAG AA 標準 (4.5:1 以上)
- [ ] 鍵盤導航正常
- [ ] 螢幕閱讀器相容性

---

## 4. 修改檔案清單

| 檔案 | 修改類型 | 行數 | 說明 |
|------|---------|------|------|
| frontend/src/index.css | 修改 + 新增 | 3-401 | 色彩系統更新 + 提示框 CSS |
| frontend/src/App.jsx | 修改 | 686-715 | 按鈕 title 屬性 + 容器改進 |

---

## 5. 潛在風險與對策

### 風險 1: 色彩變更影響其他組件
**對策**: 使用 CSS 變數集中管理，確保全應用一致性

### 風險 2: 提示框在小螢幕上超出邊界
**對策**: 後續可添加 JavaScript 邏輯動態調整位置

### 風險 3: 提示框文字過長導致換行
**對策**: 使用 `white-space: nowrap` 防止換行，必要時可改為 `normal`

---

## 6. 後續改進建議

1. **提示框增強**
   - 支援多行文字顯示
   - 添加動畫過渡效果
   - 在小螢幕上自動調整位置

2. **無障礙改進**
   - 添加 ARIA 標籤
   - 支援鍵盤快捷鍵

3. **國際化**
   - 提示文字支援多語言

---

## 7. 開發者備註

- 所有修改遵循 MECE 原則，避免重複或遺漏
- 使用 CSS 變數確保可維護性
- 提示框使用 CSS 偽元素實現，無需額外 DOM 節點
- 修改前後已驗證無邏輯衝突

---

**簽核**: 待測試驗證  
**下一步**: 瀏覽器測試 → Git 推送
