// AIAG-VDA SPC Control Chart Selection Guide
// Based on AIAG-VDA SPC Manual
// Implements systematic chart selection based on data type, sample size, distribution, and process behavior

/**
 * Data types
 */
export const DATA_TYPES = {
  VARIABLE: 'variable',      // Continuous/Measurement data
  ATTRIBUTE: 'attribute'     // Discrete/Count data
};

/**
 * Process models based on ISO 22514-2
 */
export const PROCESS_MODELS = {
  A1: 'a1',  // Stable, Normal distribution
  A2: 'a2',  // Stable, Non-normal/Skewed
  B: 'b',    // Variation unstable (Location constant, Variation changes)
  C: 'c',    // Location unstable (e.g., Tool wear)
  D: 'd'     // Both location and variation unstable
};

/**
 * Get data type recommendation
 */
export const getDataTypeGuidance = () => {
  return {
    variable: {
      id: 'variable',
      label: '計量型數據 (Variable/Continuous Data)',
      description: '來自測量的數據（如長度、壓力、溫度）',
      advantages: [
        '提供更多製程資訊',
        '更適合零缺陷策略',
        '能檢測更微小的變化',
        '更敏感的統計檢驗'
      ],
      examples: [
        '零件尺寸 (mm)',
        '壓力 (bar)',
        '溫度 (°C)',
        '重量 (g)',
        '電阻 (Ω)'
      ]
    },
    attribute: {
      id: 'attribute',
      label: '計數型數據 (Attribute/Discrete Data)',
      description: '來自計數的數據（如不良品數、缺陷數）',
      advantages: [
        '易於收集',
        '適合快速檢驗',
        '適合通過/失敗判定'
      ],
      examples: [
        '不良品數量',
        '缺陷數量',
        '不良率',
        '缺陷率'
      ]
    }
  };
};

/**
 * Get variable data chart recommendations based on sample size
 */
export const getVariableChartRecommendations = (sampleSize) => {
  const recommendations = {
    individual: {
      n: 1,
      label: '單值移動全距圖 (I-MR Chart / X-MR Chart)',
      sampleSize: 'n = 1',
      applicableSituations: [
        '破壞性測試',
        '檢測成本高昂',
        '製程非常穩定且均質（如化學液體）',
        '自動化連續測量'
      ],
      advantages: [
        '適合單個測量值',
        '簡單易用',
        '成本低'
      ],
      disadvantages: [
        '樣本數少，統計效率低',
        '對小變化反應較慢'
      ],
      controlLimitFactors: {
        movingRange: 'MR',
        d2Constant: 1.128,
        controlLimitFactor: 2.66
      }
    },

    smallSample: {
      n: '1 < n < 10',
      label: '平均值與全距圖 (X-bar & R Chart)',
      sampleSize: '2 ≤ n ≤ 9',
      applicableSituations: [
        '手動計算或傳統抽樣',
        '樣本數較小',
        '傳統製造環境'
      ],
      advantages: [
        '易於手工計算',
        '業界標準',
        '對中心變化敏感'
      ],
      disadvantages: [
        '全距估計效率隨 n 增加而降低',
        '對變異變化反應較慢'
      ],
      notes: [
        '若為自動化測量且數據變異大，可考慮中位數圖 (Median chart)',
        '中位數圖反應較慢，不推薦'
      ],
      controlLimitFactors: {
        centerChart: 'X-bar (Average)',
        variationChart: 'R (Range)',
        estimator: 'R-based',
        efficiency: '隨 n 增加而降低'
      }
    },

    largeSample: {
      n: '≥ 10',
      label: '平均值與標準差圖 (X-bar & s Chart)',
      sampleSize: 'n ≥ 10',
      applicableSituations: [
        '電腦輔助計算',
        '自動化測量',
        '樣本數較大',
        '現代製造環境'
      ],
      advantages: [
        '全距估計效率高',
        '對變異變化敏感',
        '推薦的標準圖表',
        '電腦計算時的最佳選擇'
      ],
      disadvantages: [
        '手工計算複雜',
        '需要電腦支持'
      ],
      notes: [
        '當樣本數增加時，全距估計標準差的效率會降低',
        '因此應改用標準差 (s)',
        '這是電腦輔助計算時的推薦標準圖表'
      ],
      controlLimitFactors: {
        centerChart: 'X-bar (Average)',
        variationChart: 's (Standard Deviation)',
        estimator: 's-based',
        efficiency: '隨 n 增加而提高'
      }
    }
  };

  if (sampleSize === 1) {
    return recommendations.individual;
  } else if (sampleSize > 1 && sampleSize < 10) {
    return recommendations.smallSample;
  } else {
    return recommendations.largeSample;
  }
};

/**
 * Get attribute data chart recommendations
 */
export const getAttributeChartRecommendations = (countType, sampleSizeFixed) => {
  const recommendations = {
    defectives: {
      fixed: {
        label: 'np 管制圖 (np-chart)',
        type: '計件 - 樣本數固定',
        description: '監測不良品數量（樣本數固定）',
        applicableSituations: [
          '樣本數固定',
          '每批次檢驗相同數量',
          '計數不良品'
        ],
        advantages: [
          '易於理解',
          '直接計數',
          '樣本數固定時最簡單'
        ],
        controlLimitFormula: 'UCL = np + 3√[np(1-p)], LCL = np - 3√[np(1-p)]'
      },
      variable: {
        label: 'p 管制圖 (p-chart)',
        type: '計件 - 樣本數不固定',
        description: '監測不良品比例（樣本數可變）',
        applicableSituations: [
          '樣本數不固定',
          '每批次檢驗數量不同',
          '計算不良率'
        ],
        advantages: [
          '適應樣本數變化',
          '可比較不同批次',
          '更靈活'
        ],
        controlLimitFormula: 'UCL = p + 3√[p(1-p)/n], LCL = p - 3√[p(1-p)/n]'
      }
    },

    defects: {
      fixed: {
        label: 'c 管制圖 (c-chart)',
        type: '計點 - 樣本單位固定',
        description: '監測缺陷數量（樣本單位固定）',
        applicableSituations: [
          '樣本單位/大小固定',
          '每件產品檢驗相同面積',
          '計數缺陷'
        ],
        advantages: [
          '易於理解',
          '直接計數',
          '樣本單位固定時最簡單'
        ],
        controlLimitFormula: 'UCL = c + 3√c, LCL = c - 3√c'
      },
      variable: {
        label: 'u 管制圖 (u-chart)',
        type: '計點 - 樣本單位不固定',
        description: '監測缺陷率（樣本單位可變）',
        applicableSituations: [
          '樣本單位/大小不固定',
          '每件產品檢驗面積不同',
          '計算缺陷率'
        ],
        advantages: [
          '適應樣本單位變化',
          '可比較不同產品',
          '更靈活'
        ],
        controlLimitFormula: 'UCL = u + 3√(u/n), LCL = u - 3√(u/n)'
      }
    }
  };

  if (countType === 'defectives') {
    return sampleSizeFixed ? recommendations.defectives.fixed : recommendations.defectives.variable;
  } else {
    return sampleSizeFixed ? recommendations.defects.fixed : recommendations.defects.variable;
  }
};

/**
 * Get process model guidance
 */
export const getProcessModelGuidance = () => {
  return {
    a1: {
      id: 'a1',
      label: '模型 A1: 穩定且常態分佈 (Stable, Normal)',
      characteristics: [
        '製程穩定',
        '數據呈常態分佈',
        '無明顯趨勢',
        '變異恆定'
      ],
      analysisChart: 'Shewhart Chart (如 X-bar/s)',
      spcChart: 'Shewhart Chart',
      description: '最理想的製程狀態，使用標準 Shewhart 管制圖'
    },

    a2: {
      id: 'a2',
      label: '模型 A2: 穩定但非常態/偏態 (Skewed/Non-normal)',
      characteristics: [
        '製程穩定',
        '數據呈偏態分佈',
        '如幾何公差接近零',
        '無明顯趨勢'
      ],
      analysisChart: 'Pearson Chart',
      spcChart: 'Pearson Chart',
      description: '數據非常態時，使用 Pearson 管制圖或數據轉換',
      recommendations: [
        '優先使用 Pearson 管制圖',
        '或使用 Box-Cox/Johnson 轉換後的 Shewhart 管制圖',
        '檢查數據是否真的非常態'
      ]
    },

    b: {
      id: 'b',
      label: '模型 B: 變異不穩定 (Location constant, Variation changes)',
      characteristics: [
        '製程中心穩定',
        '變異不穩定',
        '無明顯趨勢',
        '變異隨時間變化'
      ],
      analysisChart: 'Shewhart Chart (需較大樣本/較低頻率)',
      spcChart: 'Shewhart Chart',
      description: '變異不穩定時，需要較大樣本或較低抽樣頻率',
      recommendations: [
        '增加樣本數',
        '降低抽樣頻率',
        '調查變異來源',
        '改善製程穩定性'
      ]
    },

    c: {
      id: 'c',
      label: '模型 C: 位置不穩定/有趨勢 (Location changes, e.g. Tool wear)',
      characteristics: [
        '製程有已知趨勢',
        '如刀具磨耗',
        '位置隨時間變化',
        '系統性偏移'
      ],
      analysisChart: 'Extended Shewhart Chart (擴展界限)',
      spcChart: 'Acceptance Control Chart (允收管制圖)',
      description: '有已知趨勢時，標準 Shewhart 圖會頻繁發出假警報',
      recommendations: [
        '使用擴展的 Shewhart 管制圖',
        '或使用允收管制圖 (Acceptance Control Chart)',
        '定期更換刀具或調整參數',
        '監測趨勢速率'
      ]
    },

    d: {
      id: 'd',
      label: '模型 D: 位置與變異皆不穩定 (Both unstable)',
      characteristics: [
        '位置和變異都不穩定',
        '複雜的製程行為',
        '多個變異來源',
        '需要深入調查'
      ],
      analysisChart: 'Extended Shewhart Chart',
      spcChart: 'Acceptance Control Chart',
      description: '最複雜的情況，需要使用高級管制圖',
      recommendations: [
        '使用擴展的 Shewhart 管制圖',
        '或使用允收管制圖',
        '進行深入的製程分析',
        '識別並消除變異來源',
        '可能需要專家協助'
      ]
    }
  };
};

/**
 * Get sensitivity-based chart recommendations
 */
export const getSensitivityRecommendations = () => {
  return {
    standard: {
      id: 'standard',
      label: 'Shewhart 管制圖',
      sensitivity: '標準',
      description: '傳統管制圖，適合一般監測',
      advantages: [
        '易於理解',
        '計算簡單',
        '業界標準',
        '適合大多數應用'
      ],
      disadvantages: [
        '對小變化反應較慢',
        '需要較多數據點才能檢測小偏移'
      ]
    },

    cusum: {
      id: 'cusum',
      label: 'CUSUM (累積和管制圖)',
      sensitivity: '高',
      description: '對小幅度偏移非常敏感',
      advantages: [
        '對小變化敏感',
        '能快速顯示趨勢變化',
        '適合精密製造',
        '適合零缺陷策略'
      ],
      disadvantages: [
        '計算複雜',
        '需要電腦支持',
        '解釋較困難'
      ],
      applicableSituations: [
        '需要檢測微小偏移',
        '精密製造',
        '零缺陷策略',
        '高價值產品'
      ]
    },

    ewma: {
      id: 'ewma',
      label: 'EWMA (指數加權移動平均管制圖)',
      sensitivity: '中-高',
      description: '利用歷史數據的加權平均來檢測小偏移',
      advantages: [
        '對小變化敏感',
        '適合漸進式變化監控',
        '計算相對簡單',
        '適合連續監測'
      ],
      disadvantages: [
        '需要電腦支持',
        '參數選擇影響性能',
        '解釋較困難'
      ],
      applicableSituations: [
        '需要檢測微小偏移',
        '漸進式變化監控',
        '連續製程',
        '自動化系統'
      ]
    }
  };
};

/**
 * Get special situation recommendations
 */
export const getSpecialSituationRecommendations = () => {
  return {
    shortRun: {
      label: '小批量/多樣少量 (Short Runs/High Mix)',
      description: '不同產品混合生產',
      techniques: [
        'Z-Chart',
        'Short Run SPC 技術'
      ],
      approach: '將不同產品的數據標準化後繪製在同一張圖上',
      advantages: [
        '適合多品種生產',
        '節省資源',
        '快速反應'
      ]
    },

    multivariate: {
      label: '多變量特性 (Multivariate)',
      description: '多個特性相互影響',
      techniques: [
        "Hotelling's T² chart",
        'MEWMA'
      ],
      approach: '同時監控多個相關特性',
      advantages: [
        '考慮特性間的相關性',
        '更準確的判斷',
        '避免誤判'
      ],
      examples: [
        '位置度座標 X 和 Y',
        '多個相關尺寸',
        '複合特性'
      ]
    }
  };
};

/**
 * Main chart selection engine
 */
export const selectControlChart = (context) => {
  const {
    dataType,
    sampleSize,
    distribution,
    processModel,
    sensitivity,
    specialSituation
  } = context;

  let recommendation = {
    primaryChart: null,
    secondaryCharts: [],
    reasoning: [],
    warnings: [],
    recommendations: []
  };

  // Step 1: Data type
  if (dataType === DATA_TYPES.VARIABLE) {
    const variableRec = getVariableChartRecommendations(sampleSize);
    recommendation.primaryChart = variableRec.label;
    recommendation.reasoning.push(`根據樣本數 (n=${sampleSize})，推薦 ${variableRec.label}`);
  } else if (dataType === DATA_TYPES.ATTRIBUTE) {
    // Need more info for attribute data
    recommendation.reasoning.push('計數型數據需要進一步確認計件/計點和樣本大小是否固定');
  }

  // Step 2: Distribution
  if (distribution === 'non-normal') {
    recommendation.warnings.push('⚠ 數據非常態分佈');
    recommendation.recommendations.push('考慮使用 Pearson 管制圖或數據轉換 (Box-Cox/Johnson)');
  }

  // Step 3: Process model
  if (processModel) {
    const modelGuidance = getProcessModelGuidance()[processModel];
    if (modelGuidance) {
      recommendation.reasoning.push(`製程模型: ${modelGuidance.label}`);
      recommendation.primaryChart = modelGuidance.analysisChart;
      
      if (processModel === PROCESS_MODELS.C || processModel === PROCESS_MODELS.D) {
        recommendation.warnings.push(`⚠ ${modelGuidance.label}`);
        recommendation.secondaryCharts.push(modelGuidance.spcChart);
        recommendation.recommendations.push(...modelGuidance.recommendations);
      }
    }
  }

  // Step 4: Sensitivity
  if (sensitivity === 'high') {
    recommendation.secondaryCharts.push('CUSUM 或 EWMA');
    recommendation.recommendations.push('考慮使用 CUSUM 或 EWMA 以檢測微小變化');
  }

  // Step 5: Special situations
  if (specialSituation === 'shortRun') {
    recommendation.secondaryCharts.push('Z-Chart 或 Short Run SPC');
    recommendation.recommendations.push('使用 Z-Chart 或 Short Run SPC 技術標準化數據');
  } else if (specialSituation === 'multivariate') {
    recommendation.secondaryCharts.push("Hotelling's T² 或 MEWMA");
    recommendation.recommendations.push("使用 Hotelling's T² 或 MEWMA 監控多個相關特性");
  }

  return recommendation;
};

/**
 * Get complete selection guide
 */
export const getCompleteSelectionGuide = () => {
  return {
    step1: {
      title: '第 1 步：數據類型判斷',
      description: '數據是測量的（計量）還是計數的（計數）？',
      note: '計量型優於計數型，因為更適合零缺陷策略',
      guidance: getDataTypeGuidance()
    },
    step2: {
      title: '第 2 步：樣本數分析',
      description: '樣本數大小為何？',
      note: '決定用 R 還是 s，或是 I-MR',
      guidance: '根據樣本數選擇合適的圖表'
    },
    step3: {
      title: '第 3 步：分佈特性檢驗',
      description: '製程是否為常態分佈？',
      note: '若否，考慮 Pearson 或數據轉換',
      guidance: '非常態分佈需要特殊處理'
    },
    step4: {
      title: '第 4 步：趨勢檢測',
      description: '是否有已知趨勢（如磨耗）？',
      note: '若有，考慮允收管制圖或擴展 Shewhart',
      guidance: getProcessModelGuidance()
    },
    step5: {
      title: '第 5 步：敏感度需求',
      description: '是否需要檢測微小變化？',
      note: '若需要，考慮 CUSUM 或 EWMA',
      guidance: getSensitivityRecommendations()
    }
  };
};
