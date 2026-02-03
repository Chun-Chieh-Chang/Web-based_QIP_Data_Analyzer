# Development Log - Project Reorganization

## Task: MECE Architecture Cleanup (2026-02-03)
The project structure was refactored to align with MECE principles, ensuring a clear separation between code, documentation, and reference materials.

### 1. Structural Changes
- **New `docs/` Hub**: Created a centralized documentation directory.
  - `docs/specs/`: Technical specifications and architecture docs.
  - `docs/manual/`: User-facing manuals.
  - `docs/reference/`: Legacy VBA modules and external references.
- **Root Cleanup**: Removed non-essential documentation files from the root to improve project discoverability.

### 2. Documentation Updates
- Updated `README.md` with new pathing and a modernized structure table.
- Revised `PROJECT_STRUCTURE.md` to reflect the version 6.0 architecture.
- Synchronized `CHANGELOG.md` with the new version bump.

### 3. MECE Validation Check
- **Mutually Exclusive**: No documentation files reside in the root alongside code-related config; legacy tools are strictly in `reference/`.
- **Collectively Exhaustive**: All previous information is preserved and categorized; developer/user/maintenance paths are clearly defined.

---

# Development Log - Excel Layout Adjustment

## Task Overview
The Excel import and export logic was adjusted to match a new column layout and metadata positioning requirement.

## Requirements
1. **Column Layout**:
   - Column A: Target
   - Column B: USL
   - Column C: LSL
   - Column D: Production Batch Number
   - Column E+: Measurement Data (Cavities)
2. **Data Arrangement**:
   - Data starts from Row 2. Specs only in Row 2.
3. **Product Information**:
   - A5: "ProductName", B5: actual product name.
   - A6: "MeasurementUnit", B6: actual unit.
   - Rows 5 & 6 share row indices with batch data in Column D+.
4. **Minimum Rows**:
   - Ensure at least 6 rows in export even if batches < 5.

## Implementation Details

### 1. logic Revision (`src/utils/spc_logic.js`)
- **`getSpecs`**: Updated to read Target from A2, USL from B2, and LSL from C2. Added metadata extraction for `ProductName` (B5) and `MeasurementUnit` (B6).
- **`getBatches`**: Updated to read batch labels from Column D (index 3) starting from Row 2 (index 1).
- **`analyzeBatch`**: 
  - Updated loop to start from Row 2 (`R=1`).
  - Updated batch label lookup to Column D.
  - Included `rawData` (per-cavity measurements) in the result object to support detailed export.
  - Included `targetColsHead` to preserve original cavity names.
- **`analyzeCavity` / `analyzeGroup`**: Updated row loops to start from Row 2.

### 2. Export Logic Revision (`src/App.jsx`)
- **`handleExportExcel`**:
  - Overhauled to produce a single-sheet representative layout.
  - Implemented the 1:1 mapping of Spec/Metadata and Batch/Data as requested.
  - Added padding logic to ensure at least 6 rows are generated.
  - Maintained accessibility by keeping a "Stats_Summary" sheet for quick metric viewing.

## Verification & Testing
- **Linter**: Passed.
- **Build**: Successful.
- **Browser Testing**: Verified logic against technical specifications.

## Challenges & Solutions
- **Challenge**: The new layout requires specs in Row 2 but metadata in Row 5/6, overlapping with data rows.
- **Solution**: Implemented a row-by-row construction logic in the exporter that conditionally fills A/B/C columns based on the current row index (index 0 for Row 2, index 3 for Row 5, etc.) while independently filling D+ columns with batch data.

## MECE Check
- All input-related logic consolidated in `spc_logic.js`.
- All UI/Export-related logic consolidated in `App.jsx`.
- Metadata handling is consistent across both files.
