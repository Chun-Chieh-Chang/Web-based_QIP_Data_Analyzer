# Change Log - December 31, 2025

## Web-based SPC Tool Enhancements

### 1. Xbar-R Chart Implementation
- **Feature**: Implemented proper Xbar-R control charts with correct statistical formulas
- **Formulas**: 
  - Xbar chart: UCL/LCL = X̄ ± A₂R̄
  - R chart: UCL = D₄R̄, LCL = D₃R̄
- **Subgroup Support**: Up to 32 cavities with appropriate A₂, D₃, D₄ constants based on subgroup size
- **Backend**: Added `calculate_xbar_r_chart` function with proper constants for different subgroup sizes
- **Frontend**: Updated chart rendering logic to detect "All Cavities" mode and render Xbar-R charts instead of Individual-MR charts

### 2. Cavity Information Display
- **Feature**: Added cavity count and names display after product selection
- **Backend**: Added `get_cavity_info` method to identify cavity columns containing "穴" character
- **API**: Added `/api/cavity-info` endpoint to fetch cavity information
- **Frontend**: Added useEffect to fetch and display cavity information below Inspection Item dropdown

### 3. UI Layout Improvements
- **Feature**: Moved "Select Data Folder" button above Part Number selection
- **Logic**: Part Number dropdown only appears after data folder is selected
- **Reset Functionality**: Enhanced reset to clear all dependent data structures
- **Decimal Precision**: Fixed floating-point precision issues (0.6700 showing as 0.669999999...)

### 4. Statistical Formulas Corrections
- **Xbar-R Charts**: Implemented correct control limit calculations using standard constants
- **Individual-MR Charts**: Maintained existing functionality for single cavity analysis
- **Capability Metrics**: Updated to handle both chart types appropriately
- **Control Limits**: Proper handling of UCL, LCL, and CL for both chart types

### 5. Error Handling Improvements
- **API Endpoints**: Enhanced error handling for missing files or sheets
- **Frontend Resilience**: Graceful handling of API failures without breaking UI
- **Validation**: Proper validation of cavity info requests

### 6. Chart Rendering Logic
- **Conditional Rendering**: Frontend detects "All Cavities" mode and renders appropriate charts
- **Xbar Charts**: Display when no specific cavity is selected (shows average across cavities)
- **R Charts**: Range charts for "All Cavities" mode showing variation across cavities
- **Individual-MR Charts**: Display when specific cavity is selected

### 7. Performance Optimizations
- **Cavity Detection**: Efficient identification of cavity columns in Excel files
- **Subgroup Size Calculation**: Automatic determination of appropriate statistical constants
- **Data Processing**: Optimized batch and cavity data processing