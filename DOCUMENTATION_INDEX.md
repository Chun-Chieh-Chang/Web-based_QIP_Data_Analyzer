# QIP SPC Data Analyzer - Documentation Index

**Last Updated**: February 4, 2026  
**Project**: Web-based QIP Data Analyzer  
**Repository**: https://github.com/Chun-Chieh-Chang/Web-based_QIP_Data_Analyzer

---

## Quick Navigation

### 🚀 Getting Started
- **[SPC_Tool_User_Manual.md](docs/manual/SPC_Tool_User_Manual.md)** - Complete user manual with step-by-step instructions
- **[AIAG_VDA_QUICK_START.md](AIAG_VDA_QUICK_START.md)** - Quick start guide for AIAG-VDA chart selection
- **[DECISION_TREE_QUICK_START.md](DECISION_TREE_QUICK_START.md)** - Quick start guide for decision tree wizard

### 📊 Feature Documentation
- **[AIAG_VDA_CHART_SELECTION_REPORT.md](AIAG_VDA_CHART_SELECTION_REPORT.md)** - AIAG-VDA chart selection implementation
- **[ANALYSIS_STAGE_GUIDANCE_REPORT.md](ANALYSIS_STAGE_GUIDANCE_REPORT.md)** - Analysis stage guidance system
- **[DECISION_TREE_PHASE_4_REPORT.md](DECISION_TREE_PHASE_4_REPORT.md)** - Decision tree implementation
- **[PHASE_3_IMPLEMENTATION_REPORT.md](PHASE_3_IMPLEMENTATION_REPORT.md)** - P Chart implementation
- **[IMPLEMENTATION_REPORT_XBAR_S.md](IMPLEMENTATION_REPORT_XBAR_S.md)** - X-bar/S chart implementation

### 📋 Project Documentation
- **[PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)** - Current project status and overview
- **[PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md)** - Overall project completion summary
- **[TASK_15_COMPLETION_SUMMARY.md](TASK_15_COMPLETION_SUMMARY.md)** - TASK 15 completion details

### 📚 Technical Reference
- **[docs/specs/SPC_Calculation_Logic.md](docs/specs/SPC_Calculation_Logic.md)** - SPC calculation specifications
- **[docs/specs/NELSON_RULES_VERIFICATION.md](docs/specs/NELSON_RULES_VERIFICATION.md)** - Nelson rules verification
- **[docs/specs/PROJECT_STRUCTURE.md](docs/specs/PROJECT_STRUCTURE.md)** - Project structure overview
- **[docs/reference/Nelson Rules/](docs/reference/Nelson%20Rules/)** - Nelson rules reference materials

### 📖 Changelogs
- **[CHANGELOG.md](CHANGELOG.md)** - Main project changelog
- **[DEVELOPMENT_CHANGELOG.md](DEVELOPMENT_CHANGELOG.md)** - Development progress log
- **[ALGORITHM_CHANGELOG.md](ALGORITHM_CHANGELOG.md)** - Algorithm changes log

---

## Documentation by Topic

### User Guides
| Document | Purpose | Audience |
|----------|---------|----------|
| [SPC_Tool_User_Manual.md](docs/manual/SPC_Tool_User_Manual.md) | Complete user guide | End users |
| [AIAG_VDA_QUICK_START.md](AIAG_VDA_QUICK_START.md) | Chart selection guide | End users |
| [DECISION_TREE_QUICK_START.md](DECISION_TREE_QUICK_START.md) | Decision tree guide | End users |

### Technical Documentation
| Document | Purpose | Audience |
|----------|---------|----------|
| [AIAG_VDA_CHART_SELECTION_REPORT.md](AIAG_VDA_CHART_SELECTION_REPORT.md) | Implementation details | Developers |
| [ANALYSIS_STAGE_GUIDANCE_REPORT.md](ANALYSIS_STAGE_GUIDANCE_REPORT.md) | Stage guidance logic | Developers |
| [DECISION_TREE_PHASE_4_REPORT.md](DECISION_TREE_PHASE_4_REPORT.md) | Decision tree logic | Developers |
| [docs/specs/SPC_Calculation_Logic.md](docs/specs/SPC_Calculation_Logic.md) | SPC calculations | Developers |

### Project Management
| Document | Purpose | Audience |
|----------|---------|----------|
| [PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md) | Current status | Project managers |
| [PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md) | Completion summary | Project managers |
| [TASK_15_COMPLETION_SUMMARY.md](TASK_15_COMPLETION_SUMMARY.md) | Task details | Project managers |

### Reference Materials
| Document | Purpose | Audience |
|----------|---------|----------|
| [docs/reference/Nelson Rules/](docs/reference/Nelson%20Rules/) | Nelson rules reference | Quality engineers |
| [docs/specs/NELSON_RULES_VERIFICATION.md](docs/specs/NELSON_RULES_VERIFICATION.md) | Rules verification | Quality engineers |

---

## Feature Overview

### Core Features
1. **SPC Analysis**
   - I-MR Chart (Individual-Moving Range)
   - X-bar & R Chart (Average & Range)
   - X-bar & S Chart (Average & Standard Deviation)
   - P Chart (Proportion Defective)
   - Z-Chart (Short runs)

2. **Data Analysis**
   - Outlier detection
   - Stability analysis
   - Uniformity analysis
   - Capability assessment

3. **User Guidance**
   - Step-by-step guidance
   - Analysis stage selection
   - False alarm calculator
   - Interpretation guides

4. **Intelligent Decision Support**
   - Decision Tree wizard
   - AIAG-VDA Chart Selection wizard
   - Recommendation engine

5. **Data Management**
   - Excel import/export
   - Batch selection
   - Cavity analysis

6. **AI Integration**
   - Google Gemini API
   - Expert diagnostics
   - Intelligent recommendations

---

## Documentation Structure

### Root Level Documents
```
├── DOCUMENTATION_INDEX.md (this file)
├── PROJECT_STATUS_REPORT.md
├── PROJECT_COMPLETION_REPORT.md
├── TASK_15_COMPLETION_SUMMARY.md
├── AIAG_VDA_QUICK_START.md
├── DECISION_TREE_QUICK_START.md
├── AIAG_VDA_CHART_SELECTION_REPORT.md
├── ANALYSIS_STAGE_GUIDANCE_REPORT.md
├── DECISION_TREE_PHASE_4_REPORT.md
├── PHASE_3_IMPLEMENTATION_REPORT.md
├── IMPLEMENTATION_REPORT_XBAR_S.md
├── CHANGELOG.md
├── DEVELOPMENT_CHANGELOG.md
└── ALGORITHM_CHANGELOG.md
```

### Docs Directory
```
docs/
├── manual/
│   └── SPC_Tool_User_Manual.md
├── specs/
│   ├── SPC_Calculation_Logic.md
│   ├── NELSON_RULES_VERIFICATION.md
│   └── PROJECT_STRUCTURE.md
└── reference/
    ├── Nelson Rules/
    │   ├── Nelson Rules.txt
    │   └── 帶有規則解讀的 SPC 管制圖.txt
    └── NormalDistributionPlot/
        ├── 標記 Excel 圖表中超出規格的點.txt
        └── 選擇工作表與數據欄位畫出標準正態分布圖(非正規化).txt
```

---

## How to Use This Documentation

### For New Users
1. Start with **[SPC_Tool_User_Manual.md](docs/manual/SPC_Tool_User_Manual.md)**
2. Choose your wizard:
   - For chart type recommendation: **[DECISION_TREE_QUICK_START.md](DECISION_TREE_QUICK_START.md)**
   - For detailed AIAG-VDA guidance: **[AIAG_VDA_QUICK_START.md](AIAG_VDA_QUICK_START.md)**
3. Follow the step-by-step guidance in the application

### For Developers
1. Read **[PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)** for overview
2. Check **[docs/specs/PROJECT_STRUCTURE.md](docs/specs/PROJECT_STRUCTURE.md)** for architecture
3. Review specific feature documentation:
   - **[AIAG_VDA_CHART_SELECTION_REPORT.md](AIAG_VDA_CHART_SELECTION_REPORT.md)** for chart selection
   - **[DECISION_TREE_PHASE_4_REPORT.md](DECISION_TREE_PHASE_4_REPORT.md)** for decision tree
   - **[docs/specs/SPC_Calculation_Logic.md](docs/specs/SPC_Calculation_Logic.md)** for calculations

### For Quality Engineers
1. Review **[docs/reference/Nelson Rules/](docs/reference/Nelson%20Rules/)** for rules reference
2. Check **[docs/specs/NELSON_RULES_VERIFICATION.md](docs/specs/NELSON_RULES_VERIFICATION.md)** for verification
3. Use **[AIAG_VDA_QUICK_START.md](AIAG_VDA_QUICK_START.md)** for chart selection guidance

### For Project Managers
1. Check **[PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)** for current status
2. Review **[PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md)** for completion details
3. See **[TASK_15_COMPLETION_SUMMARY.md](TASK_15_COMPLETION_SUMMARY.md)** for latest task

---

## Key Concepts

### AIAG-VDA 5-Step Decision Logic
1. **Data Type**: Variable (計量) vs Attribute (計數)
2. **Sample Size**: n=1, 1<n<10, n≥10 for variable; fixed/variable for attribute
3. **Distribution**: Normal vs Non-normal
4. **Process Behavior**: ISO 22514-2 models (A1, A2, B, C, D)
5. **Sensitivity**: Standard, CUSUM, or EWMA

### Analysis Stages
1. **Machine Performance Research** (< 100 samples)
   - Qualitative stability assessment
   - Observe outliers, jumps, step changes, trends

2. **Analysis Control Charts** (100-500 samples)
   - Retrospective evaluation
   - Consider false alarm rate
   - Only judge unstable if violations > expected false alarms

3. **SPC Control Charts** (> 500 samples)
   - Real-time control
   - Zero tolerance policy
   - Any violation requires immediate action

### Control Chart Types
- **I-MR**: Individual-Moving Range (n=1)
- **X-bar & R**: Average & Range (1<n<10)
- **X-bar & S**: Average & Standard Deviation (n≥10)
- **P Chart**: Proportion Defective (variable sample size)
- **Z-Chart**: Short runs (multiple products)

---

## Frequently Accessed Documents

### Most Important
1. **[PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)** - Current project status
2. **[SPC_Tool_User_Manual.md](docs/manual/SPC_Tool_User_Manual.md)** - User guide
3. **[AIAG_VDA_QUICK_START.md](AIAG_VDA_QUICK_START.md)** - Chart selection guide

### Most Technical
1. **[docs/specs/SPC_Calculation_Logic.md](docs/specs/SPC_Calculation_Logic.md)** - Calculations
2. **[AIAG_VDA_CHART_SELECTION_REPORT.md](AIAG_VDA_CHART_SELECTION_REPORT.md)** - Implementation
3. **[DECISION_TREE_PHASE_4_REPORT.md](DECISION_TREE_PHASE_4_REPORT.md)** - Decision logic

### Most Recent
1. **[TASK_15_COMPLETION_SUMMARY.md](TASK_15_COMPLETION_SUMMARY.md)** - Latest task
2. **[AIAG_VDA_CHART_SELECTION_REPORT.md](AIAG_VDA_CHART_SELECTION_REPORT.md)** - Latest feature
3. **[PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)** - Current status

---

## External Resources

### GitHub
- **Repository**: https://github.com/Chun-Chieh-Chang/Web-based_QIP_Data_Analyzer
- **Live Application**: https://chun-chieh-chang.github.io/Web-based_QIP_Data_Analyzer/
- **Issues**: Report bugs or request features

### Standards & References
- **AIAG-VDA SPC Manual** - Control chart selection guidelines
- **ISO 22514-2** - Process models and capability
- **Nelson Rules** - Stability analysis rules
- **Shewhart Control Charts** - Traditional SPC methods

---

## Document Maintenance

### Last Updated
- **DOCUMENTATION_INDEX.md**: February 4, 2026
- **PROJECT_STATUS_REPORT.md**: February 4, 2026
- **TASK_15_COMPLETION_SUMMARY.md**: February 4, 2026
- **AIAG_VDA_QUICK_START.md**: February 4, 2026

### Version History
- **v1.0.0**: Initial release with TASK 15 completion
- **Previous versions**: See CHANGELOG.md

---

## Quick Links

### Application
- 🌐 **Live App**: https://chun-chieh-chang.github.io/Web-based_QIP_Data_Analyzer/
- 📦 **Repository**: https://github.com/Chun-Chieh-Chang/Web-based_QIP_Data_Analyzer

### Documentation
- 📖 **User Manual**: [SPC_Tool_User_Manual.md](docs/manual/SPC_Tool_User_Manual.md)
- 📊 **Project Status**: [PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md)
- 🧭 **Chart Selection**: [AIAG_VDA_QUICK_START.md](AIAG_VDA_QUICK_START.md)

### Support
- 📧 **Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📚 **Documentation**: This index and linked documents

---

## Navigation Tips

1. **Use Ctrl+F** to search within documents
2. **Click links** to navigate between documents
3. **Check the table of contents** at the top of each document
4. **Refer to this index** when unsure where to find information
5. **Start with PROJECT_STATUS_REPORT.md** for overview

---

**Happy analyzing! 📊**

For questions or feedback, please refer to the GitHub repository or contact the project maintainers.
