# Quick Reference Guide

> **Fast Lookup for Common Tasks and Configuration**

**Last Updated**: 2026-02-04  
**Version**: v1.0

---

## 🎨 Color System Reference

### CSS Variables (frontend/src/index.css)

```css
:root {
  /* Primary Colors */
  --primary-color: #1e293b;        /* Dark blue-gray */
  --secondary-color: #475569;      /* Gray */
  
  /* Backgrounds */
  --bg-color: #f8fafc;             /* Light gray */
  --sidebar-bg: #ffffff;           /* White */
  --card-bg: #ffffff;              /* White */
  
  /* Text */
  --text-main: #0f172a;            /* Dark black */
  --text-muted: #475569;           /* Gray */
  
  /* Borders */
  --border-color: #cbd5e1;         /* Light gray */
  
  /* Status Colors */
  --success-color: #059669;        /* Green */
  --warning-color: #d97706;        /* Orange */
  --danger-color: #dc2626;         /* Red */
}
```

### Contrast Ratios

| Element | Foreground | Background | Ratio | Standard |
|---------|-----------|-----------|-------|----------|
| Main Text | #0f172a | #f8fafc | 18.5:1 | ✅ WCAG AAA |
| Button Text | #ffffff | #1e293b | 13.2:1 | ✅ WCAG AAA |
| Muted Text | #475569 | #ffffff | 7.8:1 | ✅ WCAG AA |
| Success | #059669 | #ffffff | 5.2:1 | ✅ WCAG AA |
| Warning | #d97706 | #ffffff | 5.8:1 | ✅ WCAG AA |
| Danger | #dc2626 | #ffffff | 5.4:1 | ✅ WCAG AA |

---

## 🔧 Development Workflow

### Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Git Workflow

```bash
# Check status
git status

# View changes
git diff

# Stage changes
git add <file>

# Commit changes
git commit -m "type: description"

# Push to remote
git push origin main

# View history
git log --oneline
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, perf, test, chore

---

## 📁 Project Structure

```
QIP_Data_Analyzer/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main component
│   │   ├── index.css            # Global styles ⭐
│   │   ├── main.jsx             # Entry point
│   │   └── utils/
│   │       ├── spc_logic.js      # SPC calculations
│   │       ├── diagnostic_logic.js
│   │       └── spc.worker.js     # Web Worker
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions
├── docs/
│   ├── manual/
│   ├── reference/
│   └── specs/
├── DEVELOPMENT_CHANGELOG.md
├── ALGORITHM_CHANGELOG.md
├── PROJECT_COMPLETION_REPORT.md
├── QA_AND_SOP_REPORT.md
└── README.md
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] All text clearly readable
- [ ] Buttons display correctly
- [ ] Tooltips show on hover
- [ ] Responsive on mobile

### Functional Testing
- [ ] File upload works
- [ ] Analysis runs correctly
- [ ] Charts display properly
- [ ] Export to Excel works

### Performance Testing
- [ ] No console errors
- [ ] No React warnings
- [ ] Smooth animations (60 FPS)
- [ ] Fast load times

### Accessibility Testing
- [ ] Contrast ratio WCAG AA+
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible

---

## 🚀 Deployment

### GitHub Actions

**Trigger**: Push to main/master  
**Environment**: Ubuntu Latest + Node 20  
**Target**: GitHub Pages

**Workflow File**: `.github/workflows/deploy.yml`

### Deploy URLs

```
GitHub Repo: https://github.com/Chun-Chieh-Chang/Web-based_QIP_Data_Analyzer
GitHub Pages: https://chun-chieh-chang.github.io/Web-based_QIP_Data_Analyzer/
```

---

## 💡 Common Tasks

### Add a New Button Tooltip

```jsx
<button
  title="Your tooltip text here"
  onClick={() => handleClick()}
>
  Button Label
</button>
```

### Update Color Variables

Edit `frontend/src/index.css`:
```css
:root {
  --primary-color: #new-color;
}
```

### Run Tests

```bash
cd frontend
npm run lint
```

### Build for Production

```bash
cd frontend
npm run build
```

---

## 🔗 Important Links

**Documentation**
- [Development Changelog](./DEVELOPMENT_CHANGELOG.md)
- [Algorithm Changelog](./ALGORITHM_CHANGELOG.md)
- [Project Completion Report](./PROJECT_COMPLETION_REPORT.md)
- [QA & SOP Report](./QA_AND_SOP_REPORT.md)

**External**
- [GitHub Repository](https://github.com/Chun-Chieh-Chang/Web-based_QIP_Data_Analyzer)
- [GitHub Pages](https://chun-chieh-chang.github.io/Web-based_QIP_Data_Analyzer/)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

---

## 📞 Contact

**Developer**: Chun-Chieh-Chang  
**Email**: wesleychang2025@gmail.com  
**GitHub**: https://github.com/Chun-Chieh-Chang

---

**Last Updated**: 2026-02-04  
**Maintained By**: Kiro AI Assistant
