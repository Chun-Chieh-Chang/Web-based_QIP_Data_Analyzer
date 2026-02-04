// Analysis Stage Guidance System
// Provides different guidance based on analysis stage:
// 1. Machine Performance Research (定性穩定性評估)
// 2. Analysis Control Charts (回溯評估，考慮誤報率)
// 3. SPC Control Charts (即時控制，零容忍)

/**
 * Analysis stages
 */
export const ANALYSIS_STAGES = {
  MACHINE_PERFORMANCE: 'machine-performance',
  ANALYSIS_CONTROL: 'analysis-control',
  SPC_CONTROL: 'spc-control'
};

/**
 * Get stage configuration
 */
export const getStageConfig = (stage) => {
  const configs = {
    [ANALYSIS_STAGES.MACHINE_PERFORMANCE]: {
      id: 'machine-performance',
      label: '機器性能研究階段 (Machine Performance)',
      description: '樣本數較少，進行定性穩定性評估',
      icon: '🔧',
      sampleSizeRange: '< 100 (通常 50 件)',
      purpose: '評估機器/模具的基本性能',
      
      characteristics: {
        title: '階段特徵',
        items: [
          '樣本數較少 (通常 50-100 件)',
          '進行定性穩定性評估',
          '重點關注無法解釋的異常',
          '觀察曲線形態而非統計檢驗'
        ]
      },

      whatToObserve: {
        title: '應該觀察什麼?',
        items: [
          '無法解釋的離群值 (Unexplained Outliers)',
          '數值跳動 (Jumps)',
          '階梯狀變化 (Step Changes)',
          '明顯的上升或下降趨勢 (Trends)',
          '週期性波動 (Periodic Patterns)'
        ]
      },

      whatToDo: {
        title: '應該怎麼做?',
        items: [
          '記錄所有異常現象及其發生時間',
          '調查異常原因 (機器故障、參數變化、操作員變更等)',
          '進行定性評估，判斷機器是否穩定',
          '如果發現問題，進行調整或維修',
          '收集更多數據以驗證改善效果'
        ]
      },

      controlLimitStrategy: {
        title: '控制界限策略',
        description: '使用寬鬆的控制界限進行初步評估',
        approach: '基於全部數據計算，用於識別明顯異常',
        tolerance: '允許較多的變異，重點是發現系統性問題'
      },

      falseAlarmConsideration: {
        title: '誤報率考慮',
        description: '不需要考慮誤報率',
        reason: '樣本數少，統計檢驗不適用',
        focus: '定性評估，尋找明顯的異常模式'
      },

      actionThreshold: {
        title: '採取行動的閾值',
        description: '明顯的異常或無法解釋的現象',
        examples: [
          '連續多個點明顯偏離中心線',
          '突然的跳躍或階梯狀變化',
          '明顯的上升或下降趨勢',
          '無法解釋的離群值'
        ]
      },

      recommendations: {
        title: '建議',
        items: [
          '使用 I-MR 圖進行初步評估',
          '重點觀察曲線形態而非統計指標',
          '記錄所有異常及其原因',
          '進行機器調整或維修',
          '收集足夠數據後進入下一階段'
        ]
      }
    },

    [ANALYSIS_STAGES.ANALYSIS_CONTROL]: {
      id: 'analysis-control',
      label: '分析用管制圖 (Analysis Control Charts)',
      description: '回溯評估，考慮誤報率',
      icon: '📊',
      sampleSizeRange: '100-500 件',
      purpose: '回溯評估製程穩定性，建立基準',
      
      characteristics: {
        title: '階段特徵',
        items: [
          '樣本數中等 (100-500 件)',
          '用於回溯評估 (Retrospective Analysis)',
          '需要考慮誤報率 (False Alarm Rate)',
          '基於統計檢驗進行判斷'
        ]
      },

      whatToObserve: {
        title: '應該觀察什麼?',
        items: [
          '超出管制界限的點數',
          '違反 Nelson Rules 的模式',
          '誤報率 (False Alarm Rate)',
          '製程的整體穩定性趨勢'
        ]
      },

      whatToDo: {
        title: '應該怎麼做?',
        items: [
          '計算預期的誤報次數',
          '只有當超出界限的次數 > 預期誤報次數時，才判定製程不穩定',
          '調查超出界限的原因',
          '如果是特殊原因，移除該數據點並重新計算',
          '建立製程的基準控制界限'
        ]
      },

      controlLimitStrategy: {
        title: '控制界限策略',
        description: '基於全部數據計算，用於回溯評估',
        approach: '使用 3σ 控制界限',
        tolerance: '考慮統計誤差，允許一定的誤報'
      },

      falseAlarmConsideration: {
        title: '誤報率考慮',
        description: '必須考慮誤報率',
        calculation: '預期誤報率 = 樣本數 × 0.27% (3σ 界限)',
        example: '100 個點：預期誤報 ≈ 0.27 次；500 個點：預期誤報 ≈ 1.35 次',
        decision: '只有當實際超出次數 > 預期誤報次數時，才判定不穩定'
      },

      actionThreshold: {
        title: '採取行動的閾值',
        description: '超出界限的次數 > 預期誤報次數',
        examples: [
          '100 個點，預期誤報 0.27 次 → 需要 ≥ 1 次超出才判定不穩定',
          '500 個點，預期誤報 1.35 次 → 需要 ≥ 2 次超出才判定不穩定'
        ]
      },

      recommendations: {
        title: '建議',
        items: [
          '使用 X-bar/R 或 X-bar/S 圖進行分析',
          '計算預期的誤報次數',
          '比較實際超出次數與預期誤報次數',
          '調查超出界限的原因',
          '移除特殊原因導致的數據點',
          '建立製程基準'
        ]
      }
    },

    [ANALYSIS_STAGES.SPC_CONTROL]: {
      id: 'spc-control',
      label: 'SPC 管制圖 (SPC Control Charts)',
      description: '現場即時控制，零容忍',
      icon: '🎯',
      sampleSizeRange: '> 500 件 (持續監測)',
      purpose: '現場即時控制，確保製程穩定',
      
      characteristics: {
        title: '階段特徵',
        items: [
          '樣本數充足 (> 500 件)',
          '用於現場即時控制 (Real-time SPC)',
          '零容忍政策',
          '任何違反準則都必須立即採取行動'
        ]
      },

      whatToObserve: {
        title: '應該觀察什麼?',
        items: [
          '任何超出管制界限的點',
          '任何違反 Nelson Rules 的模式',
          '製程中心的漂移',
          '變異的增加'
        ]
      },

      whatToDo: {
        title: '應該怎麼做?',
        items: [
          '任何違反穩定性準則的情況都必須立即採取修正措施',
          '停止生產，調查原因',
          '實施改正措施',
          '驗證改正措施的有效性',
          '恢復生產'
        ]
      },

      controlLimitStrategy: {
        title: '控制界限策略',
        description: '基於歷史數據建立的標準控制界限',
        approach: '使用 3σ 控制界限',
        tolerance: '零容忍，任何違反都需要立即行動'
      },

      falseAlarmConsideration: {
        title: '誤報率考慮',
        description: '不考慮誤報率',
        reason: '零容忍政策，任何異常都需要調查',
        benefit: '確保製程穩定，防止不良品產生'
      },

      actionThreshold: {
        title: '採取行動的閾值',
        description: '任何違反穩定性準則的情況',
        examples: [
          '任何點超出 3σ 界限',
          '任何違反 Nelson Rules 的模式',
          '製程中心明顯漂移',
          '變異明顯增加'
        ]
      },

      recommendations: {
        title: '建議',
        items: [
          '使用 X-bar/R 或 X-bar/S 圖進行即時監測',
          '建立清晰的行動計劃',
          '培訓操作員識別異常',
          '建立快速反應機制',
          '定期檢查控制界限的有效性',
          '持續改善製程'
        ]
      }
    }
  };

  return configs[stage] || null;
};

/**
 * Get guidance for specific stage
 */
export const getStageGuidance = (stage) => {
  const config = getStageConfig(stage);
  if (!config) return null;

  return {
    stage,
    ...config,
    summary: generateStageSummary(config)
  };
};

/**
 * Generate stage summary
 */
const generateStageSummary = (config) => {
  const summaries = {
    'machine-performance': `在機器性能研究階段，您有 ${config.sampleSizeRange} 的樣本。重點是進行定性穩定性評估，觀察數值曲線是否有無法解釋的離群值、跳動、階梯狀變化或趨勢。不需要進行複雜的統計檢驗，而是尋找明顯的異常模式。`,
    
    'analysis-control': `在分析用管制圖階段，您有 ${config.sampleSizeRange} 的樣本。這是回溯評估階段，需要考慮誤報率。只有當超出管制界限的次數多於預期的誤報次數時，才判定製程不穩定。`,
    
    'spc-control': `在 SPC 管制圖階段，您有 ${config.sampleSizeRange} 的樣本進行持續監測。這是現場即時控制階段，採用零容忍政策。任何違反穩定性準則的情況都必須立即採取修正措施。`
  };

  return summaries[config.id] || '';
};

/**
 * Recommend stage based on sample size
 */
export const recommendStage = (sampleSize) => {
  if (sampleSize < 100) {
    return {
      stage: ANALYSIS_STAGES.MACHINE_PERFORMANCE,
      reason: `樣本數 (${sampleSize}) < 100，建議進行機器性能研究`
    };
  } else if (sampleSize < 500) {
    return {
      stage: ANALYSIS_STAGES.ANALYSIS_CONTROL,
      reason: `樣本數 (${sampleSize}) 在 100-500 之間，建議進行分析用管制圖評估`
    };
  } else {
    return {
      stage: ANALYSIS_STAGES.SPC_CONTROL,
      reason: `樣本數 (${sampleSize}) ≥ 500，建議進行 SPC 管制圖監測`
    };
  }
};

/**
 * Calculate expected false alarm rate
 */
export const calculateFalseAlarmRate = (sampleSize, sigma = 3) => {
  // For 3σ control limits, the probability of a point exceeding the limit is 0.27%
  const probabilityPerPoint = 0.0027;
  const expectedFalseAlarms = sampleSize * probabilityPerPoint;
  
  return {
    sampleSize,
    sigma,
    probabilityPerPoint: (probabilityPerPoint * 100).toFixed(2) + '%',
    expectedFalseAlarms: expectedFalseAlarms.toFixed(2),
    expectedFalseAlarmsRounded: Math.round(expectedFalseAlarms),
    interpretation: `在 ${sampleSize} 個點中，預期約有 ${expectedFalseAlarms.toFixed(2)} 次誤報`
  };
};

/**
 * Determine if process is stable based on stage
 */
export const isProcessStable = (violationCount, stage, sampleSize) => {
  if (stage === ANALYSIS_STAGES.MACHINE_PERFORMANCE) {
    // Qualitative assessment - look for obvious patterns
    return {
      isStable: violationCount === 0,
      reason: '機器性能研究階段：任何異常都應被調查',
      actionRequired: violationCount > 0
    };
  }

  if (stage === ANALYSIS_STAGES.ANALYSIS_CONTROL) {
    // Consider false alarm rate
    const falseAlarmInfo = calculateFalseAlarmRate(sampleSize);
    const expectedFalseAlarms = Math.ceil(parseFloat(falseAlarmInfo.expectedFalseAlarms));
    
    return {
      isStable: violationCount <= expectedFalseAlarms,
      expectedFalseAlarms,
      actualViolations: violationCount,
      reason: violationCount <= expectedFalseAlarms 
        ? `違反次數 (${violationCount}) ≤ 預期誤報次數 (${expectedFalseAlarms})，判定製程穩定`
        : `違反次數 (${violationCount}) > 預期誤報次數 (${expectedFalseAlarms})，判定製程不穩定`,
      actionRequired: violationCount > expectedFalseAlarms
    };
  }

  if (stage === ANALYSIS_STAGES.SPC_CONTROL) {
    // Zero tolerance policy
    return {
      isStable: violationCount === 0,
      reason: 'SPC 管制圖階段：零容忍政策，任何違反都需要立即行動',
      actionRequired: violationCount > 0
    };
  }

  return null;
};

/**
 * Get action plan based on stage and violations
 */
export const getActionPlan = (stage, violationCount, sampleSize) => {
  const stabilityInfo = isProcessStable(violationCount, stage, sampleSize);
  
  if (!stabilityInfo.actionRequired) {
    return {
      stage,
      status: '✓ 製程穩定',
      actions: getStageConfig(stage).recommendations.items
    };
  }

  const actionPlans = {
    [ANALYSIS_STAGES.MACHINE_PERFORMANCE]: [
      '1. 記錄所有異常現象及其發生時間',
      '2. 調查異常原因 (機器故障、參數變化、操作員變更等)',
      '3. 進行定性評估，判斷機器是否穩定',
      '4. 如果發現問題，進行調整或維修',
      '5. 收集更多數據以驗證改善效果'
    ],
    
    [ANALYSIS_STAGES.ANALYSIS_CONTROL]: [
      `1. 檢查違反次數 (${violationCount}) 是否 > 預期誤報次數 (${stabilityInfo.expectedFalseAlarms})`,
      `2. 如果是，調查超出界限的原因`,
      `3. 判斷是否為特殊原因 (Special Cause)`,
      `4. 如果是特殊原因，移除該數據點並重新計算`,
      `5. 建立製程的基準控制界限`
    ],
    
    [ANALYSIS_STAGES.SPC_CONTROL]: [
      '1. 立即停止生產',
      '2. 調查違反穩定性準則的原因',
      '3. 實施改正措施',
      '4. 驗證改正措施的有效性',
      '5. 恢復生產並持續監測'
    ]
  };

  return {
    stage,
    status: '⚠ 製程不穩定，需要採取行動',
    reason: stabilityInfo.reason,
    actions: actionPlans[stage] || []
  };
};

/**
 * Get all stages for UI selection
 */
export const getAllStages = () => {
  return [
    {
      id: ANALYSIS_STAGES.MACHINE_PERFORMANCE,
      label: '機器性能研究 (Machine Performance)',
      description: '樣本數 < 100，定性穩定性評估',
      icon: '🔧'
    },
    {
      id: ANALYSIS_STAGES.ANALYSIS_CONTROL,
      label: '分析用管制圖 (Analysis Control Charts)',
      description: '樣本數 100-500，回溯評估',
      icon: '📊'
    },
    {
      id: ANALYSIS_STAGES.SPC_CONTROL,
      label: 'SPC 管制圖 (SPC Control Charts)',
      description: '樣本數 > 500，即時控制',
      icon: '🎯'
    }
  ];
};
