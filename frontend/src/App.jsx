import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Plot from 'react-plotly.js';
import { generateExpertDiagnostic } from './utils/diagnostic_logic';
import { SPCAnalysis } from './utils/spc_logic';
import { Settings, FileText, Activity, Layers, BarChart3, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
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
  const [showViolationDetails, setShowViolationDetails] = useState(false); // Collapsible violation details

  // Local Mode State
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localFiles, setLocalFiles] = useState([]); // Array of File objects

  // State for cavity information
  const [cavityInfo, setCavityInfo] = useState(null);
  const [currentDataDir, setCurrentDataDir] = useState('');

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

  // Function to select data directory
  const selectDataDirectory = async () => {
    console.log("selectDataDirectory called");
    try {
      // For web applications, we can't directly select folders
      // Instead, we'll prompt for the directory path
      const directoryPath = prompt(
        "請輸入資料夾的絕對路徑 (例如 C:/path/to/data):\n\n該資料夾應包含您的 QIP Excel 檔案。",
        currentDataDir || ""
      );
      console.log("Path entered:", directoryPath);

      if (directoryPath) {
        setCurrentDataDir(directoryPath);
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

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
            onClick={() => setIsLocalMode(!isLocalMode)}
            className={isLocalMode ? 'secondary' : ''}
          >
            {isLocalMode ? 'Switch to Server Mode' : 'Switch to Local Mode'}
          </button>
        </div>

        <input
          type="file"
          multiple
          webkitdirectory=""
          directory=""
          accept=".xlsx"
          style={{ display: 'none' }}
          id="fileInput"
          onChange={handleLocalFileUpload}
        />
        <button
          id="selectDataBtn"
          onClick={isLocalMode ? () => document.getElementById('fileInput').click() : selectDataDirectory}
        >
          {isLocalMode ? 'Select Data Folder (Local)' : 'Select Data Folder (Server)'}
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
          <div className="animate-in">
            {/* Dynamic Expert Summary Engine - Senior Aesthetic Polish */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              padding: '2.5rem'
            }}>
              <h2 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.5rem' }}>
                <TrendingUp size={28} color="#38bdf8" /> 智能製程診斷報告
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
                <span>製程能力摘要: {selectedItem}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>{selectedCavity ? `模穴: ${selectedCavity}` : '全穴平均'}</span>
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

              {/* Handle violations for both Individual-MR and Xbar-R charts */}
              {((data.violations && Array.isArray(data.violations) && data.violations.length > 0) ||
                (data.violations && data.violations.xbar_violations && data.violations.xbar_violations.length > 0) ||
                (data.violations && data.violations.r_violations && data.violations.r_violations.length > 0)) ? (
                <div className="violation-list" style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff1f0', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #ffa39e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cf1322', fontWeight: 'bold' }}>
                      <AlertCircle size={18} />
                      <span>偵測到統計異常點 ({(data.violations?.xbar_violations?.length || 0) + (data.violations?.r_violations?.length || 0) + (Array.isArray(data.violations) ? data.violations.length : 0)} 處)</span>
                    </div>
                    <button
                      onClick={() => setShowViolationDetails(!showViolationDetails)}
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', backgroundColor: '#fff', border: '1px solid #d9d9d9', color: '#666' }}
                    >
                      {showViolationDetails ? '隱藏細節' : '顯示詳細清單'}
                    </button>
                  </div>

                  {showViolationDetails && (
                    <div style={{ marginTop: '0.5rem', padding: '0.8rem', backgroundColor: '#fdfdfd', border: '1px solid #eee', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                      {/* Show Detailed violations if available */}
                      {data.violations_detail ? (
                        data.violations_detail.map((v, i) => (
                          <div key={`nelson-${i}`} style={{ marginBottom: '0.3rem', color: '#cf1322' }}>
                            <AlertCircle size={12} style={{ marginRight: '4px' }} />
                            <strong>{v.rule}:</strong> {v.message}
                          </div>
                        ))
                      ) : (
                        <>
                          {/* Fallback to original violations list */}
                          {data.violations && Array.isArray(data.violations) && data.violations.map((v, i) => <div key={`mr-${i}`} style={{ marginBottom: '0.3rem' }}><AlertCircle size={12} style={{ marginRight: '4px' }} /> {v}</div>)}
                          {/* Show Xbar violations */}
                          {data.violations && data.violations.xbar_violations && data.violations.xbar_violations.map((v, i) => <div key={`xbar-${i}`} style={{ marginBottom: '0.3rem' }}><AlertCircle size={12} style={{ marginRight: '4px' }} /> {v}</div>)}
                          {/* Show R violations */}
                          {data.violations && data.violations.r_violations && data.violations.r_violations.map((v, i) => <div key={`r-${i}`} style={{ marginBottom: '0.3rem' }}><AlertCircle size={12} style={{ marginRight: '4px' }} /> {v}</div>)}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--success-color)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>所有點位均在統計管制界限內。</span>
                </div>
              )}

              {/* Interpretation Hint for Batch Analysis */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderLeft: '4px solid #334155',
                borderRadius: '4px',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155' }}>
                  <Activity size={18} /> 分析結果解讀 (Interpretation Guide)
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li><strong>製程中心趨勢 (Xbar/I Chart)</strong>: 監測製程均值。<strong>紅色異常點</strong>代表觸發了 Nelson Rules，暗示存在「特殊原因」變異。</li>
                  <li><strong>Nelson Rules 判定引擎</strong>:
                    <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem' }}>
                      <li><strong>Rule 1</strong>: 點超出 ±3σ 管制界限 (突發性異常/重大偏移)。</li>
                      <li><strong>Rule 2</strong>: 連續 9 點在中心線同側 (製程平均值發生偏移)。</li>
                      <li><strong>Rule 3</strong>: 連續 6 點持續上升或下降 (工具磨損、耗材老化或趨勢性變化)。</li>
                      <li><strong>Rule 4</strong>: 連續 14 點上下交替 (系統性振動、人為干擾或週期性因素)。</li>
                    </ul>
                  </li>
                  <li><strong>全距管制圖 (R/MR Chart)</strong>:
                    <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem' }}>
                      <li><strong>R 圖 (模穴平衡性)</strong>: 監測模具各穴填充的均勻度。R 值偏高通常代表<strong>熱流道溫控不均</strong>、<strong>排氣阻塞</strong>或<strong>澆口損耗</strong>。</li>
                      <li><strong>MR 圖 (製程漂移)</strong>: 反映相鄰批次的跳動。異常通常源於<strong>冷卻水溫漂移</strong>或<strong>環境溫濕度</strong>影響。</li>
                    </ul>
                  </li>
                  <li><strong>常態分佈 (Histogram & Curve)</strong>: 評估數據是否符合常態分佈。
                    <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem' }}>
                      <li>若直方圖嚴重偏斜 (Skewed)，即便 Cpk 達標，也暗示製程存在系統性偏置或數據非隨機分佈。</li>
                      <li><strong>Sigma 區間</strong>: ±3σ 應涵蓋約 99.73% 的數據。若大量點位於 ±3σ 之外，代表製程能力不足。</li>
                    </ul>
                  </li>
                </ul>
                <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: '#fff', border: '1px solid #bae7ff', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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

            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '32px 32px 0 32px' }}>
                <h2 style={{ marginBottom: '8px' }}>控制圖分析 (Process Control Charts)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>即時監測製程中心趨勢與變異一致性</p>
              </div>
              <div className="charts-container" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '40px' }}>
                  <Plot
                    data={[
                      ...(data.data.cavity_actual_name === "Average of All Cavities" || (data.data.cavity_actual_name && data.data.r_values && data.data.r_values.length > 0) ? [
                        {
                          x: data.data.labels.map((_, i) => i),
                          y: data.data.values,
                          type: 'scatter',
                          mode: 'lines+markers',
                          name: 'X-bar (均值)',
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
                        text: `<b>${selectedProduct}</b><br><span style="font-size: 14px; color: #64748b;">${selectedItem} - ${data.data.cavity_actual_name === "Average of All Cavities" ? "X-bar (均值)" : "Individual-X (單值)"}</span>`,
                        font: { family: 'Inter', size: 16 },
                        x: 0,
                        xanchor: 'left',
                        y: 0.95
                      },
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
                            color: data.data.r_values.map(val => {
                              if (data.control_limits && data.control_limits.ucl_r && (val > data.control_limits.ucl_r)) return '#ef4444';
                              return '#64748b';
                            }),
                            size: 6
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
                            color: data.data.mr_values.map(val => (data.control_limits && data.control_limits.ucl_mr && val > data.control_limits.ucl_mr) ? '#ef4444' : '#64748b'),
                            size: 6
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
                              ...(data.specs.lsl !== null ? [{ x: data.specs.lsl, y: Math.max(...data.distribution.histogram.counts) * 1.15, text: 'LSL', showarrow: false, font: { color: '#dc2626', weight: 'bold' } }] : []),
                              ...(data.specs.usl !== null ? [{ x: data.specs.usl, y: Math.max(...data.distribution.histogram.counts) * 1.15, text: 'USL', showarrow: false, font: { color: '#dc2626', weight: 'bold' } }] : []),
                              ...(data.specs.target !== null ? [{ x: data.specs.target, y: Math.max(...data.distribution.histogram.counts) * 1.15, text: 'Target', showarrow: false, font: { color: '#10b981' } }] : []),
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
                            {(() => {
                              const dec = data.specs.decimals !== undefined ? data.specs.decimals : 4;
                              return (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>LSL</span>
                                    <span style={!data.specs.lsl ? { opacity: 0.3 } : {}}>
                                      {data.specs.lsl !== null && data.specs.lsl !== undefined ? data.specs.lsl.toFixed(dec) : '*'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>Target</span>
                                    <span style={!data.specs.target ? { opacity: 0.3 } : {}}>
                                      {data.specs.target !== null && data.specs.target !== undefined ? data.specs.target.toFixed(dec) : '*'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span>USL</span>
                                    <span style={!data.specs.usl ? { opacity: 0.3 } : {}}>
                                      {data.specs.usl !== null && data.specs.usl !== undefined ? data.specs.usl.toFixed(dec) : '*'}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', marginTop: '4px', paddingTop: '4px' }}>
                                    <span>Sample Mean</span>
                                    <span>{data.stats.mean.toFixed(dec)}</span>
                                  </div>
                                </>
                              );
                            })()}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sample N</span> <span>{data.stats.count}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>StDev (Within)</span> <span>{data.stats.within_std.toFixed(5)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>StDev (Overall)</span> <span>{data.stats.overall_std.toFixed(5)}</span></div>
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
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {data && analysisType === 'cavity' && data.cavities && (
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
        )}

        {data && analysisType === 'group' && data.groups && (
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
        )}
      </main>
    </div>
  );
}

export default App;
