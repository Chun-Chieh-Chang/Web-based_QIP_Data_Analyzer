# Project Change Log

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
