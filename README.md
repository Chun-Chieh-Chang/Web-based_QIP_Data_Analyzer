# Web-based SPC Analysis Tool

## Overview
This is a standalone web-based Statistical Process Control (SPC) analysis tool that provides modern, browser-based interface for manufacturing process analysis.

## Features
- Web-based interface accessible through any modern browser
- Support for up to 32 cavities in multi-cavity analysis
- Xbar-R control charts with proper statistical formulas (UCL/LCL = X̄ ± A₂R̄ for Xbar, UCL = D₄R̄, LCL = D₃R̄ for R chart)
- Individual-MR control charts for single cavity analysis
- Cavity comparison analysis
- Capability analysis (Cpk, Ppk)
- Western Electric Rules violation detection
- Export to Excel functionality

## System Requirements
- Node.js (v14 or later)
- Python (v3.7 or later)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Installation

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Install Python 3.7+ from [python.org](https://python.org/)
3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```
4. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

## Running the Application

### Method 1: Using Start Scripts
1. **For Command Prompt users:** Run `StartApplication.bat` to start both backend and frontend servers
2. **For PowerShell users:** Run `StartApplication.ps1` to start both backend and frontend servers (requires running `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` first)
3. The application will be accessible at `http://localhost:5173` (or the next available port if 5173 is busy, check the terminal output for the exact address)

### Method 2: Manual Start
1. Start the backend server:
   ```
   cd backend
   python main.py
   ```
   The backend will start on an available port (typically 8000 or higher)

2. In a new terminal, start the frontend:
   ```
   cd frontend
   npm run dev
   ```
   The frontend will start on port 5173

3. Access the application at `http://localhost:5173` (or the next available port if 5173 is busy, check the terminal output for the exact address)

## Usage
1. Click "Select Data Folder" to specify your data directory containing Excel files
2. Select a Part Number and Inspection Item
3. Choose the analysis type (Batch Analysis, Cavity Comparison, Group Trend)
4. For Batch Analysis, optionally specify a cavity number (leave blank for Xbar-R charts)
5. Click "Generate Analysis" to run the analysis
6. Export results to Excel using the "Export to Excel" button

## Calculation Formulas and Logic

### Control Charts

#### Individual-MR Chart (for single cavity analysis):
- **Moving Range (MR)**: MRᵢ = |Xᵢ - Xᵢ₋₁|
- **Average Moving Range**: MR̄ = ΣMRᵢ / (n-1)
- **Control Limits for Individual Chart**:
  - UCL = X̄ + 2.66 × MR̄
  - CL = X̄
  - LCL = X̄ - 2.66 × MR̄
- **Control Limits for Moving Range Chart**:
  - UCL = 3.267 × MR̄
  - CL = MR̄
  - LCL = 0 (or D₃ × MR̄ if subgroup size > 10)

#### Xbar-R Chart (for all cavities analysis when no specific cavity is selected):
- **Subgroup size (n)**: Equals the number of cavities
- **Control Limits for Xbar Chart**:
  - UCL = X̄̄ + A₂R̄
  - CL = X̄̄
  - LCL = X̄̄ - A₂R̄
- **Control Limits for R Chart**:
  - UCL = D₄R̄
  - CL = R̄
  - LCL = D₃R̄

Where A₂, D₃, and D₄ are control chart constants that depend on subgroup size (n):

| n | A₂    | D₃    | D₄    |
|---|-------|-------|-------|
| 2 | 1.880 | 0     | 3.267 |
| 3 | 1.023 | 0     | 2.575 |
| 4 | 0.729 | 0     | 2.282 |
| 5 | 0.577 | 0     | 2.115 |
| 6 | 0.483 | 0     | 2.004 |
| 7 | 0.419 | 0.076 | 1.924 |
| 8 | 0.373 | 0.136 | 1.864 |
| 9 | 0.337 | 0.184 | 1.816 |

### Capability Analysis

#### Cpk (Process Capability Index):
- **For Individual-MR Chart**: Cpk = min[(USL - X̄)/(3 × σ_within), (X̄ - LSL)/(3 × σ_within)]
  - Where σ_within = MR̄ / d₂, and d₂ = 1.128 for n=2

- **For Xbar-R Chart**: Cpk = min[(USL - X̄̄)/(3 × σ_within), (X̄̄ - LSL)/(3 × σ_within)]
  - Where σ_within = R̄ / d₂, and d₂ varies by subgroup size (number of cavities)

#### Ppk (Process Performance Index):
- Ppk = min[(USL - X̄)/(3 × σ_overall), (X̄ - LSL)/(3 × σ_overall)]
- Where σ_overall = standard deviation of all individual values

### Key Differences:
- **Cpk** uses within-subgroup variation (short-term capability)
- **Ppk** uses overall variation (long-term performance)
- Typically Cpk ≥ Ppk, as overall variation includes more sources of variation

## Documentation
- Complete user manual: `SPC_Tool_User_Manual.md`

## Moving to Another Location

The web-based SPC analysis tool is designed to be portable. To move it to another location:

1. Copy the entire `web_spc_tool` folder to the new location
2. **For Command Prompt users:** Run `InstallDependencies.bat` to install all dependencies
   **For PowerShell users:** Run `InstallDependencies.ps1` to install all dependencies
3. Run `StartApplication.bat` (or `StartApplication.ps1` for PowerShell) to start the application
4. Access the application at `http://localhost:5173` (or the next available port if 5173 is busy, check the terminal output for the exact address)
- Change log: `CHANGELOG_2025-12-31.md`