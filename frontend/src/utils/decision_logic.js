// Decision Tree Logic for Intelligent Chart Type Recommendation
// Implements 5-layer decision logic for automatic chart selection

/**
 * Layer 1: Detect data type (continuous vs discrete)
 */
export const detectDataType = (data) => {
  if (!data || data.length === 0) return null;

  // Check if all values are integers and non-negative
  const allIntegers = data.every(v => Number.isInteger(v) && v >= 0);
  
  if (!allIntegers) {
    return {
      type: 'continuous',
      label: '計量型 (Continuous)',
      description: '測量值 (mm, μm, g, etc.)',
      recommendation: 'I-MR, X-bar/R, X-bar/S, EWMA, CUSUM'
    };
  }

  // Check if binary (0 or 1)
  const isBinary = data.every(v => v === 0 || v === 1);
  if (isBinary) {
    return {
      type: 'binary-count',
      label: '計數型 - 二元分類 (Binary)',
      description: '良/不良分類',
      recommendation: 'P Chart, NP Chart'
    };
  }

  // Otherwise it's count data
  return {
    type: 'count',
    label: '計數型 - 多元計數 (Count)',
    description: '缺陷數、不良品數',
    recommendation: 'C Chart, U Chart'
  };
};

/**
 * Layer 2: Analyze sample size and recommend chart type
 */
export const analyzeSampleSize = (n) => {
  if (n === 1) {
    return {
      n,
      category: 'individual',
      label: '個別值 (n=1)',
      recommendedChart: 'I-MR',
      reason: '個別值監測，使用移動全距估計標準差',
      factors: {
        centerChart: 'I (Individual)',
        variationChart: 'MR (Moving Range)',
        d2Constant: 1.128,
        controlLimitFactor: 2.66
      }
    };
  }

  if (n >= 2 && n <= 5) {
    return {
      n,
      category: 'small-sample',
      label: '小樣本 (2 ≤ n ≤ 5)',
      recommendedChart: 'X-bar/R',
      reason: '小樣本使用全距 (R) 估計標準差',
      factors: {
        centerChart: 'X-bar (Average)',
        variationChart: 'R (Range)',
        estimator: 'R-based',
        advantage: '計算簡單，適合現場應用'
      }
    };
  }

  if (n >= 6 && n <= 10) {
    return {
      n,
      category: 'medium-sample',
      label: '中樣本 (6 ≤ n ≤ 10)',
      recommendedChart: 'X-bar/S',
      reason: '中樣本使用標準差 (S) 估計，更精確',
      factors: {
        centerChart: 'X-bar (Average)',
        variationChart: 'S (Standard Deviation)',
        estimator: 'S-based',
        advantage: '比 R 更精確，推薦使用'
      }
    };
  }

  // n > 10
  return {
    n,
    category: 'large-sample',
    label: '大樣本 (n > 10)',
    recommendedChart: 'X-bar/S',
    reason: '大樣本使用標準差 (S) 估計',
    factors: {
      centerChart: 'X-bar (Average)',
      variationChart: 'S (Standard Deviation)',
      estimator: 'S-based',
      advantage: '最精確的估計方法'
    }
  };
};

/**
 * Shapiro-Wilk normality test
 * Returns p-value (0-1)
 */
const shapiroWilkTest = (data) => {
  if (data.length < 3 || data.length > 5000) return null;

  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  
  // Calculate mean
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  
  // Calculate sum of squared deviations
  const ss = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
  
  // Coefficients for Shapiro-Wilk test (simplified)
  const coefficients = getShapiroWilkCoefficients(n);
  
  // Calculate W statistic
  let numerator = 0;
  for (let i = 0; i < Math.floor(n / 2); i++) {
    const a = coefficients[i];
    numerator += a * (sorted[n - 1 - i] - sorted[i]);
  }
  
  const w = Math.pow(numerator, 2) / ss;
  
  // Convert W to p-value (approximation)
  const pValue = calculateShapiroWilkPValue(w, n);
  
  return pValue;
};

/**
 * Get Shapiro-Wilk coefficients for given sample size
 */
const getShapiroWilkCoefficients = (n) => {
  // Simplified coefficients for common sample sizes
  const coefficientsTable = {
    3: [0.7071],
    4: [0.6872, 0.1677],
    5: [0.6646, 0.1543, 0.0000],
    6: [0.6431, 0.1519, 0.0351],
    7: [0.6233, 0.1496, 0.0458],
    8: [0.6052, 0.1472, 0.0539],
    9: [0.5888, 0.1447, 0.0604],
    10: [0.5739, 0.1422, 0.0658]
  };
  
  if (coefficientsTable[n]) {
    return coefficientsTable[n];
  }
  
  // For larger n, use approximation
  return Array(Math.floor(n / 2)).fill(0).map((_, i) => {
    const j = i + 1;
    return Math.sqrt(j / (n + 1 - j)) * 0.5;
  });
};

/**
 * Calculate p-value from W statistic
 */
const calculateShapiroWilkPValue = (w, n) => {
  // Simplified approximation
  if (w < 0.8) return 0.001;
  if (w < 0.9) return 0.01;
  if (w < 0.95) return 0.05;
  return 0.1;
};

/**
 * Layer 3: Test normality
 */
export const testNormality = (data) => {
  if (!data || data.length < 3) {
    return {
      canTest: false,
      message: '樣本數不足 (需要至少 3 個數據點)'
    };
  }

  const pValue = shapiroWilkTest(data);
  
  if (pValue === null) {
    return {
      canTest: false,
      message: '樣本數超出範圍 (需要 3-5000 個數據點)'
    };
  }

  const isNormal = pValue >= 0.05;
  
  return {
    canTest: true,
    pValue: pValue.toFixed(4),
    isNormal,
    alpha: 0.05,
    message: isNormal 
      ? `✓ 數據符合常態分布 (P-value = ${pValue.toFixed(4)} ≥ 0.05)`
      : `✗ 數據不符合常態分布 (P-value = ${pValue.toFixed(4)} < 0.05)`,
    recommendations: isNormal 
      ? ['使用標準 Shewhart 管制圖']
      : [
          '嘗試 Log 轉換',
          '嘗試 Box-Cox 轉換',
          '嘗試平方根轉換',
          '考慮使用非參數方法',
          '檢查是否有異常值'
        ]
  };
};

/**
 * Layer 4: Detect trend (wear, drift, or stable)
 */
export const detectTrend = (data) => {
  if (!data || data.length < 3) {
    return {
      canDetect: false,
      message: '樣本數不足 (需要至少 3 個數據點)'
    };
  }

  // Linear regression
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = data;
  
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  
  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  
  const slope = numerator / denominator;
  
  // Calculate R²
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = yMean + slope * (x[i] - xMean);
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  
  // Determine trend type
  const trendThreshold = 0.7;
  const slopeThreshold = (Math.max(...y) - Math.min(...y)) / (n * 10);
  
  let trendType = 'none';
  let recommendation = '使用標準 Shewhart 管制圖';
  
  if (Math.abs(slope) > slopeThreshold && r2 > trendThreshold) {
    if (slope < 0) {
      trendType = 'wear';
      recommendation = '檢測到磨耗趨勢，建議使用允收管制圖 (Acceptance Control Chart)';
    } else {
      trendType = 'drift';
      recommendation = '檢測到漂移趨勢，建議使用擴展 Shewhart 圖表或 EWMA';
    }
  }
  
  return {
    canDetect: true,
    slope: slope.toFixed(6),
    r2: r2.toFixed(4),
    trendType,
    hasTrend: trendType !== 'none',
    message: trendType === 'none' 
      ? `✓ 無明顯趨勢 (R² = ${r2.toFixed(4)})`
      : `⚠ 檢測到${trendType === 'wear' ? '磨耗' : '漂移'}趨勢 (R² = ${r2.toFixed(4)})`,
    recommendation,
    details: {
      linearSlope: slope,
      rSquared: r2,
      trendStrength: r2 > 0.8 ? '強' : r2 > 0.5 ? '中' : '弱'
    }
  };
};

/**
 * Layer 5: Sensitivity selection
 */
export const getSensitivityOptions = () => {
  return [
    {
      id: 'standard',
      label: '標準 (Shewhart)',
      description: '傳統管制圖，適合一般監測',
      method: 'Shewhart',
      sigma: 3,
      advantages: ['易於理解', '計算簡單', '業界標準'],
      disadvantages: ['對小變化不敏感'],
      useCase: '一般製程監測'
    },
    {
      id: 'medium',
      label: '中等 (EWMA)',
      description: '指數加權移動平均，對小變化敏感',
      method: 'EWMA',
      lambda: 0.2,
      sigma: 2.66,
      advantages: ['對小變化敏感', '快速反應', '適合連續監測'],
      disadvantages: ['計算複雜', '需要歷史數據'],
      useCase: '需要快速反應的製程'
    },
    {
      id: 'high',
      label: '高敏感 (CUSUM)',
      description: '累積和圖，最敏感的方法',
      method: 'CUSUM',
      h: 5,
      k: 0.5,
      advantages: ['最敏感', '檢測微小變化', '專業級'],
      disadvantages: ['計算複雜', '需要專業知識'],
      useCase: '精密製造、零缺陷策略'
    }
  ];
};

/**
 * Main recommendation engine
 */
export const recommendChartType = (analysisContext) => {
  const {
    dataType,
    sampleSize,
    normalityTest,
    trendDetection,
    sensitivity
  } = analysisContext;

  let primaryChart = null;
  let secondaryCharts = [];
  let warnings = [];
  let recommendations = [];

  // Based on data type
  if (dataType.type === 'continuous') {
    // For continuous data
    if (sampleSize.n === 1) {
      primaryChart = 'I-MR';
    } else if (sampleSize.n <= 5) {
      primaryChart = 'X-bar/R';
    } else {
      primaryChart = 'X-bar/S';
    }

    // Check normality
    if (!normalityTest.isNormal) {
      warnings.push('⚠ 數據不符合常態分布，考慮數據轉換');
      recommendations.push(...normalityTest.recommendations);
    }

    // Check trend
    if (trendDetection.hasTrend) {
      warnings.push(`⚠ 檢測到${trendDetection.trendType === 'wear' ? '磨耗' : '漂移'}趨勢`);
      recommendations.push(trendDetection.recommendation);
      
      if (trendDetection.trendType === 'wear') {
        secondaryCharts.push('Acceptance Control Chart');
      } else {
        secondaryCharts.push('EWMA');
      }
    }

    // Check sensitivity
    if (sensitivity === 'medium') {
      secondaryCharts.push('EWMA');
    } else if (sensitivity === 'high') {
      secondaryCharts.push('CUSUM');
    }
  } else if (dataType.type === 'binary-count') {
    primaryChart = 'P Chart';
    recommendations.push('適用於良/不良二元分類');
  } else if (dataType.type === 'count') {
    primaryChart = 'C Chart';
    recommendations.push('適用於缺陷數計數');
  }

  return {
    primaryChart,
    secondaryCharts,
    warnings,
    recommendations,
    confidence: calculateConfidence(analysisContext),
    summary: generateSummary(primaryChart, analysisContext)
  };
};

/**
 * Calculate recommendation confidence
 */
const calculateConfidence = (context) => {
  let score = 100;
  
  if (!context.normalityTest.isNormal) score -= 10;
  if (context.trendDetection.hasTrend) score -= 15;
  
  return Math.max(score, 50);
};

/**
 * Generate human-readable summary
 */
const generateSummary = (chart, context) => {
  const parts = [];
  
  parts.push(`根據您的數據特性，推薦使用 ${chart}。`);
  
  if (context.sampleSize.n > 1) {
    parts.push(`每批次有 ${context.sampleSize.n} 個樣本，${context.sampleSize.reason}`);
  }
  
  if (context.normalityTest.isNormal) {
    parts.push('數據符合常態分布，可以使用標準管制圖。');
  }
  
  if (!context.trendDetection.hasTrend) {
    parts.push('未檢測到明顯趨勢，製程相對穩定。');
  }
  
  return parts.join(' ');
};

/**
 * Get all decision results
 */
export const runFullDecisionTree = (data, sampleSize) => {
  const dataType = detectDataType(data);
  const sampleSizeAnalysis = analyzeSampleSize(sampleSize);
  const normalityTest = testNormality(data);
  const trendDetection = detectTrend(data);
  
  return {
    dataType,
    sampleSize: sampleSizeAnalysis,
    normality: normalityTest,
    trend: trendDetection,
    recommendation: recommendChartType({
      dataType,
      sampleSize: sampleSizeAnalysis,
      normalityTest,
      trendDetection,
      sensitivity: 'standard'
    })
  };
};
