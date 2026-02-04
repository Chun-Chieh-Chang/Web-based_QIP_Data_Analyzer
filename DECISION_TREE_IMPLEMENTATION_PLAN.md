# 智能決策樹實現計劃

**版本**: v1.0  
**優先級**: 高  
**預期工作量**: 8-12 小時

---

## 📋 概述

實現一個**5層決策樹系統**，根據數據特性自動推薦最適合的管制圖類型，而不是讓用戶盲目選擇。

---

## 🎯 決策樹邏輯

### 第 1 層：數據類型判斷

```
問題: 您的數據是什麼類型?
├─ 計量型 (Continuous) - 測量值 (mm, μm, g, etc.)
│  └─ 推薦: I-MR, X-bar/R, X-bar/S, EWMA, CUSUM
│
└─ 計數型 (Discrete) - 計數值 (缺陷數, 不良品數)
   ├─ 二元分類 (良/不良)
   │  └─ 推薦: P Chart, NP Chart
   │
   └─ 多元計數 (缺陷數)
      └─ 推薦: C Chart, U Chart
```

**實現方式**:
- 在 Step 1 前添加「數據類型選擇」
- 根據選擇自動過濾後續選項

---

### 第 2 層：樣本數評估

```
問題: 每批次的樣本數是多少?
├─ n = 1 (個別值)
│  └─ 推薦: I-MR Chart
│
├─ 2 ≤ n ≤ 5 (小樣本)
│  └─ 推薦: X-bar/R Chart (使用 R 估計 σ)
│
├─ 6 ≤ n ≤ 10 (中樣本)
│  └─ 推薦: X-bar/S Chart (使用 S 估計 σ)
│
└─ n > 10 (大樣本)
   └─ 推薦: X-bar/S Chart 或 EWMA
```

**實現方式**:
- 自動檢測 Excel 中的穴位數量
- 根據 n 值自動推薦圖表類型
- 顯示推薦理由

---

### 第 3 層：常態性檢驗

```
問題: 數據是否符合常態分布?
├─ 是 (P-value ≥ 0.05)
│  └─ 使用標準 Shewhart 圖表
│
└─ 否 (P-value < 0.05)
   ├─ 嘗試數據轉換 (Box-Cox, Log)
   │  ├─ 轉換成功 → 使用轉換後的數據
   │  └─ 轉換失敗 → 使用 Pearson 分布
   │
   └─ 使用非參數方法
      └─ 推薦: 分位數圖表或秩轉換
```

**實現方式**:
- 在 Step 1 中添加 Shapiro-Wilk 檢驗
- 顯示 P-value 和建議
- 提供轉換選項

---

### 第 4 層：趨勢檢測

```
問題: 製程是否有已知趨勢?
├─ 有磨耗趨勢 (線性下降)
│  └─ 推薦: 允收管制圖 (Acceptance Control Chart)
│
├─ 有漂移趨勢 (非線性)
│  └─ 推薦: 擴展 Shewhart 圖表 + 趨勢分析
│
└─ 無明顯趨勢
   └─ 使用標準管制圖
```

**實現方式**:
- 在 Step 2 (穩定性分析) 中添加趨勢檢測
- 使用線性回歸檢驗趨勢
- 顯示趨勢強度和建議

---

### 第 5 層：敏感度需求

```
問題: 是否需要檢測微小變化?
├─ 是 (需要快速反應)
│  ├─ 推薦: EWMA Chart (λ = 0.2-0.3)
│  └─ 推薦: CUSUM Chart (更敏感)
│
└─ 否 (標準監測)
   └─ 使用 Shewhart 圖表
```

**實現方式**:
- 在 Step 2 中添加「敏感度選擇」
- 根據選擇調整控制界限
- 顯示不同方法的優缺點

---

## 🏗️ 技術架構

### 新增組件

```
DecisionWizard.jsx
├─ DataTypeSelector (第 1 層)
├─ SampleSizeAnalyzer (第 2 層)
├─ NormalityTest (第 3 層)
├─ TrendDetector (第 4 層)
└─ SensitivitySelector (第 5 層)
```

### 新增邏輯

```
decision_logic.js
├─ getDataType() - 判斷數據類型
├─ analyzeSampleSize() - 分析樣本數
├─ testNormality() - 常態性檢驗
├─ detectTrend() - 趨勢檢測
├─ recommendChartType() - 推薦圖表類型
└─ getRecommendationReason() - 獲取推薦理由
```

### 修改現有組件

```
App.jsx
├─ 在 Step 1 前添加 DecisionWizard
├─ 根據決策結果自動選擇 analysisType
└─ 隱藏不適用的選項
```

---

## 📊 實現步驟

### Step 1: 數據類型判斷 (2 小時)

**任務**:
- 創建 DataTypeSelector 組件
- 實現數據類型檢測邏輯
- 根據類型過濾後續選項

**代碼示例**:
```javascript
const detectDataType = (data) => {
  // 檢查是否為計量型或計數型
  const isDiscrete = data.every(v => Number.isInteger(v) && v >= 0);
  const isBinary = data.every(v => v === 0 || v === 1);
  
  if (isBinary) return 'binary-count';
  if (isDiscrete) return 'count';
  return 'continuous';
};
```

---

### Step 2: 樣本數評估 (2 小時)

**任務**:
- 自動檢測穴位數量
- 根據 n 值推薦圖表
- 顯示推薦理由

**代碼示例**:
```javascript
const recommendByN = (n) => {
  if (n === 1) return { chart: 'I-MR', reason: '個別值監測' };
  if (n <= 5) return { chart: 'X-bar/R', reason: '小樣本使用 R' };
  if (n <= 10) return { chart: 'X-bar/S', reason: '中樣本使用 S' };
  return { chart: 'X-bar/S', reason: '大樣本使用 S' };
};
```

---

### Step 3: 常態性檢驗 (3 小時)

**任務**:
- 實現 Shapiro-Wilk 檢驗
- 提供數據轉換建議
- 顯示檢驗結果

**代碼示例**:
```javascript
const testNormality = (data) => {
  const pValue = shapiroWilkTest(data);
  
  if (pValue >= 0.05) {
    return { isNormal: true, message: '數據符合常態分布' };
  } else {
    return { 
      isNormal: false, 
      message: '數據不符合常態分布',
      suggestions: ['嘗試 Log 轉換', '嘗試 Box-Cox 轉換', '使用非參數方法']
    };
  }
};
```

---

### Step 4: 趨勢檢測 (2 小時)

**任務**:
- 實現線性回歸趨勢檢測
- 計算趨勢強度 (R²)
- 推薦適當的圖表

**代碼示例**:
```javascript
const detectTrend = (data) => {
  const { slope, r2 } = linearRegression(data);
  
  if (Math.abs(slope) > threshold && r2 > 0.7) {
    return { 
      hasTrend: true, 
      type: slope < 0 ? 'wear' : 'drift',
      strength: r2,
      recommendation: '使用允收管制圖或 EWMA'
    };
  }
  return { hasTrend: false };
};
```

---

### Step 5: 敏感度選擇 (2 小時)

**任務**:
- 添加敏感度選擇界面
- 根據選擇調整控制界限
- 顯示不同方法的對比

**代碼示例**:
```javascript
const adjustSensitivity = (sensitivity) => {
  const config = {
    'standard': { method: 'Shewhart', sigma: 3 },
    'medium': { method: 'EWMA', lambda: 0.2, sigma: 2.66 },
    'high': { method: 'CUSUM', h: 5, k: 0.5 }
  };
  return config[sensitivity];
};
```

---

### Step 6: 集成和測試 (1 小時)

**任務**:
- 集成所有組件
- 端到端測試
- 性能優化

---

## 🎨 UI 設計

### 決策嚮導流程

```
┌─────────────────────────────────────┐
│  智能決策嚮導 (Smart Wizard)        │
├─────────────────────────────────────┤
│                                     │
│  第 1 層: 數據類型                  │
│  ○ 計量型 (Continuous)             │
│  ○ 計數型 (Discrete)               │
│                                     │
│  [下一步] [跳過]                    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  第 2 層: 樣本數分析                │
│                                     │
│  檢測到: n = 4 (4 穴模具)           │
│  推薦: X-bar/R Chart                │
│  理由: 小樣本使用 R 估計 σ          │
│                                     │
│  [接受推薦] [自訂選擇]              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  第 3 層: 常態性檢驗                │
│                                     │
│  Shapiro-Wilk P-value: 0.23         │
│  ✓ 數據符合常態分布                 │
│                                     │
│  [繼續] [查看詳情]                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  第 4 層: 趨勢檢測                  │
│                                     │
│  線性趨勢強度 (R²): 0.15            │
│  ✓ 無明顯趨勢                       │
│                                     │
│  [繼續] [查看詳情]                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  第 5 層: 敏感度選擇                │
│                                     │
│  ○ 標準 (Shewhart)                 │
│  ○ 中等 (EWMA)                     │
│  ○ 高敏感 (CUSUM)                  │
│                                     │
│  [開始分析]                         │
└─────────────────────────────────────┘
```

---

## 📈 預期效果

### 用戶體驗改進

| 方面 | 改進前 | 改進後 |
|------|--------|--------|
| 選擇難度 | 用戶困惑 | 自動推薦 |
| 決策時間 | 5-10 分鐘 | 1-2 分鐘 |
| 錯誤率 | 高 | 低 |
| 專業性 | 一般 | 高 |

### 功能完整性

- ✅ 支持計量型和計數型數據
- ✅ 自動樣本數分析
- ✅ 常態性檢驗和轉換建議
- ✅ 趨勢檢測和特殊圖表推薦
- ✅ 敏感度調整

---

## 🔄 與現有功能的整合

### 不破壞現有功能

- 保留手動選擇選項
- 決策嚮導為可選功能
- 用戶可跳過嚮導直接選擇

### 增強現有功能

- Step 1 (數據校驗) 增加常態性檢驗
- Step 2 (穩定性分析) 增加趨勢檢測
- 自動推薦最適合的圖表類型

---

## 📋 實現檢查清單

- [ ] 創建 decision_logic.js
- [ ] 實現 detectDataType()
- [ ] 實現 analyzeSampleSize()
- [ ] 實現 testNormality()
- [ ] 實現 detectTrend()
- [ ] 實現 recommendChartType()
- [ ] 創建 DecisionWizard.jsx
- [ ] 創建 DataTypeSelector 組件
- [ ] 創建 SampleSizeAnalyzer 組件
- [ ] 創建 NormalityTest 組件
- [ ] 創建 TrendDetector 組件
- [ ] 創建 SensitivitySelector 組件
- [ ] 集成到 App.jsx
- [ ] 單元測試
- [ ] 集成測試
- [ ] 文檔更新
- [ ] 用戶指南

---

## 🎯 優先級

**優先級**: 🔴 高  
**建議時機**: Phase 4 (在 C Chart 和 EWMA 之後)

---

## 📝 相關文檔

- CONTROL_CHART_EVALUATION.md - 圖表類型評估
- PHASE_3_IMPLEMENTATION_REPORT.md - Phase 3 完成報告
- USER_GUIDANCE_SYSTEM.md - 用戶指導系統

---

**建議者**: Kiro AI Assistant  
**日期**: 2026-02-04  
**狀態**: 待批准

