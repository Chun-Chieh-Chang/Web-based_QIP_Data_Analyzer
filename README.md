# Web-based SPC Analysis Tool (v4.6)

## 1. Project Architecture (Modular MECE Design)
The system is built on a **Dual-Runtime Architecture** to ensure flexibility and data privacy.

### 1.1 Local Mode (Client-Side)
- **Engine**: React + Web Worker (Background Processing).
- **Scope**: Processes data entirely within the browser using `spc_logic.js`.
- **Constraint**: Optimized for molds with up to 10 cavities.

### 1.2 Server Mode (Backend-Side)
- **Engine**: Python (FastAPI) + NumPy/Pandas.
- **Scope**: Centralized analysis via `backend/analysis.py`.
- **Capability**: Extended support for up to 32 cavities with high-precision approximation formulas.

---

## 2. Core Logic & Statistical Engine
Mutually exclusive components handling the "math" behind the visuals.

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
- **Excel Handling**: Memory-efficient parsing supporting large datasets.
- **Precision Matching**: Automatic decimal alignment with source Excel formatting.
- **Export System**: Specialized Excel report generator (Summary + Detail sheets).

### 4.2 Legacy & Extension Tools
Located in `/Nelson Rules` and `/NormalDistributionPlot`:
- **VBA Modules**: standalone Excel macros for offline Nelson Rule tagging and Normal Distribution plotting.

---

## 5. Getting Started & Deployment
### 5.1 Installation
1. **Frontend**: `cd frontend && npm install`
2. **Backend (Optional)**: `cd backend && pip install -r requirements.txt`

### 5.2 Execution
- **One-Click Start**: Run `StartApplication.bat`.
- **Manual**: `npm run dev` (Frontend) | `python main.py` (Backend).

### 5.3 Deployment
Fully compatible with **GitHub Pages** (auto-activates Local Mode).

---
*Maintained under MECE Principles - 2026-01-04*