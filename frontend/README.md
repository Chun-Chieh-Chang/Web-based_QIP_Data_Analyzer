# QIP Data Analysis Tool - Frontend

The frontend component of the QIP (Quality Improvement Process) Data Analysis Tool, a web-based application for Statistical Process Control (SPC) analysis.

## Overview

This React-based frontend provides a user-friendly interface for analyzing manufacturing process data. It connects to a FastAPI backend to perform various types of SPC analysis including:

- **Batch Analysis**: Individual-X and Moving Range (I-MR) charts with capability analysis
- **Cavity Analysis**: Multi-cavity comparison with capability metrics
- **Group Analysis**: Min-Max-Avg trend analysis

## Features

- Interactive charts using Plotly.js
- Real-time SPC calculations
- Western Electric rules violation detection
- Capability indices (Cp, Cpk, Pp, Ppk)
- Responsive design for desktop and tablet use
- Color-coded capability assessment

## Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Backend service running on http://localhost:8000

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd web_app/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. Make sure the backend service is running (see backend README)

2. Start the frontend development server:
   ```bash
   npm run dev
   ```

3. Open your browser to http://localhost:5173

## Project Structure

- `src/App.jsx`: Main application component
- `src/index.css`: Global styles
- `public/`: Static assets

## API Integration

The frontend communicates with the backend API at `http://localhost:8000/api/` through:

- `/api/products`: List available products
- `/api/items`: Get inspection items for a product
- `/api/batches`: Get batch information
- `/api/analysis/batch`: Batch analysis results
- `/api/analysis/cavity`: Cavity comparison analysis
- `/api/analysis/group`: Group trend analysis

## Dependencies

- React 19+
- Vite 7+
- Axios for API requests
- Plotly.js for charting
- Lucide React for icons
