# 設計系統實施指南

**目標**: 將 QIP SPC Data Analyzer 升級至國際級工具應用設計標準

---

## 第 1 部分: 色彩系統

### 1.1 完整色彩系統

```css
:root {
  /* 品牌色 - 藍色系 */
  --brand-50: #f0f9ff;
  --brand-100: #e0f2fe;
  --brand-200: #bae6fd;
  --brand-300: #7dd3fc;
  --brand-400: #38bdf8;
  --brand-500: #0ea5e9;
  --brand-600: #0284c7;
  --brand-700: #0369a1;
  --brand-800: #075985;
  --brand-900: #0c3d66;

  /* 中性色 - 灰色系 */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-400: #9ca3af;
  --neutral-500: #6b7280;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --neutral-900: #111827;

  /* 功能色 */
  --success-50: #f0fdf4;
  --success-500: #10b981;
  --success-600: #059669;
  --success-700: #047857;

  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;

  --danger-50: #fef2f2;
  --danger-500: #ef4444;
  --danger-600: #dc2626;
  --danger-700: #b91c1c;

  --info-50: #f0f9ff;
  --info-500: #0ea5e9;
  --info-600: #0284c7;
  --info-700: #0369a1;
}
```

### 1.2 色彩使用規則

| 用途 | 色彩 | 說明 |
|------|------|------|
| 主要按鈕 | brand-600 | 主要操作 |
| 次要按鈕 | neutral-200 | 次要操作 |
| 成功狀態 | success-600 | 成功/完成 |
| 警告狀態 | warning-600 | 警告/注意 |
| 錯誤狀態 | danger-600 | 錯誤/失敗 |
| 信息狀態 | info-600 | 信息/提示 |
| 背景 | neutral-50 | 主背景 |
| 卡片 | white | 卡片背景 |
| 邊框 | neutral-200 | 邊框顏色 |
| 文字 | neutral-900 | 主文字 |
| 次文字 | neutral-600 | 次要文字 |

---

## 第 2 部分: 排版系統

### 2.1 排版規模

```css
/* 標題 */
--text-h1: 2rem;      /* 32px */
--text-h2: 1.5rem;    /* 24px */
--text-h3: 1.25rem;   /* 20px */
--text-h4: 1.125rem;  /* 18px */

/* 正文 */
--text-lg: 1.125rem;  /* 18px */
--text-base: 1rem;    /* 16px */
--text-sm: 0.875rem;  /* 14px */
--text-xs: 0.75rem;   /* 12px */

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* 字重 */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 2.2 排版組件

```css
/* 標題 1 */
.text-h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

/* 標題 2 */
.text-h2 {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.33;
  letter-spacing: -0.015em;
}

/* 標題 3 */
.text-h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

/* 正文 */
.text-base {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

/* 小文本 */
.text-sm {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}

/* 標籤 */
.text-label {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 第 3 部分: 間距系統

### 3.1 間距規模

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### 3.2 組件間距規則

| 組件 | 內邊距 | 外邊距 | 說明 |
|------|--------|--------|------|
| 按鈕 | 12px 16px | 0 | 中等大小 |
| 輸入框 | 10px 12px | 0 | 標準 |
| 卡片 | 24px | 0 | 標準卡片 |
| 側邊欄 | 24px | 0 | 側邊欄 |
| 主內容 | 40px | 0 | 主內容區 |

---

## 第 4 部分: 組件設計

### 4.1 按鈕設計

```jsx
// 主要按鈕
<button className="btn btn-primary">
  操作
</button>

// 次要按鈕
<button className="btn btn-secondary">
  取消
</button>

// 成功按鈕
<button className="btn btn-success">
  確認
</button>

// 危險按鈕
<button className="btn btn-danger">
  刪除
</button>
```

```css
.btn {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: var(--brand-600);
  color: white;
  box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2);
}

.btn-primary:hover {
  background-color: var(--brand-700);
  box-shadow: 0 10px 15px rgba(2, 132, 199, 0.3);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background-color: var(--neutral-100);
  color: var(--neutral-700);
  border: 1px solid var(--neutral-300);
}

.btn-secondary:hover {
  background-color: var(--neutral-200);
  border-color: var(--neutral-400);
}
```

### 4.2 卡片設計

```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">卡片標題</h3>
  </div>
  <div className="card-body">
    卡片內容
  </div>
  <div className="card-footer">
    卡片頁腳
  </div>
</div>
```

```css
.card {
  background-color: white;
  border-radius: 12px;
  border: 1px solid var(--neutral-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--brand-200);
}

.card-header {
  padding: 24px;
  border-bottom: 1px solid var(--neutral-100);
  background-color: var(--neutral-50);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--neutral-100);
  background-color: var(--neutral-50);
}
```

### 4.3 輸入框設計

```jsx
<div className="form-group">
  <label className="form-label">標籤</label>
  <input 
    type="text" 
    className="form-input"
    placeholder="輸入內容"
  />
  <span className="form-hint">幫助文本</span>
</div>
```

```css
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--neutral-300);
  background-color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-100);
}

.form-input:disabled {
  background-color: var(--neutral-100);
  color: var(--neutral-500);
  cursor: not-allowed;
}

.form-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--neutral-600);
  margin-top: 6px;
}
```

### 4.4 嚮導組件

```jsx
<div className="wizard">
  <div className="wizard-steps">
    <div className="wizard-step active">
      <div className="wizard-step-circle">1</div>
      <div className="wizard-step-label">步驟 1</div>
    </div>
    <div className="wizard-step">
      <div className="wizard-step-circle">2</div>
      <div className="wizard-step-label">步驟 2</div>
    </div>
  </div>
  <div className="wizard-content">
    內容
  </div>
</div>
```

```css
.wizard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.wizard-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.wizard-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--neutral-200);
  z-index: 0;
}

.wizard-step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.wizard-step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid var(--neutral-300);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--neutral-600);
  transition: all 0.3s ease;
}

.wizard-step.active .wizard-step-circle {
  background-color: var(--brand-600);
  border-color: var(--brand-600);
  color: white;
  box-shadow: 0 0 0 4px var(--brand-100);
}

.wizard-step.completed .wizard-step-circle {
  background-color: var(--success-600);
  border-color: var(--success-600);
  color: white;
}

.wizard-step-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neutral-600);
  text-align: center;
  transition: color 0.3s ease;
}

.wizard-step.active .wizard-step-label {
  color: var(--neutral-900);
}
```

---

## 第 5 部分: 動畫和過渡

### 5.1 過渡效果

```css
/* 快速過渡 (200ms) */
.transition-fast {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 標準過渡 (300ms) */
.transition-normal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 緩慢過渡 (500ms) */
.transition-slow {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.2 動畫效果

```css
/* 淡入 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 滑入 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 縮放 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}
```

---

## 第 6 部分: 響應式設計

### 6.1 斷點

```css
/* 手機 */
@media (max-width: 640px) {
  .sidebar {
    width: 100%;
    position: fixed;
    bottom: 0;
    height: auto;
    max-height: 50vh;
  }
  
  .main-content {
    padding: 20px;
  }
}

/* 平板 */
@media (max-width: 1024px) {
  .sidebar {
    width: 250px;
  }
  
  .main-content {
    padding: 30px;
  }
}

/* 桌面 */
@media (min-width: 1025px) {
  .sidebar {
    width: 300px;
  }
  
  .main-content {
    padding: 40px;
  }
}
```

---

## 第 7 部分: 可訪問性

### 7.1 ARIA 標籤

```jsx
<button 
  aria-label="打開菜單"
  aria-expanded={isOpen}
  aria-controls="menu"
>
  菜單
</button>

<div id="menu" role="menu">
  菜單項目
</div>
```

### 7.2 焦點管理

```css
/* 清晰的焦點指示 */
:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
}

input:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
}
```

### 7.3 對比度

```css
/* 確保最小對比度 4.5:1 */
.text-primary {
  color: var(--neutral-900);
  background-color: white;
  /* 對比度: 21:1 ✅ */
}

.text-secondary {
  color: var(--neutral-600);
  background-color: white;
  /* 對比度: 7:1 ✅ */
}
```

---

## 實施檢查清單

- [ ] 建立色彩系統 CSS 變數
- [ ] 建立排版系統 CSS 類
- [ ] 建立間距系統 CSS 變數
- [ ] 更新按鈕組件
- [ ] 更新卡片組件
- [ ] 更新輸入框組件
- [ ] 更新嚮導組件
- [ ] 添加動畫效果
- [ ] 實現響應式設計
- [ ] 改進可訪問性
- [ ] 測試所有瀏覽器
- [ ] 性能優化
- [ ] 文檔更新

---

**預計實施時間**: 2-3 週  
**優先級**: 高  
**影響**: 顯著提升使用者體驗和視覺設計質量
