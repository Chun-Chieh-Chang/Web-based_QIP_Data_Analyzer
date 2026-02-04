# P Chart (Proportion Defective Chart) 實現指南

**版本**: v6.4  
**狀態**: 計劃中  
**預期工作量**: 3-5 小時

---

## 📋 概述

P Chart (Proportion Defective Chart) 用於監測不良品率，適用於品質管理和缺陷分析。

---

## 🎯 實現計劃

### 1. 數據結構

#### Excel 格式要求
```
第 1 行: 批次標籤 (Batch Labels)
第 2 行: 樣本數 (Sample Size)
第 3 行: 不良品數 (Defective Count)
第 4 行: 規格 (Specifications) - 可選
```

#### 示例
```
批次      批次1  批次2  批次3  ...
樣本數    100    100    100
不良數    5      3      7
```

### 2. 計算邏輯

#### P Chart 公式
```
p = 不良品數 / 樣本數
p-bar = Σp / n (平均不良率)

標準誤 SE = √[p-bar(1-p-bar)/n]

UCL = p-bar + 3 × SE
LCL = max(0, p-bar - 3 × SE)
```

#### 實現位置
- 文件: `frontend/src/utils/spc_logic.js`
- 方法: `calculatePChart(defectiveCount, sampleSize, labels)`
- 返回: P Chart 數據結構

### 3. UI 實現

#### 新增分析類型
```javascript
// 在 App.jsx 中添加
<option value="p-chart">P Chart (不良率監測)</option>
```

#### 新增輸入字段
- 樣本數輸入
- 不良品數輸入
- 或直接從 Excel 讀取

#### 圖表渲染
- 不良率折線圖
- 控制界限 (UCL, LCL)
- 中心線 (p-bar)
- 紅色點表示超出界限

### 4. 指導內容

#### P Chart 指導
```javascript
pChart: {
  title: 'P Chart (不良率監測)',
  description: '監測製程的不良品率趨勢',
  keyPoints: [
    '適用於二元分類 (良/不良)',
    '樣本數可以不同',
    '不良率應該穩定在低水平'
  ],
  whatToLook: {
    title: '應該注意什麼?',
    items: [
      '紅色點 - 超出控制界限的批次',
      '趨勢 - 不良率是否上升或下降',
      '變異 - 不良率的波動程度'
    ]
  },
  whatToDo: {
    title: '應該怎麼做?',
    items: [
      '如果不良率穩定: 繼續監測',
      '如果不良率上升: 調查原因，改善製程',
      '如果不良率下降: 確認改善措施的有效性'
    ]
  }
}
```

### 5. 實現步驟

#### Step 1: 添加計算方法
```javascript
// spc_logic.js
calculatePChart(defectiveCount, sampleSize, labels) {
  // 計算不良率
  // 計算控制界限
  // 返回數據結構
}
```

#### Step 2: 添加 UI 組件
```javascript
// App.jsx
- 添加 P Chart 分析類型選項
- 添加樣本數和不良品數輸入字段
- 添加 P Chart 圖表渲染邏輯
```

#### Step 3: 添加指導內容
```javascript
// guidance.js
- 添加 P Chart 指導
- 添加使用建議
```

#### Step 4: 測試和驗證
```
- 構建測試
- 功能測試
- 代碼診斷
```

---

## 📊 技術規格

### 適用場景
- 不良品率監測
- 缺陷率分析
- 品質管理
- 過程改善

### 優勢
- 簡單易懂
- 適合管理層
- 直觀的視覺效果
- 易於溝通

### 限制
- 只適用於二元分類
- 樣本數應該足夠大 (n ≥ 30)
- 不適用於缺陷計數

---

## 🔮 後續計劃

### 相關圖表
1. **NP Chart** - 不良品數 (固定樣本數)
2. **C Chart** - 缺陷數 (單位產品)
3. **U Chart** - 缺陷率 (可變樣本數)

### 高級功能
1. **多圖表對比** - 同時顯示多個圖表
2. **導出功能** - 導出為 PNG/PDF
3. **趨勢分析** - 自動檢測趨勢

---

## 📝 實現檢查清單

- [ ] 添加 `calculatePChart()` 方法
- [ ] 添加 P Chart 分析類型
- [ ] 添加輸入字段
- [ ] 實現圖表渲染
- [ ] 添加指導內容
- [ ] 構建測試
- [ ] 功能測試
- [ ] 代碼診斷
- [ ] Git 提交
- [ ] GitHub 推送
- [ ] 文檔更新

---

**預期完成日期**: 2026-02-05  
**優先級**: 高

