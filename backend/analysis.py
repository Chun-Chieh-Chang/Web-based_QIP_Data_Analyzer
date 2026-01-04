import pandas as pd
import numpy as np
import os
from typing import List, Dict, Any, Optional

class QIPAnalysis:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.d2 = 1.128  # d2 constant for n=2

    def list_products(self) -> List[str]:
        files = [f for f in os.listdir(self.data_dir) if f.endswith('.xlsx')]
        return [f.replace('.xlsx', '') for f in files]

    def get_inspection_items(self, product_code: str) -> List[str]:
        file_path = os.path.join(self.data_dir, f"{product_code}.xlsx")
        if not os.path.exists(file_path):
            return []
        
        xl = pd.ExcelFile(file_path)
        # Filter sheets (same logic as VBA DataInput.SelectInspectionItem)
        excluded = ["摘要", "Summary", "統計", "說明"]
        items = [s for s in xl.sheet_names if s not in excluded and "分析" not in s and "配置" not in s]
        return items
    
    def get_cavity_info(self, product_code: str, item_name: str) -> Dict[str, Any]:
        """Get cavity information for a specific product and item"""
        file_path = os.path.join(self.data_dir, f"{product_code}.xlsx")
        if not os.path.exists(file_path):
            return {"error": "File not found"}
        
        try:
            # Read the sheet to identify cavity columns
            df = pd.read_excel(file_path, sheet_name=item_name, header=0)
            
            # Find columns that contain cavity information (contain '穴' character)
            cavity_cols = [col for col in df.columns if "穴" in str(col)]
            
            return {
                "total_cavities": len(cavity_cols),
                "cavity_names": cavity_cols,
                "has_cavity_data": len(cavity_cols) > 0
            }
        except FileNotFoundError:
            return {"error": "Product file not found"}
        except ValueError as e:
            # This catches the case where the sheet doesn't exist
            if "does not exist" in str(e).lower() or "sheet" in str(e).lower():
                return {"error": f"Sheet '{item_name}' not found in the product file"}
            else:
                return {"error": f"Failed to read cavity info: {str(e)}"}
        except Exception as e:
            return {"error": f"Failed to read cavity info: {str(e)}"}

    def read_data(self, product_code: str, item_name: str) -> pd.DataFrame:
        file_path = os.path.join(self.data_dir, f"{product_code}.xlsx")
        
        # Read the whole sheet
        df = pd.read_excel(file_path, sheet_name=item_name, header=0)
        
        if df.empty:
            return df, {"target": 0.0, "usl": 0.0, "lsl": 0.0}

        # Specs are in fixed cells: B2 (Target), C2 (USL), D2 (LSL) - following VBA implementation
        # Read directly from row 2, columns B, C, D (Excel columns 2, 3, 4; 1-indexed -> 1, 2, 3 in 0-indexed)
        # When header=0 is used, Excel row 2 becomes df.iloc[0]
        def get_spec_from_cell(col_index, default=0.0):
            if len(df.columns) > col_index and len(df) > 0:  # Ensure row 2 exists (index 0 after header=0)
                original_val = df.iloc[0, col_index]  # Row 2 is index 0 after header=0, column col_index
                
                # Check the original string representation to determine decimal places
                original_str = str(original_val).strip()
                
                # Convert to numeric value
                val = pd.to_numeric(original_val, errors='coerce')
                
                if pd.isna(val):
                    return default
                
                # Determine the number of decimal places in the original value
                decimal_places = 0
                if '.' in original_str:
                    # Count decimal places in the original string representation
                    decimal_part = original_str.split('.')[1]
                    # Remove trailing zeros to get the actual displayed precision
                    decimal_part = decimal_part.rstrip('0')  # Remove trailing zeros
                    if decimal_part:  # If there are significant decimal digits after removing trailing zeros
                        decimal_places = len(decimal_part)
                    else:
                        decimal_places = 0  # If all decimals were zeros, treat as integer
                
                # Apply proper rounding to match the source precision
                if decimal_places > 0:
                    return round(float(val), decimal_places)
                else:
                    # For values that appear as integers or with trailing zeros only
                    return float(int(round(val)))
            return default

        specs = {
            "target": get_spec_from_cell(1),  # B column (0-indexed: 1)
            "usl": get_spec_from_cell(2),    # C column (0-indexed: 2) 
            "lsl": get_spec_from_cell(3)     # D column (0-indexed: 3)
        }
        
        return df, specs

    def get_batches(self, product_code: str, item_name: str) -> List[Dict[str, Any]]:
        try:
            file_path = os.path.join(self.data_dir, f"{product_code}.xlsx")
            df = pd.read_excel(file_path, sheet_name=item_name, header=0, usecols=[0])
            # Row 0 is spec, data starts from index 1
            # Read batch names from all rows starting from Excel row 2 (index 0 in df after header=0)
            # Excel row 2 = index 0, Excel row 3 = index 1, etc.
            batches = []
            for i, val in enumerate(df.iloc[0:, 0].fillna("Unknown")):
                batches.append({"index": i, "name": str(val)})
            return batches
        except:
            return []

    def filter_df_by_batches(self, df: pd.DataFrame, start_idx: Optional[str], end_idx: Optional[str]) -> pd.DataFrame:
        if df.empty or len(df) <= 1:
            return pd.DataFrame()
            
        # Use the full dataframe (no rows are skipped since spec values are read separately)
        try:
            # Slicing based on provided indices (0-based relative to the full df)
            s = int(start_idx) if start_idx is not None else 0
            e = int(end_idx) if end_idx is not None else len(df) - 1
            
            # Clamp indices
            s = max(0, min(s, len(df) - 1))
            e = max(0, min(e, len(df) - 1))
            
            # Ensure order
            first, last = min(s, e), max(s, e)
            return df.iloc[first:last+1]
        except (ValueError, TypeError):
            return df

    def calculate_spc(self, values: np.ndarray, usl: float, lsl: float, target: float) -> Dict[str, Any]:
        if len(values) < 2:
            return {"error": "Insufficient data"}

        try:
            # Basic Stats
            mean = float(np.mean(values))
            max_val = float(np.max(values))
            min_val = float(np.min(values))
            data_range = float(max_val - min_val)
            n = int(len(values))

            # Variance/StdDev
            overall_std = float(np.std(values, ddof=1))

            # Within StdDev (Sigma Within) using Moving Range
            mr = np.abs(np.diff(values))
            mr_mean = float(np.mean(mr)) if len(mr) > 0 else 0
            within_std = mr_mean / self.d2 if self.d2 > 0 else 0

            # Control Limits for Individual-X Chart
            ucl_x = mean + 2.66 * within_std
            lcl_x = mean - 2.66 * within_std
            
            # Control Limits for MR Chart
            ucl_mr = 3.267 * mr_mean
            cl_mr = mr_mean

            # Capability Indices
            tolerance = usl - lsl
            
            # Short-term (Cp, Cpk)
            cp = tolerance / (6 * within_std) if within_std > 0 else 0
            cpu = (usl - mean) / (3 * within_std) if within_std > 0 else 0
            cpl = (mean - lsl) / (3 * within_std) if within_std > 0 else 0
            cpk = min(cpu, cpl) if not (pd.isna(cpu) or pd.isna(cpl)) else 0

            # Long-term (Pp, Ppk)
            pp = tolerance / (6 * overall_std) if overall_std > 0 else 0
            ppu = (usl - mean) / (3 * overall_std) if overall_std > 0 else 0
            ppl = (mean - lsl) / (3 * overall_std) if overall_std > 0 else 0
            ppk = min(ppu, ppl) if not (pd.isna(ppu) or pd.isna(ppl)) else 0

            # Sigma Level & DPMO
            sigma_level = float(cpk * 3)
            
            from scipy.stats import norm
            try:
                # Use absolute value for cpk-based DPMO
                dpmo = float(2 * (1 - norm.cdf(abs(sigma_level))) * 1_000_000)
            except:
                dpmo = 0.0

            # Nelson Rules detection (Rules 1-4)
            violations_detail = self.detect_violations(values, mean, ucl_x, lcl_x, within_std)
            violations = [v['message'] for v in violations_detail]

            # Normal Distribution Plot Data
            # 1. Histogram data
            num_bins = 15
            counts, bin_edges = np.histogram(values, bins=num_bins)
            bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
            
            # 2. Normal Distribution Curve data
            # Define range for curve (±4 sigma overall)
            curve_x = np.linspace(mean - 4 * overall_std, mean + 4 * overall_std, 100)
            # Use probability density function (PDF)
            # To scale PDF to histogram, we need: PDF * (Total Points * Bin Width)
            bin_width = bin_edges[1] - bin_edges[0]
            curve_y = norm.pdf(curve_x, mean, overall_std) * (len(values) * bin_width)

            # Ensure everything is JSON serializable (no NaN)
            def clean_float(f):
                return float(f) if not (pd.isna(f) or np.isinf(f)) else 0.0

            return {
                "stats": {
                    "mean": clean_float(mean),
                    "max": clean_float(max_val),
                    "min": clean_float(min_val),
                    "range": clean_float(data_range),
                    "count": n,
                    "within_std": clean_float(within_std),
                    "overall_std": clean_float(overall_std),
                    "mr_mean": clean_float(mr_mean)
                },
                "control_limits": {
                    "ucl_x": clean_float(ucl_x),
                    "lcl_x": clean_float(lcl_x),
                    "cl_x": clean_float(mean),
                    "ucl_mr": clean_float(ucl_mr),
                    "cl_mr": clean_float(cl_mr)
                },
                "capability": {
                    "cp": clean_float(cp),
                    "cpk": clean_float(cpk),
                    "cpu": clean_float(cpu),
                    "cpl": clean_float(cpl),
                    "pp": clean_float(pp),
                    "ppk": clean_float(ppk),
                    "sigma_level": clean_float(sigma_level),
                    "dpmo": clean_float(dpmo)
                },
                "violations": violations,
                "violations_detail": violations_detail,
                "distribution": {
                    "histogram": {
                        "bin_centers": [clean_float(x) for x in bin_centers],
                        "counts": counts.tolist()
                    },
                    "curve": {
                        "x": [clean_float(x) for x in curve_x],
                        "y": [clean_float(y) for y in curve_y]
                    }
                }
            }
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return {"error": f"SPC calculation failed: {str(e)}"}

    def detect_violations(self, data, cl, ucl, lcl, sigma) -> List[Dict[str, Any]]:
        """Detect SPC violations using Nelson Rules 1-4"""
        if sigma <= 0: return []
        violations = []
        
        # Rule 1: One point beyond 3 sigma from center line
        for i, v in enumerate(data):
            if v > ucl or v < lcl:
                violations.append({
                    "rule": "Rule 1",
                    "index": i,
                    "message": f"Rule 1: Point {i+1} is outside control limits ({v:.4f})"
                })
        
        # Rule 2: 9 (or more) consecutive points on the same side of the center line
        side = 0 
        count = 0
        for i, v in enumerate(data):
            current_side = 1 if v > cl else -1 if v < cl else 0
            if current_side != 0:
                if current_side == side:
                    count += 1
                else:
                    side = current_side
                    count = 1
                if count >= 9:
                    violations.append({
                        "rule": "Rule 2",
                        "index": i,
                        "message": f"Rule 2: 9 consecutive points on one side at point {i+1}"
                    })
            else:
                count = 0
                side = 0

        # Rule 3: 6 (or more) points in a row are continually increasing (or decreasing)
        trend = 0 
        count = 1
        for i in range(1, len(data)):
            current_trend = 1 if data[i] > data[i-1] else -1 if data[i] < data[i-1] else 0
            if current_trend != 0:
                if current_trend == trend:
                    count += 1
                else:
                    trend = current_trend
                    count = 2
                if count >= 6:
                    violations.append({
                        "rule": "Rule 3",
                        "index": i,
                        "message": f"Rule 3: 6 consecutive points increasing or decreasing at point {i+1}"
                    })
            else:
                count = 1
                trend = 0

        # Rule 4: 14 (or more) points in a row alternate in direction, increasing then decreasing
        # This means diff1 * diff2 < 0 for 13 consecutive diffs
        if len(data) >= 14:
            for i in range(13, len(data)):
                is_alternating = True
                for j in range(i - 12, i + 1):
                    # Check if (data[j] - data[j-1]) and (data[j-1] - data[j-2]) have different signs
                    diff1 = data[j] - data[j-1]
                    diff2 = data[j-1] - data[j-2]
                    if diff1 * diff2 >= 0:
                        is_alternating = False
                        break
                if is_alternating:
                    violations.append({
                        "rule": "Rule 4",
                        "index": i,
                        "message": f"Rule 4: 14 points alternating direction at point {i+1}"
                    })

        return violations

    
    def export_to_excel(self, product_code: str, item_name: str, analysis_result: Dict[str, Any], output_path: str, start_batch: str = None, end_batch: str = None, analysis_type: str = 'batch', cavity: str = None):
        import xlsxwriter
        import tempfile
        import matplotlib.pyplot as plt
        import io
        import base64
        from datetime import datetime
        import numpy as np
        
        # Create a new Excel workbook and add worksheets
        workbook = xlsxwriter.Workbook(output_path, {'constants': True})
        data_worksheet = workbook.add_worksheet('Data')
        chart_worksheet = workbook.add_worksheet('Charts')
        
        # Add some basic formatting
        title_format = workbook.add_format({'bold': True, 'font_size': 14})
        header_format = workbook.add_format({'bold': True, 'bg_color': '#D3D3D3'})
        subheader_format = workbook.add_format({'bold': True})
        
        # Write the title with production range and chart attributes
        range_info = f" [{start_batch}-{end_batch}]" if start_batch and end_batch and start_batch != 'Unknown' and end_batch != 'Unknown' else ""
        cavity_info = f" - Cavity: {cavity}" if cavity and cavity != 'All' else ""
        chart_type_info = f" - {analysis_type.title()} Analysis"
        data_worksheet.write(0, 0, f'QIP Analysis Report - {product_code} - {item_name}{range_info}{cavity_info}{chart_type_info}', title_format)
        
        # Write timestamp
        data_worksheet.write(1, 0, f'Report Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        
        # Write capability summary if available
        if 'capability' in analysis_result:
            row = 3
            data_worksheet.write(row, 0, 'Capability Summary', header_format)
            row += 1
            
            data_worksheet.write(row, 0, 'Cpk')
            data_worksheet.write(row, 1, analysis_result['capability'].get('cpk', 0))
            row += 1
            
            data_worksheet.write(row, 0, 'Ppk')
            data_worksheet.write(row, 1, analysis_result['capability'].get('ppk', 0))
            row += 1
            
            data_worksheet.write(row, 0, 'Cp')
            data_worksheet.write(row, 1, analysis_result['capability'].get('cp', 0))
            row += 1
            
            data_worksheet.write(row, 0, 'Pp')
            data_worksheet.write(row, 1, analysis_result['capability'].get('pp', 0))
            row += 1
            
            data_worksheet.write(row, 0, 'Mean')
            data_worksheet.write(row, 1, analysis_result['stats'].get('mean', 0))
            row += 1
            
            data_worksheet.write(row, 0, 'Std Dev (Within)')
            data_worksheet.write(row, 1, analysis_result['stats'].get('within_std', 0))
            row += 1
            
            data_worksheet.write(row, 0, 'Std Dev (Overall)')
            data_worksheet.write(row, 1, analysis_result['stats'].get('overall_std', 0))
            row += 1
            
            # Write specs if available
            if 'specs' in analysis_result:
                specs = analysis_result['specs']
                data_worksheet.write(row, 0, 'Target')
                data_worksheet.write(row, 1, specs.get('target', 0))
                row += 1
                data_worksheet.write(row, 0, 'USL')
                data_worksheet.write(row, 1, specs.get('usl', 0))
                row += 1
                data_worksheet.write(row, 0, 'LSL')
                data_worksheet.write(row, 1, specs.get('lsl', 0))
                row += 2
        
        # Write data if available
        if 'data' in analysis_result:
            data = analysis_result['data']
            
            # Check if labels contain cavity information (indicated by parentheses)
            labels = data.get('labels', [])
            values = data.get('values', [])
            
            # Get control limits if available
            ucl = analysis_result.get('control_limits', {}).get('ucl_x')
            lcl = analysis_result.get('control_limits', {}).get('lcl_x')
            mean = analysis_result.get('control_limits', {}).get('cl_x')
            
            # Check if we have data from multiple cavities
            has_cavity_info = any('(' in str(label) and ')' in str(label) for label in labels)
            
            if has_cavity_info:
                # Separate data by cavity
                cavity_data = {}
                for label, value in zip(labels, values):
                    # Extract cavity name from label like "Batch_01 (Cavity A)"
                    cavity_name = "General"
                    if '(' in str(label) and ')' in str(label):
                        cavity_name = str(label)[str(label).rfind('(')+1:str(label).rfind(')')]
                        batch_name = str(label)[:str(label).rfind(' (')]
                    else:
                        batch_name = str(label)
                    
                    if cavity_name not in cavity_data:
                        cavity_data[cavity_name] = {'batches': [], 'values': []}
                    cavity_data[cavity_name]['batches'].append(batch_name)
                    cavity_data[cavity_name]['values'].append(value)
                
                # Create a worksheet for each cavity
                for cavity_name, cavity_values in cavity_data.items():
                    # Sanitize cavity name for worksheet name (Excel has restrictions)
                    sanitized_cavity_name = ''.join(c for c in cavity_name if c.isalnum() or c in (' ', '-', '_'))[:31]  # Excel worksheet name limit
                    if sanitized_cavity_name == '':
                        sanitized_cavity_name = 'Sheet'
                    
                    cavity_worksheet = workbook.add_worksheet(f'Data_{sanitized_cavity_name}')
                    
                    # Write headers for this cavity
                    cavity_worksheet.write(0, 0, f'Data Values - {cavity_name}', header_format)
                    cavity_worksheet.write(1, 0, 'Batch')
                    cavity_worksheet.write(1, 1, 'Value')
                    if ucl is not None:
                        cavity_worksheet.write(1, 2, 'UCL')
                        cavity_worksheet.write(2, 2, ucl)
                    if lcl is not None:
                        cavity_worksheet.write(1, 3, 'LCL')
                        cavity_worksheet.write(2, 3, lcl)
                    if mean is not None:
                        cavity_worksheet.write(1, 4, 'CL')
                        cavity_worksheet.write(2, 4, mean)
                    
                    # Write data for this cavity
                    batches = cavity_values['batches']
                    cavity_vals = cavity_values['values']
                    for i, (batch, value) in enumerate(zip(batches, cavity_vals)):
                        cavity_worksheet.write(3 + i, 0, batch)
                        cavity_worksheet.write(3 + i, 1, value)
                        
                # Write summary of all cavities on the main Data worksheet
                data_worksheet.write(row, 0, 'Data Summary - All Cavities', header_format)
                row += 1
                data_worksheet.write(row, 0, 'Cavity')
                data_worksheet.write(row, 1, 'Count')
                data_worksheet.write(row, 2, 'Mean')
                data_worksheet.write(row, 3, 'Min')
                data_worksheet.write(row, 4, 'Max')
                row += 1
                
                for cavity_name, cavity_values in cavity_data.items():
                    cavity_vals = cavity_values['values']
                    data_worksheet.write(row, 0, cavity_name)
                    data_worksheet.write(row, 1, len(cavity_vals))
                    data_worksheet.write(row, 2, sum(cavity_vals)/len(cavity_vals))  # mean
                    data_worksheet.write(row, 3, min(cavity_vals))  # min
                    data_worksheet.write(row, 4, max(cavity_vals))  # max
                    row += 1
                row += 2
            else:
                # Original behavior for single cavity or non-cavity data
                data_worksheet.write(row, 0, 'Data Values', header_format)
                row += 1
                
                # Write headers
                data_worksheet.write(row, 0, 'Batch')
                data_worksheet.write(row, 1, 'Value')
                if ucl is not None:
                    data_worksheet.write(row, 2, 'UCL')
                    data_worksheet.write(row, 3, 'LCL')
                    data_worksheet.write(row, 4, 'CL')
                row += 1
                
                # Write data
                for i, (label, value) in enumerate(zip(labels, values)):
                    data_worksheet.write(row + i, 0, label)
                    data_worksheet.write(row + i, 1, value)
                    if ucl is not None:
                        data_worksheet.write(row + i, 2, ucl)
                    if lcl is not None:
                        data_worksheet.write(row + i, 3, lcl)
                    if mean is not None:
                        data_worksheet.write(row + i, 4, mean)
                row += len(values) + 2
        
        # Write violations if available
        if 'violations' in analysis_result and analysis_result['violations']:
            data_worksheet.write(row, 0, 'SPC Violations', header_format)
            row += 1
            for i, violation in enumerate(analysis_result['violations']):
                data_worksheet.write(row + i, 0, violation)
            row += len(analysis_result['violations']) + 1
        
        # Create charts if data is available
        if 'data' in analysis_result:
            data = analysis_result['data']
            values = data.get('values', [])
            labels = data.get('labels', [])
            
            if values and len(values) > 0:
                # Check if we have data from multiple cavities
                has_cavity_info = any('(' in str(label) and ')' in str(label) for label in labels)
                
                if has_cavity_info:
                    # Create separate charts for each cavity
                    cavity_data = {}
                    for label, value in zip(labels, values):
                        cavity_name = "General"
                        if '(' in str(label) and ')' in str(label):
                            cavity_name = str(label)[str(label).rfind('(')+1:str(label).rfind(')')]
                        
                        if cavity_name not in cavity_data:
                            cavity_data[cavity_name] = {'labels': [], 'values': []}
                        cavity_data[cavity_name]['labels'].append(label)
                        cavity_data[cavity_name]['values'].append(value)
                    
                    # Create a separate worksheet for charts
                    chart_cavity_worksheet = workbook.add_worksheet('Cavity_Charts')
                    
                    # Create separate chart for each cavity
                    for i, (cavity_name, cavity_values) in enumerate(cavity_data.items()):
                        cavity_vals = cavity_values['values']
                        cavity_labels = cavity_values['labels']
                        
                        # Add data to the worksheet for this cavity chart
                        start_row = i * (len(cavity_vals) + 10)  # Add spacing between charts
                        
                        # Write header
                        chart_cavity_worksheet.write(start_row, 0, f'Individual-X Chart - {product_code} - {item_name} - {cavity_name}')
                        chart_cavity_worksheet.write(start_row + 1, 0, 'Sample')
                        chart_cavity_worksheet.write(start_row + 1, 1, 'Value')
                        
                        # Write data
                        for j, (label, value) in enumerate(zip(cavity_labels, cavity_vals)):
                            chart_cavity_worksheet.write(start_row + 2 + j, 0, j)  # Sample number
                            chart_cavity_worksheet.write(start_row + 2 + j, 1, value)
                        
                        # Write control limits if available
                        if 'control_limits' in analysis_result:
                            cl = analysis_result['control_limits'].get('cl_x')
                            ucl = analysis_result['control_limits'].get('ucl_x')
                            lcl = analysis_result['control_limits'].get('lcl_x')
                            
                            if cl is not None:
                                chart_cavity_worksheet.write(start_row + 1, 2, 'CL')
                                chart_cavity_worksheet.write(start_row + 1, 3, cl)
                            if ucl is not None:
                                chart_cavity_worksheet.write(start_row + 1, 4, 'UCL')
                                chart_cavity_worksheet.write(start_row + 1, 5, ucl)
                            if lcl is not None:
                                chart_cavity_worksheet.write(start_row + 1, 6, 'LCL')
                                chart_cavity_worksheet.write(start_row + 1, 7, lcl)
                        
                        # Create an Excel chart
                        chart = workbook.add_chart({'type': 'line'})
                        
                        # Configure the series for the chart
                        chart.add_series({
                            'name': cavity_name,
                            'categories': [chart_cavity_worksheet.name, start_row + 2, 0, start_row + 1 + len(cavity_vals), 0],  # X-axis: sample numbers
                            'values': [chart_cavity_worksheet.name, start_row + 2, 1, start_row + 1 + len(cavity_vals), 1],     # Y-axis: values
                            'line': {'color': 'blue', 'width': 2},
                            'marker': {'type': 'circle', 'size': 6}
                        })
                        
                        # Add control limits to the chart if available
                        if 'control_limits' in analysis_result:
                            cl = analysis_result['control_limits'].get('cl_x')
                            ucl = analysis_result['control_limits'].get('ucl_x')
                            lcl = analysis_result['control_limits'].get('lcl_x')
                            
                            if cl is not None:
                                chart.add_series({
                                    'name': 'CL',
                                    'categories': [chart_cavity_worksheet.name, start_row + 2, 0, start_row + 1 + len(cavity_vals), 0],
                                    'values': [chart_cavity_worksheet.name, start_row + 2, 2, start_row + 1 + len(cavity_vals), 2],
                                    'line': {'color': 'green', 'width': 2, 'dash_type': 'solid'},
                                    'marker': {'type': 'none'}
                                })
                            if ucl is not None:
                                chart.add_series({
                                    'name': 'UCL',
                                    'categories': [chart_cavity_worksheet.name, start_row + 2, 0, start_row + 1 + len(cavity_vals), 0],
                                    'values': [chart_cavity_worksheet.name, start_row + 2, 4, start_row + 1 + len(cavity_vals), 4],
                                    'line': {'color': 'red', 'width': 1, 'dash_type': 'long_dash'},
                                    'marker': {'type': 'none'}
                                })
                            if lcl is not None:
                                chart.add_series({
                                    'name': 'LCL',
                                    'categories': [chart_cavity_worksheet.name, start_row + 2, 0, start_row + 1 + len(cavity_vals), 0],
                                    'values': [chart_cavity_worksheet.name, start_row + 2, 6, start_row + 1 + len(cavity_vals), 6],
                                    'line': {'color': 'red', 'width': 1, 'dash_type': 'long_dash'},
                                    'marker': {'type': 'none'}
                                })
                        
                        # Add chart title and axis labels
                        chart.set_title({'name': f'Individual-X Chart - {product_code} - {item_name} - {cavity_name}'})
                        chart.set_x_axis({'name': 'Sample'})
                        chart.set_y_axis({'name': 'Value'})
                        
                        # Insert the chart in the worksheet
                        chart_cavity_worksheet.insert_chart(start_row + 2, 8, chart, {'x_scale': 2, 'y_scale': 1.5})
                else:
                    # Create Individual-X chart for single cavity or non-cavity data
                    # Add data to the worksheet for the chart
                    chart_worksheet.write(0, 0, f'Individual-X Chart - {product_code} - {item_name}{range_info}')
                    chart_worksheet.write(1, 0, 'Sample')
                    chart_worksheet.write(1, 1, 'Value')
                    
                    # Write data
                    for i, (label, value) in enumerate(zip(labels, values)):
                        chart_worksheet.write(2 + i, 0, i)  # Sample number
                        chart_worksheet.write(2 + i, 1, value)
                    
                    # Write control limits if available
                    if 'control_limits' in analysis_result:
                        cl = analysis_result['control_limits'].get('cl_x')
                        ucl = analysis_result['control_limits'].get('ucl_x')
                        lcl = analysis_result['control_limits'].get('lcl_x')
                        
                        if cl is not None:
                            chart_worksheet.write(1, 2, 'CL')
                            chart_worksheet.write(2, 2, cl)  # Write CL value for all rows
                            for i in range(len(values)):
                                chart_worksheet.write(2 + i, 2, cl)
                        if ucl is not None:
                            chart_worksheet.write(1, 3, 'UCL')
                            for i in range(len(values)):
                                chart_worksheet.write(2 + i, 3, ucl)
                        if lcl is not None:
                            chart_worksheet.write(1, 4, 'LCL')
                            for i in range(len(values)):
                                chart_worksheet.write(2 + i, 4, lcl)
                    
                    # Create an Excel chart
                    chart = workbook.add_chart({'type': 'line'})
                    
                    # Configure the series for the chart
                    chart.add_series({
                        'name': 'Data Values',
                        'categories': [chart_worksheet.name, 2, 0, 1 + len(values), 0],  # X-axis: sample numbers
                        'values': [chart_worksheet.name, 2, 1, 1 + len(values), 1],       # Y-axis: values
                        'line': {'color': 'blue', 'width': 2},
                        'marker': {'type': 'circle', 'size': 6}
                    })
                    
                    # Add control limits to the chart if available
                    if 'control_limits' in analysis_result:
                        cl = analysis_result['control_limits'].get('cl_x')
                        ucl = analysis_result['control_limits'].get('ucl_x')
                        lcl = analysis_result['control_limits'].get('lcl_x')
                        
                        if cl is not None:
                            chart.add_series({
                                'name': 'CL',
                                'categories': [chart_worksheet.name, 2, 0, 1 + len(values), 0],
                                'values': [chart_worksheet.name, 2, 2, 1 + len(values), 2],
                                'line': {'color': 'green', 'width': 2, 'dash_type': 'solid'},
                                'marker': {'type': 'none'}
                            })
                        if ucl is not None:
                            chart.add_series({
                                'name': 'UCL',
                                'categories': [chart_worksheet.name, 2, 0, 1 + len(values), 0],
                                'values': [chart_worksheet.name, 2, 3, 1 + len(values), 3],
                                'line': {'color': 'red', 'width': 1, 'dash_type': 'long_dash'},
                                'marker': {'type': 'none'}
                            })
                        if lcl is not None:
                            chart.add_series({
                                'name': 'LCL',
                                'categories': [chart_worksheet.name, 2, 0, 1 + len(values), 0],
                                'values': [chart_worksheet.name, 2, 4, 1 + len(values), 4],
                                'line': {'color': 'red', 'width': 1, 'dash_type': 'long_dash'},
                                'marker': {'type': 'none'}
                            })
                    
                    # Add chart title and axis labels
                    chart.set_title({'name': f'Individual-X Chart - {product_code} - {item_name}{range_info}'})
                    chart.set_x_axis({'name': 'Sample'})
                    chart.set_y_axis({'name': 'Value'})
                    
                    # Insert the chart in the worksheet
                    chart_worksheet.insert_chart('F1', chart, {'x_scale': 1.5, 'y_scale': 1.2})
        
        workbook.close()
        return {'status': 'success', 'file': output_path}

    def get_batch_analysis(self, product_code: str, item_name: str, cavity_name: str, start_batch: str = None, end_batch: str = None) -> Dict[str, Any]:
        try:
            df, specs = self.read_data(product_code, item_name)
            
            # Fuzzy match cavity name
            target_col = None
            if not cavity_name:
                # If no cavity is selected, calculate average values across all cavities
                cavity_cols = [c for c in df.columns if "穴" in str(c)]
                if not cavity_cols:
                    return {"error": "No cavity columns found in the data"}
                
                # Range filter
                data_df = self.filter_df_by_batches(df, start_batch, end_batch)
                if data_df.empty:
                    return {"error": "No data found for the selected batch range"}
                
                all_labels = []
                avg_values = []
                range_values = []
                
                # Calculate average and range for each row across all cavities
                for idx, row in data_df.iterrows():
                    row_values = []
                    for col in cavity_cols:
                        val = pd.to_numeric(row[col], errors='coerce')
                        if not pd.isna(val):
                            row_values.append(float(val))
                    
                    if row_values:  # If we have values for this row
                        avg_val = sum(row_values) / len(row_values)  # Calculate average
                        avg_values.append(avg_val)
                        
                        # Calculate range across cavities for this batch
                        range_val = max(row_values) - min(row_values)
                        range_values.append(range_val)
                        
                        # Use the batch identifier from the first column
                        batch_label = str(row.iloc[0])
                        all_labels.append(batch_label)
                
                if not avg_values:
                    return {"error": "No numeric data found for any cavity"}
                
                # Calculate Xbar-R chart control limits for "All Cavities" mode
                # Estimate the number of cavities per batch from the first batch's range calculation
                if len(avg_values) > 0 and len(range_values) > 0:
                    # We can estimate the number of cavities by looking at the relationship
                    # between the range and the original cavity values
                    # For now, use the length of the first batch's cavity values
                    # which is not directly available, so we'll use a reasonable approach
                    
                    # Calculate the average number of cavities by looking at how many 
                    # cavity values contributed to each range calculation
                    # This information is not directly available, so we'll use a different approach
                    
                    # For now, we'll determine subgroup size based on the average range relative to standard deviation
                    # Or simply use the number of range values as an estimate
                    estimated_subgroup_size = max(2, min(10, round(np.mean([len([v for v in avg_values if not np.isnan(v)]) if len(avg_values) > 0 else 2]))))
                    
                    # Actually, let's use a simpler approach - estimate based on the context
                    # In the batch analysis, we process all cavity columns, so estimate based on number of cavity columns
                    cavity_cols_count = len([c for c in df.columns if "穴" in str(c)])
                    estimated_subgroup_size = max(2, min(32, cavity_cols_count))  # Cap at 32 cavities
                    
                    analysis = self.calculate_xbar_r_chart(avg_values, range_values, specs['usl'], specs['lsl'], specs['target'], estimated_subgroup_size)
                else:
                    analysis = self.calculate_xbar_r_chart(avg_values, range_values, specs['usl'], specs['lsl'], specs['target'], 5)  # Default to 5
                if "error" in analysis: return analysis
                
                analysis['data'] = {
                    "cavity_actual_name": "Average of All Cavities",
                    "labels": all_labels,  # Use batch labels only (no cavity identifiers)
                    "values": avg_values,
                    "mr_values": np.abs(np.diff(avg_values)).tolist(),
                    "mr_labels": [f"{all_labels[i]}-{all_labels[i+1]}" for i in range(len(all_labels)-1)] if len(all_labels) > 1 else all_labels,  # Labels for Moving Range chart
                    "r_values": range_values,  # Range across cavities for each batch
                    "r_labels": all_labels  # Labels for Range chart
                }
                analysis['specs'] = specs
                return analysis
            else:
                for col in df.columns:
                    col_str = str(col)
                    if cavity_name == col_str or (cavity_name in col_str and "穴" in col_str):
                        target_col = col
                        break
                
                if not target_col:
                    return {"error": f"Cavity '{cavity_name}' not found. Available: {df.columns.tolist()}"}
                
                # Range filter
                data_df = self.filter_df_by_batches(df, start_batch, end_batch)
                if data_df.empty:
                    return {"error": "No data found for the selected batch range"}

                valid_data = data_df[pd.to_numeric(data_df[target_col], errors='coerce').notnull()]
                if valid_data.empty:
                     return {"error": f"No numeric data found for col {target_col}"}
                     
                values = valid_data[target_col].astype(float).values
                labels = valid_data.iloc[:, 0].astype(str).tolist() 
                
                analysis = self.calculate_spc(values, specs['usl'], specs['lsl'], specs['target'])
                if "error" in analysis: return analysis
                    
                analysis['data'] = {
                    "cavity_actual_name": str(target_col),
                    "labels": labels,
                    "values": values.tolist(),
                    "mr_values": np.abs(np.diff(values)).tolist(),
                    "mr_labels": [f"{labels[i]}-{labels[i+1]}" for i in range(len(labels)-1)] if len(labels) > 1 else labels  # Labels for Moving Range chart
                }
                analysis['specs'] = specs
                return analysis
        except Exception as e:
            return {"error": f"Batch analysis error: {str(e)}"}

    def get_cavity_analysis(self, product_code: str, item_name: str, start_batch: str = None, end_batch: str = None) -> Dict[str, Any]:
        try:
            df, specs = self.read_data(product_code, item_name)
            cavity_stats = []
            cavity_cols = [c for c in df.columns if "穴" in str(c)]
            
            # Range filter
            data_df = self.filter_df_by_batches(df, start_batch, end_batch)
            if data_df.empty:
                return {"error": "No data found for the selected batch range"}

            for col in cavity_cols:
                valid_data = data_df[pd.to_numeric(data_df[col], errors='coerce').notnull()]
                values = valid_data[col].astype(float).values
                if len(values) >= 2:
                    stats = self.calculate_spc(values, specs['usl'], specs['lsl'], specs['target'])
                    if "error" not in stats:
                        cavity_stats.append({
                            "cavity": col,
                            "mean": stats['stats']['mean'],
                            "cpk": stats['capability']['cpk'],
                            "ppk": stats['capability']['ppk'],
                            "std_within": stats['stats']['within_std'],
                            "std_overall": stats['stats']['overall_std']
                        })
            
            return {"cavities": cavity_stats, "specs": specs}
        except Exception as e:
            return {"error": f"Cavity analysis error: {str(e)}"}

    def get_group_analysis(self, product_code: str, item_name: str, start_batch: str = None, end_batch: str = None) -> Dict[str, Any]:
        try:
            df, specs = self.read_data(product_code, item_name)
            cavity_cols = [c for c in df.columns if "穴" in str(c)]
            
            # Range filter
            data_df = self.filter_df_by_batches(df, start_batch, end_batch)
            if data_df.empty:
                return {"error": "No data found for the selected batch range"}

            group_data = []
            for _, row in data_df.iterrows():
                row_values = []
                for col in cavity_cols:
                    val = pd.to_numeric(row[col], errors='coerce')
                    if not pd.isna(val):
                        row_values.append(float(val))
                
                if row_values:
                    group_data.append({
                        "batch": str(row.iloc[0]),
                        "avg": float(np.mean(row_values)),
                        "max": float(np.max(row_values)),
                        "min": float(np.min(row_values)),
                        "range": float(np.max(row_values) - np.min(row_values)),
                        "n": len(row_values)
                    })
            
            return {"groups": group_data, "specs": specs}
        except Exception as e:
            return {"error": f"Group analysis error: {str(e)}"}

    def calculate_xbar_r_chart(self, xbar_values, r_values, usl, lsl, target, subgroup_size: int = 5) -> Dict[str, Any]:
        if len(xbar_values) < 2 or len(r_values) < 2:
            return {"error": "Insufficient data for Xbar-R chart"}
        
        try:
            # Calculate overall averages
            xbar_bar = float(np.mean(xbar_values))  # Average of subgroup averages
            r_bar = float(np.mean(r_values))      # Average of subgroup ranges
            
            # For Xbar-R charts, constants depend on subgroup size (number of cavities per batch)
            # Use the provided subgroup size to determine appropriate constants
            n = subgroup_size
            
            # Determine appropriate constants based on subgroup size
            # Standard Xbar-R chart constants for different subgroup sizes
            if n == 2:
                a2, d3, d4 = 1.880, 0, 3.267  # A2, D3, D4 for n=2
            elif n == 3:
                a2, d3, d4 = 1.023, 0, 2.575  # A2, D3, D4 for n=3
            elif n == 4:
                a2, d3, d4 = 0.729, 0, 2.282  # A2, D3, D4 for n=4
            elif n == 5:
                a2, d3, d4 = 0.577, 0, 2.115  # A2, D3, D4 for n=5
            elif n == 6:
                a2, d3, d4 = 0.483, 0, 2.004  # A2, D3, D4 for n=6
            elif n == 7:
                a2, d3, d4 = 0.419, 0.076, 1.924  # A2, D3, D4 for n=7
            elif n == 8:
                a2, d3, d4 = 0.373, 0.136, 1.864  # A2, D3, D4 for n=8
            elif n == 9:
                a2, d3, d4 = 0.337, 0.184, 1.816  # A2, D3, D4 for n=9
            elif n >= 10 and n <= 25:
                # For larger subgroups, use approximations
                # Using formulas or standard values for larger subgroups
                # These are approximated values for larger subgroups
                if n <= 15:
                    a2, d3, d4 = 0.308, 0.223, 1.777  # Close to n=10
                elif n <= 20:
                    a2, d3, d4 = 0.250, 0.300, 1.700  # Approximate for larger n
                else:
                    a2, d3, d4 = 0.200, 0.350, 1.650  # Approximate for very large n
            else:
                # Default to n=5 if outside normal range
                n = 5
                a2, d3, d4 = 0.577, 0, 2.115
            
            # Calculate control limits for Xbar chart
            xbar_ucl = xbar_bar + a2 * r_bar
            xbar_lcl = xbar_bar - a2 * r_bar
            
            # Calculate control limits for R chart
            r_ucl = d4 * r_bar
            r_lcl = d3 * r_bar
            
            # Calculate basic statistics
            xbar_max = float(np.max(xbar_values))
            xbar_min = float(np.min(xbar_values))
            xbar_count = len(xbar_values)
            
            r_max = float(np.max(r_values))
            r_min = float(np.min(r_values))
            r_count = len(r_values)
            
            # Calculate standard deviations
            xbar_overall_std = float(np.std(xbar_values, ddof=1))
            r_overall_std = float(np.std(r_values, ddof=1))
            
            # Calculate within-standard deviation for Xbar chart
            # For Xbar-R charts, within-standard deviation = R-bar / d2
            # The d2 constant depends on the subgroup size (n)
            if n == 2:
                d2_xbar = 1.128
            elif n == 3:
                d2_xbar = 1.693
            elif n == 4:
                d2_xbar = 2.059
            elif n == 5:
                d2_xbar = 2.326
            elif n == 6:
                d2_xbar = 2.534
            elif n == 7:
                d2_xbar = 2.704
            elif n == 8:
                d2_xbar = 2.847
            elif n == 9:
                d2_xbar = 2.970
            elif n <= 25:  # up to n=25
                # For larger n, use approximation
                d2_xbar = 2.970 + (n - 9) * 0.029  # Approximate formula
            else:
                d2_xbar = 3.078  # Approximate for larger n
            
            xbar_within_std = r_bar / d2_xbar if d2_xbar > 0 else xbar_overall_std
            
            # Capability indices using the overall average
            tolerance = usl - lsl
            
            # Short-term capability (Cpk) using within-standard deviation
            xbar_cpu = (usl - xbar_bar) / (3 * xbar_within_std) if xbar_within_std > 0 else 0
            xbar_cpl = (xbar_bar - lsl) / (3 * xbar_within_std) if xbar_within_std > 0 else 0
            xbar_cpk = min(xbar_cpu, xbar_cpl) if not (pd.isna(xbar_cpu) or pd.isna(xbar_cpl)) else 0
            xbar_cp = tolerance / (6 * xbar_within_std) if xbar_within_std > 0 else 0
            
            # Long-term capability (Ppk) using overall standard deviation
            xbar_ppu = (usl - xbar_bar) / (3 * xbar_overall_std) if xbar_overall_std > 0 else 0
            xbar_ppl = (xbar_bar - lsl) / (3 * xbar_overall_std) if xbar_overall_std > 0 else 0
            xbar_ppk = min(xbar_ppu, xbar_ppl) if not (pd.isna(xbar_ppu) or pd.isna(xbar_ppl)) else 0
            xbar_pp = tolerance / (6 * xbar_overall_std) if xbar_overall_std > 0 else 0
            
            # Sigma Level & DPMO
            xbar_sigma_level = float(xbar_cpk * 3)
            
            from scipy.stats import norm
            try:
                xbar_dpmo = float(2 * (1 - norm.cdf(abs(xbar_sigma_level))) * 1_000_000)
            except:
                xbar_dpmo = 0.0

            # Western Electric Rules for Xbar chart
            xbar_violations = self.detect_violations(xbar_values, xbar_bar, xbar_ucl, xbar_lcl, xbar_overall_std)
            
            # Western Electric Rules for R chart
            # Use the mean and std of the range values for violation detection
            r_violations = self.detect_violations(r_values, r_bar, r_ucl, r_lcl, r_overall_std)
            
            # Ensure everything is JSON serializable (no NaN)
            def clean_float(f):
                return float(f) if not (pd.isna(f) or np.isinf(f)) else 0.0

            return {
                "stats": {
                    "xbar_mean": clean_float(xbar_bar),
                    "xbar_max": clean_float(xbar_max),
                    "xbar_min": clean_float(xbar_min),
                    "xbar_count": xbar_count,
                    "r_mean": clean_float(r_bar),
                    "r_max": clean_float(r_max),
                    "r_min": clean_float(r_min),
                    "r_count": r_count,
                    "xbar_overall_std": clean_float(xbar_overall_std),
                    "r_overall_std": clean_float(r_overall_std)
                },
                "control_limits": {
                    # Xbar chart limits
                    "ucl_xbar": clean_float(xbar_ucl),
                    "lcl_xbar": clean_float(xbar_lcl),
                    "cl_xbar": clean_float(xbar_bar),
                    # R chart limits
                    "ucl_r": clean_float(r_ucl),
                    "lcl_r": clean_float(r_lcl),
                    "cl_r": clean_float(r_bar)
                },
                "capability": {
                    "xbar_cp": clean_float(xbar_cp),
                    "xbar_cpk": clean_float(xbar_cpk),
                    "xbar_cpu": clean_float(xbar_cpu),
                    "xbar_cpl": clean_float(xbar_cpl),
                    "xbar_pp": clean_float(xbar_pp),
                    "xbar_ppk": clean_float(xbar_ppk),
                    "sigma_level": clean_float(xbar_sigma_level),
                    "dpmo": clean_float(xbar_dpmo)
                },
                "violations": {
                    "xbar_violations": xbar_violations,
                    "r_violations": r_violations
                }
            }
        except Exception as e:
            return {"error": f"Xbar-R chart calculation failed: {str(e)}"}
