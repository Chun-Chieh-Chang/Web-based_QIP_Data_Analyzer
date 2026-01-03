import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Plot from 'react-plotly.js';
import { Settings, FileText, Activity, Layers, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
// SPCAnalysis now runs in worker.js
import SPCWorker from './utils/spc.worker.js?worker';

const API_BASE = '/api';

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

  const [batches, setBatches] = useState([]);
  const [startBatch, setStartBatch] = useState('');
  const [endBatch, setEndBatch] = useState('');
  const [excludedBatches, setExcludedBatches] = useState([]); // Array of indices to skip

  // Local Mode State
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localFiles, setLocalFiles] = useState([]); // Array of File objects

  // State for cavity information
  const [cavityInfo, setCavityInfo] = useState(null);

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

  // Check Backend Status on Mount
  useEffect(() => {
    // If running on GitHub Pages, we know there's no backend, so default to Local Mode immediately
    if (window.location.hostname.includes('github.io')) {
      console.log("GitHub Pages detected. Using Local Mode.");
      setIsLocalMode(true);
      return;
    }

    axios.get(`${API_BASE}/products`)
      .then(() => setIsLocalMode(false))
      .catch(() => {
        console.log("Backend unreachable. Switching to Local Mode.");
        setIsLocalMode(true);
      });
  }, []);

  // Handler for Local File Upload
  const handleLocalFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLocalFiles(files);
    const productNames = files.map(f => f.name.replace('.xlsx', ''));
    // Products will be set via worker response if possible, but for initial UI we set them here
    setProducts(productNames);
    if (productNames.length > 0) setSelectedProduct(productNames[0]);
  };

  // Helper to get file by product name
  const getLocalFile = (pName) => localFiles.find(f => f.name.includes(pName));

  // Function to select data directory
  const selectDataDirectory = async () => {
    try {
      // For web applications, we can't directly select folders
      // Instead, we'll prompt for the directory path
      const directoryPath = prompt(
        "Please enter the absolute path to your data directory (e.g., C:/path/to/your/data/folder):\n\nNote: The folder should contain your Excel data files."
      );

      if (directoryPath) {
        const response = await axios.post(`${API_BASE}/set-data-directory`, {
          directory: directoryPath
        });

        if (response.data.status === 'success') {
          alert(response.data.message);
          // Reset the form to refresh the product list
          setSelectedProduct('');
          setProducts([]);
          setData(null);

          // Reload products
          axios.get(`${API_BASE}/products`)
            .then(res => {
              setProducts(res.data.products);
              if (res.data.products.length === 0) {
                setError('No products found in the selected folder. Please verify the folder contains Excel files.');
              }
            })
            .catch(err => setError('Failed to reload products: ' + err.message));
        }
      }
    } catch (err) {
      setError('Failed to set data directory: ' + err.message);
    }
  };

  const handleExportExcel = async () => {
    if (!data || !selectedProduct || !selectedItem) return;

    try {
      if (isLocalMode) {
        // Local Mode: Generate Excel using XLSX library
        const wb = XLSX.utils.book_new();

        // 1. Prepare Summary Data
        const summaryData = [
          ["QIP Analysis Report", "", ""],
          ["Part Number:", selectedProduct, ""],
          ["Inspection Item:", selectedItem, ""],
          ["Analysis Type:", analysisType === 'batch' ? "Batch Analysis" : analysisType === 'cavity' ? "Cavity Comparison" : "Group Trend", ""],
          ["Generated:", new Date().toLocaleString(), ""],
          ["", "", ""],
          ["Capability Summary", "", ""]
        ];

        if (analysisType === 'batch' && data.capability) {
          const dec = data.specs?.decimals !== undefined ? data.specs.decimals : 4;
          summaryData.push(["Cpk", (data.capability.cpk || data.capability.xbar_cpk)?.toFixed(3), ""]);
          summaryData.push(["Ppk", (data.capability.ppk || data.capability.xbar_ppk)?.toFixed(3), ""]);
          summaryData.push(["Mean", (data.stats?.mean || data.stats?.xbar_mean)?.toFixed(dec), ""]);
          summaryData.push(["Target", data.specs?.target?.toFixed(dec), ""]);
          summaryData.push(["USL", data.specs?.usl?.toFixed(dec), ""]);
          summaryData.push(["LSL", data.specs?.lsl?.toFixed(dec), ""]);
        }

        const ws_summary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws_summary, "Summary");

        // 2. Prepare Detailed Data
        let detailData = [];
        if (analysisType === 'batch' && data.data) {
          const header = ["Batch Label", "Value", "UCL", "LCL", "CL"];
          if (showSpecLimits) header.push("Target", "USL", "LSL");
          detailData.push(header);

          const { labels, values } = data.data;
          const { ucl_x, lcl_x, cl_x, ucl_xbar, lcl_xbar, cl_xbar } = data.control_limits;
          const { target, usl, lsl, decimals } = data.specs || {};
          const dec = decimals !== undefined ? decimals : 4;

          labels.forEach((label, i) => {
            const row = [
              label,
              values[i]?.toFixed(dec),
              (ucl_x || ucl_xbar)?.toFixed(dec),
              (lcl_x || lcl_xbar)?.toFixed(dec),
              (cl_x || cl_xbar)?.toFixed(dec)
            ];
            if (showSpecLimits) row.push(target?.toFixed(dec), usl?.toFixed(dec), lsl?.toFixed(dec));
            detailData.push(row);
          });
        } else if (analysisType === 'cavity' && data.cavities) {
          const dec = data.specs?.decimals !== undefined ? data.specs.decimals : 4;
          detailData.push(["Cavity Name", "Mean", "Cpk"]);
          data.cavities.forEach(c => {
            detailData.push([c.cavity, c.mean?.toFixed(dec), c.cpk?.toFixed(3)]);
          });
        } else if (analysisType === 'group' && data.groups) {
          const dec = data.specs?.decimals !== undefined ? data.specs.decimals : 4;
          detailData.push(["Batch", "Min", "Max", "Avg"]);
          data.groups.forEach(g => {
            detailData.push([g.batch, g.min?.toFixed(dec), g.max?.toFixed(dec), g.avg?.toFixed(dec)]);
          });
        }

        if (detailData.length > 0) {
          const ws_data = XLSX.utils.aoa_to_sheet(detailData);
          XLSX.utils.book_append_sheet(wb, ws_data, "Data");
        }

        // Write and download
        const localFilename = `QIP_${selectedProduct}_${selectedItem}_${analysisType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, localFilename);
      } else {
        // Server Mode: Original Axios implementation
        const response = await axios.post(`${API_BASE}/export/excel`, {
          product: selectedProduct,
          item: selectedItem,
          startBatch: startBatch,
          endBatch: endBatch,
          analysisType: analysisType,
          cavity: selectedCavity,
          analysis_data: data
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const serverFilename = response.headers['content-disposition']?.split('filename=')[1] || `QIP_${selectedProduct}_${selectedItem}_${analysisType}.xlsx`;
        link.setAttribute('download', serverFilename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  // Initialize without loading products automatically
  // Products will be loaded only after a data folder is selected
  useEffect(() => {
    // Do not auto-load products on mount
    // Products will be loaded after user selects a data directory
  }, []);

  // Fetch batches and set range defaults
  useEffect(() => {
    if (selectedProduct && selectedItem) {
      if (isLocalMode) {
        // Local Mode: Request batches from worker
        workerRef.current.postMessage({ type: 'GET_BATCHES', payload: { item: selectedItem } });
      } else {
        // Server Mode
        axios.get(`${API_BASE}/batches?product=${selectedProduct}&item=${selectedItem}`)
          .then(res => {
            setBatches(res.data.batches);
            if (res.data.batches.length > 0) {
              setStartBatch(res.data.batches[0].index);
              setEndBatch(res.data.batches[res.data.batches.length - 1].index);
              setExcludedBatches([]);
            }
          })
          .catch(err => setError('Failed to load batches'));
      }
    }
  }, [selectedProduct, selectedItem, isLocalMode]);

  // Clear data when selection changes to prevent stale UI
  useEffect(() => {
    setData(null);
    setError('');
  }, [selectedProduct, selectedItem, selectedCavity, analysisType, startBatch, endBatch, excludedBatches]);

  // Items load on product change
  useEffect(() => {
    if (selectedProduct) {
      if (isLocalMode) {
        // Local Mode: Parse file in worker
        const file = getLocalFile(selectedProduct);
        if (file) {
          setLoading(true);
          // 1. Parse Excel in BG
          workerRef.current.postMessage({ type: 'PARSE_EXCEL', payload: { file } });
          // 2. Request Items
          workerRef.current.postMessage({ type: 'GET_ITEMS', payload: { product: selectedProduct } });
        }
      } else {
        // Server Mode
        axios.get(`${API_BASE}/items?product=${selectedProduct}`)
          .then(res => {
            setItems(res.data.items);
            if (res.data.items.length > 0) {
              setSelectedItem(res.data.items[0]);
            }
          })
          .catch(err => setError('Failed to load items'));
      }
    }
  }, [selectedProduct, isLocalMode]);

  // Cavity information for Server Mode (Local mode handled via worker)
  useEffect(() => {
    if (!isLocalMode && selectedProduct && selectedItem) {
      axios.get(`${API_BASE}/cavity-info?product=${selectedProduct}&item=${selectedItem}`)
        .then(res => {
          setCavityInfo(res.data);
        })
        .catch(err => {
          console.log(`Cavity info not available: ${err.message}`);
          setCavityInfo(null);
        });
    }
  }, [selectedProduct, selectedItem, isLocalMode]);

  const handleRunAnalysis = async () => {
    if (!selectedProduct || !selectedItem) return;
    setLoading(true);
    setError('');
    setData(null);

    const queryParams = `product=${selectedProduct}&item=${selectedItem}&startBatch=${startBatch}&endBatch=${endBatch}`;

    try {
      if (isLocalMode) {
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
      } else {
        // Server Analysis
        let endpoint = '';
        if (analysisType === 'batch') {
          endpoint = `${API_BASE}/analysis/batch?${queryParams}&cavity=${selectedCavity}`;
        } else if (analysisType === 'cavity') {
          endpoint = `${API_BASE}/analysis/cavity?${queryParams}`;
        } else {
          endpoint = `${API_BASE}/analysis/group?${queryParams}`;
        }

        const res = await axios.get(endpoint);
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed');
      setLoading(false);
    } finally {
      if (!isLocalMode) {
        setLoading(false);
      }
    }
  };

  const getCapabilityClass = (val) => {
    if (val >= 1.67) return 'capability-excellent';
    if (val >= 1.33) return 'capability-good';
    if (val >= 1.0) return 'capability-accept';
    return 'capability-fail';
  };

  const getCapabilityLabel = (val) => {
    if (val >= 1.67) return 'Excellent';
    if (val >= 1.33) return 'Good';
    if (val >= 1.0) return 'Acceptable';
    return 'Need Improvement';
  };

  // Automated Expert Diagnostic Engine (Senior Authority Logic)
  const generateExpertDiagnostic = (data, type) => {
    if (!data) return [];
    let insights = [];

    if (type === 'batch') {
      const cpk = data.capability?.cpk || data.capability?.xbar_cpk || 0;
      const ppk = data.capability?.ppk || data.capability?.xbar_ppk || 0;
      const mean = data.stats?.mean || data.stats?.xbar_mean || 0;
      const target = data.specs?.target || 0;
      const usl = data.specs?.usl || 0;
      const lsl = data.specs?.lsl || 0;
      const violationsCount = (data.violations?.length || 0) + (data.violations?.xbar_violations?.length || 0) + (data.violations?.r_violations?.length || 0);

      // 1. Capability Assessment
      if (cpk >= 1.67) insights.push(`✅ **精英級製程**: Cpk (${cpk.toFixed(3)}) 現狀極佳，公差帶寬裕，物理精度高於標竿水平。`);
      else if (cpk >= 1.33) insights.push(`🟢 **穩定製程**: Cpk (${cpk.toFixed(3)}) 符合國際品質要求 (Automotive standard)。`);
      else if (cpk > 0) insights.push(`⚠️ **製程能力不足**: Cpk (${cpk.toFixed(3)}) 低於理想指標，建議檢查模具物理磨損或基本工藝參數。`);

      // 2. Stability Analysis (Cpk vs Ppk)
      const diff = Math.abs(cpk - ppk);
      if (cpk > 0 && ppk > 0) {
        if (diff / cpk > 0.1) {
          insights.push(`🔍 **穩定性低 (Stability Index Issue)**: Cpk 與 Ppk 差異显著 (${((diff / cpk) * 100).toFixed(1)}%)。暗示「批次間」波動較劇烈，應重點檢查材料一致性、模溫機波動或不同班別的操作差異。`);
        } else {
          insights.push(`✨ **穩定性極佳**: Cpk 與 Ppk 數據契合，顯示製程具備高度的可重複性。`);
        }
      }

      // 3. Centering (Centering / k-index)
      if (target !== 0 && usl !== lsl) {
        const offset = ((mean - target) / (usl - lsl)) * 100;
        if (Math.abs(offset) > 10) {
          insights.push(`📍 **中心漂移**: 均值偏向${offset > 0 ? '上限 (USL)' : '下限 (LSL)'}約 ${Math.abs(offset).toFixed(1)}%。建議調整**射出壓力**或**保壓時間**以拉回基準中值。`);
        }
      }

      // 4. Violation Handling
      if (violationsCount > 0) {
        insights.push(`🔴 **異常警示**: 圖中發現 ${violationsCount} 個統計異常點。這代表製程中存在「特殊原因」，請檢查是否有**更換材料批次**、**機台警報(Alarm)** 或**模具清理**動作。`);
      } else {
        insights.push(`🛡️ **統計受控**: 目前所有點位均在管制界限內，製程處於統計受控狀態。`);
      }
    } else if (type === 'cavity') {
      const minCpk = data.cavities?.length > 0 ? Math.min(...data.cavities.map(c => c.cpk)) : 0;
      const maxCpk = data.cavities?.length > 0 ? Math.max(...data.cavities.map(c => c.cpk)) : 0;
      if (maxCpk - minCpk > 0.3) {
        insights.push(`🚩 **穴別不平衡 (Balance Issue)**: 不同模穴間能力差異大。應針對 Cpk 最差的模穴檢查其**成品頂出行程**或**排氣阻塞**。`);
      } else {
        insights.push(`✅ **模穴平衡良好**: 各穴性能分佈均勻。`);
      }
    }

    return insights;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Activity size={28} color="var(--primary-color)" />
          <h1 style={{ fontSize: '1.2rem' }}>QIP SPC Analyst</h1>
        </div>

        {isLocalMode && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fff3cd', border: '1px solid #ffecb5', borderRadius: '4px', fontSize: '0.8rem', color: '#856404' }}>
            <strong>Offline Mode</strong><br />Running in browser (Serverless).
          </div>
        )}

        <input
          type="file"
          multiple
          accept=".xlsx"
          style={{ display: 'none' }}
          id="fileInput"
          onChange={handleLocalFileUpload}
        />
        <button onClick={isLocalMode ? () => document.getElementById('fileInput').click() : selectDataDirectory}>
          {isLocalMode ? 'Select Excel Files' : 'Select Data Folder'}
        </button>

        {/* Show message if no products are available */}
        {products.length === 0 && (
          <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Please select a data folder to load products</p>
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

        {data && analysisType === 'batch' && data.capability && (
          <>
            {/* Dynamic Expert Summary Engine */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, #1d39c4 0%, #001529 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 4px 15px rgba(29, 57, 196, 0.3)'
            }}>
              <h2 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <TrendingUp size={24} /> 自動化專家診斷報告 (Automated Diagnostic)
              </h2>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {generateExpertDiagnostic(data, 'batch').map((msg, i) => (
                  <div key={i} style={{
                    padding: '0.8rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(5px)',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}>
                    {msg.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2>Capability Summary: {selectedItem} {selectedCavity && `(${selectedCavity})`}</h2>
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

              {/* Handle violations for both Individual-MR and Xbar-R charts */}
              {(data.violations && Array.isArray(data.violations) && data.violations.length > 0) ||
                (data.violations && data.violations.xbar_violations && data.violations.xbar_violations.length > 0) ||
                (data.violations && data.violations.r_violations && data.violations.r_violations.length > 0) ? (
                <div className="violation-list">
                  <h4 style={{ margin: '1rem 0 0.5rem 0' }}>SPC Violations Detected:</h4>
                  {/* Show Individual-MR violations */}
                  {data.violations && Array.isArray(data.violations) && data.violations.map((v, i) => <div key={`mr-${i}`}><AlertCircle size={14} /> {v}</div>)}
                  {/* Show Xbar violations */}
                  {data.violations && data.violations.xbar_violations && data.violations.xbar_violations.map((v, i) => <div key={`xbar-${i}`}><AlertCircle size={14} /> {v}</div>)}
                  {/* Show R violations */}
                  {data.violations && data.violations.r_violations && data.violations.r_violations.map((v, i) => <div key={`r-${i}`}><AlertCircle size={14} /> {v}</div>)}
                </div>
              ) : (
                <div style={{ color: 'var(--success-color)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Process is in statistical control.</span>
                </div>
              )}

              {/* Interpretation Hint for Batch Analysis */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f0f7ff',
                borderLeft: '4px solid #1890ff',
                borderRadius: '4px',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1890ff' }}>
                  <Activity size={18} /> 分析結果解讀 (Interpretation Guide)
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li><strong>製程中心趨勢 (Xbar/I Chart)</strong>: 反映熔膠黏度一致性或射出參數穩定度。<strong>紅色異常點</strong>代表「特殊原因變異」，建議檢查<strong>射出壓力切換 (V/P)</strong>、<strong>料溫波動</strong>或<strong>回收料比例</strong>。</li>
                  <li><strong>全距管制圖 (R/MR Chart)</strong>:
                    <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem' }}>
                      <li><strong>R 圖 (模穴平衡性)</strong>: 監測模具各穴填充的均勻度。R 值偏高通常代表<strong>熱流道溫控不均</strong>、<strong>排氣阻塞</strong>或<strong>澆口物理損耗</strong>。</li>
                      <li><strong>MR 圖 (製程漂移)</strong>: 反映相鄰批次的跳動。異常通常源於<strong>冷卻水溫漂移</strong>或<strong>環境溫濕度</strong>影響。</li>
                    </ul>
                  </li>
                  <li><strong>製程能力深度解讀 (Capability Insights)</strong>:
                    <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem' }}>
                      <li><strong>Cpk (製程能力指數)</strong>: 衡量「短期」穩定性，反映機台與模具在當下物理狀態下的最佳潛力。</li>
                      <li><strong>Ppk (製程性能指數)</strong>: 衡量「長期」表現，涵蓋批次間所有波動。這是客戶收受產品時的最真實數據。</li>
                      <li><strong>專家建議</strong>: 若 <code>Cpk &gt;&gt; Ppk</code>，代表模穴平衡良好，但<strong>生產穩定性 (Stability Index)</strong> 不佳，應重點控管批次間的工藝一致性。</li>
                    </ul>
                  </li>
                </ul>
                <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: '#fff', border: '1px solid #bae7ff', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#0050b3', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Settings size={14} /> 核心統計公式與參數 (Statistical Reference)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ paddingRight: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>Cpk (Short-term)</div>
                      <code>min[ (USL-μ)/3σw, (μ-LSL)/3σw ]</code>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>Ppk (Long-term)</div>
                      <code>min[ (USL-μ)/3σo, (μ-LSL)/3σo ]</code>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.6rem', borderTop: '1px solid #f0f0f0', paddingTop: '0.4rem', color: '#666', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <span><strong>μ</strong>: 製程均值 (Process Mean)</span>
                    <span><strong>σw (Within)</strong>: 組內標準差 (R̄/d2)</span>
                    <span><strong>σo (Overall)</strong>: 整體標準差 (S)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="charts-container">
              <div className="card">
                <Plot
                  data={[ // Determine if this is Xbar-R chart (All Cavities mode) or Individual-X chart
                    ...(data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0) ? [
                      // Xbar chart data
                      {
                        x: data.data.labels.map((_, i) => i),
                        y: data.data.values,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Xbar (Avg)',
                        line: {
                          color: 'var(--primary-color)',
                          width: 3
                        },
                        marker: {
                          color: data.data.values.map(val => {
                            if (data.control_limits &&
                              data.control_limits.ucl_xbar &&
                              data.control_limits.lcl_xbar &&
                              ((val > data.control_limits.ucl_xbar) ||
                                (val < data.control_limits.lcl_xbar))) {
                              return 'red'; // Out of control points in red
                            }
                            return 'var(--primary-color)'; // In control points in blue
                          }),
                          size: 8
                        }
                      },
                      { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.ucl_xbar), type: 'scatter', mode: 'lines', name: 'UCL (Xbar)', line: { color: 'red', dash: 'dash' } },
                      { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.cl_xbar), type: 'scatter', mode: 'lines', name: 'CL (Xbar)', line: { color: 'green' } },
                      { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.lcl_xbar), type: 'scatter', mode: 'lines', name: 'LCL (Xbar)', line: { color: 'red', dash: 'dash' } },
                      ...(showSpecLimits ? [
                        { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: 'orange', dash: 'dot' } },
                        { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: 'orange', dash: 'dot' } }
                      ] : [])
                    ] : [
                      // Individual-X chart data
                      {
                        x: data.data.labels.map((_, i) => i),
                        y: data.data.values,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Measurement',
                        line: {
                          color: 'var(--primary-color)',
                          width: 3
                        },
                        marker: {
                          color: data.data.values.map(val => {
                            if (data.control_limits &&
                              data.control_limits.ucl_x &&
                              data.control_limits.lcl_x &&
                              ((val > data.control_limits.ucl_x) ||
                                (val < data.control_limits.lcl_x))) {
                              return 'red'; // Out of control points in red
                            }
                            return 'var(--primary-color)'; // In control points in blue
                          }),
                          size: 8
                        }
                      },
                      { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.ucl_x), type: 'scatter', mode: 'lines', name: 'UCL', line: { color: 'red', dash: 'dash' } },
                      { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.cl_x), type: 'scatter', mode: 'lines', name: 'CL', line: { color: 'green' } },
                      { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.control_limits.lcl_x), type: 'scatter', mode: 'lines', name: 'LCL', line: { color: 'red', dash: 'dash' } },
                      ...(showSpecLimits ? [
                        { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: 'orange', dash: 'dot' } },
                        { x: data.data.labels.map((_, i) => i), y: Array(data.data.values.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: 'orange', dash: 'dot' } }
                      ] : [])
                    ])
                  ]}
                  layout={{
                    title: (data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0)) ? 'Xbar Control Chart' : 'Individual-X Control Chart',
                    height: 400,
                    autosize: true,
                    margin: { t: 50, b: 80, l: 50, r: 50 },
                    xaxis: {
                      tickvals: data.data.labels.map((_, i) => i),
                      ticktext: data.data.labels,
                      tickangle: 45
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="card">
                <Plot
                  data={[ // Determine if this is R chart (All Cavities mode) or MR chart
                    ...(data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0) ? [
                      // R chart data
                      {
                        x: data.data.r_labels.map((_, i) => i),
                        y: data.data.r_values,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Range (R)',
                        line: {
                          color: '#7030a0',
                          width: 2
                        },
                        marker: {
                          color: data.data.r_values.map(val => {
                            if (data.control_limits &&
                              data.control_limits.ucl_r &&
                              val > data.control_limits.ucl_r) {
                              return 'red'; // Out of control points in red
                            }
                            return '#7030a0'; // In control points in purple
                          }),
                          size: 8
                        }
                      },
                      { x: data.data.r_labels.map((_, i) => i), y: Array(data.data.r_values.length).fill(data.control_limits.ucl_r), type: 'scatter', mode: 'lines', name: 'UCL (R)', line: { color: 'red', dash: 'dash' } },
                      { x: data.data.r_labels.map((_, i) => i), y: Array(data.data.r_values.length).fill(data.control_limits.cl_r), type: 'scatter', mode: 'lines', name: 'CL (R)', line: { color: 'green' } },
                      { x: data.data.r_labels.map((_, i) => i), y: Array(data.data.r_values.length).fill(data.control_limits.lcl_r), type: 'scatter', mode: 'lines', name: 'LCL (R)', line: { color: 'red', dash: 'dash' } }
                    ] : [
                      // MR chart data
                      {
                        x: data.data.labels.slice(1).map((_, i) => i),
                        y: data.data.mr_values,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Moving Range',
                        line: {
                          color: '#7030a0',
                          width: 2
                        },
                        marker: {
                          color: data.data.mr_values.map(val => {
                            if (data.control_limits &&
                              data.control_limits.ucl_mr &&
                              val > data.control_limits.ucl_mr) {
                              return 'red'; // Out of control points in red
                            }
                            return '#7030a0'; // In control points in purple
                          }),
                          size: 8
                        }
                      },
                      { x: data.data.labels.slice(1).map((_, i) => i), y: Array(data.data.mr_values.length).fill(data.control_limits.ucl_mr), type: 'scatter', mode: 'lines', name: 'UCL (MR)', line: { color: 'red', dash: 'dash' } },
                      { x: data.data.labels.slice(1).map((_, i) => i), y: Array(data.data.mr_values.length).fill(data.control_limits.cl_mr), type: 'scatter', mode: 'lines', name: 'CL (MR)', line: { color: 'green' } }
                    ])
                  ]}
                  layout={{
                    title: (data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0)) ? 'R Chart (Range)' : 'Moving Range Chart',
                    height: 300,
                    autosize: true,
                    xaxis: {
                      tickvals: (data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0)) ? data.data.r_labels.map((_, i) => i) : data.data.labels.slice(1).map((_, i) => i),
                      ticktext: (data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0)) ? data.data.r_labels : data.data.labels.slice(1),
                      tickangle: 45
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </>
        )}

        {data && analysisType === 'cavity' && data.cavities && (
          <div className="charts-container">
            <div className="card">
              <h2>Cavity Cpk Comparison</h2>
              <Plot
                data={[{
                  x: data.cavities.map(c => c.cavity),
                  y: data.cavities.map(c => c.cpk),
                  text: data.cavities.map(c => c.cpk.toFixed(2)),
                  textposition: 'auto',
                  type: 'bar',
                  marker: {
                    color: data.cavities.map(c => {
                      if (c.cpk >= 1.67) return '#70ad47';
                      if (c.cpk >= 1.33) return '#ffc000';
                      return '#ff0000';
                    })
                  }
                }]}
                layout={{ title: 'Cpk by Cavity', height: 400 }}
                style={{ width: '100%' }}
              />
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#70ad47' }}></span>
                  <span>Excellent (Cpk ≥ 1.67)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ffc000' }}></span>
                  <span>Good (Cpk ≥ 1.33)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ff0000' }}></span>
                  <span>Poor (Cpk &lt; 1.33)</span>
                </div>
              </div>
            </div>
            <div className="card">
              <h2>Average Values Comparison</h2>
              <Plot
                data={[
                  { x: data.cavities.map(c => c.cavity), y: data.cavities.map(c => c.mean), type: 'scatter', mode: 'lines+markers', name: 'Mean' },
                  { x: data.cavities.map(c => c.cavity), y: Array(data.cavities.length).fill(data.specs.target), type: 'scatter', mode: 'lines', name: 'Target', line: { color: 'green' } },
                  { x: data.cavities.map(c => c.cavity), y: Array(data.cavities.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: 'red', dash: 'dash' } },
                  { x: data.cavities.map(c => c.cavity), y: Array(data.cavities.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: 'red', dash: 'dash' } }
                ]}
                layout={{ title: 'Mean vs Specs', height: 400 }}
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
        )}

        {data && analysisType === 'group' && data.groups && (
          <div className="card">
            <h2>Group Trend (Min-Max-Avg)</h2>
            <Plot
              data={[
                { x: data.groups.map((_, i) => i), y: data.groups.map(g => g.max), type: 'scatter', mode: 'lines', name: 'Max', line: { color: 'red', width: 1 } },
                { x: data.groups.map((_, i) => i), y: data.groups.map(g => g.avg), type: 'scatter', mode: 'lines+markers', name: 'Avg', line: { color: 'blue', width: 3 } },
                { x: data.groups.map((_, i) => i), y: data.groups.map(g => g.min), type: 'scatter', mode: 'lines', name: 'Min', line: { color: 'red', width: 1 } },
                { x: data.groups.map((_, i) => i), y: Array(data.groups.length).fill(data.specs.usl), type: 'scatter', mode: 'lines', name: 'USL', line: { color: 'orange', dash: 'dot' } },
                { x: data.groups.map((_, i) => i), y: Array(data.groups.length).fill(data.specs.lsl), type: 'scatter', mode: 'lines', name: 'LSL', line: { color: 'orange', dash: 'dot' } }
              ]}
              layout={{
                title: 'Process Variability Trend',
                height: 500,
                xaxis: {
                  tickvals: data.groups.map((_, i) => i),
                  ticktext: data.groups.map(g => g.batch),
                  tickangle: 45
                }
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
        )}
      </main>
    </div>
  );
}

export default App;
