import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  DATA_TYPES,
  PROCESS_MODELS,
  getDataTypeGuidance,
  getVariableChartRecommendations,
  getAttributeChartRecommendations,
  getProcessModelGuidance,
  getSensitivityRecommendations,
  getSpecialSituationRecommendations,
  selectControlChart,
  getCompleteSelectionGuide
} from '../utils/aiag_vda_chart_selection';

/**
 * ControlChartSelectionWizard Component
 * 5-step AIAG-VDA based control chart selection wizard
 */
const ControlChartSelectionWizard = ({ onRecommendation, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState({
    dataType: null,
    sampleSize: null,
    distribution: null,
    processModel: null,
    sensitivity: null,
    specialSituation: null
  });
  const [recommendation, setRecommendation] = useState(null);

  const handleDataTypeSelect = (type) => {
    setSelections({ ...selections, dataType: type });
  };

  const handleSampleSizeSelect = (size) => {
    setSelections({ ...selections, sampleSize: size });
  };

  const handleDistributionSelect = (dist) => {
    setSelections({ ...selections, distribution: dist });
  };

  const handleProcessModelSelect = (model) => {
    setSelections({ ...selections, processModel: model });
  };

  const handleSensitivitySelect = (sens) => {
    setSelections({ ...selections, sensitivity: sens });
  };

  const handleSpecialSituationSelect = (situation) => {
    setSelections({ ...selections, specialSituation: situation });
  };

  const handleGenerateRecommendation = () => {
    const rec = selectControlChart(selections);
    setRecommendation(rec);
    
    // Call parent callback with recommendation
    if (onRecommendation) {
      onRecommendation({
        selections,
        recommendation: rec
      });
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selections.dataType !== null;
      case 2:
        return selections.sampleSize !== null;
      case 3:
        return selections.distribution !== null;
      case 4:
        return selections.processModel !== null;
      case 5:
        return selections.sensitivity !== null;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (canProceedToNext() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '2px solid #0284c7',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>
          📊 AIAG-VDA 管制圖選擇嚮導
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          根據 AIAG-VDA SPC Manual 的 5 步決策邏輯，選擇最合適的管制圖
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[1, 2, 3, 4, 5].map(step => (
            <div
              key={step}
              onClick={() => step <= currentStep && setCurrentStep(step)}
              style={{
                flex: 1,
                height: '8px',
                backgroundColor: step <= currentStep ? '#0284c7' : '#e2e8f0',
                borderRadius: '4px',
                cursor: step <= currentStep ? 'pointer' : 'default',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          第 {currentStep} 步 / 5 步
        </div>
      </div>

      {/* Step 1: Data Type */}
      {currentStep === 1 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>
            第 1 步：數據類型判斷
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.95rem' }}>
            數據是測量的（計量）還是計數的（計數）？
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {Object.entries(getDataTypeGuidance()).map(([key, guidance]) => (
              <div
                key={key}
                onClick={() => handleDataTypeSelect(key)}
                style={{
                  padding: '16px',
                  border: `2px solid ${selections.dataType === key ? '#0284c7' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  backgroundColor: selections.dataType === key ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                  {guidance.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  {guidance.description}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  例如: {guidance.examples.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', color: '#92400e' }}>
            <strong>💡 提示:</strong> 計量型數據提供更多製程資訊，更適合零缺陷策略。
          </div>
        </div>
      )}

      {/* Step 2: Sample Size */}
      {currentStep === 2 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>
            第 2 步：樣本數分析
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.95rem' }}>
            樣本數大小為何？(決定用 R 還是 s，或是 I-MR)
          </p>
          {selections.dataType === 'variable' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { value: 1, label: '單個測量值 (n = 1)', desc: '破壞性測試或檢測成本高昂' },
                { value: 5, label: '小樣本 (1 < n < 10)', desc: '手動計算或傳統抽樣' },
                { value: 15, label: '較大樣本 (n ≥ 10)', desc: '電腦輔助計算或自動化測量' }
              ].map(option => (
                <div
                  key={option.value}
                  onClick={() => handleSampleSizeSelect(option.value)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${selections.sampleSize === option.value ? '#0284c7' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    backgroundColor: selections.sampleSize === option.value ? '#f0f9ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {option.desc}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { value: 'fixed', label: '樣本數固定', desc: '每批次檢驗相同數量' },
                { value: 'variable', label: '樣本數不固定', desc: '每批次檢驗數量不同' }
              ].map(option => (
                <div
                  key={option.value}
                  onClick={() => handleSampleSizeSelect(option.value)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${selections.sampleSize === option.value ? '#0284c7' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    backgroundColor: selections.sampleSize === option.value ? '#f0f9ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {option.desc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Distribution */}
      {currentStep === 3 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>
            第 3 步：分佈特性檢驗
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.95rem' }}>
            製程是否為常態分佈？(若否，考慮 Pearson 或數據轉換)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { value: 'normal', label: '常態分佈 (Normal)', desc: '數據呈鐘形曲線分佈' },
              { value: 'non-normal', label: '非常態分佈 (Non-normal)', desc: '數據呈偏態或其他分佈' }
            ].map(option => (
              <div
                key={option.value}
                onClick={() => handleDistributionSelect(option.value)}
                style={{
                  padding: '16px',
                  border: `2px solid ${selections.distribution === option.value ? '#0284c7' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  backgroundColor: selections.distribution === option.value ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                  {option.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {option.desc}
                </div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', color: '#0c4a6e' }}>
            <strong>💡 提示:</strong> 可使用 Shapiro-Wilk 或 Anderson-Darling 檢驗判斷常態性。
          </div>
        </div>
      )}

      {/* Step 4: Process Model */}
      {currentStep === 4 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>
            第 4 步：趨勢檢測
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.95rem' }}>
            是否有已知趨勢（如磨耗）？(若有，考慮允收管制圖或擴展 Shewhart)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
            {Object.entries(getProcessModelGuidance()).map(([key, model]) => (
              <div
                key={key}
                onClick={() => handleProcessModelSelect(key)}
                style={{
                  padding: '16px',
                  border: `2px solid ${selections.processModel === key ? '#0284c7' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  backgroundColor: selections.processModel === key ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                  {model.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  {model.description}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  特徵: {model.characteristics.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Sensitivity */}
      {currentStep === 5 && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>
            第 5 步：敏感度需求
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.95rem' }}>
            是否需要檢測微小變化？(若需要，考慮 CUSUM 或 EWMA)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
            {Object.entries(getSensitivityRecommendations()).map(([key, sens]) => (
              <div
                key={key}
                onClick={() => handleSensitivitySelect(key)}
                style={{
                  padding: '16px',
                  border: `2px solid ${selections.sensitivity === key ? '#0284c7' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  backgroundColor: selections.sensitivity === key ? '#f0f9ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                  {sens.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                  {sens.description}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  敏感度: {sens.sensitivity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'space-between' }}>
        <button
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: currentStep === 1 ? '#e2e8f0' : '#f1f5f9',
            color: currentStep === 1 ? '#94a3b8' : '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onSkip}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            跳過
          </button>

          {currentStep < 5 ? (
            <button
              onClick={goToNextStep}
              disabled={!canProceedToNext()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: canProceedToNext() ? '#0284c7' : '#cbd5e1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: canProceedToNext() ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              下一步 <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleGenerateRecommendation}
              disabled={!canProceedToNext()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: canProceedToNext() ? '#10b981' : '#cbd5e1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: canProceedToNext() ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              <CheckCircle2 size={16} /> 生成推薦
            </button>
          )}
        </div>
      </div>

      {/* Recommendation Display */}
      {recommendation && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '2px solid #86efac',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#166534' }}>
            <CheckCircle2 size={20} />
            <strong style={{ fontSize: '1rem' }}>推薦結果</strong>
          </div>
          <div style={{ color: '#166534', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>主要推薦圖表:</strong> {recommendation.primaryChart}
            </div>
            {recommendation.secondaryCharts.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>備選圖表:</strong> {recommendation.secondaryCharts.join(', ')}
              </div>
            )}
            {recommendation.reasoning.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>推理過程:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {recommendation.reasoning.map((r, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {recommendation.warnings.length > 0 && (
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#fef3c7', borderRadius: '4px', color: '#92400e' }}>
                <strong>⚠ 警告:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {recommendation.warnings.map((w, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {recommendation.recommendations.length > 0 && (
              <div>
                <strong>建議:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {recommendation.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlChartSelectionWizard;
