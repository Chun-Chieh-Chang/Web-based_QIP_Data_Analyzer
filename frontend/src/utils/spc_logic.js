import * as XLSX from 'xlsx';

// Statistical Helper Functions
const getMean = (data) => data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0;

const getStdDev = (data, isSample = true) => {
    if (data.length < 2) return 0;
    const mean = getMean(data);
    const sumDiffSq = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    return Math.sqrt(sumDiffSq / (data.length - (isSample ? 1 : 0)));
};

// Helper: Get max decimal places from array
const getPrecision = (data) => {
    let max = 0;
    for (const val of data) {
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
    // Helper to format batch name (remove suffix after '-')
    formatBatchName(name) {
        if (typeof name !== 'string') return name;
        return name.split('-')[0];
    }

    // Parse Excel File from Input
    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    }

    // Get valid inspection items (sheets)
    getInspectionItems(workbook) {
        const excluded = ["摘要", "Summary", "統計", "說明"];
        return workbook.SheetNames.filter(s =>
            !excluded.includes(s) && !s.includes("分析") && !s.includes("配置")
        );
    }

    // Get Batches for a specific sheet
    getBatches(workbook, sheetName) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return [];

        // Read column A skipping header
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 2) return [];

        // Row 1: Header (index 0)
        // Row 2: Specs (index 1)
        // Row 3+: Data (index 2 onwards)
        const batches = [];
        for (let i = 2; i < json.length; i++) {
            if (json[i][0]) {
                batches.push({ index: i, name: this.formatBatchName(String(json[i][0])) });
            }
        }
        return batches;
    }

    // Get Cavity Info
    getCavityInfo(workbook, sheetName) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return { error: "Sheet not found" };

        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!json.length) return { error: "Empty Data" };

        const header = json[0];
        const cavityCols = [];
        header.forEach((h, idx) => {
            if (h && String(h).includes("穴")) {
                cavityCols.push({ name: h, index: idx });
            }
        });

        return {
            total_cavities: cavityCols.length,
            cavity_names: cavityCols.map(c => c.name),
            has_cavity_data: cavityCols.length > 0
        };
    }

    // Help read specs and detect their precision
    getSpecs(json) {
        if (json.length < 2) return { target: 0, usl: 0, lsl: 0, precision: 0 };
        const row = json[1];
        const targetRaw = row[1];
        const uslRaw = row[2];
        const lslRaw = row[3];

        return {
            target: parseFloat(targetRaw) || 0,
            usl: parseFloat(uslRaw) || 0,
            lsl: parseFloat(lslRaw) || 0,
            precision: getPrecision([targetRaw, uslRaw, lslRaw])
        };
    }

    // 1. Batch Analysis (I-MR or Xbar-R)
    analyzeBatch(workbook, sheetName, cavityName = null, startBatch = null, endBatch = null, skipIndices = []) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return { error: "Sheet not found" };

        // Use raw: false to get formatted strings for precision detection
        const jsonFormatted = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        // Use raw: true for calculations
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

        if (json.length < 2) return { error: "Insufficient Data" };

        const specs = this.getSpecs(jsonFormatted);
        const header = json[0];

        // Check mode
        // If no cavityName provided, we assume Xbar-R of all cavities (if cavities exist)
        let isXbar = false;
        let targetCols = [];

        if (cavityName) {
            // Individual Cavity
            const idx = header.findIndex(h => h === cavityName || (String(h).includes(cavityName) && String(h).includes("穴")));
            if (idx !== -1) targetCols = [idx];
        } else {
            // All Cavities
            header.forEach((h, i) => { if (h && String(h).includes("穴")) targetCols.push(i); });
            if (targetCols.length > 0) isXbar = true;
        }

        if (targetCols.length === 0) return { error: "No matching cavity/data column found." };

        let labels = [];
        let values = [];      // For I-MR: individual values. For Xbar: averages.
        let rangeValues = []; // For Xbar: ranges.
        let rawSourceData = []; // To track source precision

        // Start from Row 3 (index 2) to skip Header and Specs
        for (let i = 2; i < json.length; i++) {
            // Range Filter
            if (startBatch !== null && i < Number(startBatch)) continue;
            if (endBatch !== null && i > Number(endBatch)) continue;
            if (skipIndices.includes(i)) continue;

            const row = json[i];
            const batchName = this.formatBatchName(row[0] || `Batch ${i}`);

            let rowVals = [];
            targetCols.forEach(idx => {
                const val = row[idx];
                const formattedVal = jsonFormatted[i] ? jsonFormatted[i][idx] : null;
                const v = parseFloat(val);
                if (!isNaN(v)) {
                    rowVals.push(v);
                    rawSourceData.push(formattedVal);
                }
            });

            if (rowVals.length > 0) {
                labels.push(batchName);
                if (isXbar) {
                    // Xbar Logic: Avg of row
                    const avg = rowVals.reduce((a, b) => a + b, 0) / rowVals.length;
                    const rng = Math.max(...rowVals) - Math.min(...rowVals);
                    values.push(avg);
                    rangeValues.push(rng);
                } else {
                    // I-MR Logic: Single value
                    values.push(rowVals[0]);
                }
            }
        }

        if (values.length < 2) return { error: "Insufficient numeric data" };

        const mean = getMean(values);
        let ucl_x, lcl_x, ucl_r, lcl_r, cl_r;
        let mr = [], mr_mean = 0;

        // Stats for capability
        let within_std = 0;
        const overall_std = getStdDev(values);

        if (isXbar) {
            // Xbar-R Stats
            const r_bar = getMean(rangeValues);
            // Constants for n (subgroup size = num cavities)
            // Simplified lookup (approximate for n=2 to 10)
            // n:  2     3     4     5     6     7     8
            // A2: 1.88  1.02  0.73  0.58  0.48  0.42  0.37
            // D4: 3.27  2.57  2.28  2.11  2.00  1.92  1.86
            // D3: 0     0     0     0     0     0.08  0.14
            const n = Math.max(2, Math.min(targetCols.length, 10)); // Clamp n
            const A2_Map = { 2: 1.88, 3: 1.02, 4: 0.73, 5: 0.58, 6: 0.48, 7: 0.42, 8: 0.37, 9: 0.34, 10: 0.31 };
            const D4_Map = { 2: 3.27, 3: 2.57, 4: 2.28, 5: 2.11, 6: 2.00, 7: 1.92, 8: 1.86, 9: 1.82, 10: 1.78 };
            const D3_Map = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.08, 8: 0.14, 9: 0.18, 10: 0.22 };

            const A2 = A2_Map[n] || 0.31;
            const D4 = D4_Map[n] || 1.78;
            const D3 = D3_Map[n] || 0.22;
            const d2 = 2.326; // approx for sigma est if needed, but we use Rbar/d2 usually. 
            // For Cpk using Rbar method: sigma_within = Rbar / d2
            // d2 table: 2->1.128, 3->1.693, 4->2.059, 5->2.326 ...
            const d2_Map = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };
            const d2_val = d2_Map[n] || 3.078;

            ucl_x = mean + A2 * r_bar;
            lcl_x = mean - A2 * r_bar;

            ucl_r = D4 * r_bar;
            lcl_r = D3 * r_bar;
            cl_r = r_bar;

            within_std = r_bar / d2_val;

        } else {
            // I-MR Stats
            for (let i = 1; i < values.length; i++) mr.push(Math.abs(values[i] - values[i - 1]));
            mr_mean = getMean(mr);
            within_std = mr_mean / D2;

            ucl_x = mean + 2.66 * within_std;
            lcl_x = mean - 2.66 * within_std;

            // MR Chart
            ucl_r = 3.267 * mr_mean;
            lcl_r = 0;
            cl_r = mr_mean;
        }

        // Capability
        const cpu = (specs.usl - mean) / (3 * within_std);
        const cpl = (mean - specs.lsl) / (3 * within_std);
        const cpk = Math.min(cpu, cpl);

        const ppu = (specs.usl - mean) / (3 * overall_std);
        const ppl = (mean - specs.lsl) / (3 * overall_std);
        const ppk = Math.min(ppu, ppl);

        return {
            stats: { mean, within_std, overall_std },
            control_limits: {
                ucl_x, lcl_x, cl_x: mean,
                ucl_r: ucl_r, lcl_r: lcl_r, cl_r: cl_r,
                ucl_xbar: ucl_x, lcl_xbar: lcl_x, cl_xbar: mean // Alias for frontend compat
            },
            capability: { cpk, ppk },
            data: {
                cavity_actual_name: isXbar ? "Average of All Cavities" : cavityName,
                labels,
                values,
                mr_values: mr,
                r_values: rangeValues.length ? rangeValues : [],
                r_labels: labels
            },
            specs: {
                target: specs.target,
                usl: specs.usl,
                lsl: specs.lsl,
                // Prioritize Spec precision if defined (>0), otherwise fallback to data
                decimals: (specs.precision !== undefined && specs.precision > 0) ? specs.precision : getPrecision(rawSourceData)
            }
        };
    }

    // 2. Cavity Comparison
    analyzeCavity(workbook, sheetName, startBatch = null, endBatch = null, skipIndices = []) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return { error: "Sheet not found" };

        const jsonFormatted = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

        const specs = this.getSpecs(jsonFormatted);
        const header = json[0];
        let rawSourceStrings = [];

        let cavityData = [];

        // Find all cavity columns
        header.forEach((h, idx) => {
            if (h && String(h).includes("穴")) {
                // Calculate stats for this cavity
                const vals = [];
                for (let i = 2; i < json.length; i++) { // Start index 2
                    // Range Filter
                    if (startBatch !== null && i < Number(startBatch)) continue;
                    if (endBatch !== null && i > Number(endBatch)) continue;
                    if (skipIndices.includes(i)) continue;

                    const rawVal = jsonFormatted[i] ? jsonFormatted[i][idx] : null;
                    const v = parseFloat(json[i][idx]);
                    if (!isNaN(v)) {
                        vals.push(v);
                        rawSourceStrings.push(rawVal);
                    }
                }
                if (vals.length > 2) {
                    const mean = getMean(vals);
                    // I-MR logic for individual cavity capability
                    const mr = [];
                    for (let k = 1; k < vals.length; k++) mr.push(Math.abs(vals[k] - vals[k - 1]));
                    const mr_mean = getMean(mr);
                    const sigma = mr_mean / D2;

                    const cpu = (specs.usl - mean) / (3 * sigma);
                    const cpl = (mean - specs.lsl) / (3 * sigma);
                    const cpk = Math.min(cpu, cpl);

                    cavityData.push({
                        cavity: h,
                        mean,
                        cpk,
                        ppk: 0 // Simplification
                    });
                }
            }
        });

        return {
            cavities: cavityData,
            specs: {
                target: specs.target,
                usl: specs.usl,
                lsl: specs.lsl,
                decimals: (specs.precision !== undefined && specs.precision > 0) ? specs.precision : getPrecision(rawSourceStrings)
            }
        };
    }

    // 3. Group Trend
    analyzeGroup(workbook, sheetName, startBatch = null, endBatch = null, skipIndices = []) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return { error: "Sheet not found" };

        const jsonFormatted = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

        const specs = this.getSpecs(jsonFormatted);
        const header = json[0];
        let rawSourceStrings = [];

        const cavityIndices = [];
        header.forEach((h, i) => { if (h && String(h).includes("穴")) cavityIndices.push(i); });

        if (cavityIndices.length === 0) return { error: "No cavities found for group analysis" };

        const groups = [];

        for (let i = 2; i < json.length; i++) { // Start index 2
            // Range Filter
            if (startBatch !== null && i < Number(startBatch)) continue;
            if (endBatch !== null && i > Number(endBatch)) continue;
            if (skipIndices.includes(i)) continue;

            const row = json[i];
            const batchIdx = this.formatBatchName(row[0] || i);
            const vals = [];
            cavityIndices.forEach(idx => {
                const rawVal = jsonFormatted[i] ? jsonFormatted[i][idx] : null;
                const v = parseFloat(row[idx]);
                if (!isNaN(v)) {
                    vals.push(v);
                    rawSourceStrings.push(rawVal);
                }
            });

            if (vals.length > 0) {
                groups.push({
                    batch: String(batchIdx),
                    min: Math.min(...vals),
                    max: Math.max(...vals),
                    avg: vals.reduce((a, b) => a + b, 0) / vals.length
                });
            }
        }

        return {
            groups,
            specs: {
                target: specs.target,
                usl: specs.usl,
                lsl: specs.lsl,
                decimals: (specs.precision !== undefined && specs.precision > 0) ? specs.precision : getPrecision(rawSourceStrings)
            }
        };
    }
}
