# Web-based SPC Analysis Tool (v5.0)

> **A Standalone, Privacy-First Statistical Process Control Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Architecture: MECE](https://img.shields.io/badge/Architecture-MECE-green.svg)](docs/specs/PROJECT_STRUCTURE.md)

---

## 📊 Overview

The Web-based SPC Analyzer is a **client-side statistical process control tool** designed for manufacturing quality analysis. It performs complex statistical calculations entirely in your browser—no server required.

### Key Differentiators
- **100% Local Processing**: Zero data upload; all analysis runs in-browser
- **ISO 7870-2 Compliant**: Nelson Rules 1-6 for stability monitoring
- **Production-Ready Performance**: Handles Excel files up to 50MB via Web Workers

---

## 🏗️ Architecture (MECE Framework)

The system is organized using **MECE principles** (Mutually Exclusive, Collectively Exhaustive):

### 1. Statistical Engine (`frontend/src/utils/`)
- **`spc_logic.js`**: Pure statistical calculations (Cpk, Ppk, control limits)
- **`spc.worker.js`**: Async processing coordinator (Web Worker)
- **`diagnostic_logic.js`**: Expert interpretation engine

### 2. User Interface (`frontend/src/`)
- **`App.jsx`**: Interactive dashboard with real-time controls
- **`index.css`**: Modern styling with glassmorphism effects

### 3. Auxiliary Tools (`/`)
- **`Nelson Rules/`**: Standalone Excel VBA module
- **`NormalDistributionPlot/`**: Offline distribution plotter

📖 **Full Structure**: See [`PROJECT_STRUCTURE.md`](docs/specs/PROJECT_STRUCTURE.md)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm

### Installation
```bash
# Option 1: One-Click Install (Windows)
InstallDependencies.bat

# Option 2: Manual Install
cd frontend
npm install
```

### Run Application
```bash
# Option 1: One-Click Start (Windows)
StartApplication.bat

# Option 2: Manual Start
cd frontend
npm run dev
```

Access at: **http://localhost:5173**

---

## 🔬 Core Features

### Statistical Analysis Types
| Analysis       | Description                              | Use Case                  |
|----------------|------------------------------------------|---------------------------|
| **Batch**      | I-MR or Xbar-R charts with capability    | Process stability tracking|
| **Cavity**     | Multi-cavity Cpk comparison              | Mold balance verification |
| **Group Trend**| Min-Max-Avg over time                    | Long-term trend analysis  |

### Capability Metrics
- **Cpk** (Short-term): Within-subgroup variation (R̄/d₂ or MR̄/1.128)
- **Ppk** (Long-term): Overall standard deviation
- **Cp, Pp, Cpm**: Comprehensive process potential assessment

### Stability Monitoring
- **Nelson Rules 1-6**: Automatic violation detection
- **Dynamic Sigma Zones**: Visual ±1σ, ±2σ, ±3σ shading
- **Smart Flagging**: Red markers for out-of-control points

---

## 📂 Data Format

Excel files must follow this structure:

```
Row 1:  [Batch Label] | [Cavity 1_穴] | [Cavity 2_穴] | ...
Row 2:  [Ignored]     | [Target]      | [USL]         | [LSL]
Row 3+: [Batch ID]    | [Value]       | [Value]       | [Value]
```

**Key Requirements**:
- Cavity column headers must contain "穴"
- Specs in Row 2: Target (Col B), USL (Col C), LSL (Col D)

---

## 📚 Documentation

| Document                  | Purpose                          |
|---------------------------|----------------------------------|
| **README.md** (this file) | Quick start & overview           |
| **docs/manual/SPC_Tool_User_Manual.md**| Detailed usage instructions     |
| **docs/specs/PROJECT_STRUCTURE.md**  | MECE architecture explanation    |
| **CHANGELOG.md**          | Version history                  |
| **frontend/README.md**    | Technical frontend details       |

---

## 🛠️ Technology Stack

### Runtime
- **React 19**: Modern UI framework
- **Web Workers**: Background processing
- **Vite 7**: Lightning-fast development

### Libraries
- **Plotly.js**: Interactive statistical charts
- **XLSX**: Client-side Excel parsing
- **Lucide React**: Icon system

---

## 🔒 Privacy & Security

All data processing occurs **locally in your browser**. No files are transmitted to external servers.

---

## 📦 Deployment

### GitHub Pages (Recommended)
```bash
cd frontend
npm run build
# Deploy the `dist/` folder to GitHub Pages
```

### Static Hosting
The build output (`frontend/dist/`) is a fully self-contained SPA compatible with any static host.

---

## 📊 Statistical Formulas

### Within-Subgroup Standard Deviation (σw)
```
n = 1:  σw = MR̄ / 1.128
n > 1:  σw = R̄ / d₂
```

### Overall Standard Deviation (σo)
```
σo = √[Σ(Xi - X̄)² / (N-1)]
```

### Process Capability
```
Cpk = min[(USL - μ) / 3σw, (μ - LSL) / 3σw]
Ppk = min[(USL - μ) / 3σo, (μ - LSL) / 3σo]
```

---

## 💡 核心統計邏輯深層解讀 (Statistical Deep Dive)

為了讓使用者更直觀地理解工具背後的數學模型，我們將複雜的統計學拆解為容易理解的概念：

### 🎯 射箭比賽比喻 (The Archery Analogy)
想像生產過程是一場射箭比賽：
- **生產批次 (Batch)**：每一輪射箭。
- **模穴數據 (Cavity)**：這一輪中你同時射出的好幾支箭。

1. **X-bar Chart (均值圖) — 瞄準能力**
   - **意義**：計算每一輪箭的重心位置（平均值）。
   - **目的**：監測你的「準星」有沒有歪？如果重心偏離了黃心（規格中心），代表整批貨可能因為壓力、溫度等因素集體偏移。

2. **R Chart (全距圖) — 穩定度/發抖程度**
   - **意義**：看這一輪裡面，射得最遠和最近的那支箭差了多少（Range）。
   - **目的**：反映模穴之間的不均勻度。如果 R 很大，代表你的手在發抖（模穴開發不均或溫控不穩）。

3. **Cpk (製程能力指標) — 期末考總分**
   - **邏輯**：Cpk 在問一個問題：「在考慮你手抖（R）的前提下，你最差的情況會不會射出界？」
   - **關鍵**：本工具計算 Cpk 時，使用的是由 R（模穴落差）推算出來的「組內標準差 (σw)」，這反映的是在現有設備精度下的最好潛力。

### 🔢 為什麼 X-bar 與 R 套用不同的常數 (A₂, D₃, D₄)?
這是因為「平均值」與「差距值」有著完全不同的統計特性：

- **X-bar 使用 A₂**：因為「平均值」的波動天生就比「單支箭」穩定。A₂ 常數是用來將「手抖程度 (R)」轉換為「平均值應該出現的合理波動範圍」。
- **R 使用 D₃ 與 D₄**：因為「差距 (Range)」不可能小於零，且人數（模穴數）越多，抓到極端大差距的機率就越高。D₃ 與 D₄ 考慮了樣本數，給出一個合理的落差界限。

### 🛠️ 如何診斷問題？
- **Cpk 不佳 + X-bar 異常** ➔ 調整機台參數（如壓力、時間）。
- **Cpk 不佳 + R 異常** ➔ 維護模具（如清穴位、調熱流道）。

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
1. Code follows MECE principles
2. Statistical logic has unit tests
3. Documentation is updated accordingly

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🏷️ Version

**Current**: v5.0.0 (2026-01-05)  
**Architecture**: Standalone Local Mode Only

---

*Built with precision by the QIP Development Team*