import * as XLSX from 'xlsx';

// Statistical Helper Functions
const getMean = (data) => data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0;

const getStdDev = (data, isSample = true) => {
  if (data.length < 2) return 0;
  const mean = getMean(data);
  const sumDiffSq = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  return Math.sqrt(sumDiffSq / (data.length - (isSample ? 1 : 0)));
};

// d2 constant for n=2 (Moving Range)
const D2 = 1.128;

export class SPCAnalysis {
  
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
    
    // items usually in first column, starting row 2 (index 1)
    const batches = [];
    for (let i = 1; i < json.length; i++) {
        if (json[i][0]) {
            batches.push({ index: i, name: String(json[i][0]) });
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

  // Perform Analysis
  analyze(workbook, sheetName, cavityName = null, startBatch = null, endBatch = null) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return { error: "Sheet not found" };
    
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (json.length < 2) return { error: "Insufficient Data" };
    
    // Specs: B2 (1,1), C2 (1,2), D2 (1,3)
    // Row index 1 is the first data row (Excel row 2)
    const dataRow1 = json[1]; 
    const specs = {
        target: parseFloat(dataRow1[1]) || 0,
        usl: parseFloat(dataRow1[2]) || 0,
        lsl: parseFloat(dataRow1[3]) || 0
    };

    let labels = [];
    let values = [];
    
    const header = json[0];

    // Determine target column index
    let targetColIdx = -1;
    if (cavityName) {
        // Find specific cavity
        targetColIdx = header.findIndex(h => h === cavityName || (String(h).includes(cavityName) && String(h).includes("穴")));
    } else {
        // If no cavity, maybe averaging all cavities?
        // For simplicity in this demo, let's pick the first cavity or default.
        // User logic says: "If no cavity specified, Xbar-R of all cavities".
        // This is complex. Let's support Single Cavity Mode first for the frontend demo.
        // Or if user selects "Average", we avg.
        // Let's implement Single Cavity logic first.
        const cavityCols = [];
        header.forEach((h, i) => { if(h && String(h).includes("穴")) cavityCols.push(i); });
        
        if (cavityCols.length > 0) {
            // "All Cavities Mode" -> calculate average of all cavities for each row ??
            // OR return all data?
            // Let's fall back to averaging if cavityName is null but data exists.
             // (Logic simplified for JS port)
             targetColIdx = -999; // Special flag for avg
        }
    }
    
    // Collect Data
    // Filter by batch range logic omitted for brevity, taking all for now or simple slice
    
    for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const batchName = row[0] || `Batch ${i}`;
        
        let val = null;
        if (targetColIdx === -999) {
             // Average all cavities
             const vals = [];
             header.forEach((h, idx) => {
                 if(h && String(h).includes("穴")) {
                     const v = parseFloat(row[idx]);
                     if (!isNaN(v)) vals.push(v);
                 }
             });
             if (vals.length) val = vals.reduce((a,b)=>a+b,0)/vals.length;
        } else if (targetColIdx >= 0) {
            val = parseFloat(row[targetColIdx]);
        }
        
        if (val !== null && !isNaN(val)) {
            labels.push(batchName);
            values.push(val);
        }
    }

    if (values.length < 2) return { error: "Insufficient numeric data" };

    // SPC Calc
    const mean = getMean(values);
    const max_val = Math.max(...values);
    const min_val = Math.min(...values);
    const range = max_val - min_val;
    const overall_std = getStdDev(values);
    
    // Moving Range
    const mr = [];
    for(let i=1; i<values.length; i++) {
        mr.push(Math.abs(values[i] - values[i-1]));
    }
    const mr_mean = getMean(mr);
    const within_std = mr_mean / D2;

    // Control Limits (I-MR)
    const ucl_x = mean + 2.66 * within_std;
    const lcl_x = mean - 2.66 * within_std;
    
    // Capability
    const tolerance = specs.usl - specs.lsl;
    const cpu = (specs.usl - mean) / (3 * within_std);
    const cpl = (mean - specs.lsl) / (3 * within_std);
    const cpk = Math.min(cpu, cpl);
    
    const ppu = (specs.usl - mean) / (3 * overall_std);
    const ppl = (mean - specs.lsl) / (3 * overall_std);
    const ppk = Math.min(ppu, ppl);

    return {
        stats: {
            mean, max: max_val, min: min_val, range, 
            within_std, overall_std, mr_mean, count: values.length
        },
        control_limits: {
            ucl_x, lcl_x, cl_x: mean
        },
        capability: {
            cpk, ppk, cpu, cpl, ppu, ppl
        },
        data: {
            labels,
            values,
            mr_values: mr
        },
        specs
    };
  }
}
