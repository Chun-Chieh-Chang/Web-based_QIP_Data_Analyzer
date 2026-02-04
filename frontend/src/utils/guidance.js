// User Guidance System for SPC Analysis
// Provides contextual help and explanations at each stage

export const guidanceContent = {
  // Step 1: Data Validation
  step1: {
    title: '第一步 - 數據有效性校驗 (Data Validation)',
    icon: 'Search',
    description: '在進行統計分析前，必須確認數據是否存在異常離群值 (Outliers)。',
    keyPoints: [
      '離群值應被記錄但不可參與統計計算',
      '異常值會扭曲控制界限和製程能力指數',
      '需要回校對原始紙本記錄確認異常原因'
    ],
    whatToLook: {
      title: '應該注意什麼?',
      items: [
        '紅色警告框中的數值 - 這些是統計上的異常點',
        '異常原因 - 是量測錯誤還是真實的製程異常',
        '異常數量 - 如果超過 5% 的數據，需要檢查數據質量'
      ]
    },
    whatToDo: {
      title: '應該怎麼做?',
      items: [
        '如果是量測錯誤: 在 Excel 中刪除該批次或修正數值',
        '如果是製程異常: 記錄異常原因，保留數據用於分析',
        '修改後重新上傳 Excel 文件並重新分析'
      ]
    }
  },

  // Step 2: Stability Analysis
  step2: {
    title: '第二步 - 統計受控狀態分析 (Process Stability)',
    icon: 'Activity',
    description: '使用 Nelson Rules 判別製程是否受「特殊原因」干擾。',
    keyPoints: [
      '只有在製程受控 (Stable) 的情況下，計算出的 Cpk 才有預測意義',
      'Nelson Rules 包含 6 條規則，檢測不同類型的異常',
      '紅色點表示違反控制規則的批次'
    ],
    chartModes: {
      title: '圖表模式說明',
      standard: {
        name: '標準圖表 (Standard)',
        description: '顯示原始數據值與控制界限',
        use: '用於監測製程中心和變異',
        interpretation: '點應該隨機分佈在中心線周圍，在控制界限內'
      },
      zChart: {
        name: 'Z-Chart (標準化圖表)',
        description: '將數據標準化為 Z 分數',
        use: '便於比較不同量綱的製程數據',
        interpretation: '適合多穴模具，標準化後便於對比'
      },
      xbarS: {
        name: 'X-bar/S 圖',
        description: '監測批次平均值與標準差',
        use: '適合多穴模具分析',
        interpretation: '同時監測中心和變異，比 I-MR 圖更敏感'
      }
    },
    nelsonRules: {
      title: 'Nelson Rules 解釋',
      rule1: '單點超出 3σ 界限 - 製程明顯失控',
      rule2: '連續 9 點在中心線同側 - 製程偏移',
      rule3: '連續 6 點上升或下降 - 製程趨勢',
      rule4: '連續 14 點交替上下 - 異常變異',
      rule5: '連續 3 點中有 2 點超出 2σ - 製程不穩定',
      rule6: '連續 5 點中有 4 點超出 1σ - 製程偏離'
    },
    whatToLook: {
      title: '應該注意什麼?',
      items: [
        '紅色點 - 違反控制規則的批次',
        '點的分佈 - 應該隨機分佈，無明顯趨勢',
        '違反規則的類型 - 不同規則表示不同的問題'
      ]
    },
    whatToDo: {
      title: '應該怎麼做?',
      items: [
        '如果製程受控: 繼續進行下一步分析',
        '如果製程失控: 調查失控原因，改善製程後重新分析',
        '記錄失控時間和原因，用於製程改善'
      ]
    }
  },

  // Step 3: Uniformity Analysis
  step3: {
    title: '第三步 - 幾何均勻性分析 (Geometric Uniformity)',
    icon: 'Layers',
    description: '檢查多穴模具各穴之間的數據一致性。',
    keyPoints: [
      '多穴模具各穴應該有相似的製程能力',
      '如果某穴明顯不同，可能表示模具磨損或參數不當',
      '均勻性差會影響 Cpk 計算的有效性'
    ],
    uniformityCheck: {
      title: '均勻性檢查方法',
      anova: 'ANOVA 檢驗 - 統計檢驗各穴平均值是否有顯著差異',
      pValue: 'P-value ≥ 0.05 - 各穴無顯著差異 (綠色✓)',
      pValueLow: 'P-value < 0.05 - 各穴有顯著差異 (紅色✗)'
    },
    whatToLook: {
      title: '應該注意什麼?',
      items: [
        '綠色勾選 - 表示各穴均勻，可以合併計算 Cpk',
        '紅色警告 - 表示各穴不均勻，不應合併計算',
        '穴位偏差百分比 - 顯示最大偏差相對於公差的比例'
      ]
    },
    whatToDo: {
      title: '應該怎麼做?',
      items: [
        '如果均勻: 可以使用整體 Cpk 評估製程能力',
        '如果不均勻: 應該分別計算各穴的 Cpk，找出問題穴位',
        '檢查問題穴位的模具狀況和參數設置'
      ]
    }
  },

  // Step 4: Capability Analysis
  step4: {
    title: '第四步 - 製程能力評估 (Process Capability)',
    icon: 'TrendingUp',
    description: '評估製程是否能夠滿足規格要求。',
    keyPoints: [
      'Cpk 反映短期製程能力，Ppk 反映長期製程績效',
      'Cpk ≥ 1.33 表示製程能力良好',
      'Cpk < 1.0 表示製程能力不足，需要改善'
    ],
    capabilityLevels: {
      title: '製程能力等級',
      excellent: {
        range: 'Cpk ≥ 1.67',
        level: '優異',
        meaning: '製程高度穩定，不良率極低 (< 0.01%)',
        color: '🟢'
      },
      good: {
        range: 'Cpk ≥ 1.33',
        level: '良好',
        meaning: '製程穩定，符合多數客戶要求 (< 0.1%)',
        color: '🟢'
      },
      acceptable: {
        range: 'Cpk ≥ 1.00',
        level: '可接受',
        meaning: '製程尚可，但存在改善空間 (< 0.3%)',
        color: '🟡'
      },
      needImprovement: {
        range: 'Cpk < 1.00',
        level: '需改善',
        meaning: '製程能力不足，需立即改善 (> 0.3%)',
        color: '🔴'
      }
    },
    whatToLook: {
      title: '應該注意什麼?',
      items: [
        'Cpk 值 - 短期製程能力指數',
        'Ppk 值 - 長期製程績效指數',
        'Cpk vs Ppk - 差異大表示製程不穩定',
        '不良率估計 - 基於正態分布的理論不良率'
      ]
    },
    whatToDo: {
      title: '應該怎麼做?',
      items: [
        '如果 Cpk ≥ 1.33: 製程能力滿足要求，繼續監測',
        '如果 1.0 ≤ Cpk < 1.33: 需要改善，制定改善計劃',
        '如果 Cpk < 1.0: 立即改善，可能需要調整參數或更換模具',
        '定期監測，確保製程能力保持穩定'
      ]
    }
  },

  // Chart Mode Guidance
  chartModes: {
    standard: {
      title: '標準圖表 (I-MR Chart)',
      description: '顯示個別值或批次平均值與移動全距',
      when: '適用於所有分析類型',
      interpretation: [
        '上圖: 個別值或批次平均值',
        '下圖: 移動全距 (相鄰兩點的差)',
        '紅色虛線: 控制界限',
        '綠色實線: 中心線'
      ]
    },
    zChart: {
      title: 'Z-Chart (標準化圖表)',
      description: '將數據標準化為 Z 分數',
      when: '適用於多穴模具，便於對比',
      interpretation: [
        'Z = (X - 平均值) / 標準差',
        '標準化後各穴數據在同一尺度',
        '便於識別異常穴位',
        '適合短期製程監測'
      ]
    },
    xbarS: {
      title: 'X-bar/S 圖',
      description: '監測批次平均值與標準差',
      when: '適用於多穴模具 (n=2~10)',
      interpretation: [
        '上圖: 批次平均值 (X-bar)',
        '下圖: 批次標準差 (S)',
        '同時監測中心和變異',
        '比 I-MR 圖更敏感'
      ]
    }
  },

  // General Tips
  tips: {
    dataPreparation: {
      title: '數據準備建議',
      items: [
        '確保 Excel 格式正確: 第 1 行為穴位名稱，第 2-4 行為規格',
        '數據應該是連續的測量值，不應有文字或空白',
        '建議至少 20 個批次的數據，以獲得可靠的統計結果',
        '確保數據單位一致，例如都是毫米或都是微米'
      ]
    },
    interpretation: {
      title: '結果解釋建議',
      items: [
        '不要只看 Cpk 值，還要看製程是否受控',
        '受控但 Cpk 低 → 需要改善製程中心或減少變異',
        '失控但 Cpk 高 → 可能是暫時異常，需要調查',
        '定期監測，觀察趨勢比單次結果更重要'
      ]
    },
    improvement: {
      title: '製程改善建議',
      items: [
        '優先改善變異 (σ) 而不是中心 (μ)',
        '使用 DOE (實驗設計) 找出關鍵因素',
        '改善後需要重新收集數據驗證效果',
        '建立控制圖持續監測，防止反彈'
      ]
    }
  }
};

// Helper function to get guidance for current step
export const getStepGuidance = (step) => {
  const stepMap = {
    1: guidanceContent.step1,
    2: guidanceContent.step2,
    3: guidanceContent.step3,
    4: guidanceContent.step4
  };
  return stepMap[step] || null;
};

// Helper function to get chart mode guidance
export const getChartModeGuidance = (mode) => {
  const modeMap = {
    'standard': guidanceContent.chartModes.standard,
    'z-chart': guidanceContent.chartModes.zChart,
    'xbar-s': guidanceContent.chartModes.xbarS
  };
  return modeMap[mode] || null;
};
