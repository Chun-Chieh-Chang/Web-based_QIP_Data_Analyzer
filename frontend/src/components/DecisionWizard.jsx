import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  detectDataType,
  analyzeSampleSize,
  testNormality,
  detectTrend,
  getSensitivityOptions,
  recommendChartType
} from '../utils/decision_logic';

/**
 * DecisionWizard Component
 * 5-layer intelligent decision tree for chart type recommendation
 */
const DecisionWizard = ({ data, sampleSize, onRecommendation, onSkip }) => {
  const [currentLayer, setCurrentLayer] = useState(1);
  const [results, setResults] = useState({});
  const [selectedSensitivity, setSelectedSensitivity] = useState('standard');

  // Layer 1: Data Type Detection
  const handleDataTypeDetection = () => {
    if (!data || data.length === 0) return;
    
    const dataType = detectDataType(data);
    setResults(prev => ({ ...prev, dataType }));
    setCurrentLayer(2);
  };

  // Layer 2: Sample Size Analysis
  const handleSampleSizeAnalysis = () => {
    const sampleSizeAnalysis = analyzeSampleSize(sampleSize);
    setResults(prev => ({ ...prev, sampleSize: sampleSizeAnalysis }));
    setCurrentLayer(3);
  };

  // Layer 3: Normality Test
  const handleNormalityTest = () => {
    const normalityTest = testNormality(data);
    setResults(prev => ({ ...prev, normality: normalityTest }));
    setCurrentLayer(4);
  };

  // Layer 4: Trend Detection
  const handleTrendDetection = () => {
    const trendDetection = detectTrend(data);
    setResults(prev => ({ ...prev, trend: trendDetection }));
    setCurrentLayer(5);
  };

  // Layer 5: Sensitivity Selection & Final Recommendation
  const handleFinalRecommendation = () => {
    const recommendation = recommendChartType({
      dataType: results.dataType,
      sampleSize: results.sampleSize,
      normalityTest: results.normality,
      trendDetection: results.trend,
      sensitivity: selectedSensitivity
    });

    setResults(prev => ({ ...prev, recommendation }));
    
    // Call parent callback with recommendation
    if (onRecommendation) {
      onRecommendation({
        ...results,
        recommendation,
        sensitivity: selectedSensitivity
      });
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  const handlePrevious = () => {
    if (currentLayer > 1) setCurrentLayer(currentLayer - 1);
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.5rem' }}>
          🧭 智能決策嚮導 (Smart Decision Wizard)
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          根據您的數據特性自動推薦最適合的管制圖類型
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        justifyContent: 'space-between'
      }}>
        {[1, 2, 3, 4, 5].map(layer => (
          <div
            key={layer}
            style={{
              flex: 1,
              height: '8px',
              backgroundColor: layer <= currentLayer ? '#3b82f6' : '#e2e8f0',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Layer 1: Data Type Detection */}
      {currentLayer === 1 && (
        <Layer1DataType
          data={data}
          result={results.dataType}
          onNext={handleDataTypeDetection}
          onSkip={handleSkip}
        />
      )}

      {/* Layer 2: Sample Size Analysis */}
      {currentLayer === 2 && (
        <Layer2SampleSize
          sampleSize={sampleSize}
          result={results.sampleSize}
          onNext={handleSampleSizeAnalysis}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
        />
      )}

      {/* Layer 3: Normality Test */}
      {currentLayer === 3 && (
        <Layer3Normality
          data={data}
          result={results.normality}
          onNext={handleNormalityTest}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
        />
      )}

      {/* Layer 4: Trend Detection */}
      {currentLayer === 4 && (
        <Layer4Trend
          data={data}
          result={results.trend}
          onNext={handleTrendDetection}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
        />
      )}

      {/* Layer 5: Sensitivity Selection */}
      {currentLayer === 5 && (
        <Layer5Sensitivity
          selectedSensitivity={selectedSensitivity}
          onSensitivityChange={setSelectedSensitivity}
          onFinish={handleFinalRecommendation}
          onPrevious={handlePrevious}
        />
      )}
    </div>
  );
};

/**
 * Layer 1: Data Type Detection
 */
const Layer1DataType = ({ data, result, onNext, onSkip }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
        第 1 層：數據類型判斷
      </h3>
      
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '0.95rem' }}>
          <strong>問題:</strong> 您的數據是什麼類型?
        </p>
        
        {result && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0284c7',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={20} color="#0284c7" />
              <strong style={{ color: '#0284c7' }}>{result.label}</strong>
            </div>
            <p style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '0.9rem' }}>
              {result.description}
            </p>
            <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.85rem' }}>
              推薦: {result.recommendation}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onSkip}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          跳過嚮導
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          下一步 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Layer 2: Sample Size Analysis
 */
const Layer2SampleSize = ({ sampleSize, result, onNext, onPrevious, onSkip }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
        第 2 層：樣本數分析
      </h3>
      
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '0.95rem' }}>
          <strong>問題:</strong> 每批次的樣本數是多少?
        </p>
        
        {result && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #16a34a',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <strong style={{ color: '#16a34a' }}>檢測到: n = {result.n}</strong>
            </div>
            <p style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '0.9rem' }}>
              <strong>分類:</strong> {result.label}
            </p>
            <p style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '0.9rem' }}>
              <strong>推薦:</strong> {result.recommendedChart}
            </p>
            <p style={{ margin: 0, color: '#166534', fontSize: '0.85rem' }}>
              {result.reason}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onPrevious}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          跳過嚮導
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          下一步 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Layer 3: Normality Test
 */
const Layer3Normality = ({ data, result, onNext, onPrevious, onSkip }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
        第 3 層：常態性檢驗
      </h3>
      
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '0.95rem' }}>
          <strong>問題:</strong> 數據是否符合常態分布?
        </p>
        
        {result && result.canTest && (
          <div style={{
            backgroundColor: result.isNormal ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.isNormal ? '#16a34a' : '#dc2626'}`,
            borderRadius: '6px',
            padding: '12px',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={20} color={result.isNormal ? '#16a34a' : '#dc2626'} />
              <strong style={{ color: result.isNormal ? '#16a34a' : '#dc2626' }}>
                Shapiro-Wilk P-value: {result.pValue}
              </strong>
            </div>
            <p style={{ margin: '0 0 12px 0', color: result.isNormal ? '#166534' : '#7f1d1d', fontSize: '0.9rem' }}>
              {result.message}
            </p>
            
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <p style={{ margin: '0 0 8px 0', color: result.isNormal ? '#166534' : '#7f1d1d', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  建議:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: result.isNormal ? '#166534' : '#7f1d1d', fontSize: '0.85rem' }}>
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onPrevious}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          跳過嚮導
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          下一步 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Layer 4: Trend Detection
 */
const Layer4Trend = ({ data, result, onNext, onPrevious, onSkip }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
        第 4 層：趨勢檢測
      </h3>
      
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '0.95rem' }}>
          <strong>問題:</strong> 製程是否有已知趨勢?
        </p>
        
        {result && result.canDetect && (
          <div style={{
            backgroundColor: result.hasTrend ? '#fef3c7' : '#f0fdf4',
            border: `1px solid ${result.hasTrend ? '#f59e0b' : '#16a34a'}`,
            borderRadius: '6px',
            padding: '12px',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {result.hasTrend ? (
                <AlertCircle size={20} color="#f59e0b" />
              ) : (
                <CheckCircle2 size={20} color="#16a34a" />
              )}
              <strong style={{ color: result.hasTrend ? '#b45309' : '#16a34a' }}>
                {result.message}
              </strong>
            </div>
            <p style={{ margin: '0 0 8px 0', color: result.hasTrend ? '#b45309' : '#166534', fontSize: '0.9rem' }}>
              <strong>線性斜率:</strong> {result.slope}
            </p>
            <p style={{ margin: '0 0 12px 0', color: result.hasTrend ? '#b45309' : '#166534', fontSize: '0.9rem' }}>
              <strong>R² 值:</strong> {result.r2} ({result.details.trendStrength}趨勢)
            </p>
            <p style={{ margin: 0, color: result.hasTrend ? '#b45309' : '#166534', fontSize: '0.85rem' }}>
              {result.recommendation}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onPrevious}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>
        <button
          onClick={onSkip}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          跳過嚮導
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          下一步 <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Layer 5: Sensitivity Selection
 */
const Layer5Sensitivity = ({ selectedSensitivity, onSensitivityChange, onFinish, onPrevious }) => {
  const sensitivityOptions = [
    {
      id: 'standard',
      label: '標準 (Shewhart)',
      description: '傳統管制圖，適合一般監測',
      icon: '📊'
    },
    {
      id: 'medium',
      label: '中等 (EWMA)',
      description: '指數加權移動平均，對小變化敏感',
      icon: '📈'
    },
    {
      id: 'high',
      label: '高敏感 (CUSUM)',
      description: '累積和圖，最敏感的方法',
      icon: '🎯'
    }
  ];

  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
        第 5 層：敏感度選擇
      </h3>
      
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '0.95rem' }}>
          <strong>問題:</strong> 是否需要檢測微小變化?
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {sensitivityOptions.map(option => (
            <div
              key={option.id}
              onClick={() => onSensitivityChange(option.id)}
              style={{
                padding: '12px',
                border: `2px solid ${selectedSensitivity === option.id ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '8px',
                backgroundColor: selectedSensitivity === option.id ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{option.icon}</div>
              <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                {option.label}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {option.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onPrevious}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> 上一步
        </button>
        <button
          onClick={onFinish}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle2 size={16} /> 開始分析
        </button>
      </div>
    </div>
  );
};

export default DecisionWizard;
