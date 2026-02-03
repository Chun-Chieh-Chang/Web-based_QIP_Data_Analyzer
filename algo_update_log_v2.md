
# Development Log - Algorithm Enhancements (Medium Term)

## Task Overview
Implemented advanced statistical methods for multi-cavity analysis: ANOVA for uniformity testing and Standardized Z-Charts for process monitoring.

## Changes

### 1. ANOVA Implementation (`spc_logic.js`)
- **Logic**: Replaced the geometric uniformity heuristic (25% ratio) with a formal **One-Way ANOVA**.
- **Calculation**: computest F-statistic and P-value to test the null hypothesis that all cavity means are equal.
- **Includes**: Implemented `logGamma`, `betai` (Incomplete Beta), and `fDistributionPValue` functions to calculate P-values locally without external heavy libraries.

### 2. Z-Chart Mode (`spc_logic.js`, `App.jsx`)
- **Logic**: Implemented Z-Score transformation $Z_{ij} = (X_{ij} - \mu_j) / \sigma_j$. This normalizes each cavity's data to have Mean=0 and Sigma=1 based on its own history.
- **UI**: Added a toggle in Step 2 to switch between "Standard X-bar" and "Standardized Z-Chart".
- **Visuals**: 
    - Z-Chart plots the Batch Average of Z-scores.
    - Limits are set to $\pm 3 / \sqrt{n}$ (where n is number of cavities).
    - Zones (Shapes) adapt to the new limits.

### 3. UI Enhancements (`App.jsx`)
- **Step 3**: Now displays a "Confidence Check" based on ANOVA.
    - **Green Check**: P-value >= 0.05 (No significant difference).
    - **Red Alert**: P-value < 0.05 (Significant difference detected).
- **Chart**: Updated titles and tooltips to reflect the current mode.

## Next Steps
- **R-Chart Adaptation**: Consider adding a "Z-Range" or "Z-Sigma" chart to accompany the Z-Chart for standard deviation monitoring.
- **Long Term**: AI Pattern Recognition refinements.
