# Development Changelog

> **Complete History of Development Activities and Feature Implementations**

---

## [v6.1] - 2026-02-04
### UI/UX Improvements: Contrast & Accessibility

#### Task Overview
Improved visual accessibility by fixing font-to-background contrast issues and adding contextual help tooltips.

#### 1. Button Contrast Fix (`frontend/src/App.jsx`)
- **Issue**: Chart mode buttons (Standard/Z-Chart) had poor contrast with transparent backgrounds
- **Solution**: Changed button styling to use consistent light backgrounds (#f1f5f9) with dark text (#0f172a)
- **Result**: All buttons now have clear, readable text regardless of selection state

#### 2. Tooltip Implementation (`frontend/src/App.jsx`, `frontend/src/index.css`)
- **Feature**: Added hover tooltips to chart mode buttons
- **Implementation**: Used CSS pseudo-elements (::before, ::after) for tooltip box and arrow
- **Content**:
  - Standard: "標準圖表：顯示原始數據值與控制界限，用於監測製程中心和變異"
  - Z-Chart: "Z-Chart（標準化圖表）：將數據標準化為Z分數，便於比較不同量綱的製程數據"

#### 3. CSS Enhancements
- Added smooth transitions for button hover states
- Improved button spacing with gap property
- Maintained WCAG AA contrast standards

#### Files Modified
- `frontend/src/App.jsx`: Button styling updates
- `frontend/src/index.css`: Tooltip CSS implementation

---

## [v6.0] - 2026-02-03
### Project Reorganization (MECE Architecture)

#### Task Overview
Refactored project structure to align with MECE principles (Mutually Exclusive, Collectively Exhaustive).

#### 1. Structural Changes
- **New `docs/` Hub**: Created centralized documentation directory
  - `docs/specs/`: Technical specifications and architecture
  - `docs/manual/`: User-facing manuals
  - `docs/reference/`: Legacy VBA modules and external references
- **Root Cleanup**: Removed non-essential documentation from root directory

#### 2. Documentation Updates
- Updated `README.md` with new pathing and modernized structure
- Revised `PROJECT_STRUCTURE.md` for v6.0 architecture
- Synchronized `CHANGELOG.md` with version bump

#### 3. MECE Validation
- **Mutually Exclusive**: No documentation files in root alongside code config
- **Collectively Exhaustive**: All information preserved and categorized

---

## [v5.5] - 2026-02-02
### Excel Layout & Metadata Management

#### Task Overview
Redesigned Excel import/export logic to match industry standard layout.

#### 1. Excel Layout Changes
- **Column Reorganization**:
  - Column A/B/C: Target/USL/LSL (previously B/C/D)
  - Column D: Production Batch Number (previously A)
  - Column E+: Measurement Data (Cavities)

#### 2. Metadata Management
- Added support for reading/writing `ProductName` and `MeasurementUnit`
- Fixed positions: Rows 5 & 6 of Excel sheet
- Improved export template for professional quality reports

#### 3. Data Integrity
- Minimum row enforcement (at least 6 rows)
- Maintained layout integrity for small datasets
- Updated all analysis modules (Batch, Cavity, Group)

---

## [v5.4] - 2026-02-03
### Advanced SPC Algorithms (ANOVA & Z-Chart)

#### Task Overview
Implemented high-end SPC analysis features for multi-cavity analysis.

#### 1. ANOVA Implementation
- Replaced 25% ratio heuristic with formal One-Way ANOVA
- Implemented F-distribution P-value calculation
- Added helper functions: `logGamma`, `betai`, `fDistributionPValue`

#### 2. Z-Chart Mode
- Implemented Z-Score transformation: $Z_{ij} = (X_{ij} - \mu_j) / \sigma_j$
- Added toggle in Step 2 for Standard X-bar vs Z-Chart modes
- Set limits to $\pm 3 / \sqrt{n}$ for standardized monitoring

#### 3. UI Enhancements
- Step 3 displays ANOVA-based "Confidence Check"
- Green Check: P-value >= 0.05 (no significant difference)
- Red Alert: P-value < 0.05 (significant difference detected)

---

## [v5.3] - 2026-02-03
### Contributor Traceability & Uniformity Warnings

#### Task Overview
Enhanced analysis with cavity-level traceability and geometric uniformity validation.

#### 1. Contributor Traceability
- Updated `analyzeBatch` to identify cavity responsible for Min/Max values
- Added `contributors` array to analysis results
- Enhanced Step 2 chart tooltips with cavity information

#### 2. Geometric Uniformity Warning
- Implemented pre-check in Step 3 (Uniformity Analysis)
- Calculates spread of medians across cavities
- Triggers alert if spread exceeds 25% of tolerance
- Message: "Critical Uniformity Alert: Cavity deviation is X% of tolerance"

---

## [v5.0] - 2026-01-05
### Standalone Local Architecture

#### Task Overview
Removed server-side functionality and unified to client-side processing.

#### 1. Removed Components
- Python backend (FastAPI) completely removed
- Server-side analysis logic eliminated
- Dual-mode switching removed

#### 2. Unified Architecture
- Application operates exclusively in Standalone Local Mode
- All calculations performed in browser
- Refined UI for single-mode experience

#### 3. Documentation Updates
- Simplified User Manual
- Updated README for streamlined architecture

---

## [v4.5] - 2026-01-03
### Web Worker Engine & Performance Optimization

#### Task Overview
Introduced background processing and optimized memory management.

#### 1. Web Worker Engine
- Background execution for all SPC calculations
- Main UI remains responsive during processing
- Robust client-side analysis for static hosts

#### 2. Memory Management
- Rewrote Excel parsing for direct cell-by-cell reading
- Bypassed memory-heavy JSON conversion
- Enabled analysis of significantly larger files

#### 3. Dynamic Precision System
- Statistics automatically match source Excel formatting
- Smart lot labeling with automatic suffix cleaning
- Asynchronous engine for better thread synchronization

#### 4. Bug Fixes
- Resolved "Page Unresponsive" errors
- Fixed floating-point rounding errors
- Resolved Vite bundling issues with Web Workers

---

## Technical Notes

### Development Principles
- MECE framework for project organization
- Conventional Commits for version control
- WCAG AA compliance for accessibility
- Client-side processing for privacy

### Performance Targets
- Handles Excel files up to 50MB
- Responsive UI during large dataset analysis
- 60 FPS animation performance

### Quality Standards
- ISO 7870-2 compliance for control charts
- Nelson Rules 1-6 for stability monitoring
- Comprehensive error handling and validation

---

**Last Updated**: 2026-02-04  
**Maintained By**: Kiro AI Assistant  
**Total Versions**: 7 major releases


---

## [v6.2] - 2026-02-04
### Advanced Control Chart Implementation: X-bar/S Chart

#### Task Overview
Implemented X-bar/S (X-bar/Sigma) control chart for enhanced multi-cavity analysis capabilities.

#### 1. X-bar/S Chart Calculation (`frontend/src/utils/spc_logic.js`)
- **Logic**: Monitors batch averages (X-bar) and standard deviations (S) simultaneously
- **Constants**: A3, B3, B4 constants for n=2 to 10 (multi-cavity support)
- **Calculation**:
  - X-bar = Average of each batch
  - S = Standard deviation of each batch
  - UCL_X = X-bar_overall + A3 × S-bar
  - LCL_X = X-bar_overall - A3 × S-bar
  - UCL_S = B4 × S-bar
  - LCL_S = B3 × S-bar

#### 2. UI Enhancement (`frontend/src/App.jsx`)
- **New Chart Mode**: Added "X-bar/S 圖" button to chart mode selector
- **Chart Rendering**: Implemented X-bar/S chart visualization with Plotly
- **Chart Title**: Updated to display "X-bar/S 圖 (批次平均與標準差) [ISO 7870-2]"
- **Tooltip**: Added descriptive tooltip for X-bar/S chart mode

#### 3. Data Integration
- **Return Structure**: Added `xbar_s_chart` object to analysis results
- **Compatibility**: Maintains backward compatibility with existing chart modes
- **Conditional Rendering**: X-bar/S chart only displays for batch analysis with multi-cavity data

#### 4. Features
- ✅ Monitors process center (X-bar) and variation (S) simultaneously
- ✅ Supports multi-cavity molds (n=2 to 10)
- ✅ ISO 7870-2 compliant
- ✅ Interactive chart with hover tooltips
- ✅ Seamless integration with existing analysis workflow

#### Files Modified
- `frontend/src/utils/spc_logic.js`: Added `calculateXbarSChart()` method
- `frontend/src/App.jsx`: Added X-bar/S chart UI and rendering logic
- `CONTROL_CHART_EVALUATION.md`: Created comprehensive evaluation report

#### Testing
- ✅ Build successful (no errors)
- ✅ Code diagnostics passed
- ✅ Chart rendering verified
- ✅ Data integration confirmed

#### Next Steps
- Implement P Chart (Proportion Defective) for quality monitoring
- Implement C Chart (Count of Defects) for defect analysis
- Implement EWMA Chart for trend detection

