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

// Helper to yield execution to allow Worker to respond to status requests/breathe
const yieldExecution = () => new Promise(resolve => setTimeout(resolve, 0));

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
        for (let R = 2; R <= range.e.r; R++) {
            const cell = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
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
        const targetCell = sheet['B2'];
        const uslCell = sheet['C2'];
        const lslCell = sheet['D2'];
        const target = targetCell ? parseFloat(targetCell.v) : null;
        const usl = uslCell ? parseFloat(uslCell.v) : null;
        const lsl = lslCell ? parseFloat(lslCell.v) : null;
        const specPrecision = Math.max(
            getPrecision(targetCell ? (targetCell.w || targetCell.v) : null),
            getPrecision(uslCell ? (uslCell.w || uslCell.v) : null),
            getPrecision(lslCell ? (lslCell.w || lslCell.v) : null)
        );
        return { target, usl, lsl, precision: specPrecision };
    }

    // 1. Batch Analysis - Memory Optimized & Async-friendly
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
        let dataMaxPrecision = 0;

        for (let R = 2; R <= range.e.r; R++) {
            // Periodically yield to prevent total UI freeze on large files
            if (R % 500 === 0) await yieldExecution();

            if (startBatch !== null && R < Number(startBatch)) continue;
            if (endBatch !== null && R > Number(endBatch)) continue;
            if (skipIndices.includes(R)) continue;

            const batchCell = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
            const batchName = this.formatBatchName(batchCell ? String(batchCell.v) : `Batch ${R}`);

            let rowVals = [];
            targetCols.forEach(C => {
                const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell && cell.v !== undefined) {
                    const v = parseFloat(cell.v);
                    if (!isNaN(v)) {
                        rowVals.push(v);
                        if (cell.w || cell.v !== undefined) {
                            dataMaxPrecision = Math.max(dataMaxPrecision, getPrecision(cell.w || cell.v));
                        }
                    }
                }
            });

            if (rowVals.length > 0) {
                labels.push(batchName);
                if (isXbar) {
                    values.push(getMean(rowVals));
                    rangeValues.push(Math.max(...rowVals) - Math.min(...rowVals));
                } else {
                    values.push(rowVals[0]);
                }
            }
        }

        if (values.length < 2) return { error: "Insufficient numeric data" };

        const mean = getMean(values);
        const overall_std = getStdDev(values);
        let ucl_x, lcl_x, ucl_r, lcl_r, cl_r, within_std;
        let mr = [];

        if (isXbar) {
            const r_bar = getMean(rangeValues);
            const n = Math.max(2, Math.min(targetCols.length, 10));
            const A2_Map = { 2: 1.88, 3: 1.02, 4: 0.73, 5: 0.58, 6: 0.48, 7: 0.42, 8: 0.37, 9: 0.34, 10: 0.31 };
            const D4_Map = { 2: 3.27, 3: 2.57, 4: 2.28, 5: 2.11, 6: 2.00, 7: 1.92, 8: 1.86, 9: 1.82, 10: 1.78 };
            const D3_Map = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.08, 8: 0.14, 9: 0.18, 10: 0.22 };
            const d2_Map = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };
            ucl_x = mean + (A2_Map[n] || 0.31) * r_bar;
            lcl_x = mean - (A2_Map[n] || 0.31) * r_bar;
            ucl_r = (D4_Map[n] || 1.78) * r_bar;
            lcl_r = (D3_Map[n] || 0) * r_bar;
            cl_r = r_bar;
            within_std = r_bar / (d2_Map[n] || 3.078);
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

        return {
            stats: { mean, within_std, overall_std, std_within: within_std, std_overall: overall_std },
            control_limits: { ucl_x, lcl_x, cl_x: mean, ucl_r, lcl_r, cl_r, ucl_xbar: ucl_x, lcl_xbar: lcl_x, cl_xbar: mean },
            capability: { cpk, ppk },
            data: { cavity_actual_name: isXbar ? "Average of All Cavities" : cavityName, labels, values, r_values: isXbar ? rangeValues : mr, r_labels: labels },
            specs: { target: specs.target, usl: specs.usl, lsl: specs.lsl, decimals: specs.precision > 0 ? specs.precision : dataMaxPrecision }
        };
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
                for (let R = 2; R <= range.e.r; R++) {
                    if (R % 1000 === 0) await yieldExecution();
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
        return { cavities: cavityData, specs: { ...specs, decimals: specs.precision > 0 ? specs.precision : dataMaxPrecision } };
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
        for (let R = 2; R <= range.e.r; R++) {
            if (R % 500 === 0) await yieldExecution();
            if (startBatch !== null && R < Number(startBatch)) continue;
            if (endBatch !== null && R > Number(endBatch)) continue;
            if (skipIndices.includes(R)) continue;
            const batchCell = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
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
        return { groups, specs: { ...specs, decimals: specs.precision > 0 ? specs.precision : dataMaxPrecision } };
    }
}
