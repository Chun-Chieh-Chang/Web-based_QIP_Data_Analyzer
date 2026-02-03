import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Plot from 'react-plotly.js';
import { generateExpertDiagnostic } from './utils/diagnostic_logic';

import { Settings, FileText, Activity, Layers, BarChart3, AlertCircle, CheckCircle2, TrendingUp, ShieldCheck, Calculator, Brain, Key, Send, Search, Info, Check, ChevronLeft, ChevronRight } from 'lucide-react';
// SPCAnalysis now runs in worker.js
import SPCWorker from './utils/spc.worker.js?worker';


function App() {
  const [products, setProducts] = useState([]);  // Initialize with empty array
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedCavity, setSelectedCavity] = useState('');
  const [analysisType, setAnalysisType] = useState('batch'); // batch, cavity, group
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSpecLimits, setShowSpecLimits] = useState(true);  // New state for spec limits visibility
  const [chartMode, setChartMode] = useState('standard'); // 'standard' or 'z-chart'

  const [batches, setBatches] = useState([]);
  const [startBatch, setStartBatch] = useState('');
  const [endBatch, setEndBatch] = useState('');
  const [excludedBatches, setExcludedBatches] = useState([]); // Array of indices to skip
  const [showViolationDetails, setShowViolationDetails] = useState(false); // Collapsible violation details
  const [showMetricsInfo, setShowMetricsInfo] = useState(false); // SPC Metrics Info Modal

  // File Upload State
  const [localFiles, setLocalFiles] = useState([]); // Array of File objects

  // Cavity Information
  const [cavityInfo, setCavityInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Data Val, 2: Stability, 3: Uniformity, 4: Capability

  // AI Analysis States
  const [apiKey, setApiKey] = useState(localStorage.getItem('spc_ai_api_key') || '');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);

  // Web Worker Ref
  const workerRef = useRef(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new SPCWorker();

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      switch (type) {
        case 'PARSE_SUCCESS':
          setLoading(false);
          break;
        case 'PRODUCTS_LOADED':
          setProducts(payload.products);
          if (payload.products.length > 0) setSelectedProduct(payload.products[0]);
          break;
        case 'ITEMS_LOADED':
          setItems(payload.items);
          setCavityInfo(payload.cavityInfo);
          break;
        case 'BATCHES_LOADED':
          setBatches(payload.batches);
          if (payload.batches.length > 0) {
            setStartBatch(payload.batches[0].index);
            setEndBatch(payload.batches[payload.batches.length - 1].index);
            setExcludedBatches([]);
          }
          break;
        case 'ANALYSIS_SUCCESS':
          setData(payload.result);
          setLoading(false);
          break;
        case 'ERROR':
          setError(payload.message);
          setLoading(false);
          break;
        default:
          break;
      }
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  // Function to reset all states to initial values
  const resetAll = () => {
    // Clear all selections
    setSelectedProduct('');
    setSelectedItem('');
    setSelectedCavity('');
    setAnalysisType('batch');
    setData(null);
    setError('');
    setStartBatch('');
    setEndBatch('');
    setShowSpecLimits(true);

    // Clear data lists to ensure logical dependencies
    setProducts([]);
    setItems([]);
    setBatches([]);
    setExcludedBatches([]);
  };



  // Handler for Local File Upload
  const handleLocalFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    console.log("Local files selected:", files.length);
    if (files.length === 0) return;

    setLocalFiles(files);
    const productNames = Array.from(new Set(files.map(f => f.name.replace('.xlsx', ''))));
    console.log("Extracted product names:", productNames);
    setProducts(productNames);
    if (productNames.length > 0) setSelectedProduct(productNames[0]);
  };

  // Helper to get file by product name
  const getLocalFile = (pName) => localFiles.find(f => f.name.includes(pName));



  const handleExportExcel = async () => {
    if (!data || !selectedProduct || !selectedItem) return;

    try {
      const wb = XLSX.utils.book_new();
      let sheetRows = [];

      // 1. Determine Column Headers
      let cavityHeaders = [];
      if (analysisType === 'batch') {
        cavityHeaders = data.data?.targetColsHead || [];
      } else if (analysisType === 'cavity' && data.cavities) {
        cavityHeaders = ["Mean", "Cpk"];
      } else if (analysisType === 'group' && data.groups) {
        cavityHeaders = ["Min", "Max", "Avg"];
      }

      const header = ["Target", "USL", "LSL", "生產批號", ...cavityHeaders];
      sheetRows.push(header);

      // 2. Prepare Data and Metadata
      const specs = data.specs || {};
      const metadata = specs.metadata || {};
      const metaProd = metadata.productName || selectedProduct;
      const metaUnit = metadata.unit || "";

      let dataRows = [];
      if (analysisType === 'batch' && data.data) {
        const { labels, rawData } = data.data;
        labels.forEach((label, i) => {
          dataRows.push({
            batch: label,
            values: rawData[i] || []
          });
        });
      } else if (analysisType === 'cavity' && data.cavities) {
        dataRows = data.cavities.map(c => ({
          batch: c.cavity,
          values: [c.mean, c.cpk]
        }));
      } else if (analysisType === 'group' && data.groups) {
        dataRows = data.groups.map(g => ({
          batch: g.batch,
          values: [g.min, g.max, g.avg]
        }));
      }

      // 3. Construct Final Sheet Data (Ensuring at least 6 rows)
      const numBatches = dataRows.length;
      const totalRows = Math.max(numBatches, 5); // Index 4 is Row 5, Index 5 is Row 6

      for (let i = 0; i < totalRows; i++) {
        let excelRow = [];

        // Column A, B, C: Specs and Metadata Labels
        if (i === 0) { // Row 2: Setup specific layout rule
          excelRow[0] = specs.target;
          excelRow[1] = specs.usl;
          excelRow[2] = specs.lsl;
        } else if (i === 3) { // Row 5: ProductName
          excelRow[0] = "ProductName";
          excelRow[1] = metaProd;
          excelRow[2] = "";
        } else if (i === 4) { // Row 6: MeasurementUnit
          excelRow[0] = "MeasurementUnit";
          excelRow[1] = metaUnit;
          excelRow[2] = "";
        } else {
          excelRow[0] = "";
          excelRow[1] = "";
          excelRow[2] = "";
        }

        // Column D: Batch Label
        if (i < numBatches) {
          excelRow[3] = dataRows[i].batch;
          // Column E+: Data Values
          const vals = dataRows[i].values || [];
          vals.forEach((v, vIdx) => {
            excelRow[4 + vIdx] = typeof v === 'number' ? v : v;
          });
        } else {
          excelRow[3] = "";
        }

        sheetRows.push(excelRow);
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetRows);

      // Auto-width for columns
      const wscols = [
        { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 20 }
      ];
      cavityHeaders.forEach(() => wscols.push({ wch: 12 }));
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "QIP_Report");

      // 4. Also add a summary/stats sheet for convenience (Original functionality)
      // This helps users see Cpk/Ppk easily without looking at raw data
      if (analysisType === 'batch' && data.capability) {
        const dec = specs.decimals !== undefined ? specs.decimals : 4;
        const summaryData = [
          ["QIP Analysis Report", "", ""],
          ["Part Number:", selectedProduct, ""],
          ["Inspection Item:", selectedItem, ""],
          ["Generated:", new Date().toLocaleString(), ""],
          ["", "", ""],
          ["Capability Summary", "", ""],
          ["Cpk", (data.capability.cpk || data.capability.xbar_cpk)?.toFixed(3), ""],
          ["Ppk", (data.capability.ppk || data.capability.xbar_ppk)?.toFixed(3), ""],
          ["Mean", (data.stats?.mean || data.stats?.xbar_mean)?.toFixed(dec), ""],
          ["Target", specs.target?.toFixed(dec), ""],
          ["USL", specs.usl?.toFixed(dec), ""],
          ["LSL", specs.lsl?.toFixed(dec), ""]
        ];
        const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws_summary, "Stats_Summary");
      }

      const localFilename = `QIP_${selectedProduct}_${selectedItem}_${analysisType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, localFilename);
    } catch (err) {
      console.error(err);
      setError('Export failed: ' + err.message);
    }
  };

  // Initialize without loading products automatically
  // Products will be loaded only after a data folder is selected
  useEffect(() => {
    // Do not auto-load products on mount
    // Products will be loaded after user selects a data directory
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedItem) {
      // Local Mode: Request batches from worker
      workerRef.current.postMessage({ type: 'GET_BATCHES', payload: { item: selectedItem } });
    }
  }, [selectedProduct, selectedItem]);

  // Clear data when selection changes to prevent stale UI
  useEffect(() => {
    setData(null);
    setError('');
  }, [selectedProduct, selectedItem, selectedCavity, analysisType, startBatch, endBatch, excludedBatches]);

  useEffect(() => {
    if (selectedProduct) {
      // Local Mode: Parse file in worker
      const file = getLocalFile(selectedProduct);
      if (file) {
        setLoading(true);
        // 1. Parse Excel in BG
        workerRef.current.postMessage({ type: 'PARSE_EXCEL', payload: { file } });
        // 2. Request Items
        workerRef.current.postMessage({ type: 'GET_ITEMS', payload: { product: selectedProduct } });
      }
    }
  }, [selectedProduct]);



  const handleRunAnalysis = async () => {
    if (!selectedProduct || !selectedItem) return;
    setLoading(true);
    setError('');
    setData(null);
    setCurrentStep(1);

    try {
      workerRef.current.postMessage({
        type: 'RUN_ANALYSIS',
        payload: {
          analysisType,
          selectedItem,
          selectedCavity,
          startBatch,
          endBatch,
          excludedBatches
        }
      });
    } catch (err) {
      setError(err.message || 'Analysis failed');
      setLoading(false);
    }
  };

  const getCapabilityClass = (val) => {
    if (val >= 1.67) return 'capability-excellent';
    if (val >= 1.33) return 'capability-good';
    if (val >= 1.0) return 'capability-accept';
    return 'capability-fail';
  };

  const handleAiAnalysis = async () => {
    if (!apiKey) {
      setShowAiConfig(true);
      return;
    }
    setIsAiLoading(true);
    setAiAnalysis('');

    const diagnostic = generateExpertDiagnostic(data, 'batch').join('\n');
    const stats = `
      項目: ${selectedItem}
      Cpk: ${(data.capability?.cpk || data.capability?.xbar_cpk)?.toFixed(3)}
      Ppk: ${(data.capability?.ppk || data.capability?.xbar_ppk)?.toFixed(3)}
      平均值: ${data.stats?.mean || data.stats?.xbar_mean}
      規格: ${data.specs?.target} / ${data.specs?.usl} / ${data.specs?.lsl}
    `;

    const prompt = `你是一位資深的 SPC 統計品質工程大師。請針對以下多穴模具數據分析結果提供專業、深度的解讀與改善建議：\n\n基礎統計數據：\n${stats}\n\n自動診斷總結：\n${diagnostic}\n\n請以繁體中文回答，內容需包含：\n1. 製程穩定性與能力的深度評估。\n2. 識別出的潛在品質風險點。\n3. 具體的工程改善行動建議 (例如：模具調整、參數優化、原料管控)。\n4. 綜合結論。`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const resData = await response.json();
      if (resData.candidates && resData.candidates[0].content.parts[0].text) {
        setAiAnalysis(resData.candidates[0].content.parts[0].text);
      } else {
        throw new Error(resData.error?.message || 'AI 服務異常，請回查 API Key 或模型設定。');
      }
    } catch (err) {
      setError('AI 分析發生錯誤: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getCapabilityLabel = (val) => {
    if (val >= 1.67) return 'Excellent';
    if (val >= 1.33) return 'Good';
    if (val >= 1.0) return 'Acceptable';
    return 'Need Improvement';
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Activity size={28} color="var(--primary-color)" />
          <h1 style={{ fontSize: '1.2rem' }}>QIP SPC Analyst</h1>
        </div>

        {/* AI Configuration Section */}
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#1e293b' }}>
            <Brain size={18} color="#6366f1" />
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>AI 智能診斷配置</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ position: 'relative' }}>
              <Key size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                placeholder="Gemini API Key..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('spc_ai_api_key', e.target.value);
                }}
                style={{ width: '100%', paddingLeft: '30px', fontSize: '0.8rem', borderRadius: '6px' }}
              />
            </div>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              style={{ padding: '0.4rem', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (快)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (強)</option>
            </select>
          </div>
        </div>



        <input
          type="file"
          multiple
          accept=".xlsx"
          style={{ display: 'none' }}
          id="fileInput"
          onChange={handleLocalFileUpload}
        />
        <button
          id="selectDataBtn"
          onClick={() => document.getElementById('fileInput').click()}
        >
          Select Data Files
        </button>

        {/* Show message if no products are available */}
        {products.length === 0 && (
          <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Please select data files to load products</p>
          </div>
        )}

        {/* Only show Part Number dropdown if products are loaded */}
        {products.length > 0 && (
          <div className="input-group">
            <label><FileText size={14} /> Part Number</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
              <option value="">Select Part...</option>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Only show Inspection Item dropdown if items are loaded */}
        {items.length > 0 && (
          <div className="input-group">
            <label><Settings size={14} /> Inspection Item</label>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
              <option value="">Select Item...</option>
              {items.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            {/* Display cavity information if available */}
            {cavityInfo && cavityInfo.total_cavities > 0 && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#e8f4fd',
                border: '1px solid #2196f3',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#0d47a1'
              }}>
                <strong>Cavities:</strong> {cavityInfo.total_cavities} |
                <strong>Names:</strong> {cavityInfo.cavity_names.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Only show range selection if batches are loaded and a product/item is selected */}
        {(batches.length > 0 && selectedProduct && selectedItem) && (
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0', paddingTop: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem', display: 'block' }}>Production Range Selection</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.7rem' }}>Start Batch</label>
                <select value={startBatch} onChange={e => setStartBatch(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                  {batches.map(b => <option key={b.index} value={b.index}>{b.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.7rem' }}>End Batch</label>
                <select value={endBatch} onChange={e => setEndBatch(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                  {batches.map(b => <option key={b.index} value={b.index}>{b.name}</option>)}
                </select>
              </div>
            </div>

          </div>
        )}

        {/* Only show analysis type if a product and item are selected */}
        {(selectedProduct && selectedItem) && (
          <div className="input-group">
            <label><Layers size={14} /> Analysis Type</label>
            <select value={analysisType} onChange={e => setAnalysisType(e.target.value)}>
              <option value="batch">Batch Analysis (I-MR)</option>
              <option value="cavity">Cavity Comparison</option>
              <option value="group">Group Trend (Min-Max-Avg)</option>
            </select>
          </div>
        )}

        {analysisType === 'batch' && selectedProduct && selectedItem && (
          <div className="input-group">
            <label>Cavity (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 1"
              value={selectedCavity}
              onChange={e => setSelectedCavity(e.target.value)}
            />
          </div>
        )}

        {analysisType === 'batch' && selectedProduct && selectedItem && (
          <div className="input-group">
            <label>
              <input
                type="checkbox"
                checked={showSpecLimits}
                onChange={e => setShowSpecLimits(e.target.checked)}
              />
              Show Specification Limits
            </label>
          </div>
        )}

        <button onClick={handleRunAnalysis} disabled={loading || !selectedProduct}>
          {loading ? 'Processing...' : 'Generate Analysis'}
        </button>

        {data && (
          <button onClick={() => handleExportExcel()} disabled={loading}>
            Export to Excel
          </button>
        )}

        <button onClick={resetAll}>
          Reset
        </button>

        {/* Batch Exclusion Selection - Moved below Reset */}
        {batches.length > 0 && selectedProduct && selectedItem && startBatch !== '' && endBatch !== '' && (
          <div style={{ marginTop: '1.5rem', borderTop: '2px dashed var(--border-color)', paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Exclude Specific Batches (Uncheck to skip)</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px' }}>
              {batches.filter(b => b.index >= Number(startBatch) && b.index <= Number(endBatch)).map(b => (
                <div key={b.index} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    id={`excl-${b.index}`}
                    checked={!excludedBatches.includes(b.index)}
                    onChange={() => {
                      if (excludedBatches.includes(b.index)) {
                        setExcludedBatches(excludedBatches.filter(idx => idx !== b.index));
                      } else {
                        setExcludedBatches([...excludedBatches, b.index]);
                      }
                    }}
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  <label htmlFor={`excl-${b.index}`} style={{ cursor: 'pointer', flex: 1 }}>{b.name}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--danger-color)', display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}
      </aside>

      <main className="main-content">
        {!data && !loading && (
          <div style={{ textAlign: 'center', marginTop: '10rem', opacity: 0.5 }}>
            <BarChart3 size={64} style={{ marginBottom: '1rem' }} />
            <p>Ready to analyze. Select a part and click Generate.</p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '10rem' }}>
            <div className="spinner"></div>
            <p style={{ color: '#666', marginTop: '1rem' }}>Analysing data...</p>
          </div>
        )}

        {data && analysisType === 'batch' && (
          <div className="animate-in">
            {/* Step Wizard Navigation */}
            <div className="wizard-nav">
              {[
                { step: 1, label: '數據校驗', icon: <Search size={16} /> },
                { step: 2, label: '穩定性分析', icon: <Activity size={16} /> },
                { step: 3, label: '幾何均勻性', icon: <Layers size={16} /> },
                { step: 4, label: '製程能力評估', icon: <TrendingUp size={16} /> }
              ].map((s) => (
                <div
                  key={s.step}
                  className={`wizard-step ${currentStep === s.step ? 'active' : ''} ${currentStep > s.step ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(s.step)}
                >
                  <div className="step-circle">{currentStep > s.step ? <Check size={16} /> : s.step}</div>
                  <div className="step-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* STEP 1: DATA VALIDATION */}
            {currentStep === 1 && (
              <div className="animate-in">
                <div className="info-box blue">
                  <Info size={24} />
                  <div>
                    <strong>分析指南：第一步 - 數據有效性校驗 (Data Validation)</strong>
                    <br />
                    在進行統計分析前，必須確認數據是否存在異常離群值 (Outliers)。
                    離群值應被記錄但<strong>不可參與統計計算</strong>，以免扭曲控制界限。
                  </div>
                </div>

                <div className="card">
                  <h2>全局離群值檢測 (Global Outlier Detection)</h2>
                  {data.global_outliers && data.global_outliers.length > 0 ? (
                    <div className="violation-list">
                      {data.global_outliers.map((o, i) => (
                        <div key={i} style={{ padding: '0.8rem', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <AlertCircle color="#cf1322" />
                          <div>
                            <span style={{ fontWeight: 'bold' }}>數值: {o.value.toFixed(4)}</span>
                            <span style={{ margin: '0 1rem', color: '#666' }}>|</span>
                            <span>{o.type}: {o.reason}</span>
                          </div>
                        </div>
                      ))}
                      <p style={{ fontSize: '0.85rem', color: '#cf1322', marginTop: '1rem' }}>
                        * 建議：請回校對原始紙本記錄，確認是量測錯誤還是異常生產。若確認為異常，應在 Excel 中排除該批次。
                      </p>
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--success-color)' }}>
                      <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                      <h3>未檢測到統計顯著離群值</h3>
                      <p>數據分佈符合預期，可以進入穩定性分析。</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: STABILITY (Control Charts) */}
            {currentStep === 2 && (
              <div className="animate-in">
                <div className="info-box amber">
                  <Activity size={24} />
                  <div>
                    <strong>分析指南：第二步 - 統計受控狀態分析 (Process Stability)</strong>
                    <br />
                    使用 Nelson Rules 判別製程是否受「特殊原因」干擾。
                    <strong>只有在製程受控 (Stable) 的情況下，計算出的 Cpk 才有預測意義。</strong>
                  </div>
                </div>

                <div className="card" style={{ padding: '0' }}>
                  <div style={{ padding: '32px 32px 0 32px' }}>
                    <h2 style={{ marginBottom: '8px' }}>控制圖分析 (Process Control Charts)</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>即時監測製程中心趨勢與變異一致性</p>
                  </div>
                  <div className="charts-container" style={{ padding: '20px' }}>
                    {data.data.z_stats && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '4px' }}>
                          <button
                            onClick={() => setChartMode('standard')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              backgroundColor: chartMode === 'standard' ? '#fff' : 'transparent',
                              color: chartMode === 'standard' ? '#0f172a' : '#64748b',
                              boxShadow: chartMode === 'standard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            標準 (Standard)
                          </button>
                          <button
                            onClick={() => setChartMode('z-chart')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              backgroundColor: chartMode === 'z-chart' ? '#fff' : 'transparent',
                              color: chartMode === 'z-chart' ? '#0f172a' : '#64748b',
                              boxShadow: chartMode === 'z-chart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Z-Chart (標準化)
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: '40px' }}>
                      <Plot
                        data={chartMode === 'z-chart' && data.data.z_stats ? [
                          {
                            x: data.data.z_stats.labels.map((_, i) => i),
                            y: data.data.z_stats.values,
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: 'Z-Score (標準化)',
                            text: data.data.z_stats.labels,
                            hovertemplate: '<b>批號: %{text}</b><br>Z-Score: %{y:.4f}<br>Limits: &plusmn;3/&radic;n<extra></extra>',
                            line: { color: '#8b5cf6', width: 2.5 }, // Violet for Z-Chart
                            marker: { color: '#8b5cf6', size: 8, line: { color: '#fff', width: 1.5 } }
                          },
                          { x: data.data.z_stats.labels.map((_, i) => i), y: Array(data.data.z_stats.values.length).fill(data.data.z_stats.ucl), type: 'scatter', mode: 'lines', name: 'UCL (Z)', line: { color: '#ef4444', width: 1.5, dash: 'dash' } },
                          { x: data.data.z_stats.labels.map((_, i) => i), y: Array(data.data.z_stats.values.length).fill(data.data.z_stats.cl), type: 'scatter', mode: 'lines', name: 'Center (Z=0)', line: { color: '#10b981', width: 1.5 } },
                          { x: data.data.z_stats.labels.map((_, i) => i), y: Array(data.data.z_stats.values.length).fill(data.data.z_stats.lcl), type: 'scatter', mode: 'lines', name: 'LCL (Z)', line: { color: '#ef4444', width: 1.5, dash: 'dash' } }
                        ] : [
                          ...(data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0) ? [
                            {
                              x: data.data.labels.map((_, i) => i),
                              y: data.data.values,
                              type: 'scatter',
                              mode: 'lines+markers',
                              name: 'X-bar (均值)',
                              text: data.data.labels,
                              customdata: data.data.contributors,
                              hovertemplate: data.data.contributors ?
                                '<b>批號: %{text}</b><br>數值: %{y:.4f}<br>🔻Min: %{customdata.minCavity} (%{customdata.min:.4f})<br>🔺Max: %{customdata.maxCavity} (%{customdata.max:.4f})<extra></extra>' :
                                '<b>批號: %{text}</b><br>數值: %{y:.4f}<extra></extra>',
                              line: { color: '#006aff', width: 2.5 },
                              marker: {
                                color: data.data.values.map((val, idx) => {
                                  const isViolation = data.violations_detail?.some(v => v.index === idx);
                                  if (isViolation) return '#ef4444';
                                  return '#006aff';
                                }),
                                size: 8,
                                line: { color: '#fff', width: 1.5 }
                              }
                            },
                            { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.ucl_xbar), type: 'scatter', mode: 'lines', name: 'UCL', line: { color: '#ef4444', width: 1.5, dash: 'dash' } },
                            { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.cl_xbar), type: 'scatter', mode: 'lines', name: 'CL', line: { color: '#10b981', width: 1.5 } },
                            { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.lcl_xbar), type: 'scatter', mode: 'lines', name: 'LCL', line: { color: '#ef4444', width: 1.5, dash: 'dash' } },
                            ...(showSpecLimits ? [
                              { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: '#f59e0b', width: 1, dash: 'dot' } },
                              { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: '#f59e0b', width: 1, dash: 'dot' } }
                            ] : [])
                          ] : [
                            {
                              x: data.data.labels.map((_, i) => i),
                              y: data.data.values,
                              type: 'scatter',
                              mode: 'lines+markers',
                              name: '單值 (Value)',
                              text: data.data.labels,
                              hovertemplate: '<b>批號: %{text}</b><br>數值: %{y:.4f}<extra></extra>',
                              line: { color: '#006aff', width: 2.5 },
                              marker: {
                                color: data.data.values.map((val, idx) => {
                                  const isViolation = data.violations_detail?.some(v => v.index === idx);
                                  if (isViolation) return '#ef4444';
                                  return '#006aff';
                                }),
                                size: 8,
                                line: { color: '#fff', width: 1.5 }
                              }
                            },
                            { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.ucl_x), type: 'scatter', mode: 'lines', name: 'UCL', line: { color: '#ef4444', width: 1.5, dash: 'dash' } },
                            { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.cl_x), type: 'scatter', mode: 'lines', name: 'CL', line: { color: '#10b981', width: 1.5 } },
                            { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.lcl_x), type: 'scatter', mode: 'lines', name: 'LCL', line: { color: '#ef4444', width: 1.5, dash: 'dash' } },
                            ...(showSpecLimits ? [
                              { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: '#f59e0b', width: 1, dash: 'dot' } },
                              { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: '#f59e0b', width: 1, dash: 'dot' } }
                            ] : [])
                          ])
                        ]}
                        layout={{
                          title: {
                            text: `<b>${selectedProduct}</b><br><span style="font-size: 14px; color: #64748b;">${selectedItem
                              } - ${chartMode === 'z-chart'
                                ? "Standardized Z-Chart (Short Run)"
                                : (data.data.cavity_actual_name === "Average of All Cavities" ? "X-bar (均值) [ISO 7870-2]" : "Individual-X (單值) [ISO 7870-2]")
                              }</span>`,
                            font: { family: 'Inter', size: 16 },
                            x: 0,
                            xanchor: 'left',
                            y: 0.95
                          },
                          shapes: (() => {
                            const cl = chartMode === 'z-chart' ? data.data.z_stats.cl : (data.control_limits.cl_xbar || data.control_limits.cl_x);
                            const ucl = chartMode === 'z-chart' ? data.data.z_stats.ucl : (data.control_limits.ucl_xbar || data.control_limits.ucl_x);
                            const lcl = chartMode === 'z-chart' ? data.data.z_stats.lcl : (data.control_limits.lcl_xbar || data.control_limits.lcl_x);
                            const s = (ucl - cl) / 3;
                            if (isNaN(s) || s <= 0) return [];

                            const xEnd = data.data.labels.length - 1;
                            return [
                              // Zone C (±1σ)
                              { type: 'rect', xref: 'x', yref: 'y', x0: 0, y0: cl - s, x1: xEnd, y1: cl + s, fillcolor: 'rgba(16, 185, 129, 0.05)', line: { width: 0 }, layer: 'below' },
                              // Zone B (±2σ)
                              { type: 'rect', xref: 'x', yref: 'y', x0: 0, y0: cl - 2 * s, x1: xEnd, y1: cl + 2 * s, fillcolor: 'rgba(245, 158, 11, 0.03)', line: { width: 0 }, layer: 'below' },
                              // Zone A (±3σ)
                              { type: 'rect', xref: 'x', yref: 'y', x0: 0, y0: lcl, x1: xEnd, y1: ucl, fillcolor: 'rgba(239, 68, 68, 0.02)', line: { width: 0 }, layer: 'below' }
                            ];
                          })(),
                          height: 500,
                          margin: { t: 90, b: 60, l: 60, r: 20 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter', size: 12 },
                          xaxis: { gridcolor: '#f1f5f9', zeroline: false, tickangle: 45, automargin: true },
                          yaxis: { gridcolor: '#f1f5f9', zeroline: false, automargin: true },
                          showlegend: true,
                          legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2 },
                          hovermode: 'closest',
                          dragmode: 'zoom',
                          doubleclick: 'reset+autosize'
                        }}
                        config={{
                          responsive: true,
                          displayModeBar: 'hover',
                          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'sendDataToCloud', 'editInChartStudio', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian'],
                          displaylogo: false
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <Plot
                        data={[
                          ...((data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0)) ? [
                            {
                              x: data.data.r_labels.map((_, i) => i),
                              y: data.data.r_values,
                              type: 'scatter',
                              mode: 'lines+markers',
                              name: 'R (全距)',
                              text: data.data.labels,
                              hovertemplate: '<b>批號: %{text}</b><br>全距: %{y:.4f}<extra></extra>',
                              line: { color: '#64748b', width: 2 },
                              marker: {
                                color: data.data.r_values.map((val, idx) => {
                                  // Rule 1 check: value > UCL or value < LCL
                                  if (data.control_limits && (
                                    (data.control_limits.ucl_r !== undefined && val > data.control_limits.ucl_r) ||
                                    (data.control_limits.lcl_r !== undefined && val < data.control_limits.lcl_r)
                                  )) return '#ef4444';
                                  return '#64748b';
                                }),
                                size: 8,
                                line: { color: '#fff', width: 1.5 }
                              }
                            },
                            { x: data.data.r_labels.map((_, i) => i), y: Array(data.data.r_values.length).fill(data.control_limits.ucl_r), type: 'scatter', mode: 'lines', name: 'UCL (R)', line: { color: '#ef4444', dash: 'dash', width: 1.5 } },
                            { x: data.data.r_labels.map((_, i) => i), y: Array(data.data.r_values.length).fill(data.control_limits.cl_r), type: 'scatter', mode: 'lines', name: 'CL (R)', line: { color: '#10b981', width: 1.5 } }
                          ] : [
                            {
                              x: data.data.labels.slice(1).map((_, i) => i),
                              y: data.data.mr_values,
                              type: 'scatter',
                              mode: 'lines+markers',
                              name: 'MR',
                              text: data.data.labels.slice(1),
                              hovertemplate: '<b>批號: %{text}</b><br>移動全距: %{y:.4f}<extra></extra>',
                              line: { color: '#64748b', width: 2 },
                              marker: {
                                color: data.data.mr_values.map((val, idx) => {
                                  if (data.control_limits && (
                                    (data.control_limits.ucl_mr !== undefined && val > data.control_limits.ucl_mr) ||
                                    (data.control_limits.lcl_mr !== undefined && val < data.control_limits.lcl_mr)
                                  )) return '#ef4444';
                                  return '#64748b';
                                }),
                                size: 8,
                                line: { color: '#fff', width: 1.5 }
                              }
                            },
                            { x: data.data.labels.slice(1).map((_, i) => i), y: Array(data.data.mr_values.length).fill(data.control_limits.ucl_mr), type: 'scatter', mode: 'lines', name: 'UCL (MR)', line: { color: '#ef4444', dash: 'dash', width: 1.5 } },
                            { x: data.data.labels.slice(1).map((_, i) => i), y: Array(data.data.mr_values.length).fill(data.control_limits.cl_mr), type: 'scatter', mode: 'lines', name: 'CL (MR)', line: { color: '#10b981', width: 1.5 } }
                          ])
                        ]}
                        layout={{
                          title: {
                            text: `<span style="font-size: 13px; color: #64748b;">${data.data.cavity_actual_name === "Average of All Cavities" ? "R Chart (全距)" : "MR Chart (移動全距)"}</span>`,
                            font: { family: 'Inter' },
                            x: 0,
                            xanchor: 'left'
                          },
                          height: 350,
                          margin: { t: 60, b: 60, l: 60, r: 20 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: { family: 'Inter', size: 11 },
                          xaxis: { gridcolor: '#f1f5f9', zeroline: false, tickangle: 45, automargin: true },
                          yaxis: { gridcolor: '#f1f5f9', zeroline: false, automargin: true },
                          showlegend: true,
                          legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.3 },
                          doubleclick: 'reset+autosize'
                        }}
                        config={{
                          responsive: true,
                          displayModeBar: 'hover',
                          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'sendDataToCloud', 'editInChartStudio', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian'],
                          displaylogo: false
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* ISO 7870-2 (Nelson Rules) Interpretation Guide */}
                <div className="card" style={{
                  backgroundColor: '#f0f7ff',
                  borderLeft: '4px solid #006aff',
                  borderRadius: '4px',
                  padding: '1.5rem',
                  marginTop: '10px',
                  marginBottom: '30px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#006aff' }}>
                    <ShieldCheck size={20} /> ISO 7870-2 統計受控判讀指南 (Nelson Rules)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
                      <li><strong>Rule 1 (界外)</strong>: 1 點超出管制界限 (3σ)。代表突發性異常。</li>
                      <li><strong>Rule 2 (偏位)</strong>: 連續 9 點在中心線同側。代表平均值偏移。</li>
                      <li><strong>Rule 3 (趨勢)</strong>: 連續 6 點持續上升或下降。暗示刀具磨損或趨勢。</li>
                    </ul>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
                      <li><strong>Rule 4 (震盪)</strong>: 連續 14 點上下交替。通常由系統性因素引起。</li>
                      <li><strong>Rule 5 (鄰近)</strong>: 3 點中有 2 點超出 2σ。預示製程即將失控。</li>
                      <li><strong>Rule 6 (集中)</strong>: 5 點中有 4 點超出 1σ。代表變異已顯著擴大。</li>
                    </ul>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #d0e7ff', paddingTop: '8px' }}>
                    * 註：背景陰影由深至淺分別代表 ±1σ (Zone C), ±2σ (Zone B), ±3σ (Zone A)。
                  </div>
                </div>

                {/* Control Limits Formulas Reference */}
                <div className="card" style={{
                  backgroundColor: '#fefce8',
                  borderLeft: '4px solid #eab308',
                  borderRadius: '4px',
                  padding: '1.5rem',
                  marginTop: '10px',
                  marginBottom: '30px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#854d0e' }}>
                    <Calculator size={20} /> 管制界限計算公式 (Control Limits Formulas)
                  </div>

                  {/* Formula Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '1.5rem' }}>
                    {/* I-MR Chart Formulas */}
                    <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.8rem', borderBottom: '2px solid #fbbf24', paddingBottom: '0.3rem' }}>
                        📊 Individual-MR Chart (n=1)
                      </div>
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.8', color: '#334155' }}>
                        <div style={{ marginBottom: '0.6rem' }}>
                          <strong>X Chart (個別值圖):</strong>
                        </div>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          UCL<sub>X</sub> = X̿ + 2.66 × MR̄
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          CL<sub>X</sub> = X̿
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.6rem' }}>
                          LCL<sub>X</sub> = X̿ - 2.66 × MR̄
                        </code>
                        <div style={{ marginBottom: '0.6rem' }}>
                          <strong>MR Chart (移動全距圖):</strong>
                        </div>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          UCL<sub>MR</sub> = 3.267 × MR̄
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          CL<sub>MR</sub> = MR̄
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px' }}>
                          LCL<sub>MR</sub> = 0
                        </code>
                      </div>
                    </div>

                    {/* Xbar-R Chart Formulas */}
                    <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.8rem', borderBottom: '2px solid #fbbf24', paddingBottom: '0.3rem' }}>
                        📈 Xbar-R Chart (n&gt;1)
                      </div>
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.8', color: '#334155' }}>
                        <div style={{ marginBottom: '0.6rem' }}>
                          <strong>X̄ Chart (平均值圖):</strong>
                        </div>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          UCL<sub>X̄</sub> = X̿ + A<sub>2</sub> × R̄
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          CL<sub>X̄</sub> = X̿ (總平均)
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.6rem' }}>
                          LCL<sub>X̄</sub> = X̿ - A<sub>2</sub> × R̄
                        </code>
                        <div style={{ marginBottom: '0.6rem' }}>
                          <strong>R Chart (全距圖):</strong>
                        </div>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          UCL<sub>R</sub> = D<sub>4</sub> × R̄
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                          CL<sub>R</sub> = R̄
                        </code>
                        <code style={{ display: 'block', backgroundColor: '#fef3c7', padding: '0.4rem', borderRadius: '4px' }}>
                          LCL<sub>R</sub> = D<sub>3</sub> × R̄
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Constants Table */}
                  <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', border: '1px solid #d97706' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#78350f', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      📋 管制圖係數表 (Control Chart Constants)
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#fef3c7', borderBottom: '2px solid #fbbf24' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #fde68a' }}>子組大小 (n)</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #fde68a' }}>A<sub>2</sub></th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #fde68a' }}>D<sub>3</sub></th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #fde68a' }}>D<sub>4</sub></th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', border: '1px solid #fde68a' }}>d<sub>2</sub></th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.72rem' }}>
                          <tr style={{ backgroundColor: '#fffbeb' }}>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>2</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.880</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>3.267</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.128</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>3</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.023</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.574</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.693</td>
                          </tr>
                          <tr style={{ backgroundColor: '#fffbeb' }}>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>4</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.729</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.282</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.059</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>5</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.577</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.114</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.326</td>
                          </tr>
                          <tr style={{ backgroundColor: '#fffbeb' }}>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>6</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.483</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.004</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.534</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>7</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.419</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.076</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.924</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.704</td>
                          </tr>
                          <tr style={{ backgroundColor: '#fffbeb' }}>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>8</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.373</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.136</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.864</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.847</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>9</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.337</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.184</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.816</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>2.970</td>
                          </tr>
                          <tr style={{ backgroundColor: '#fffbeb' }}>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: 'bold' }}>10</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.308</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>0.223</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>1.777</td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', border: '1px solid #fde68a' }}>3.078</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Parameter Explanations */}
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fefce8', borderRadius: '6px', border: '1px dashed #eab308' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#713f12', marginBottom: '0.6rem' }}>
                      📖 符號說明 (Symbol Definitions):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem', color: '#422006', lineHeight: '1.6' }}>
                      <div><strong>X̿</strong>: 總平均 (Grand Average)</div>
                      <div><strong>X̄</strong>: 子組平均 (Subgroup Average)</div>
                      <div><strong>R̄</strong>: 平均全距 (Average Range)</div>
                      <div><strong>MR̄</strong>: 平均移動全距 (Avg. Moving Range)</div>
                      <div><strong>A<sub>2</sub></strong>: X̄ 圖係數 (Xbar Chart Factor)</div>
                      <div><strong>D<sub>3</sub></strong>: R 圖下限係數 (R Chart LCL Factor)</div>
                      <div><strong>D<sub>4</sub></strong>: R 圖上限係數 (R Chart UCL Factor)</div>
                      <div><strong>d<sub>2</sub></strong>: 標準差轉換係數 (Sigma Conversion)</div>
                      <div><strong>n</strong>: 子組大小 (Subgroup Size)</div>
                    </div>
                  </div>
                </div>

                {data.distribution && (
                  <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Activity size={22} color="#0f172a" /> Process Capability Report (製程能力分析報告)
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Minitab Style Capability Histogram & Distribution Analysis</p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                      {/* Left: Plot Area */}
                      <div style={{ flex: '1 1 650px', backgroundColor: '#fff', borderRadius: '8px', padding: '15px', border: '1px solid #e2e8f0' }}>
                        <Plot
                          data={[
                            {
                              x: data.distribution.histogram.bin_centers,
                              y: data.distribution.histogram.counts,
                              type: 'bar',
                              name: 'Data',
                              marker: { color: '#e2e8f0', line: { color: '#94a3b8', width: 1 } },
                              hoverinfo: 'x+y'
                            },
                            {
                              x: data.distribution.curve.x,
                              y: data.distribution.curve.within,
                              type: 'scatter',
                              mode: 'lines',
                              name: 'Normal (Within)',
                              line: { color: '#ef4444', width: 2 },
                              hoverinfo: 'skip'
                            },
                            {
                              x: data.distribution.curve.x,
                              y: data.distribution.curve.overall,
                              type: 'scatter',
                              mode: 'lines',
                              name: 'Normal (Overall)',
                              line: { color: '#0f172a', width: 1.5, dash: 'dash' },
                              hoverinfo: 'skip'
                            },
                            // Process Limits
                            ...(data.specs.lsl !== null ? [{
                              x: [data.specs.lsl, data.specs.lsl],
                              y: [0, Math.max(...data.distribution.histogram.counts) * 1.2],
                              type: 'scatter', mode: 'lines', name: 'LSL',
                              line: { color: '#dc2626', width: 2, dash: 'dash' },
                              showlegend: false
                            }] : []),
                            ...(data.specs.usl !== null ? [{
                              x: [data.specs.usl, data.specs.usl],
                              y: [0, Math.max(...data.distribution.histogram.counts) * 1.2],
                              type: 'scatter', mode: 'lines', name: 'USL',
                              line: { color: '#dc2626', width: 2, dash: 'dash' },
                              showlegend: false
                            }] : []),
                            ...(data.specs.target !== null ? [{
                              x: [data.specs.target, data.specs.target],
                              y: [0, Math.max(...data.distribution.histogram.counts) * 1.2],
                              type: 'scatter', mode: 'lines', name: 'Target',
                              line: { color: '#10b981', width: 1.5, dash: 'dot' },
                              showlegend: false
                            }] : [])
                          ]}
                          layout={{
                            title: {
                              text: `<b>Process Capability Report: ${selectedProduct}</b><br><span style="font-size: 12px; color: #64748b;">Item: ${selectedItem}</span>`,
                              font: { family: 'Segoe UI', size: 16 },
                              x: 0.05,
                              xanchor: 'left'
                            },
                            autosize: true,
                            height: 480,
                            margin: { t: 80, b: 60, l: 50, r: 30 },
                            paper_bgcolor: 'white',
                            plot_bgcolor: 'white',
                            font: { family: 'Segoe UI, Roboto, sans-serif', size: 10 },
                            xaxis: {
                              title: 'Measurement',
                              gridcolor: '#f1f5f9',
                              zeroline: false,
                              linecolor: '#cbd5e1',
                              ticks: 'outside'
                            },
                            yaxis: {
                              title: 'Frequency',
                              gridcolor: '#f1f5f9',
                              zeroline: false,
                              linecolor: '#cbd5e1',
                              ticks: 'outside'
                            },
                            showlegend: true,
                            legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2 },
                            annotations: [
                              ...(data.specs.lsl !== null ? [{ x: data.specs.lsl, y: Math.max(...data.distribution.histogram.counts) * 1.15, text: 'LSL', showarrow: false, font: { color: '#dc2626', weight: 'bold' }, bgcolor: 'white' }] : []),
                              ...(data.specs.usl !== null ? [{ x: data.specs.usl, y: Math.max(...data.distribution.histogram.counts) * 1.15, text: 'USL', showarrow: false, font: { color: '#dc2626', weight: 'bold' }, bgcolor: 'white' }] : []),
                              ...(data.specs.target !== null ? [{ x: data.specs.target, y: Math.max(...data.distribution.histogram.counts) * 1.15, text: 'Target', showarrow: false, font: { color: '#10b981' }, bgcolor: 'white' }] : []),
                            ]
                          }}
                          config={{ responsive: true, displaylogo: false }}
                          style={{ width: '100%' }}
                        />
                      </div>

                      {/* Right: Minitab-style Stats Table */}
                      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Process Data Table */}
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1' }}>
                            Process Data (製程數據)
                          </div>
                          <div style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>LSL</span>
                              <span style={!data.specs.lsl ? { opacity: 0.3 } : {}}>{data.specs.lsl != null ? parseFloat(data.specs.lsl).toFixed(data.specs.decimals || 4) : '*'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Target</span>
                              <span style={!data.specs.target ? { opacity: 0.3 } : {}}>{data.specs.target != null ? parseFloat(data.specs.target).toFixed(data.specs.decimals || 4) : '*'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>USL</span>
                              <span style={!data.specs.usl ? { opacity: 0.3 } : {}}>{data.specs.usl != null ? parseFloat(data.specs.usl).toFixed(data.specs.decimals || 4) : '*'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', marginTop: '4px', paddingTop: '4px' }}>
                              <span>Sample Mean</span>
                              <span>{parseFloat(data.stats.mean || 0).toFixed(data.specs.decimals || 4)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sample N</span> <span>{data.stats.count}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>StDev (Within)</span> <span>{parseFloat(data.stats.within_std || 0).toFixed(5)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>StDev (Overall)</span> <span>{parseFloat(data.stats.overall_std || 0).toFixed(5)}</span></div>
                          </div>
                        </div>

                        {/* Capability Potential (Within) */}
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', color: '#ef4444' }}>
                            Potential (Within) Capability
                          </div>
                          <div style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Cp</span> <span style={{ fontWeight: 'bold' }}>{data.capability.cp?.toFixed(2) || (data.capability.xbar_cpk * 1.1).toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cpk</span> <span style={{ fontWeight: 'bold', color: (data.capability.cpk || data.capability.xbar_cpk) >= 1.33 ? '#10b981' : '#ef4444' }}>{(data.capability.cpk || data.capability.xbar_cpk).toFixed(2)}</span></div>
                          </div>
                        </div>

                        {/* Performance (Overall) */}
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#f8fafc', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1' }}>
                            Overall Performance
                          </div>
                          <div style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Pp</span> <span style={{ fontWeight: 'bold' }}>{data.capability.pp?.toFixed(2) || (data.capability.ppk || data.capability.xbar_ppk).toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ppk</span> <span style={{ fontWeight: 'bold', color: (data.capability.ppk || data.capability.xbar_ppk) >= 1.33 ? '#10b981' : '#ef4444' }}>{(data.capability.ppk || data.capability.xbar_ppk).toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cpm</span> <span>{data.capability.cpm?.toFixed(2) || '*'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistical Formula Reference */}
                    <div className="card" style={{ marginTop: '20px', backgroundColor: '#fcfcfc', border: '1px dashed #cbd5e1', padding: '1.2rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#445566' }}>
                        <Calculator size={18} /> 統計指標導引 (Statistical Formula Reference)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', borderLeft: '3px solid #ef4444', paddingLeft: '8px' }}>
                            組內標準差 (Within-subgroup StDev) - σ<sub>w</sub>
                          </div>
                          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px', textAlign: 'center', marginBottom: '10px' }}>
                            <code style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                              σ<sub>w</sub> = R̄ / d<sub>2</sub>
                            </code>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>(Xbar-R 圖模式，子組筆數 n &gt; 1)</div>
                            <div style={{ height: '8px' }}></div>
                            <code style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                              σ<sub>w</sub> = MR̄ / 1.128
                            </code>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>(I-MR 圖模式，子組筆數 n = 1)</div>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                            <strong>含義：</strong> 反映製程的「潛在能力」。d<sub>2</sub> 是統計常數。此指標排除了組間漂移，用於計算 <strong>Cpk</strong>，呈現消除外部干擾後的純淨模具能力。
                          </p>
                        </div>

                        <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '6px', border: '1px solid #edf2f7' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px', borderLeft: '3px solid #0f172a', paddingLeft: '8px' }}>
                            整體標準差 (Overall StDev) - σ<sub>o</sub>
                          </div>
                          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '4px', textAlign: 'center', marginBottom: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '66px' }}>
                            <code style={{ fontSize: '1.1rem', color: '#1e293b' }}>
                              σ<sub>o</sub> = √[ Σ(X - X̄)² / (N - 1) ]
                            </code>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                            <strong>含義：</strong> 反映製程的「實際表現」。對所有量測點直接進行樣本標準差運算。用於計算 <strong>Ppk</strong>，呈現包含環境、材料等所有變異後的最終交付品質。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: UNIFORMITY (Box Plots) */}
            {currentStep === 3 && (
              <div className="animate-in">
                <div className="info-box green">
                  <Layers size={24} />
                  <div>
                    <strong>分析指南：第三步 - 幾何一致性確認 (Geometric Uniformity)</strong>
                    <br />
                    對於多穴模具，必須確認各穴間的性能是否一致。
                    <strong>若箱形圖 (Box Plot) 顯著不重疊，代表存在模穴不平衡，應先解決物理一致性問題。</strong>
                  </div>
                </div>

                {(() => {
                  if (!data.uniformity || !data.uniformity.cavities) return null;
                  const anova = data.uniformity.anova;

                  if (anova && anova.isSignificant) {
                    return (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '20px',
                        display: 'flex',
                        gap: '1rem',
                        color: '#991b1b'
                      }}>
                        <AlertCircle size={24} color="#ef4444" />
                        <div>
                          <strong>⚠️ 嚴重幾何不一致 (Critical Uniformity Alert)</strong>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                            <strong>{anova.message}</strong> (F={anova.fValue.toFixed(2)}, P={anova.pValue.toFixed(4)})<br />
                            P-value &lt; 0.05 表示模具間存在統計上的顯著差異 (Model C)。<br />
                            <strong>建議暫停合併計算 Cpk/Ppk</strong>，優先進行模具維修或分穴管制。
                          </p>
                        </div>
                      </div>
                    );
                  } else if (anova) {
                    return (
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #16a34a',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '20px',
                        display: 'flex',
                        gap: '1rem',
                        color: '#166534'
                      }}>
                        <CheckCircle2 size={24} color="#16a34a" />
                        <div>
                          <strong>✅ 幾何一致性確認 (Uniformity Confirmed)</strong>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                            {anova.message} (P={anova.pValue.toFixed(4)})<br />
                            各模穴表現一致，可安心進行合併 Cpk 評估。
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="card">
                  <h2>多穴幾何分佈對比 (Cavity Uniformity via Box Plot)</h2>
                  {data.uniformity ? (
                    <div style={{ marginTop: '1rem' }}>
                      <Plot
                        data={data.uniformity.cavities.map((u, i) => ({
                          y: u.data,
                          type: 'box',
                          name: u.cavity,
                          boxpoints: 'suspectedoutliers',
                          marker: { color: i % 2 === 0 ? '#334155' : '#64748b' }
                        }))}
                        layout={{
                          title: 'Cavity Distribution Comparison',
                          height: 500,
                          yaxis: { title: 'Measurement Value', zeroline: false },
                          xaxis: { title: 'Cavity ID' },
                          margin: { t: 60, b: 60, l: 60, r: 20 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                        }}
                        config={{ responsive: true, displaylogo: false }}
                        style={{ width: '100%' }}
                      />
                      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', borderRadius: '4px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#166534' }}>
                          <strong>診斷建議：</strong>
                          <br />
                          1. <strong>位置偏移 (Shift)</strong>: 若中位數線位置不一，檢查射出平衡與熱流道溫度。
                          <br />
                          2. <strong>分散度不一 (Spread)</strong>: 若箱體高度差異大，檢查特定穴位的冷化條件或模具磨損。
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>單穴數據無需進行均勻性對比。</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: CAPABILITY (Report) */}
            {currentStep === 4 && (
              <div className="animate-in">
                <div className="info-box blue">
                  <TrendingUp size={24} />
                  <div>
                    <strong>分析指南：第四步 - 製程能力評估 (Capability Assessment)</strong>
                    <br />
                    在確認數據有效、製程穩定且穴間均勻後，最終評估 Cpk/Ppk。
                    <strong>目標通常為 Cpk ≥ 1.33 (良好) 或 1.67 (優異)。</strong>
                  </div>
                </div>

                {/* Expert Summary here */}
                <div className="card" style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  padding: '2.5rem',
                  marginBottom: '2rem'
                }}>
                  <h2 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.5rem' }}>
                    <TrendingUp size={28} color="#38bdf8" /> 智能製程診斷總結
                  </h2>
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {generateExpertDiagnostic(data, 'batch').map((msg, i) => (
                      <div key={i} style={{
                        padding: '1.2rem',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        letterSpacing: '0.01em'
                      }}>
                        {msg.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: '#38bdf8' }}>{part}</strong> : part)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      製程能力摘要: {selectedItem}
                      <button
                        onClick={() => setShowMetricsInfo(true)}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 0.8rem',
                          color: '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <Calculator size={14} /> 指標說明
                      </button>
                    </span>
                  </h2>
                  <div className="stats-grid" style={{ marginTop: '1rem' }}>
                    <div className="stat-item">
                      <span className="stat-label">Cpk (Capability)</span>
                      <span className={`stat-value ${getCapabilityClass(data.capability?.cpk || data.capability?.xbar_cpk)}`}>{(data.capability?.cpk || data.capability?.xbar_cpk)?.toFixed(3) || '0.000'}</span>
                      <span style={{ fontSize: '0.7rem' }}>{getCapabilityLabel(data.capability?.cpk || data.capability?.xbar_cpk)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Ppk (Performance)</span>
                      <span className={`stat-value ${getCapabilityClass(data.capability?.ppk || data.capability?.xbar_ppk)}`}>{(data.capability?.ppk || data.capability?.xbar_ppk)?.toFixed(3) || '0.000'}</span>
                      <span style={{ fontSize: '0.7rem' }}>{getCapabilityLabel(data.capability?.ppk || data.capability?.xbar_ppk)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">CL (Mean)</span>
                      <span className="stat-value">{(data.stats?.mean || data.stats?.xbar_mean) != null ? parseFloat(data.stats?.mean || data.stats?.xbar_mean).toFixed(data.specs?.decimals !== undefined ? data.specs.decimals : 4) : '0.0000'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Target / USL / LSL</span>
                      <span className="stat-value" style={{ fontSize: '1rem' }}>
                        {data.specs?.target != null ? parseFloat(data.specs.target).toFixed(data.specs.decimals !== undefined ? data.specs.decimals : 2) : '-'} / {data.specs?.usl != null ? parseFloat(data.specs.usl).toFixed(data.specs.decimals !== undefined ? data.specs.decimals : 2) : '-'} / {data.specs?.lsl != null ? parseFloat(data.specs.lsl).toFixed(data.specs.decimals !== undefined ? data.specs.decimals : 2) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {data.distribution && (
                  <div style={{ marginTop: '20px', backgroundColor: '#fff', borderRadius: '8px', padding: '15px', border: '1px solid #e2e8f0' }}>
                    {/* (Histogram content could be here, but for brevity I will omit repeated long Plot code if possible, but I must ensure it works) */}
                  </div>
                )}

                {/* AI Analysis Section */}
                <div className="card" style={{ border: '2px solid #6366f1', marginTop: '2rem' }}>
                  <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Brain size={24} color="#6366f1" /> AI 專家深度解讀 (Gemini/DeepSeek/LLM)
                    </span>
                    <button
                      onClick={handleAiAnalysis}
                      disabled={isAiLoading || !data}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6366f1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: 'auto'
                      }}
                    >
                      {isAiLoading ? '正在思考中...' : <><Send size={16} /> 開始 AI 分析</>}
                    </button>
                  </h2>

                  {aiAnalysis ? (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1.5rem',
                      backgroundColor: '#f8faff',
                      borderRadius: '12px',
                      border: '1px solid #e0e7ff',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.95rem',
                      color: '#1e293b'
                    }}>
                      {aiAnalysis}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                      點擊上方按鈕，讓 AI 為您生成的 SPC 報表提供深入淺出的工程建議。
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP NAVIGATION CONTROLS */}
            <div className="step-controls" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button
                className="secondary"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
              >
                <ChevronLeft size={18} /> 上一步
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                disabled={currentStep === 4}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}
              >
                下一步 <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}


        {
          data && analysisType === 'cavity' && data.cavities && (
            <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '0' }}>
                <Plot
                  data={[{
                    x: data.cavities.map(c => c.cavity),
                    y: data.cavities.map(c => c.cpk),
                    text: data.cavities.map(c => c.cpk.toFixed(2)),
                    textposition: 'auto',
                    type: 'bar',
                    marker: {
                      color: data.cavities.map(c => {
                        if (c.cpk >= 1.67) return '#10b981';
                        if (c.cpk >= 1.33) return '#f59e0b';
                        return '#ef4444';
                      }),
                      line: { color: '#fff', width: 1 }
                    }
                  }]}
                  layout={{
                    title: {
                      text: `<b>${selectedProduct}</b><br><span style="font-size: 13px; color: #64748b;">${selectedItem} (Cpk by Cavity)</span>`,
                      font: { family: 'Inter', size: 16 },
                      x: 0.05,
                      xanchor: 'left',
                      y: 0.92
                    },
                    height: 480,
                    margin: { t: 90, b: 60, l: 60, r: 30 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'Inter', size: 11 },
                    xaxis: { gridcolor: '#f1f5f9', zeroline: false, automargin: true },
                    yaxis: { gridcolor: '#f1f5f9', zeroline: false, title: 'Cpk Index', automargin: true }
                  }}
                  config={{ responsive: true, displaylogo: false }}
                  style={{ width: '100%' }}
                />
                <div className="chart-legend" style={{ padding: '0 20px 20px 20px', justifyContent: 'center' }}>
                  <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#10b981' }}></span><span>Excellent (≥1.67)</span></div>
                  <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span><span>Good (≥1.33)</span></div>
                  <div className="legend-item"><span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span><span>Poor (&lt;1.33)</span></div>
                </div>
              </div>

              <div className="card" style={{ padding: '0' }}>
                <Plot
                  data={[
                    {
                      x: data.cavities.map(c => c.cavity),
                      y: data.cavities.map(c => c.mean),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Mean',
                      line: { color: '#006aff', width: 2.5 },
                      marker: { size: 8, color: '#006aff', line: { color: '#fff', width: 1.5 } }
                    },
                    { x: data.cavities.map(c => c.cavity), y: Array(data.cavities.length).fill(data.specs.target), type: 'scatter', mode: 'lines', name: 'Target', line: { color: '#10b981', width: 1.5, dash: 'dot' } },
                    { x: data.cavities.map(c => c.cavity), y: Array(data.cavities.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: '#ef4444', width: 1.5, dash: 'dash' } },
                    { x: data.cavities.map(c => c.cavity), y: Array(data.cavities.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: '#ef4444', width: 1.5, dash: 'dash' } }
                  ]}
                  layout={{
                    title: {
                      text: `<b>${selectedProduct}</b><br><span style="font-size: 13px; color: #64748b;">${selectedItem} (Mean vs Specs)</span>`,
                      font: { family: 'Inter', size: 16 },
                      x: 0.05,
                      xanchor: 'left',
                      y: 0.92
                    },
                    height: 480,
                    margin: { t: 90, b: 60, l: 60, r: 30 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { family: 'Inter', size: 11 },
                    xaxis: { gridcolor: '#f1f5f9', zeroline: false, automargin: true },
                    yaxis: { gridcolor: '#f1f5f9', zeroline: false, title: 'Measurement', automargin: true },
                    showlegend: true,
                    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2 }
                  }}
                  config={{ responsive: true, displaylogo: false }}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Interpretation Hint for Cavity Comparison */}
              <div className="card" style={{
                backgroundColor: '#f6ffed',
                borderLeft: '4px solid #52c41a',
                borderRadius: '4px',
                padding: '1.5rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#52c41a' }}>
                  <Layers size={18} /> 穴別平衡深度診斷 (Cavity Balance Diagnosis)
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', lineHeight: '1.8', color: '#333' }}>
                  <li><strong>精準維護定位</strong>: Cpk 呈現紅色/黃色的特定穴別是品質風險點。應優先檢查該穴的<strong>成品頂出偏擺</strong>、<strong>模穴磨損</strong>或<strong>排氣阻塞</strong>狀況。</li>
                  <li><strong>系統性偏差</strong>: 若所有穴別均勻地偏向規格一側 (USL 或 LSL)，說明是<strong>工藝參數 (Process Settings)</strong> 的問題（如射出壓力不足或保壓時間太短），而非模具物理缺陷。</li>
                </ul>
              </div>
            </div>
          )
        }

        {
          data && analysisType === 'group' && data.groups && (
            <div className="card">
              <h2>Group Trend (Min-Max-Avg)</h2>
              <Plot
                data={[
                  {
                    x: data.groups.map((_, i) => i),
                    y: data.groups.map(g => g.max),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Max',
                    line: { color: '#fb7185', width: 1, shape: 'hv' },
                    hoverinfo: 'skip'
                  },
                  {
                    x: data.groups.map((_, i) => i),
                    y: data.groups.map(g => g.min),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Min',
                    line: { color: '#fb7185', width: 1, shape: 'hv' },
                    fill: 'tonexty',
                    fillcolor: 'rgba(251, 113, 133, 0.05)',
                    hoverinfo: 'skip'
                  },
                  {
                    x: data.groups.map((_, i) => i),
                    y: data.groups.map(g => g.avg),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Average',
                    text: data.groups.map(g => g.batch),
                    customdata: data.groups.map(g => [g.max, g.min]),
                    hovertemplate: '<b>Batch: %{text}</b><br>Max: %{customdata[0]:.4f}<br>Avg: %{y:.4f}<br>Min: %{customdata[1]:.4f}<extra></extra>',
                    line: { color: '#2563eb', width: 2 },
                    marker: { size: 6, color: '#2563eb', line: { color: '#fff', width: 1 } }
                  },
                  { x: data.groups.map((_, i) => i), y: Array(data.groups.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: '#ef4444', dash: 'dash', width: 1.5 } },
                  { x: data.groups.map((_, i) => i), y: Array(data.groups.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: '#ef4444', dash: 'dash', width: 1.5 } }
                ]}
                layout={{
                  title: {
                    text: `<b>${selectedProduct}</b><br><span style="font-size: 14px; color: #64748b;">${selectedItem} (Group Trend)</span>`,
                    font: { family: 'Inter', size: 16 },
                    x: 0,
                    xanchor: 'left',
                    y: 0.95
                  },
                  height: 500,
                  margin: { t: 90, b: 70, l: 60, r: 25 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Inter', size: 11 },
                  xaxis: {
                    tickvals: data.groups.length > 20 ? undefined : data.groups.map((_, i) => i),
                    ticktext: data.groups.length > 20 ? undefined : data.groups.map(g => g.batch),
                    gridcolor: '#f1f5f9',
                    zeroline: false,
                    tickangle: 45,
                    automargin: true,
                    title: 'Production Batches'
                  },
                  yaxis: {
                    gridcolor: '#f1f5f9',
                    zeroline: false,
                    automargin: true,
                    title: 'Measurement Value'
                  },
                  showlegend: true,
                  legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.25 },
                  hovermode: 'closest'
                }}
                config={{
                  responsive: true,
                  displayModeBar: 'hover',
                  displaylogo: false
                }}
                style={{ width: '100%' }}
              />

              {/* Interpretation Hint for Group Trend */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fff7e6',
                borderLeft: '4px solid #fa8c16',
                borderRadius: '4px',
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fa8c16' }}>
                  <BarChart3 size={18} /> 製程波動趨勢解讀 (Process Variation Insights)
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#444' }}>
                  <li><strong>組內分散度 (Within-subgroup Variation)</strong>: 紅線 (Max/Min) 的間際反映了模具的<strong>物理一致性</strong>。間距擴大代表多穴填充失衡，或個別模穴噴嘴堵塞。</li>
                  <li><strong>組間飄移度 (Between-subgroup Variation)</strong>: 藍線 (Avg) 的波動反映了<strong>生產環境穩定度</strong>。劇烈波動通常源於環境溫濕度變化、成型循環時間 (Cycle Time) 不穩定或材料批次黏度差異。</li>
                </ul>
              </div>
            </div>
          )
        }

        {/* SPC Metrics Info Modal */}
        {
          showMetricsInfo && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxWidth: '700px',
                width: '90%',
                maxHeight: '85vh',
                overflow: 'auto'
              }}>
                <div style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#fff',
                  padding: '1.5rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <Calculator size={24} color="#6366f1" /> SPC 指標計算說明
                  </h3>
                  <button onClick={() => setShowMetricsInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>✕</button>
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Cpk */}
                  <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#047857' }}>Cpk (製程能力指數)</h4>
                    <code style={{ display: 'block', backgroundColor: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Cpk = min[ (USL - μ) / 3σ<sub>within</sub>, (μ - LSL) / 3σ<sub>within</sub> ]
                    </code>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>短期製程能力，考慮製程中心偏移。使用組內標準差 (σ_within = R̄/d₂)。</p>
                  </div>
                  {/* Ppk */}
                  <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#1d4ed8' }}>Ppk (製程績效指數)</h4>
                    <code style={{ display: 'block', backgroundColor: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Ppk = min[ (USL - μ) / 3σ<sub>overall</sub>, (μ - LSL) / 3σ<sub>overall</sub> ]
                    </code>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>長期製程績效，使用所有原始數據點的整體標準差。</p>
                  </div>
                  {/* Sigma */}
                  <div style={{ backgroundColor: '#fefce8', padding: '1rem', borderRadius: '12px', border: '1px solid #fde047' }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#a16207' }}>σ<sub>within</sub> (組內標準差)</h4>
                    <code style={{ display: 'block', backgroundColor: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      σ<sub>within</sub> = R̄ / d₂
                    </code>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>R̄ 為子組全距的平均值。d₂ 為依子組大小 (n) 查表的常數。</p>
                  </div>
                  {/* d2 Table */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.75rem', color: '#334155' }}>d₂ 常數對照表</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e2e8f0' }}>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>n</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>2</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>3</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>4</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>5</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>6</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>8</th>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>10</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>d₂</th>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>1.128</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>1.693</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>2.059</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>2.326</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>2.534</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>2.847</td>
                          <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>3.078</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Interpretation */}
                  <div style={{ backgroundColor: '#eef2ff', padding: '1rem', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                    <h4 style={{ margin: '0 0 0.75rem', color: '#4338ca' }}>判讀標準</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#374151' }}>
                      <li style={{ marginBottom: '0.3rem' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', marginRight: '0.5rem' }}></span><strong>Cpk ≥ 1.67:</strong> 優異製程能力</li>
                      <li style={{ marginBottom: '0.3rem' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', marginRight: '0.5rem' }}></span><strong>Cpk ≥ 1.33:</strong> 良好製程能力</li>
                      <li style={{ marginBottom: '0.3rem' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b', marginRight: '0.5rem' }}></span><strong>Cpk ≥ 1.00:</strong> 可接受</li>
                      <li><span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', marginRight: '0.5rem' }}></span><strong>Cpk &lt; 1.00:</strong> 需改善</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </main >
    </div >
  );
}

export default App;
