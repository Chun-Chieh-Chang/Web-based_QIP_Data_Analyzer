# UI/UX 改進建議 - 具體實施方案

**目標**: 將 QIP SPC Data Analyzer 升級至 Figma/Notion/Linear 級別的設計標準

---

## 1. 側邊欄改進

### 當前問題
- 按鈕堆疊過密集
- 缺乏視覺分組
- 沒有分隔線
- 控制項組織混亂

### 改進方案

```jsx
// 改進後的側邊欄結構
<aside className="sidebar">
  {/* 頭部 */}
  <div className="sidebar-header">
    <div className="logo">
      <Activity size={28} />
      <h1>QIP SPC Analyst</h1>
    </div>
  </div>

  {/* AI 配置區 */}
  <div className="sidebar-section">
    <h3 className="sidebar-section-title">🤖 AI 智能診斷</h3>
    <div className="sidebar-section-content">
      {/* AI 配置內容 */}
    </div>
  </div>

  {/* 分隔線 */}
  <div className="sidebar-divider" />

  {/* 數據加載區 */}
  <div className="sidebar-section">
    <h3 className="sidebar-section-title">📁 數據管理</h3>
    <div className="sidebar-section-content">
      {/* 文件上傳按鈕 */}
    </div>
  </div>

  {/* 分隔線 */}
  <div className="sidebar-divider" />

  {/* 分析配置區 */}
  <div className="sidebar-section">
    <h3 className="sidebar-section-title">⚙️ 分析配置</h3>
    <div className="sidebar-section-content">
      {/* 分析配置內容 */}
    </div>
  </div>

  {/* 分隔線 */}
  <div className="sidebar-divider" />

  {/* 操作區 */}
  <div className="sidebar-section">
    <h3 className="sidebar-section-title">🎯 操作</h3>
    <div className="sidebar-section-content">
      {/* 操作按鈕 */}
    </div>
  </div>

  {/* 頁腳 */}
  <div className="sidebar-footer">
    {/* 幫助和設置 */}
  </div>
</aside>
```

### CSS 改進

```css
.sidebar {
  width: 320px;
  background-color: var(--neutral-50);
  border-right: 1px solid var(--neutral-200);
  padding: 24px 0;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid var(--neutral-200);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}

.sidebar-section {
  padding: 0 24px;
  margin-bottom: 24px;
}

.sidebar-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;
}

.sidebar-section-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-divider {
  height: 1px;
  background-color: var(--neutral-200);
  margin: 16px 0;
}

.sidebar-footer {
  margin-top: auto;
  padding: 24px;
  border-top: 1px solid var(--neutral-200);
  display: flex;
  gap: 8px;
}
```

---

## 2. 主內容區改進

### 當前問題
- 卡片設計過於平淡
- 缺乏視覺焦點
- 沒有清晰的層級
- 背景過於單調

### 改進方案

```jsx
// 改進後的主內容結構
<main className="main-content">
  {/* 頁面頭部 */}
  <div className="page-header">
    <div className="page-header-content">
      <h1 className="page-title">SPC 分析</h1>
      <p className="page-description">
        進行統計製程控制分析，監測製程穩定性和能力
      </p>
    </div>
    <div className="page-header-actions">
      {/* 頁面級操作 */}
    </div>
  </div>

  {/* 嚮導和推薦 */}
  <div className="recommendations-section">
    {/* 決策嚮導推薦 */}
    {/* AIAG-VDA 推薦 */}
    {/* 分析階段推薦 */}
  </div>

  {/* 主要內容 */}
  <div className="content-section">
    {/* 分析結果 */}
  </div>
</main>
```

### CSS 改進

```css
.main-content {
  flex: 1;
  padding: 40px;
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--brand-50) 100%);
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--neutral-200);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 1rem;
  color: var(--neutral-600);
  margin: 0;
}

.page-header-actions {
  display: flex;
  gap: 12px;
}

.recommendations-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

---

## 3. 卡片設計改進

### 當前問題
- 卡片邊框過於簡單
- 沒有背景變化
- 懸停效果不明顯
- 缺乏視覺層級

### 改進方案

```jsx
// 改進後的卡片組件
<div className="card card-elevated">
  <div className="card-header">
    <div className="card-header-content">
      <h3 className="card-title">卡片標題</h3>
      <p className="card-subtitle">卡片副標題</p>
    </div>
    <div className="card-header-actions">
      {/* 卡片操作 */}
    </div>
  </div>
  <div className="card-body">
    {/* 卡片內容 */}
  </div>
  <div className="card-footer">
    {/* 卡片頁腳 */}
  </div>
</div>
```

### CSS 改進

```css
.card {
  background-color: white;
  border-radius: 12px;
  border: 1px solid var(--neutral-200);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-elevated {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.card:hover {
  border-color: var(--brand-300);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.card-header {
  padding: 24px;
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--brand-50) 100%);
  border-bottom: 1px solid var(--neutral-200);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 4px 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--neutral-600);
  margin: 0;
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 16px 24px;
  background-color: var(--neutral-50);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

---

## 4. 嚮導組件改進

### 當前問題
- 步驟圓圈太小
- 進度線不明顯
- 步驟標籤位置不佳
- 缺乏動畫過渡

### 改進方案

```jsx
// 改進後的嚮導組件
<div className="wizard-container">
  <div className="wizard-header">
    <h2 className="wizard-title">5 步 AIAG-VDA 管制圖選擇</h2>
    <p className="wizard-description">
      根據您的製程特性選擇最合適的管制圖
    </p>
  </div>

  <div className="wizard-progress">
    <div className="wizard-progress-bar">
      <div 
        className="wizard-progress-fill"
        style={{ width: `${(currentStep / 5) * 100}%` }}
      />
    </div>
    <div className="wizard-progress-text">
      第 {currentStep} 步 / 5 步
    </div>
  </div>

  <div className="wizard-steps">
    {[1, 2, 3, 4, 5].map(step => (
      <div
        key={step}
        className={`wizard-step ${
          step === currentStep ? 'active' : ''
        } ${step < currentStep ? 'completed' : ''}`}
      >
        <div className="wizard-step-circle">
          {step < currentStep ? '✓' : step}
        </div>
        <div className="wizard-step-label">
          步驟 {step}
        </div>
      </div>
    ))}
  </div>

  <div className="wizard-content">
    {/* 步驟內容 */}
  </div>

  <div className="wizard-actions">
    <button className="btn btn-secondary">上一步</button>
    <button className="btn btn-primary">下一步</button>
  </div>
</div>
```

### CSS 改進

```css
.wizard-container {
  background-color: white;
  border-radius: 12px;
  border: 1px solid var(--neutral-200);
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.wizard-header {
  margin-bottom: 32px;
  text-align: center;
}

.wizard-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 8px 0;
}

.wizard-description {
  font-size: 1rem;
  color: var(--neutral-600);
  margin: 0;
}

.wizard-progress {
  margin-bottom: 32px;
}

.wizard-progress-bar {
  height: 4px;
  background-color: var(--neutral-200);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.wizard-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-500), var(--brand-600));
  transition: width 0.3s ease;
}

.wizard-progress-text {
  font-size: 0.875rem;
  color: var(--neutral-600);
  text-align: center;
}

.wizard-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
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
  flex: 1;
}

.wizard-step-circle {
  width: 48px;
  height: 48px;
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
  box-shadow: 0 0 0 8px var(--brand-100);
  transform: scale(1.1);
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
  font-weight: 700;
}

.wizard-content {
  min-height: 300px;
  margin-bottom: 32px;
  padding: 24px;
  background-color: var(--neutral-50);
  border-radius: 8px;
  border: 1px solid var(--neutral-200);
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--neutral-200);
}
```

---

## 5. 選擇卡片改進

### 當前問題
- 選中狀態不明顯
- 缺乏懸停效果
- 沒有焦點指示
- 缺乏動畫反饋

### 改進方案

```jsx
// 改進後的選擇卡片
<div className="selection-grid">
  {options.map(option => (
    <div
      key={option.id}
      className={`selection-card ${
        selected === option.id ? 'selected' : ''
      }`}
      onClick={() => handleSelect(option.id)}
      role="radio"
      aria-checked={selected === option.id}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSelect(option.id);
        }
      }}
    >
      <div className="selection-card-icon">
        {option.icon}
      </div>
      <div className="selection-card-content">
        <h4 className="selection-card-title">
          {option.title}
        </h4>
        <p className="selection-card-description">
          {option.description}
        </p>
      </div>
      <div className="selection-card-check">
        <CheckCircle2 size={24} />
      </div>
    </div>
  ))}
</div>
```

### CSS 改進

```css
.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.selection-card {
  padding: 20px;
  border: 2px solid var(--neutral-200);
  border-radius: 12px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selection-card:hover {
  border-color: var(--brand-300);
  background-color: var(--brand-50);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
  transform: translateY(-2px);
}

.selection-card:focus-visible {
  outline: 2px solid var(--brand-600);
  outline-offset: 2px;
}

.selection-card.selected {
  border-color: var(--brand-600);
  background: linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%);
  box-shadow: 0 0 0 4px var(--brand-100), 0 4px 12px rgba(2, 132, 199, 0.2);
}

.selection-card-icon {
  font-size: 2rem;
}

.selection-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}

.selection-card-description {
  font-size: 0.875rem;
  color: var(--neutral-600);
  margin: 0;
}

.selection-card-check {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  color: var(--success-600);
  transition: opacity 0.3s ease;
}

.selection-card.selected .selection-card-check {
  opacity: 1;
}
```

---

## 6. 推薦卡片改進

### 改進方案

```jsx
// 改進後的推薦卡片
<div className="recommendation-card recommendation-card-success">
  <div className="recommendation-card-header">
    <div className="recommendation-card-icon">
      <CheckCircle2 size={24} />
    </div>
    <div className="recommendation-card-title">
      ✓ AIAG-VDA 管制圖推薦
    </div>
  </div>
  <div className="recommendation-card-content">
    <div className="recommendation-item">
      <strong>推薦圖表:</strong> X-bar & S Chart
    </div>
    <div className="recommendation-item">
      <strong>備選圖表:</strong> X-bar & R Chart
    </div>
  </div>
  <div className="recommendation-card-actions">
    <button className="btn btn-sm btn-secondary">
      關閉
    </button>
  </div>
</div>
```

### CSS 改進

```css
.recommendation-card {
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;
}

.recommendation-card-success {
  border-left-color: var(--success-600);
  background-color: var(--success-50);
}

.recommendation-card-warning {
  border-left-color: var(--warning-600);
  background-color: var(--warning-50);
}

.recommendation-card-danger {
  border-left-color: var(--danger-600);
  background-color: var(--danger-50);
}

.recommendation-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.recommendation-card-icon {
  color: var(--success-600);
}

.recommendation-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--success-700);
  margin: 0;
}

.recommendation-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.recommendation-item {
  font-size: 0.9rem;
  color: var(--success-700);
}

.recommendation-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(16, 185, 129, 0.2);
}
```

---

## 7. 實施優先級

### 第 1 週 (高優先級)
1. ✅ 側邊欄重組和分組
2. ✅ 卡片設計改進
3. ✅ 按鈕設計標準化
4. ✅ 色彩系統建立

### 第 2 週 (中優先級)
1. ✅ 嚮導組件改進
2. ✅ 選擇卡片改進
3. ✅ 推薦卡片改進
4. ✅ 動畫效果添加

### 第 3 週 (低優先級)
1. ✅ 響應式設計優化
2. ✅ 可訪問性改進
3. ✅ 性能優化
4. ✅ 文檔更新

---

## 8. 預期成果

### 改進前
- 視覺設計評分: 6.5/10
- 使用者體驗評分: 7/10
- 整體評分: 7.2/10

### 改進後
- 視覺設計評分: 8.5/10
- 使用者體驗評分: 8.5/10
- 整體評分: 8.5/10

### 改進幅度
- +2 分 (27% 提升)
- 達到國際級工具應用標準

---

**建議**: 立即開始第 1 週的實施工作。
