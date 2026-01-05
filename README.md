# Web-based SPC Analysis Tool (v5.0)

> **A Standalone, Privacy-First Statistical Process Control Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Architecture: MECE](https://img.shields.io/badge/Architecture-MECE-green.svg)](PROJECT_STRUCTURE.md)

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

📖 **Full Structure**: See [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)

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
| **SPC_Tool_User_Manual.md**| Detailed usage instructions     |
| **PROJECT_STRUCTURE.md**  | MECE architecture explanation    |
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