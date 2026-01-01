# Web-based SPC Analysis Tool - User Manual

## Table of Contents
1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation and Setup](#installation-and-setup)
4. [Running the Application](#running-the-application)
5. [User Interface Guide](#user-interface-guide)
6. [Analysis Types](#analysis-types)
7. [Xbar-R Chart Analysis](#xbar-r-chart-analysis)
8. [Troubleshooting](#troubleshooting)

## Overview

The Web-based SPC (Statistical Process Control) Analysis Tool is a modern web application designed to perform statistical analysis on manufacturing process data. The tool supports multiple analysis types including Individual-MR charts, cavity comparisons, and Xbar-R charts for multi-cavity processes.

### Key Features
- Web-based interface accessible through any modern browser
- Support for up to 32 cavities in multi-cavity analysis
- Xbar-R control charts with proper statistical formulas
- Individual-MR control charts for single cavity analysis
- Cavity comparison analysis
- Capability analysis (Cpk, Ppk)
- Western Electric Rules violation detection
- Export to Excel functionality

## System Requirements

### Minimum Requirements
- Operating System: Windows 10 or later, macOS 10.15 or later, Linux
- RAM: 4 GB minimum
- Storage: 100 MB available space
- Node.js: Version 14 or later
- Python: Version 3.7 or later

### Recommended Requirements
- RAM: 8 GB or more
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Installation and Setup

### Prerequisites
1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Install Python 3.7+ from [python.org](https://python.org/)
3. Ensure both Node.js and Python are in your system PATH

### Initial Setup
1. Navigate to the project directory:
   ```
   cd c:\Users\3kids\Downloads\QIP_DataCollectAnalysisTool\web_app
   ```

2. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

## Running the Application

### Method 1: Using Batch Files (Recommended)
1. Navigate to the main project directory
2. Run `StartApplication.bat` to start both backend and frontend servers
3. The application will be accessible at `http://localhost:5173`

### Method 2: Manual Start
1. Start the backend server:
   ```
   cd c:\Users\3kids\Downloads\QIP_DataCollectAnalysisTool\web_app\backend
   python main.py
   ```
   The backend will start on an available port (typically 8000 or higher)

2. In a new terminal, start the frontend:
   ```
   cd c:\Users\3kids\Downloads\QIP_DataCollectAnalysisTool\web_app\frontend
   npm run dev
   ```
   The frontend will start on port 5173

3. Access the application at `http://localhost:5173`

### Method 3: Using Individual Batch Files
- Run `StartBackend.bat` to start only the backend server
- Run `StartFrontend.bat` to start only the frontend server
- Run `StartApplication.bat` to start both servers

## User Interface Guide

### Main Interface Components

#### 1. Sidebar Controls
- **Select Data Folder**: Button to specify the directory containing Excel data files
- **Part Number**: Dropdown to select the product/part to analyze
- **Inspection Item**: Dropdown to select the inspection item/sheet
- **Cavity Information Display**: Shows number and names of cavities when available
- **Production Range Selection**: Start and End batch selection
- **Analysis Type**: Select between Batch Analysis, Cavity Comparison, or Group Trend
- **Cavity (Optional)**: Field to specify a particular cavity (for Batch Analysis)
- **Show Specification Limits**: Checkbox to toggle spec limit visibility
- **Generate Analysis**: Button to run the selected analysis
- **Export to Excel**: Button to export results to Excel
- **Reset**: Button to clear all selections and data

#### 2. Main Content Area
- **Capability Summary**: Displays Cpk, Ppk, mean, and specification limits
- **Control Charts**: Visual representation of the analysis results
- **SPC Violations**: List of any detected violations

### Step-by-Step Usage Guide

#### 1. Data Folder Selection
1. Click the "Select Data Folder" button
2. Enter the absolute path to your data directory containing Excel files
3. The Part Number dropdown will appear after selecting a data folder

#### 2. Product and Item Selection
1. Select a Part Number from the dropdown (appears after data folder selection)
2. Select an Inspection Item from the dropdown (appears after product selection)
3. Cavity information will display automatically if available

#### 3. Range Selection
1. Select the Start Batch from the dropdown
2. Select the End Batch from the dropdown
3. The range will include all batches between these two points (inclusive)

#### 4. Analysis Type Selection
Choose from:
- **Batch Analysis (I-MR)**: Individual-MR or Xbar-R charts
- **Cavity Comparison**: Compare different cavities
- **Group Trend (Min-Max-Avg)**: Trend analysis across batches

#### 5. Running Analysis
1. For Batch Analysis, optionally specify a cavity number
2. Click "Generate Analysis" button
3. Results will appear in the main content area

#### 6. Exporting Results
1. After analysis is complete, click "Export to Excel"
2. The Excel file will download automatically

## Analysis Types

### Batch Analysis (I-MR/Xbar-R)

#### Individual-MR Charts (Specific Cavity Selected)
- **Individual-X Chart**: Plots individual measurements over time
- **Moving Range Chart**: Shows variation between consecutive points
- **Control Limits**: UCL = X̄ + 2.66×MR̄, LCL = X̄ - 2.66×MR̄

#### Xbar-R Charts (No Cavity Selected - "All Cavities" Mode)
- **Xbar Chart**: Plots average values across all cavities for each batch
- **R Chart**: Plots range values (max - min) across all cavities for each batch
- **Control Limits**: 
  - Xbar: UCL = X̄ + A₂R̄, LCL = X̄ - A₂R̄
  - R: UCL = D₄R̄, LCL = D₃R̄
- **Constants**: Automatically selected based on number of cavities (2-32)

### Cavity Comparison
- **Cpk Comparison**: Bar chart comparing Cpk values across cavities
- **Average Values Comparison**: Line chart showing mean values vs specifications

### Group Trend (Min-Max-Avg)
- **Process Trend**: Shows maximum, average, and minimum values across cavities for each batch

## Xbar-R Chart Analysis

### When to Use Xbar-R Charts
Xbar-R charts are appropriate when:
- Analyzing multi-cavity processes (2-32 cavities)
- Subgroup size is 2-10 (up to 25 cavities supported)
- You want to monitor both the process average and variation between cavities

### Statistical Formulas
- **Xbar Chart**:
  - Center Line (CL) = Average of subgroup averages
  - Upper Control Limit (UCL) = X̄ + A₂R̄
  - Lower Control Limit (LCL) = X̄ - A₂R̄
  
- **R Chart**:
  - Center Line (CL) = Average of subgroup ranges
  - Upper Control Limit (UCL) = D₄R̄
  - Lower Control Limit (LCL) = D₃R̄

### Constants Based on Subgroup Size
| Subgroup Size (n) | A₂    | D₃    | D₄    |
|-------------------|-------|-------|-------|
| 2                 | 1.880 | 0     | 3.267 |
| 3                 | 1.023 | 0     | 2.575 |
| 4                 | 0.729 | 0     | 2.282 |
| 5                 | 0.577 | 0     | 2.115 |
| 6                 | 0.483 | 0     | 2.004 |
| 7                 | 0.419 | 0.076 | 1.924 |
| 8                 | 0.373 | 0.136 | 1.864 |
| 9                 | 0.337 | 0.184 | 1.816 |

### How to Activate Xbar-R Charts
1. Do NOT enter a specific cavity number in the Cavity field
2. The system will automatically detect "All Cavities" mode
3. Xbar-R charts will be displayed instead of Individual-MR charts

## Troubleshooting

### Common Issues and Solutions

#### 1. "No products found in the selected folder"
- **Cause**: Data directory doesn't contain Excel files with proper naming
- **Solution**: Ensure the directory contains .xlsx files with appropriate names

#### 2. "Cavity info not available" in browser console
- **Cause**: Sheet doesn't contain columns with "穴" character
- **Solution**: Ensure cavity columns are properly named with "穴" indicator

#### 3. Port conflicts (8000, 8001, etc. already in use)
- **Cause**: Multiple instances running
- **Solution**: Close existing instances or wait for automatic port assignment

#### 4. Excel file not found errors
- **Cause**: File or sheet doesn't exist
- **Solution**: Verify file exists and sheet name matches exactly

#### 5. Decimal precision display issues
- **Cause**: Floating-point representation
- **Solution**: The system automatically formats to preserve original precision

### Error Messages

#### HTTP 400 Errors
- Usually caused by invalid parameters or missing files
- Check that product file and sheet exist

#### "Insufficient data" Errors
- Occurs when there are fewer than 2 data points
- Verify that the selected range contains valid data

#### "File not found" Errors
- Indicates the Excel file doesn't exist in the specified directory
- Verify the file path and filename

## Best Practices

1. **Data Organization**: Keep all Excel files for a project in a single directory
2. **File Naming**: Use consistent naming conventions for product files
3. **Cavity Naming**: Include "穴" in cavity column names for automatic detection
4. **Data Quality**: Ensure data is clean and consistent before analysis
5. **Range Selection**: Select appropriate batch ranges for meaningful analysis
6. **Regular Analysis**: Perform analysis regularly to catch process shifts early

## Support and Feedback

For technical support or feedback, please contact your system administrator or development team.