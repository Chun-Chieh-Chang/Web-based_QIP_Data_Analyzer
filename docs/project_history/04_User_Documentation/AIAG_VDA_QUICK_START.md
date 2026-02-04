# AIAG-VDA Chart Selection Wizard - Quick Start Guide

**Version**: 1.0  
**Date**: February 4, 2026

---

## What is the AIAG-VDA Chart Selection Wizard?

The AIAG-VDA Chart Selection Wizard is an interactive tool that helps you select the most appropriate Statistical Process Control (SPC) chart based on your specific manufacturing process characteristics. It follows the industry-standard AIAG-VDA SPC Manual guidelines.

---

## When to Use It

Use this wizard **before running analysis** when you:
- Are unsure which control chart to use
- Want to follow AIAG-VDA best practices
- Need to document your chart selection rationale
- Want to explore different chart options

---

## How to Access It

### Step 1: Load Your Data
1. Click **"Select Data Files"** button in the sidebar
2. Choose your Excel data files (.xlsx)
3. Select a **Part Number** from the dropdown
4. Select an **Inspection Item** from the dropdown

### Step 2: Open the Wizard
Once you've selected a part and item, two buttons appear:
- 🧭 **開啟智能決策嚮導** (Decision Tree - for chart type recommendation)
- 📈 **AIAG-VDA 管制圖選擇** (Chart Selection - for detailed AIAG-VDA guidance)

Click the **green button** (📈 AIAG-VDA 管制圖選擇) to open the wizard.

---

## The 5-Step Decision Process

### Step 1: Data Type Selection
**Question**: Is your data continuous measurement (計量) or discrete count (計數)?

**Options**:
- **Variable/Continuous Data** (計量型數據)
  - Examples: Length, pressure, temperature, weight, resistance
  - Advantages: More information, better for zero-defect strategy
  - **Recommended** for most applications

- **Attribute/Discrete Data** (計數型數據)
  - Examples: Number of defects, defect rate, pass/fail
  - Advantages: Easy to collect, quick inspection
  - Use when measurement is not practical

**💡 Tip**: Variable data provides more process information and is preferred for zero-defect manufacturing strategies.

---

### Step 2: Sample Size Analysis
**Question**: What is your typical sample size?

#### For Variable Data:
- **n = 1** (Single measurement)
  - Use when: Destructive testing, high inspection cost, very stable process
  - Chart: **I-MR Chart** (Individual-Moving Range)
  - Example: Chemical liquid testing, expensive component testing

- **1 < n < 10** (Small samples)
  - Use when: Manual calculation, traditional sampling, small batches
  - Chart: **X-bar & R Chart** (Average & Range)
  - Example: Traditional manufacturing, manual inspection

- **n ≥ 10** (Larger samples)
  - Use when: Computer-aided calculation, automation, modern systems
  - Chart: **X-bar & s Chart** (Average & Standard Deviation)
  - Example: Automated production, high-volume manufacturing
  - **Recommended** for modern systems

#### For Attribute Data:
- **Fixed Sample Size**: Same number of items inspected each time
  - Chart: **np-chart** (for defectives) or **c-chart** (for defects)

- **Variable Sample Size**: Different number of items each time
  - Chart: **p-chart** (for defectives) or **u-chart** (for defects)

---

### Step 3: Distribution Characteristics
**Question**: Is your data normally distributed?

**Options**:
- **Normal Distribution** (常態分佈)
  - Data follows bell curve pattern
  - Use standard Shewhart control charts
  - Most common in manufacturing

- **Non-Normal Distribution** (非常態分佈)
  - Data is skewed or follows other pattern
  - Examples: Geometric tolerances near zero, highly skewed data
  - Use Pearson chart or data transformation (Box-Cox, Johnson)

**💡 Tip**: You can test normality using:
- Shapiro-Wilk test
- Anderson-Darling test
- Histogram visual inspection
- Q-Q plot

---

### Step 4: Process Behavior & Trends
**Question**: Does your process have known trends or unstable behavior?

**Options** (ISO 22514-2 Process Models):

- **Model A1**: Stable, Normal Distribution
  - Characteristics: Stable process, normal data, no trends
  - Chart: **Shewhart Chart** (standard)
  - Action: Continue monitoring

- **Model A2**: Stable, Non-Normal Distribution
  - Characteristics: Stable process, skewed/non-normal data
  - Chart: **Pearson Chart**
  - Action: Use data transformation if needed

- **Model B**: Variation Unstable
  - Characteristics: Center stable, but variation changes over time
  - Chart: **Shewhart Chart** (with larger sample or lower frequency)
  - Action: Investigate variation sources

- **Model C**: Location Unstable (e.g., Tool Wear)
  - Characteristics: Known trend like tool wear, gradual drift
  - Chart: **Extended Shewhart** or **Acceptance Control Chart**
  - Action: Plan for periodic adjustments

- **Model D**: Both Location & Variation Unstable
  - Characteristics: Complex behavior, multiple variation sources
  - Chart: **Extended Shewhart** or **Acceptance Control Chart**
  - Action: Deep process analysis needed

**💡 Tip**: Tool wear is a common example of Model C. If you know your process drifts over time, select Model C or D.

---

### Step 5: Sensitivity Requirements
**Question**: Do you need to detect very small process shifts?

**Options**:

- **Standard Sensitivity** (Shewhart Chart)
  - Detects: Large shifts (typically 2-3 sigma)
  - Advantages: Easy to understand, traditional, widely used
  - Use when: General process monitoring, cost-sensitive
  - **Recommended** for most applications

- **High Sensitivity** (CUSUM - Cumulative Sum)
  - Detects: Very small shifts quickly
  - Advantages: Extremely sensitive to small changes
  - Use when: Precision manufacturing, zero-defect strategy, high-value products
  - Example: Aerospace, medical devices, semiconductors

- **Medium-High Sensitivity** (EWMA - Exponentially Weighted Moving Average)
  - Detects: Gradual changes and small shifts
  - Advantages: Balanced sensitivity, good for continuous processes
  - Use when: Continuous manufacturing, gradual drift monitoring
  - Example: Chemical processes, continuous production lines

---

## Understanding the Recommendation

After completing all 5 steps, the wizard generates a recommendation showing:

### Primary Chart
The main recommended control chart based on your selections.

### Secondary/Alternative Charts
Other charts that might work for your situation.

### Reasoning
Explanation of why this chart was recommended based on each step.

### Warnings
Special considerations or cautions (e.g., "Non-normal distribution detected").

### Recommendations
Actionable next steps (e.g., "Consider using Pearson chart or data transformation").

---

## Common Scenarios

### Scenario 1: Traditional Manufacturing
- Data Type: **Variable** (measurements)
- Sample Size: **1 < n < 10** (small batches)
- Distribution: **Normal**
- Process: **Stable (A1)**
- Sensitivity: **Standard**
- **Recommendation**: X-bar & R Chart

### Scenario 2: Automated Production
- Data Type: **Variable** (measurements)
- Sample Size: **n ≥ 10** (large samples)
- Distribution: **Normal**
- Process: **Stable (A1)**
- Sensitivity: **Standard**
- **Recommendation**: X-bar & s Chart

### Scenario 3: Tool Wear Monitoring
- Data Type: **Variable** (measurements)
- Sample Size: **1 < n < 10**
- Distribution: **Normal**
- Process: **Location Unstable (C)** ← Tool wear
- Sensitivity: **Standard**
- **Recommendation**: Extended Shewhart or Acceptance Control Chart

### Scenario 4: Precision Manufacturing
- Data Type: **Variable** (measurements)
- Sample Size: **n ≥ 10**
- Distribution: **Normal**
- Process: **Stable (A1)**
- Sensitivity: **High** ← Need to detect small shifts
- **Recommendation**: Shewhart Chart + CUSUM for small shift detection

### Scenario 5: Defect Rate Monitoring
- Data Type: **Attribute** (count data)
- Sample Size: **Variable** (different batch sizes)
- Process: **Stable**
- **Recommendation**: p-chart (Proportion of Defectives)

---

## Tips & Best Practices

### Before Using the Wizard
1. ✅ Collect sufficient data (at least 20-30 samples)
2. ✅ Ensure data quality and accuracy
3. ✅ Understand your process characteristics
4. ✅ Know your sample size and measurement method

### During the Wizard
1. ✅ Answer each question honestly based on your process
2. ✅ If unsure about distribution, select "Normal" initially
3. ✅ Consider your process knowledge and experience
4. ✅ Don't skip steps - each affects the recommendation

### After Getting Recommendation
1. ✅ Review the reasoning provided
2. ✅ Verify the recommendation makes sense for your process
3. ✅ Proceed with analysis using the recommended chart
4. ✅ Monitor results and adjust if needed

### Common Mistakes to Avoid
1. ❌ Selecting wrong data type (check if measurement or count)
2. ❌ Underestimating sample size (affects chart choice)
3. ❌ Ignoring known trends (affects process model selection)
4. ❌ Skipping the wizard and guessing chart type

---

## Integration with Analysis

After getting a recommendation:

1. **Review the Recommendation**
   - Read the reasoning and warnings
   - Verify it matches your process understanding

2. **Proceed with Analysis**
   - Click "Generate Analysis" button
   - The system will use your selected analysis type
   - Results will be displayed with the recommended chart

3. **Interpret Results**
   - Use the guidance panels for each step
   - Follow the interpretation guide for your chart type
   - Take corrective actions if needed

---

## FAQ

**Q: Can I skip the wizard?**
A: Yes, you can click "Skip" at any time. However, the wizard helps ensure you select the right chart.

**Q: What if I'm not sure about the distribution?**
A: Start with "Normal" - it's the most common. You can always run the analysis and check the normality test results.

**Q: Can I change my selection after getting a recommendation?**
A: Yes, click the "Previous" button to go back and modify your selections.

**Q: What's the difference between this and the Decision Tree wizard?**
A: 
- **Decision Tree**: Recommends chart type based on data characteristics
- **AIAG-VDA Chart Selection**: Provides detailed AIAG-VDA guidance for chart selection

**Q: Do I need to use this wizard?**
A: No, it's optional. But it's highly recommended for ensuring you select the appropriate chart.

**Q: Where can I learn more about AIAG-VDA?**
A: Refer to the AIAG-VDA SPC Manual or the comprehensive documentation in the app.

---

## Next Steps

1. **Try the Wizard**: Open it with sample data to explore
2. **Review Recommendations**: Understand why each chart is recommended
3. **Run Analysis**: Use the recommended chart for your data
4. **Monitor Results**: Track process performance over time
5. **Iterate**: Refine your process based on insights

---

## Support & Documentation

For more information:
- 📖 **AIAG_VDA_CHART_SELECTION_REPORT.md** - Detailed technical documentation
- 📊 **ANALYSIS_STAGE_GUIDANCE_REPORT.md** - Analysis stage guidance
- 🧭 **DECISION_TREE_QUICK_START.md** - Decision tree wizard guide
- 📚 **SPC_Tool_User_Manual.md** - Complete user manual

---

**Happy analyzing! 📊**
