from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from analysis import QIPAnalysis
import os

app = FastAPI(title="QIP Data Analysis API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import logging
logging.basicConfig(filename='backend_error.log', level=logging.ERROR)


def format_decimal_precision(value):
    """Format decimal values to preserve original precision without floating-point errors"""
    if value is None:
        return value
    
    # Check if the value is already a "clean" float that can be represented properly
    # First, try to determine how many decimal places the original value should have
    original_str = str(value)
    
    if '.' in original_str:
        # Count total decimal places in the current representation
        total_decimal_places = len(original_str.split('.')[1])
        
        # Try rounding to fewer decimal places to see if we can get a cleaner representation
        for places in range(10, -1, -1):  # Try from 10 down to 0 decimal places
            rounded_val = round(value, places)
            test_str = f"{rounded_val:.{places}f}" if places > 0 else f"{int(rounded_val)}"
            
            # If this rounded value when formatted has the same "meaning" (ignoring trailing zeros),
            # use this cleaner representation
            if abs(value - rounded_val) < 1e-15:  # Very small difference, likely floating point error
                # Return the rounded value formatted to the original precision
                if places > 0:
                    return float(f"{rounded_val:.{places}f}")
                else:
                    return float(int(rounded_val))
    
    return value


def format_analysis_result(result):
    """Format the analysis result to preserve decimal precision"""
    if isinstance(result, dict):
        formatted_result = {}
        for key, value in result.items():
            if key == 'specs' and isinstance(value, dict):
                # Format spec values specifically
                formatted_specs = {}
                for spec_key, spec_value in value.items():
                    formatted_specs[spec_key] = format_decimal_precision(spec_value)
                formatted_result[key] = formatted_specs
            elif isinstance(value, (int, float)):
                formatted_result[key] = format_decimal_precision(value)
            elif isinstance(value, dict):
                formatted_result[key] = format_analysis_result(value)
            elif isinstance(value, list):
                formatted_result[key] = [format_analysis_result(item) if isinstance(item, dict) else item for item in value]
            else:
                formatted_result[key] = value
        return formatted_result
    return result

# Initialize analysis core with default data directory
# Try to find the directory, fallback if not exists to avoid 500 errors
ORIGINAL_DATA_DIR = os.path.abspath(os.path.join(os.getcwd(), "..", "..", "2.QIP數據提取"))
if os.path.isdir(ORIGINAL_DATA_DIR):
    DEFAULT_DATA_DIR = ORIGINAL_DATA_DIR
else:
    # Fallback to current project root or dynamic selection
    DEFAULT_DATA_DIR = os.getcwd()

current_data_dir = DEFAULT_DATA_DIR
analysis_core = QIPAnalysis(current_data_dir)

@app.get("/api/products")
async def get_products():
    try:
        products = analysis_core.list_products()
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/items")
async def get_items(product: str):
    try:
        items = analysis_core.get_inspection_items(product)
        if not items:
            raise HTTPException(status_code=404, detail="Product not found or no items available")
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/batches")
async def get_batches(product: str, item: str):
    try:
        batches = analysis_core.get_batches(product, item)
        return {"batches": batches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/batch")
async def get_batch_analysis(product: str, item: str, cavity: str, startBatch: str = None, endBatch: str = None):
    try:
        result = analysis_core.get_batch_analysis(product, item, cavity, startBatch, endBatch)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return format_analysis_result(result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/analysis/cavity")
async def get_cavity_analysis(product: str, item: str, startBatch: str = None, endBatch: str = None):
    try:
        result = analysis_core.get_cavity_analysis(product, item, startBatch, endBatch)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return format_analysis_result(result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/analysis/group")
async def get_group_analysis(product: str, item: str, startBatch: str = None, endBatch: str = None):
    try:
        result = analysis_core.get_group_analysis(product, item, startBatch, endBatch)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return format_analysis_result(result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/api/set-data-directory")
async def set_data_directory(request_data: dict):
    global current_data_dir, analysis_core
    try:
        new_dir = request_data.get('directory', '')
        if not new_dir or not os.path.isdir(new_dir):
            raise HTTPException(status_code=400, detail="Invalid directory path")
        
        # Update the analysis core with the new directory
        current_data_dir = new_dir
        analysis_core = QIPAnalysis(current_data_dir)
        
        return {"status": "success", "message": f"Data directory updated to: {new_dir}"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/cavity-info")
async def get_cavity_info(product: str, item: str):
    try:
        result = analysis_core.get_cavity_info(product, item)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/export/excel")
async def export_excel(request_data: dict):
    try:
        import tempfile
        import os
        from datetime import datetime
        
        # Extract data from request
        product = request_data.get('product', 'Unknown')
        item = request_data.get('item', 'Unknown')
        start_batch = request_data.get('startBatch', 'Unknown')
        end_batch = request_data.get('endBatch', 'Unknown')
        analysis_type = request_data.get('analysisType', 'batch')
        cavity = request_data.get('cavity', 'All')
        analysis_data = request_data.get('analysis_data', {})
        
        # Create a temporary file for the Excel output
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        range_part = f"_{start_batch}-{end_batch}" if start_batch and end_batch and start_batch != 'Unknown' and end_batch != 'Unknown' else ""
        cavity_part = f"_{cavity}" if cavity and cavity != 'All' else ""
        filename = f"QIP_Analysis_{product}_{item}{range_part}{cavity_part}_{analysis_type}_{timestamp}.xlsx"
        filepath = os.path.join("exports", filename)
        
        # Create exports directory if it doesn't exist
        os.makedirs("exports", exist_ok=True)
        
        # Call the export function
        result = analysis_core.export_to_excel(product, item, analysis_data, filepath, start_batch, end_batch, analysis_type, cavity)
        
        # Return the file for download
        from fastapi.responses import FileResponse
        return FileResponse(
            path=filepath,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename=filename
        )
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        logging.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

if __name__ == "__main__":

    import uvicorn
    import socket
    import sys
    
    # Check if port 8000 is available
    def check_port(host, port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, port))
                s.close()
                return True
            except OSError:
                return False
    
    host = "0.0.0.0"
    port = 8000
    
    # Try to find an available port starting from 8000
    while not check_port(host, port) and port < 8010:
        print(f"Port {port} is already in use, trying {port + 1}...")
        port += 1
    
    if port >= 8010:
        print("Could not find an available port between 8000-8010")
        sys.exit(1)
    
    print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
