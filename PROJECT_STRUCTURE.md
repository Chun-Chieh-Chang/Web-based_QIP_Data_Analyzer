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

### 2.1 User-Facing Documentation
```
/
├── README.md                 # Project Overview & Quick Start
└── SPC_Tool_User_Manual.md   # Detailed Usage Guide
```

**Purpose**: End-user guidance and onboarding

### 2.2 Development Documentation
```
/
├── CHANGELOG.md              # Version History
├── frontend/README.md        # Technical Architecture Details
└── PROJECT_STRUCTURE.md      # This file
```

**Purpose**: Developer reference and maintenance

---

## 3. Auxiliary Tools Layer

### 3.1 Legacy Utilities
```
/
├── Nelson Rules/             # Standalone Excel VBA Module
└── NormalDistributionPlot/   # Standalone Excel VBA Module
```

**Purpose**: Offline analysis for users without web access

---

## 4. Configuration Layer

### 4.1 Project Configuration
```
/
├── package.json              # Root project metadata
├── .gitignore                # Version control exclusions
└── LICENSE                   # MIT License
```

### 4.2 Frontend Configuration
```
frontend/
├── package.json              # Dependencies & Scripts
├── eslint.config.js          # Code Quality Rules
└── vite.config.js            # Build Tool Settings
```

**Purpose**: Development environment setup and tooling

---

## 5. Automation Layer

### 5.1 Startup Scripts
```
/
├── StartApplication.bat      # Launch Development Server
└── InstallDependencies.bat   # Install Node.js Dependencies
```

**Purpose**: One-click setup and execution

---

## MECE Validation

### Mutually Exclusive (No Overlap)
- ✅ Each file has a single, clear responsibility
- ✅ No duplicate logic across modules
- ✅ Statistical calculations isolated from UI rendering

### Collectively Exhaustive (Complete Coverage)
- ✅ All UI functionality in `App.jsx`
- ✅ All statistical logic in `utils/spc_logic.js`
- ✅ All async processing in `spc.worker.js`
- ✅ All documentation categorized by audience

---

*Last Updated: 2026-01-05 | Version 5.0*
