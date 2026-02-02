import * as XLSX from 'xlsx';

// Statistical Helper Functions
const getMean = (data) => data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0;

const getStdDev = (data, isSample = true) => {
    if (data.length < 2) return 0;
    const mean = getMean(data);
    const sumDiffSq = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    return Math.sqrt(sumDiffSq / (data.length - (isSample ? 1 : 0)));
};

// Helper: Get max decimal places from a single value or array
const getPrecision = (data) => {
    const list = Array.isArray(data) ? data : [data];
    let max = 0;
    for (const val of list) {
        if (val === null || val === undefined || val === '') continue;
        const str = String(val).trim();
        if (str.includes('.')) {
            const dec = str.split('.')[1].length;
            if (dec > max) max = dec;
        }
    }
    return Math.min(max, 10);
};

// d2 constant for n=2 (Moving Range)
const D2 = 1.128;

export class SPCAnalysis {
    formatBatchName(name) {
        if (typeof name !== 'string') return name;
        return name.split('-')[0];
    }

    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellNF: true, cellText: true });
                    resolve(workbook);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    }

    getInspectionItems(workbook) {
        const excluded = ["摘要", "Summary", "統計", "說明", "零件名稱", "PartNumber"];
        return workbook.SheetNames.filter(s =>
            !excluded.includes(s) && !s.includes("分析") && !s.includes("配置")
        );
    }

    getBatches(workbook, sheetName) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) return [];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const batches = [];
        // NEW LAYOUT: Data starts at Row 2 (index 1), Batches in Column D (index 3)
        for (let R = 1; R <= range.e.r; R++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: R, c: 3 })];
            if (cell && cell.v !== undefined) {
                batches.push({ index: R, name: this.formatBatchName(String(cell.v)) });
            }
        }
        return batches;
    }

    getCavityInfo(workbook, sheetName) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) return { error: "Sheet not found" };
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const cavityCols = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (cell && cell.v !== undefined) {
                const val = String(cell.v);
                if (val.includes("穴")) cavityCols.push({ name: val, index: C });
            }
        }
        return {
            total_cavities: cavityCols.length,
            cavity_names: cavityCols.map(c => c.name),
            has_cavity_data: cavityCols.length > 0
        };
    }

    getSpecs(sheet) {
        // NEW LAYOUT: Target(A2), USL(B2), LSL(C2)
        const targetCell = sheet['A2'];
        const uslCell = sheet['B2'];
        const lslCell = sheet['C2'];
        const target = (targetCell && targetCell.v !== undefined) ? parseFloat(targetCell.v) : null;
        const usl = (uslCell && uslCell.v !== undefined) ? parseFloat(uslCell.v) : null;
        const lsl = (lslCell && lslCell.v !== undefined) ? parseFloat(lslCell.v) : null;
        const specPrecision = Math.max(
            getPrecision(targetCell ? (targetCell.w || targetCell.v) : null),
            getPrecision(uslCell ? (uslCell.w || uslCell.v) : null),
            getPrecision(lslCell ? (lslCell.w || lslCell.v) : null)
        );

        // Metadata extraction (A5: ProductName, B5: actual; A6: MeasurementUnit, B6: actual)
        const prodNameLabel = sheet['A5']?.v;
        const prodNameValue = sheet['B5']?.v;
        const unitLabel = sheet['A6']?.v;
        const unitValue = sheet['B6']?.v;

        return {
            target, usl, lsl, precision: specPrecision,
            metadata: {
                productName: String(prodNameLabel).includes("ProductName") ? prodNameValue : null,
                unit: String(unitLabel).includes("MeasurementUnit") ? unitValue : null
            }
        };
    }

    // 1. Batch Analysis - Memory Optimized
    async analyzeBatch(workbook, sheetName, cavityName = null, startBatch = null, endBatch = null, skipIndices = []) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) return { error: "Sheet not found" };

        const range = XLSX.utils.decode_range(sheet['!ref']);
        const specs = this.getSpecs(sheet);
        let targetCols = [];
        let isXbar = false;

        for (let C = range.s.c; C <= range.e.c; C++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (!cell || cell.v === undefined) continue;
            const h = String(cell.v);
            if (cavityName) {
                if (h === cavityName || (h.includes(cavityName) && h.includes("穴"))) {
                    targetCols = [C];
                    break;
                }
            } else if (h.includes("穴")) {
                targetCols.push(C);
            }
        }

        if (!cavityName && targetCols.length > 0) isXbar = true;
        if (targetCols.length === 0) return { error: "No matching cavity/data column found." };

        let labels = [];
        let values = [];
        let rangeValues = [];
        let allRawPoints = []; // Collect all raw measurements for overall sigma
        let dataMaxPrecision = 0;
        let rawData = []; // Store raw measurements for each row

        for (let R = 1; R <= range.e.r; R++) {
            if (startBatch !== null && R < Number(startBatch)) continue;
            if (endBatch !== null && R > Number(endBatch)) continue;
            if (skipIndices.includes(R)) continue;

            const batchCell = sheet[XLSX.utils.encode_cell({ r: R, c: 3 })];
            const batchName = this.formatBatchName(batchCell ? String(batchCell.v) : `Batch ${R}`);

            let rowVals = [];
            targetCols.forEach(C => {
                const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell && cell.v !== undefined) {
                    const v = parseFloat(cell.v);
                    if (!isNaN(v)) {
                        rowVals.push(v);
                        allRawPoints.push(v); // Collect for overall sigma
                        if (cell.w || cell.v !== undefined) {
                            dataMaxPrecision = Math.max(dataMaxPrecision, getPrecision(cell.w || cell.v));
                        }
                    }
                }
            });

            if (rowVals.length > 0) {
                labels.push(batchName);
                rawData.push(rowVals); // Store raw values
                if (isXbar) {
                    values.push(getMean(rowVals));
                    rangeValues.push(Math.max(...rowVals) - Math.min(...rowVals));
                } else {
                    values.push(rowVals[0]);
                }
            }
        }

        if (values.length < 2) return { error: "Insufficient numeric data" };

        // Use allRawPoints for overall sigma (Ppk), not batch averages
        const mean = getMean(allRawPoints);
        const overall_std = getStdDev(allRawPoints);
        let ucl_x, lcl_x, ucl_r, lcl_r, cl_r, within_std;
        let mr = [];

        if (isXbar) {
            const r_bar = getMean(rangeValues);
            const n = Math.max(2, Math.min(targetCols.length, 48)); // Extended to 48
            const A2_Map = { 2: 1.88, 3: 1.02, 4: 0.73, 5: 0.58, 6: 0.48, 7: 0.42, 8: 0.37, 9: 0.34, 10: 0.31, 11: 0.29, 12: 0.27, 13: 0.25, 14: 0.24, 15: 0.22, 16: 0.21, 17: 0.20, 18: 0.19, 19: 0.19, 20: 0.18, 21: 0.17, 22: 0.17, 23: 0.16, 24: 0.16, 25: 0.15, 26: 0.15, 27: 0.14, 28: 0.14, 29: 0.13, 30: 0.13, 31: 0.13, 32: 0.12, 33: 0.12, 34: 0.12, 35: 0.11, 36: 0.11, 37: 0.11, 38: 0.10, 39: 0.10, 40: 0.10, 41: 0.10, 42: 0.10, 43: 0.09, 44: 0.09, 45: 0.09, 46: 0.09, 47: 0.09, 48: 0.09 };
            const D4_Map = { 2: 3.27, 3: 2.57, 4: 2.28, 5: 2.11, 6: 2.00, 7: 1.92, 8: 1.86, 9: 1.82, 10: 1.78, 11: 1.74, 12: 1.72, 13: 1.69, 14: 1.67, 15: 1.65, 16: 1.64, 17: 1.62, 18: 1.61, 19: 1.60, 20: 1.59, 21: 1.58, 22: 1.57, 23: 1.56, 24: 1.55, 25: 1.54, 26: 1.54, 27: 1.53, 28: 1.53, 29: 1.52, 30: 1.52, 31: 1.51, 32: 1.51, 33: 1.50, 34: 1.50, 35: 1.50, 36: 1.49, 37: 1.49, 38: 1.49, 39: 1.48, 40: 1.48, 41: 1.48, 42: 1.47, 43: 1.47, 44: 1.47, 45: 1.47, 46: 1.46, 47: 1.46, 48: 1.46 };
            const D3_Map = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.08, 8: 0.14, 9: 0.18, 10: 0.22, 11: 0.26, 12: 0.28, 13: 0.31, 14: 0.33, 15: 0.35, 16: 0.36, 17: 0.38, 18: 0.39, 19: 0.40, 20: 0.41, 21: 0.43, 22: 0.43, 23: 0.44, 24: 0.45, 25: 0.46, 26: 0.46, 27: 0.47, 28: 0.47, 29: 0.48, 30: 0.48, 31: 0.49, 32: 0.49, 33: 0.50, 34: 0.50, 35: 0.50, 36: 0.51, 37: 0.51, 38: 0.51, 39: 0.52, 40: 0.52, 41: 0.52, 42: 0.53, 43: 0.53, 44: 0.53, 45: 0.53, 46: 0.54, 47: 0.54, 48: 0.54 };
            const d2_Map = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078, 11: 3.173, 12: 3.258, 13: 3.336, 14: 3.407, 15: 3.472, 16: 3.532, 17: 3.588, 18: 3.640, 19: 3.689, 20: 3.735, 21: 3.778, 22: 3.819, 23: 3.858, 24: 3.895, 25: 3.931, 26: 3.964, 27: 3.997, 28: 4.027, 29: 4.057, 30: 4.086, 31: 4.113, 32: 4.139, 33: 4.165, 34: 4.189, 35: 4.213, 36: 4.236, 37: 4.259, 38: 4.280, 39: 4.301, 40: 4.322, 41: 4.341, 42: 4.361, 43: 4.379, 44: 4.398, 45: 4.415, 46: 4.433, 47: 4.450, 48: 4.466 };
            const xbar_mean = getMean(values); // Use batch averages for control limits
            ucl_x = xbar_mean + (A2_Map[n] || 0.09) * r_bar;
            lcl_x = xbar_mean - (A2_Map[n] || 0.09) * r_bar;
            ucl_r = (D4_Map[n] || 1.46) * r_bar;
            lcl_r = (D3_Map[n] || 0.54) * r_bar;
            cl_r = r_bar;
            within_std = r_bar / (d2_Map[n] || 4.466);
        } else {
            for (let i = 1; i < values.length; i++) mr.push(Math.abs(values[i] - values[i - 1]));
            const mr_mean = getMean(mr);
            within_std = mr_mean / D2;
            ucl_x = mean + 2.66 * within_std;
            lcl_x = mean - 2.66 * within_std;
            cl_r = mr_mean;
            ucl_r = 3.267 * mr_mean;
            lcl_r = 0;
        }

        const cpk = (specs.usl !== null && specs.lsl !== null) ? Math.min((specs.usl - mean) / (3 * within_std), (mean - specs.lsl) / (3 * within_std)) : null;
        const ppk = (specs.usl !== null && specs.lsl !== null) ? Math.min((specs.usl - mean) / (3 * overall_std), (mean - specs.lsl) / (3 * overall_std)) : null;

        // --- Nelson Rules Detection ---
        const violations_detail = this.detectNelsonRules(values, mean, ucl_x, lcl_x, labels, within_std);
        const xbar_violations = violations_detail.map(v => v.message);
        const r_violations = [];
        const current_r_values = isXbar ? rangeValues : mr;

        current_r_values.forEach((v, i) => {
            if (v > ucl_r || v < lcl_r) {
                r_violations.push(`${isXbar ? labels[i] : labels[i + 1]}: Range (${v.toFixed(dataMaxPrecision)}) out of control limits`);
            }
        });

        // --- Normal Distribution Plot Data ---
        // 1. Histogram
        const numBins = 15;
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const binWidth = (maxVal - minVal) / numBins;
        const bin_centers = [];
        const counts = Array(numBins).fill(0);

        for (let i = 0; i < numBins; i++) {
            bin_centers.push(minVal + (i + 0.5) * binWidth);
        }

        values.forEach(v => {
            let binIdx = Math.floor((v - minVal) / binWidth);
            if (binIdx === numBins) binIdx = numBins - 1;
            if (binIdx >= 0 && binIdx < numBins) counts[binIdx]++;
        });

        // 2. Normal Curves (Within and Overall)
        const curve_x = [];
        const curve_within = [];
        const curve_overall = [];
        const combined_std = Math.max(within_std, overall_std);
        const curveStart = mean - 4 * combined_std;
        const curveEnd = mean + 4 * combined_std;
        const step = (curveEnd - curveStart) / 100;

        const normalPDF = (x, m, s) => {
            if (s <= 0) return 0;
            return (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - m) / s, 2));
        };

        for (let i = 0; i <= 100; i++) {
            const x = curveStart + i * step;
            curve_x.push(x);
            curve_within.push(normalPDF(x, mean, within_std) * values.length * binWidth);
            curve_overall.push(normalPDF(x, mean, overall_std) * values.length * binWidth);
        }

        return {
            stats: { mean, within_std, overall_std, std_within: within_std, std_overall: overall_std, count: values.length },
            control_limits: {
                ucl_x, lcl_x, cl_x: mean, ucl_r, lcl_r, cl_r,
                ucl_xbar: ucl_x, lcl_xbar: lcl_x, cl_xbar: mean,
                ucl_mr: ucl_r, cl_mr: cl_r // Compatibility for I-MR
            },
            capability: { cpk, ppk, xbar_cpk: cpk, xbar_ppk: ppk },
            data: {
                cavity_actual_name: isXbar ? "Average of All Cavities" : cavityName,
                labels, values, r_values: isXbar ? rangeValues : mr, r_labels: labels,
                mr_values: isXbar ? [] : mr,
                rawData,
                targetColsHead: targetCols.map(C => String(sheet[XLSX.utils.encode_cell({ r: 0, c: C })]?.v || ""))
            },
            specs: {
                target: specs.target,
                usl: specs.usl,
                lsl: specs.lsl,
                decimals: specs.precision > 0 ? specs.precision : dataMaxPrecision,
                metadata: specs.metadata
            },
            violations: { xbar_violations, r_violations },
            violations_detail,
            distribution: {
                histogram: { bin_centers, counts },
                curve: { x: curve_x, within: curve_within, overall: curve_overall }
            }
        };
    }

    detectNelsonRules(data, cl, ucl, lcl, labels, sigma) {
        const violations = [];
        if (sigma <= 0) return [];

        const z1_u = cl + 1 * sigma;
        const z1_l = cl - 1 * sigma;
        const z2_u = cl + 2 * sigma;
        const z2_l = cl - 2 * sigma;

        // Rule 1: One point beyond 3 sigma
        data.forEach((v, i) => {
            if (v > ucl || v < lcl) {
                violations.push({
                    rule: "Rule 1",
                    index: i,
                    message: `Rule 1: Point ${labels[i]} is outside control limits (${v.toFixed(4)})`
                });
            }
        });

        // Rule 2: 9 consecutive points on same side
        let side = 0;
        let count = 0;
        data.forEach((v, i) => {
            const current_side = v > cl ? 1 : v < cl ? -1 : 0;
            if (current_side !== 0) {
                if (current_side === side) {
                    count++;
                } else {
                    side = current_side;
                    count = 1;
                }
                if (count >= 9) {
                    violations.push({
                        rule: "Rule 2",
                        index: i,
                        message: `Rule 2: 9 consecutive points on one side at point ${labels[i]}`
                    });
                }
            } else {
                count = 0;
                side = 0;
            }
        });

        // Rule 3: 6 points in a row increasing or decreasing
        let trend = 0;
        let tCount = 1;
        for (let i = 1; i < data.length; i++) {
            const current_trend = data[i] > data[i - 1] ? 1 : data[i] < data[i - 1] ? -1 : 0;
            if (current_trend !== 0) {
                if (current_trend === trend) {
                    tCount++;
                } else {
                    trend = current_trend;
                    tCount = 2;
                }
                if (tCount >= 6) {
                    violations.push({
                        rule: "Rule 3",
                        index: i,
                        message: `Rule 3: 6 consecutive points increasing or decreasing at point ${labels[i]}`
                    });
                }
            } else {
                tCount = 1;
                trend = 0;
            }
        }

        // Rule 4: 14 points alternating direction
        if (data.length >= 14) {
            for (let i = 13; i < data.length; i++) {
                let alternating = true;
                for (let j = i - 12; j <= i; j++) {
                    const diff1 = data[j] - data[j - 1];
                    const diff2 = data[j - 1] - data[j - 2];
                    if (diff1 * diff2 >= 0) {
                        alternating = false;
                        break;
                    }
                }
                if (alternating) {
                    violations.push({
                        rule: "Rule 4",
                        index: i,
                        message: `Rule 4: 14 points alternating direction at point ${labels[i]}`
                    });
                }
            }
        }

        // Rule 5: 2 out of 3 points > 2σ (same side)
        if (data.length >= 3) {
            for (let i = 2; i < data.length; i++) {
                const window = data.slice(i - 2, i + 1);
                if (window.filter(v => v > z2_u).length >= 2) {
                    violations.push({ rule: "Rule 5", index: i, message: `Rule 5: 2 of 3 points > 2σ (Upper) at point ${labels[i]}` });
                }
                if (window.filter(v => v < z2_l).length >= 2) {
                    violations.push({ rule: "Rule 5", index: i, message: `Rule 5: 2 of 3 points > 2σ (Lower) at point ${labels[i]}` });
                }
            }
        }

        // Rule 6: 4 out of 5 points > 1σ (same side)
        if (data.length >= 5) {
            for (let i = 4; i < data.length; i++) {
                const window = data.slice(i - 4, i + 1);
                if (window.filter(v => v > z1_u).length >= 4) {
                    violations.push({ rule: "Rule 6", index: i, message: `Rule 6: 4 of 5 points > 1σ (Upper) at point ${labels[i]}` });
                }
                if (window.filter(v => v < z1_l).length >= 4) {
                    violations.push({ rule: "Rule 6", index: i, message: `Rule 6: 4 of 5 points > 1σ (Lower) at point ${labels[i]}` });
                }
            }
        }

        return violations;
    }

    async analyzeCavity(workbook, sheetName, startBatch = null, endBatch = null, skipIndices = []) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) return { error: "Sheet not found" };
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const specs = this.getSpecs(sheet);
        let dataMaxPrecision = 0;
        let cavityData = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            const headCell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (headCell && String(headCell.v).includes("穴")) {
                const vals = [];
                for (let R = 1; R <= range.e.r; R++) {
                    if (startBatch !== null && R < Number(startBatch)) continue;
                    if (endBatch !== null && R > Number(endBatch)) continue;
                    if (skipIndices.includes(R)) continue;
                    const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (cell && cell.v !== undefined) {
                        const v = parseFloat(cell.v);
                        if (!isNaN(v)) {
                            vals.push(v);
                            if (cell.w || cell.v !== undefined) dataMaxPrecision = Math.max(dataMaxPrecision, getPrecision(cell.w || cell.v));
                        }
                    }
                }
                if (vals.length > 2) {
                    const mean = getMean(vals);
                    const mr = [];
                    for (let k = 1; k < vals.length; k++) mr.push(Math.abs(vals[k] - vals[k - 1]));
                    const sigma = getMean(mr) / D2;
                    const cpk = (specs.usl !== null && specs.lsl !== null) ? Math.min((specs.usl - mean) / (3 * sigma), (mean - specs.lsl) / (3 * sigma)) : null;
                    cavityData.push({ cavity: String(headCell.v), mean, cpk });
                }
            }
        }
        return { cavities: cavityData, specs: { ...specs, decimals: specs.precision > 0 ? specs.precision : dataMaxPrecision, metadata: specs.metadata } };
    }

    async analyzeGroup(workbook, sheetName, startBatch = null, endBatch = null, skipIndices = []) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) return { error: "Sheet not found" };
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const specs = this.getSpecs(sheet);
        let dataMaxPrecision = 0;
        let cavityIndices = [];
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (cell && String(cell.v).includes("穴")) cavityIndices.push(C);
        }
        const groups = [];
        for (let R = 1; R <= range.e.r; R++) {
            if (startBatch !== null && R < Number(startBatch)) continue;
            if (endBatch !== null && R > Number(endBatch)) continue;
            if (skipIndices.includes(R)) continue;
            const batchCell = sheet[XLSX.utils.encode_cell({ r: R, c: 3 })];
            const batchName = this.formatBatchName(batchCell ? String(batchCell.v) : `Batch ${R}`);
            const rowVals = [];
            cavityIndices.forEach(C => {
                const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell && cell.v !== undefined) {
                    const v = parseFloat(cell.v);
                    if (!isNaN(v)) {
                        rowVals.push(v);
                        if (cell.w || cell.v !== undefined) dataMaxPrecision = Math.max(dataMaxPrecision, getPrecision(cell.w || cell.v));
                    }
                }
            });
            if (rowVals.length > 0) {
                groups.push({ batch: batchName, min: Math.min(...rowVals), max: Math.max(...rowVals), avg: getMean(rowVals) });
            }
        }
        return { groups: groups, specs: { ...specs, decimals: specs.precision > 0 ? specs.precision : dataMaxPrecision, metadata: specs.metadata }, cavity_names: cavityIndices.map(C => String(sheet[XLSX.utils.encode_cell({ r: 0, c: C })]?.v || "")) };
    }
}
