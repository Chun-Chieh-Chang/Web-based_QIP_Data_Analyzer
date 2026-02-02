# Project Change Log

## [v5.5] - 2026-02-02
### Changed
- **Excel Layout Update**: Redesigned Excel import and export logic to match the new industry standard layout.
  - Column A/B/C: Target/USL/LSL (previously B/C/D).
  - Column D: Production Batch Number (previously A).
  - Column E+: Measurement Data (Cavities).
- **Metadata Management**: Added support for reading and writing `ProductName` and `MeasurementUnit` in fixed positions (Rows 5 & 6) of the Excel sheet.
- **Improved Export Template**: The exported Excel file now follows a single-sheet representative layout compatible with professional quality reports.
- **Minimum Row Enforcement**: Exporting now ensures at least 6 rows are populated to maintain layout integrity even with small datasets.
- **Compatibility**: Updated all analysis modules (Batch, Cavity, Group) to support the new data structure while maintaining calculation accuracy.


## [v5.0] - 2026-01-05
### Removed
- **Server Mode Functionality**: Completely removed the Python backend (FastAPI) and server-side analysis logic.
- **Backend Dependencies**: Removed all Python-related scripts and environment requirements.
- **Dual-Mode Switching**: Simplified the UI by removing the local/server mode toggle.

### Changed
- **Unified Local Architecture**: The application now operates exclusively in Standalone Local Mode, performing all calculations in the browser.
- **Refined UI**: Cleaned up the sidebar and start scripts for a smoother, single-mode experience.
- **Updated Documentation**: Simplified User Manual and README to reflect the streamlined architecture.

## [v4.5] - 2026-01-03
### Added
- **Web Worker Engine**: Introduced background execution for all SPC calculations. This ensures the main UI remains responsive while processing large datasets.
- **Batch Exclusion Control**: New interactive list in the sidebar allowing users to uncheck specific batches to exclude them from calculations and charts.
- **Offline/Local Mode Optimization**: Robust client-side analysis that activates automatically on static hosts (like GitHub Pages).

### Changed
- **Memory Management Overhaul**: Rewrote the Excel parsing engine to use direct cell-by-cell reading. This bypasses the memory-heavy JSON conversion, enabling analysis of significantly larger files.
- **Dynamic Precision System**: Statistics (Mean, CL, UCL, LCL) now automatically match the decimal places found in the source Excel formatting.
- **Smart Lot Labeling**: Implemented automatic suffix cleaning (e.g., `123456-1` → `123456`) to ensure proper batch grouping.
- **Asynchronous Engine**: Converted core analysis methods to `async` for better thread synchronization.

### Fixed
- **UI Freeze Resolution**: Offloading heavy work to Workers and optimizing memory resolved the "Page Unresponsive" errors during large file analysis.
- **Decimal Precision Bugs**: Eliminated floating-point rounding errors in exported Excel files and chart labels.
- **Worker Import Resolution**: Fixed Vite bundling issues with Web Workers in production builds.

## [v4.0] - 2025-12-31
### Added
- **Xbar-R Chart Support**: Implemented multi-cavity analysis using standard subgroup constants (A₂, D₃, D₄).
- **Cavity Info Display**: Automatic detection and display of available cavities containing "穴".
- **Export to Excel**: Added formatted Excel report generation.

### Changed
- **UI Reorganization**: Improved sidebar flow; Part Number selection now depends on successful Data Folder selection.
- **Chart Logic**: Conditional rendering between Individual-MR and Xbar-R based on user selection.

---
*Maintained by the SPC Development Team*
