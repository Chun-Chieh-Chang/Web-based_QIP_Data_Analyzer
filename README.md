# Web-based SPC Analysis Tool

## 1. Overview
A professional, standalone Statistical Process Control (SPC) analysis tool. It allows engineers to analyze manufacturing process data directly in a modern web browser, featuring high-performance local processing and optional server-side integration.

## 2. Key Features
- **Dual Runtime Support**: 
  - **Local Mode (Default)**: Process Excel files entirely in the browser (client-side). No data leaves your machine.
  - **Server Mode**: Optional integration with a Python/FastAPI backend for centralized data management.
- **Multifaceted Analysis**:
  - **Batch Analysis**: Automated selection between Individual-MR (for single cavity) and Xbar-R (for multi-cavity) control charts.
  - **Cavity Comparison**: Compare performance (Cpk, Mean) across multiple machine cavities (up to 32 supported).
  - **Group Trend**: Visualize Min/Max/Average trends across production batches.
- **Statistical Rigor**: Proper calculation of UCL, LCL, CL, Cpk, and Ppk using industry-standard formulas.
- **Modern User Experience**:
  - **Web Worker Engine**: Heavy data processing runs in the background to keep the UI responsive.
  - **Automatic Precision Matching**: Statistical results automatically match the decimal places found in the source Excel data.
  - **Batch Exclusion**: Interactive filtering to remove outliers or non-representative batches.
  - **Export to Excel**: Specialized reports with summary and detailed data tabs.

## 3. Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or later)
- (Optional) [Python](https://python.org/) 3.7+ (only required for Server Mode)

### Quick Setup
1. **Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```
2. **Backend Dependencies (Optional)**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the App
- **For All Users**: Run `StartApplication.bat` (Windows) or `StartApplication.ps1` (PowerShell).
- **Manual Start**:
  - Frontend: `cd frontend && npm run dev` (Default: http://localhost:5173)
  - Backend: `cd backend && python main.py`

## 4. Technical Specifications

### Data Format Requirements
Your Excel files must follow these structure conventions:
- **Specification Limits**: Cell **B2** (Target), **C2** (USL), **D2** (LSL).
- **Cavity Detection**: Columns containing "穴" (e.g., "1穴", "2穴") are automatically treated as measurement subgroups.
- **Batch Labels**: The first column (Column A) should contain production lot/batch numbers.

### Subgroup Logic & Statistical Constants
The subgroup size (n) is critical for calculating process capability. This tool automatically determines the appropriate size based on your selection:

#### 1. Individual-MR (Specific Cavity)
- **Subgroup Size (n)**: **1**.
- **Logic**: Used when a specific cavity is selected or only one data column exists.
- **Variation**: Uses **Moving Range (MR)** between adjacent batches.
- **Constant**: Uses d2 = 1.128 to estimate **sigma_within**.

#### 2. Xbar-R (Average of All Cavities)
- **Subgroup Size (n)**: **Dynamic**, equal to the number of detected cavity columns.
- **Logic**: Used for multi-cavity analysis ("All Cavities").
- **Variation**: Uses **Average Range (R-bar)** across cavities within each batch.
- **Constant**: Automatically maps A2, D3, D4, and d2 based on the subgroup size (n).

### Impact on Cpk vs. Ppk
The subgroup size directly affects the capability indices:
- **Cpk (Capability)**: Depends on **sigma_within** (R-bar/d2). Since **d2** is linked to **n**, an incorrect subgroup size will lead to inaccurate Cpk values.
- **Ppk (Performance)**: Depends on **sigma_overall** (Sample Standard Deviation). This calculates the total variation of all data points and is **independent** of subgroup sizing or batching.

### Mode Comparison Summary
| Feature | Local Mode (Browser) | Server Mode (Python) |
| :--- | :--- | :--- |
| **Max Subgroup Size (n)** | **10** (Capped) | **32** (Extended) |
| **Calculation Engine** | Hardcoded constant tables | Tables + Approximation formulas |
| **I-MR Pattern** | Sigma_w = MR-bar / 1.128 | Same |
| **Xbar-R Pattern** | Sigma_w = R-bar / d2(n) | Same |
| **Recommendation** | Molds with <= 10 cavities | High-cavity molds (> 10 cavities) |

> **Note**: In **Local Mode**, if the data contains more than 10 cavities, the system will fallback to constants for $n=10$ to maintain stability. For precision in 16-cavity or 32-cavity environments, please use **Server Mode**.

## 5. Deployment
The tool is fully compatible with static hosting (e.g., GitHub Pages).
1. Build the frontend: `npm run build`.
2. Deploy the `dist` folder.
3. The app will automatically enter "Local Mode" when deployed to `github.io`.

## 6. Project Structure
- `frontend/`: React source code, Web Worker logic, and styling.
- `backend/`: Python FastAPI implementation for server-side analysis.
- `docs/`: User manual and technical documentation.

---
*Created by [Antigravity](https://github.com/Chun-Chieh-Chang/Web-based_SPC_Analyzer) - 2026-01-03*