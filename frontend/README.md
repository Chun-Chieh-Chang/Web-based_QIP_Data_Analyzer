# SPC Analysis Tool - Frontend Application

## Architecture Overview

This is the **complete application** for the Web-based SPC Analysis Tool. The system operates entirely in the browser using:

- **React 19**: Modern UI framework
- **Web Workers**: Background processing for heavy statistical calculations
- **XLSX Library**: Client-side Excel file parsing
- **Plotly.js**: Interactive statistical charts

## Core Features

### 1. Statistical Analysis
- **Batch Analysis**: Individual-X and Moving Range (I-MR) charts
- **Cavity Comparison**: Multi-cavity capability comparison
- **Group Trend**: Min-Max-Avg trend visualization

### 2. Process Capability
- Automatic calculation of Cp, Cpk, Pp, Ppk
- Color-coded capability classification
- Distribution histograms with normal curve overlays

### 3. Stability Monitoring
- **Nelson Rules 1-6** (ISO 7870-2 compliant)
- Automatic violation detection and flagging
- Dynamic sigma zone visualization (±1σ, ±2σ, ±3σ)

## Technical Stack

### Dependencies
- React 19.2+
- Vite 7.2+
- Plotly.js 3.3+
- XLSX 0.18+
- Lucide React 0.562+

### Development Tools
- ESLint for code quality
- Vite for fast development and optimized builds

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Access at: `http://localhost:5173`

### Production Build
```bash
npm run build
```
Output directory: `dist/`

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main application component
│   ├── index.css            # Global styling
│   ├── utils/
│   │   ├── spc_logic.js     # Statistical calculation engine
│   │   ├── spc.worker.js    # Web Worker for background processing
│   │   └── diagnostic_logic.js  # Expert diagnostic engine
│   └── main.jsx             # Application entry point
├── public/                  # Static assets
├── index.html               # HTML template
└── vite.config.js           # Vite configuration
```

## Key Concepts

### MECE Architecture
The codebase follows **Mutually Exclusive, Collectively Exhaustive** principles:

1. **Data Layer** (`spc_logic.js`): Pure statistical computations
2. **Worker Layer** (`spc.worker.js`): Async processing coordination
3. **UI Layer** (`App.jsx`): Interactive visualization and controls
4. **Diagnostic Layer** (`diagnostic_logic.js`): Expert interpretation

### Web Worker Benefits
- Non-blocking UI during heavy calculations
- Supports large Excel files (up to 50MB tested)
- Maintains 60fps interaction even during analysis

## Data Privacy

All data processing occurs **locally in the browser**. No files are uploaded to external servers.

---
*Part of Web-based SPC Analyzer v5.0*
