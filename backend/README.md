# QIP Data Analysis Tool - Backend

The backend API for the QIP (Quality Improvement Process) Data Analysis Tool, built with FastAPI.

## Overview

This FastAPI-based backend provides a REST API for performing Statistical Process Control (SPC) analysis on manufacturing data. It processes Excel files containing inspection data and calculates various SPC metrics including control charts and capability indices.

## Features

- RESTful API endpoints for data analysis
- Batch analysis (I-MR charts with capability analysis)
- Cavity comparison analysis
- Group trend analysis (Min-Max-Avg)
- Western Electric rules violation detection
- Capability indices (Cp, Cpk, Pp, Ppk)
- Cross-platform compatibility

## Prerequisites

- Python 3.8 or higher
- Required Python packages (see requirements.txt)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd web_app/backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Direct execution:
```bash
python main.py
```

### Using the provided script:
```bash
./StartBackend.bat  # On Windows
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /api/products`: List available products (Excel files in data directory)
- `GET /api/items`: Get inspection items for a product
- `GET /api/batches`: Get batch information
- `GET /api/analysis/batch`: Batch analysis results
- `GET /api/analysis/cavity`: Cavity comparison analysis
- `GET /api/analysis/group`: Group trend analysis

## Configuration

The backend expects data files to be located in the `../../2.QIP數據提取` directory relative to the script location. This can be modified in `main.py` by changing the `DATA_DIR` variable.

## Dependencies

- FastAPI
- Uvicorn
- Pandas
- NumPy
- SciPy
- OpenPyXL