# Project Structure (MECE Framework)

This document outlines the organizational structure of the Web-based SPC Analyzer following **MECE principles** (Mutually Exclusive, Collectively Exhaustive).

## 1. Application Layer (Frontend Only)

### 1.1 Core Application
```
frontend/
├── src/
│   ├── main.jsx              # Application Bootstrap
│   ├── App.jsx               # Main UI Controller
│   └── index.css             # Global Styling
```

**Purpose**: User Interface and Interaction Management

### 1.2 Statistical Engine
```
frontend/src/utils/
├── spc_logic.js              # Pure Statistical Calculations
├── spc.worker.js             # Async Processing Coordinator
└── diagnostic_logic.js       # Expert Interpretation System
```

**Purpose**: Data Processing and Analysis Logic

### 1.3 Static Assets
```
frontend/
├── public/                   # Static files (images, icons)
├── index.html                # HTML Entry Point
└── vite.config.js            # Build Configuration
```

**Purpose**: Build and Deployment Infrastructure

---

## 2. Documentation Layer

### 2.1 Core READMEs
```
/
├── README.md                 # Project Overview & Quick Start
├── CHANGELOG.md              # Version History
└── DEVELOPMENT_LOG.md        # Technical dev diary
```

**Purpose**: Project entry points and history

### 2.2 Specifications & Manuals
```
docs/
├── specs/
│   ├── PROJECT_STRUCTURE.md  # This file
│   ├── SPC_Calculation_Logic.md
│   └── NELSON_RULES_VERIFICATION.md
└── manual/
    └── SPC_Tool_User_Manual.md
```

**Purpose**: Technical specs and user guidance

### 2.3 Reference Archive
```
docs/reference/
├── Nelson Rules/             # Excel VBA reference
└── NormalDistributionPlot/   # Excel VBA reference
```

**Purpose**: Legacy reference material

---

## 3. Configuration & Automation Layer

### 3.1 Project Configuration
```
/
├── package.json              # Root project metadata
├── .gitignore                # Version control exclusions
├── .gitattributes            # Git attributes
└── LICENSE                   # MIT License
```

### 3.2 CI/CD
```
.github/
└── workflows/
    └── deploy.yml            # GitHub Actions Deployment
```

### 3.3 CLI / Scripts
```
/
├── StartApplication.bat      # Launch Development Server
└── InstallDependencies.bat   # Install Node.js Dependencies
```

---

## MECE Validation

### Mutually Exclusive (No Overlap)
- ✅ Each file has a single, clear responsibility
- ✅ Documentation separated from code
- ✅ Specifications separated from user manuals
- ✅ Local automation scripts separated from CI/CD workflows

### Collectively Exhaustive (Complete Coverage)
- ✅ All UI functionality in `App.jsx`
- ✅ All statistical logic in `utils/spc_logic.js`
- ✅ All deployment logic in `.github/workflows/deploy.yml`
- ✅ All documentation categorized by purpose (Spec, Manual, Reference)

---

*Last Updated: 2026-02-03 | Version 5.1*
