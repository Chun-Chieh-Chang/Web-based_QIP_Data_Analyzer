# SPC Analysis Tool - User Manual (v4.5)

## 1. Overview
The SPC Analysis Tool is a modern web application designed for manufacturing process control. It integrates complex statistical calculations with a user-friendly interface, allowing for real-time process monitoring directly in the browser.

### Key Logic & Features
- **Intelligent Mode Switching**: Detects whether to use server-side Python or client-side JavaScript based on availability.
- **Extreme Memory Efficiency**: Optimized data reading logic allows processing large Excel files without freezing the browser.
- **Dynamic Statistics**: Automatically matches the precision of results to the input data's formatting.

## 2. Getting Started

### Accessing the Tool
1. **Local Server**: Run `StartApplication.bat` and go to `http://localhost:5173`.
2. **Web Deployment**: Access the URL provided by your administrator (e.g., GitHub Pages).

### Initial Configuration
- **Step 1**: Click **Select Data Folder**.
- **Step 2**: Provide the path to your Excel records. 
  *(Note: In browser local mode, you will select or upload files individually; in server mode, you specify a directory path).*

## 3. Analysis Interface Guide

### Sidebar Controls
- **Part Number**: Select the specific component.
- **Inspection Item**: Select the measurement characteristic (Excel sheet).
- **Batch Range**: Choose the start and end of the production period.
- **Exclude Batches**: Click the checkboxes to remove specific batches from statistics (useful for excluding setup samples).
- **Analysis Type**:
  - `Batch Analysis`: Main control chart view.
  - `Cavity Comparison`: Efficiency analysis per cavity.
  - `Group Trend`: High-level trend view (Min/Max/Avg).

## 4. Understanding the Results

### Control Charts
- **I-MR Chart**: Shown for specific cavity analysis.
- **Xbar-R Chart**: Standard for multi-cavity analysis (No specific cavity selected).
- **Violations**: Points outside control limits (UCL/LCL) are automatically flagged in Red on the charts.

### Capability Statistics
- **Cpk**: Short-term capability using within-subgroup variation (R-bar or Moving Range method).
- **Ppk**: Long-term performance based on overall standard deviation.
- **Classifications**:
  - `> 1.67`: Excellent
  - `1.33 - 1.67`: Good
  - `1.00 - 1.33`: Acceptable
  - `< 1.00`: Failing/Unstable

## 5. Data Format Requirements
To ensure the tool analyzes your data correctly, please follow these rules:
1. **Header Row (Row 1)**: Column A must be Batch/Lot labels. Cavity columns must contain the string "穴".
2. **Spec Row (Row 2)**: 
   - **Column B**: Target Value.
   - **Column C**: Upper Specification Limit (USL).
   - **Column D**: Lower Specification Limit (LSL).
3. **Data Records (Row 3+)**: Measurement values.

## 6. Troubleshooting

| Issue | Potential Cause | Solution |
|-------|----------------|----------|
| **Stuck on "Analysing"** | Very large file or memory limit | Wait a few moments; if it persists, ensure the file is under 50MB. |
| **No Cavities Found** | Header naming error | Ensure columns contain the character "穴". |
| **Cpk is Null** | Missing Specs | Fill Target/USL/LSL in Row 2 (B2, C2, D2). |
| **Precision Mismatch** | Excel formatting | The tool reads formatted text. For 2 decimal places, format the Excel cells to show 2 decimals. |

---
*Last Updated: 2026-01-03*