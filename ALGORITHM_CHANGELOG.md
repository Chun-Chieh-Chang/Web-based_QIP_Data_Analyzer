# Algorithm Changelog

> **Version History of Statistical Algorithm Enhancements**

---

## [v2.0] - 2026-02-03
### Advanced SPC Algorithms (ANOVA & Z-Chart)

#### Task Overview
Implemented advanced statistical methods for multi-cavity analysis: ANOVA for uniformity testing and Standardized Z-Charts for process monitoring.

#### 1. ANOVA Implementation (`spc_logic.js`)
- **Logic**: Replaced the geometric uniformity heuristic (25% ratio) with a formal **One-Way ANOVA**.
- **Calculation**: Computes F-statistic and P-value to test the null hypothesis that all cavity means are equal.
- **Implementation**: Added `logGamma`, `betai` (Incomplete Beta), and `fDistributionPValue` functions to calculate P-values locally without external heavy libraries.

#### 2. Z-Chart Mode (`spc_logic.js`, `App.jsx`)
- **Logic**: Implemented Z-Score transformation: $Z_{ij} = (X_{ij} - \mu_j) / \sigma_j$
  - Normalizes each cavity's data to have Mean=0 and Sigma=1 based on its own history
- **UI**: Added toggle in Step 2 to switch between "Standard X-bar" and "Standardized Z-Chart"
- **Visuals**: 
  - Z-Chart plots the Batch Average of Z-scores
  - Limits set to $\pm 3 / \sqrt{n}$ (where n is number of cavities)
  - Zones adapt to the new limits

#### 3. UI Enhancements (`App.jsx`)
- **Step 3**: Displays "Confidence Check" based on ANOVA
  - Green Check: P-value >= 0.05 (No significant difference)
  - Red Alert: P-value < 0.05 (Significant difference detected)
- **Chart**: Updated titles and tooltips to reflect current mode

#### Future Enhancements
- R-Chart Adaptation: Consider adding "Z-Range" or "Z-Sigma" chart for standard deviation monitoring
- Long Term: AI Pattern Recognition refinements

---

## [v1.0] - 2026-02-03
### Contributor Traceability & Geometric Uniformity

#### 1. Contributor Traceability (`spc_logic.js`)
- **Logic**: Updated `analyzeBatch` to identify the specific cavity index/name responsible for Minimum and Maximum values within each subgroup (Batch)
- **Data Structure**: Added `contributors` array to analysis result with objects `{ min, max, minCavity, maxCavity }`
- **UI**: Updated Step 2 Xbar-R chart tooltip to display contributors
  - Users can hover over out-of-control points to see which cavity caused the deviation

#### 2. Geometric Uniformity Warning (`App.jsx`)
- **Logic**: Implemented pre-check in Step 3 (Uniformity Analysis)
- **Calculation**: Computes spread of medians across all cavities: `Max(Median) - Min(Median)`
- **Threshold**: If spread exceeds **25% of Tolerance** (`USL - LSL`), triggers critical alert
- **Message**: "Critical Uniformity Alert: Cavity deviation is X% of tolerance. Do not pool data for Cpk calculation."

#### Verification
- **Traceability**: Validated that `contributors` are correctly extracted and mapped to cavity names
- **Warning**: Validated that warning renders correctly when uniformity data exceeds threshold

---

## Technical Notes

### Statistical Foundations
- **ANOVA**: One-way analysis of variance for testing equality of means across multiple groups
- **Z-Score**: Standardization technique for comparing data on different scales
- **Control Limits**: Based on ISO 7870-2 standard for statistical process control

### Performance Considerations
- All calculations performed client-side using Web Workers
- No external statistical libraries required
- Optimized for datasets up to 50MB

### Compatibility
- Works with multi-cavity mold data
- Supports batch and cavity analysis modes
- Compatible with Excel import/export functionality

---

**Last Updated**: 2026-02-03  
**Maintained By**: Kiro AI Assistant
