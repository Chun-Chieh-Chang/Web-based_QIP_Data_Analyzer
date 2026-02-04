import * as XLSX from 'xlsx';
import { SPCAnalysis } from './spc_logic.js';

const spcEngine = new SPCAnalysis();
let cachedWorkbook = null;
let messageQueue = Promise.resolve();

self.onmessage = (e) => {
    // Queue messages to handle them sequentially, preventing race conditions
    // between parsing and data requests.
    messageQueue = messageQueue.then(async () => {
        const { type, payload } = e.data;

        try {
            switch (type) {
                case 'PARSE_EXCEL':
                    cachedWorkbook = null; // Explicitly clear old workbook to free memory for the new one
                    const { file } = payload;
                    const data = await file.arrayBuffer();
                    cachedWorkbook = XLSX.read(data, { type: 'array' });
                    self.postMessage({ type: 'PARSE_SUCCESS', payload: { success: true } });
                    break;

                case 'GET_PRODUCTS':
                    if (!cachedWorkbook) throw new Error("No workbook loaded");
                    const products = spcEngine.getInspectionItems(cachedWorkbook);
                    self.postMessage({ type: 'PRODUCTS_LOADED', payload: { products } });
                    break;

                case 'GET_ITEMS':
                    if (!cachedWorkbook) throw new Error("No workbook loaded");
                    const { product } = payload;
                    const items = spcEngine.getInspectionItems(cachedWorkbook, product);
                    const cavityInfo = spcEngine.getCavityInfo(cachedWorkbook, product);
                    self.postMessage({ type: 'ITEMS_LOADED', payload: { items, cavityInfo } });
                    break;

                case 'GET_BATCHES':
                    if (!cachedWorkbook) throw new Error("No workbook loaded");
                    const { item } = payload;
                    const batches = spcEngine.getBatches(cachedWorkbook, item);
                    self.postMessage({ type: 'BATCHES_LOADED', payload: { batches } });
                    break;

                case 'RUN_ANALYSIS':
                    if (!cachedWorkbook) throw new Error("No workbook loaded");
                    const { analysisType, selectedItem, selectedCavity, startBatch, endBatch, excludedBatches } = payload;

                    let result;
                    if (analysisType === 'batch') {
                        result = await spcEngine.analyzeBatch(cachedWorkbook, selectedItem, selectedCavity, startBatch, endBatch, excludedBatches);
                    } else if (analysisType === 'cavity') {
                        result = await spcEngine.analyzeCavity(cachedWorkbook, selectedItem, startBatch, endBatch, excludedBatches);
                    } else if (analysisType === 'group') {
                        result = await spcEngine.analyzeGroup(cachedWorkbook, selectedItem, startBatch, endBatch, excludedBatches);
                    } else if (analysisType === 'p-chart') {
                        result = await spcEngine.analyzePChart(cachedWorkbook, selectedItem, startBatch, endBatch, excludedBatches);
                    }

                    if (result.error) throw new Error(result.error);

                    // Add dummy structure if missing for batch analysis
                    if (result.data && !result.data.r_values) {
                        result.data.r_values = [];
                        result.data.r_labels = [];
                    }

                    self.postMessage({ type: 'ANALYSIS_SUCCESS', payload: { result } });
                    break;

                default:
                    console.warn("Unknown message type:", type);
            }
        } catch (error) {
            self.postMessage({ type: 'ERROR', payload: { message: error.message } });
        }
    });
};
