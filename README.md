# Web-based SPC Analysis Tool (v5.0)

## 1. Project Architecture (Modular MECE Design)
The system is built on a **Standalone Client-Side Architecture** to ensure maximum flexibility and data privacy.

### 1.1 Local Mode (Default)
- **Engine**: React + Web Worker (Background Processing).
- **Scope**: Processes data entirely within the browser using `spc_logic.js`.
- **Security**: No data is uploaded to a server; all analysis occurs locally on the user's machine.

---

## 2. Core Logic & Statistical Engine
Precision-engineered components handling the "math" behind the visuals.

### 2.1 Statistical Calculations
- **Sigma Within ($\sigma_w$)**:
  - $n=1$: Calculated via Moving Range (MR̄ / 1.128).
  - $n>1$: Calculated via Average Range (R̄ / d₂).
- **Sigma Overall ($\sigma_o$)**: Standard sample deviation including all process variation.
- **Indices**: Automatic calculation of **Cp, Cpk, Pp, Ppk**.

### 2.2 Stability Monitoring (ISO 7870-2)
Implemented **Nelson Rules 1-6** to detect assignable causes:
- **Rule 1**: Points beyond ±3σ.
- **Rule 2**: 9 points on one side of Mean.
- **Rules 3-4**: Trend and Alternation detection.
- **Rules 5-6**: Multi-point violations in Zone A/B.

---

## 3. User Experience & UI System
- **Interactive Dashboard**: Modern React interface with real-time filtering (Batch Exclusion).
- **Advanced Visuals**: 
  - **Dynamic Shading**: Background zones (±1σ, ±2σ, ±3σ) for rapid visual audit.
  - **Expert Diagnostic**: Automated textual insights based on stability and capability gaps.
  - **Minitab-style Histograms**: Capability reports with normal distribution overlays.

---

## 4. Data Management & Auxiliary Utilities
### 4.1 Data Processing
- **Excel Handling**: Memory-efficient parsing supporting large datasets via `xlsx` library.
- **Precision Matching**: Automatic decimal alignment with source Excel formatting.
- **Export System**: Standalone Excel report generator (Summary + Detail sheets).

### 4.2 Legacy & Extension Tools
Located in `/Nelson Rules` and `/NormalDistributionPlot`:
- **VBA Modules**: Standalone Excel macros for offline Nelson Rule tagging and Normal Distribution plotting.

---

## 5. Getting Started & Deployment
### 5.1 Installation
1. Run `InstallDependencies.bat` to install Node.js dependencies.

### 5.2 Execution
- **One-Click Start**: Run `StartApplication.bat`.
- **Manual**: `cd frontend && npm run dev`.

### 5.3 Deployment
Fully compatible with **GitHub Pages** (requires static build).

---
*Maintained under MECE Principles - 2026-01-05*