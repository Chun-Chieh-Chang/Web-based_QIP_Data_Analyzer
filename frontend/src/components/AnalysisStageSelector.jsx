import React, { useState } from 'react';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getAllStages,
  getStageGuidance,
  recommendStage,
  calculateFalseAlarmRate,
  isProcessStable,
  getActionPlan
} from '../utils/analysis_stage_guidance';

/**
 * AnalysisStageSelector Component
 * Allows users to select analysis stage and provides stage-specific guidance
 */
const AnalysisStageSelector = ({ sampleSize, onStageSelect, selectedStage }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showFalseAlarmInfo, setShowFalseAlarmInfo] = useState(false);

  const stages = getAllStages();
  const recommendation = recommendStage(sampleSize);
  const stageGuidance = selectedStage ? getStageGuidance(selectedStage) : null;

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
          📊 分析階段選擇 (Analysis Stage Selection)
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          根據樣本數和分析目的選擇合適的分析階段
        </p>
      </div>

      {/* Sample Size Info */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #0284c7',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Info size={18} color="#0284c7" />
          <strong style={{ color: '#0284c7' }}>樣本數: {sampleSize} 件</strong>
        </div>
        <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.9rem' }}>
          {recommendation.reason}
        </p>
      </div>

      {/* Stage Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#1e293b' }}>
          選擇分析階段:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {stages.map(stage => (
            <div
              key={stage.id}
              onClick={() => onStageSelect(stage.id)}
              style={{
                padding: '16px',
                border: `2px solid ${selectedStage === stage.id ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '8px',
                backgroundColor: selectedStage === stage.id ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{stage.icon}</div>
              <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px', fontSize: '0.95rem' }}>
                {stage.label}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {stage.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Details */}
      {stageGuidance && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: showDetails ? '12px' : 0
            }}
          >
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>
              {stageGuidance.label}
            </h3>
            <span style={{ color: '#64748b' }}>
              {showDetails ? '▼' : '▶'}
            </span>
          </div>

          {showDetails && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              {/* Summary */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {stageGuidance.summary}
                </p>
              </div>

              {/* Characteristics */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '0.95rem' }}>
                  {stageGuidance.characteristics.title}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                  {stageGuidance.characteristics.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* What to Observe */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '0.95rem' }}>
                  {stageGuidance.whatToObserve.title}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                  {stageGuidance.whatToObserve.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* What to Do */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '0.95rem' }}>
                  {stageGuidance.whatToDo.title}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                  {stageGuidance.whatToDo.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Control Limit Strategy */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '0.95rem' }}>
                  {stageGuidance.controlLimitStrategy.title}
                </h4>
                <p style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '0.85rem' }}>
                  <strong>方法:</strong> {stageGuidance.controlLimitStrategy.description}
                </p>
                <p style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '0.85rem' }}>
                  <strong>方式:</strong> {stageGuidance.controlLimitStrategy.approach}
                </p>
                <p style={{ margin: 0, color: '#166534', fontSize: '0.85rem' }}>
                  <strong>容忍度:</strong> {stageGuidance.controlLimitStrategy.tolerance}
                </p>
              </div>

              {/* False Alarm Consideration */}
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: stageGuidance.id === 'analysis-control' ? '#fef3c7' : '#f3f4f6',
                borderRadius: '6px',
                border: `1px solid ${stageGuidance.id === 'analysis-control' ? '#fcd34d' : '#d1d5db'}`
              }}>
                <div
                  onClick={() => setShowFalseAlarmInfo(!showFalseAlarmInfo)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem' }}>
                    {stageGuidance.falseAlarmConsideration.title}
                  </h4>
                  <span style={{ color: '#64748b' }}>
                    {showFalseAlarmInfo ? '▼' : '▶'}
                  </span>
                </div>

                {showFalseAlarmInfo && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#475569', fontSize: '0.85rem' }}>
                      <strong>說明:</strong> {stageGuidance.falseAlarmConsideration.description}
                    </p>
                    <p style={{ margin: '0 0 4px 0', color: '#475569', fontSize: '0.85rem' }}>
                      <strong>原因:</strong> {stageGuidance.falseAlarmConsideration.reason}
                    </p>
                    {stageGuidance.id === 'analysis-control' && (
                      <>
                        <p style={{ margin: '0 0 4px 0', color: '#475569', fontSize: '0.85rem' }}>
                          <strong>計算:</strong> {stageGuidance.falseAlarmConsideration.calculation}
                        </p>
                        <p style={{ margin: '0 0 4px 0', color: '#475569', fontSize: '0.85rem' }}>
                          <strong>示例:</strong> {stageGuidance.falseAlarmConsideration.example}
                        </p>
                        <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>
                          <strong>決策:</strong> {stageGuidance.falseAlarmConsideration.decision}
                        </p>
                        
                        {/* False Alarm Calculator */}
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '0.9rem' }}>
                            誤報率計算器:
                          </div>
                          <FalseAlarmCalculator sampleSize={sampleSize} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Threshold */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#7f1d1d', fontSize: '0.95rem' }}>
                  {stageGuidance.actionThreshold.title}
                </h4>
                <p style={{ margin: '0 0 8px 0', color: '#7f1d1d', fontSize: '0.85rem' }}>
                  {stageGuidance.actionThreshold.description}
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', fontSize: '0.85rem' }}>
                  {stageGuidance.actionThreshold.examples.map((example, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{example}</li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '0.95rem' }}>
                  {stageGuidance.recommendations.title}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c4a6e', fontSize: '0.85rem' }}>
                  {stageGuidance.recommendations.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * False Alarm Calculator Component
 */
const FalseAlarmCalculator = ({ sampleSize }) => {
  const falseAlarmInfo = calculateFalseAlarmRate(sampleSize);

  return (
    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>樣本數</div>
          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{falseAlarmInfo.sampleSize}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>每點誤報率</div>
          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{falseAlarmInfo.probabilityPerPoint}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>預期誤報次數</div>
          <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{falseAlarmInfo.expectedFalseAlarms}</div>
        </div>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>四捨五入</div>
          <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{falseAlarmInfo.expectedFalseAlarmsRounded}</div>
        </div>
      </div>
      <div style={{
        padding: '8px',
        backgroundColor: '#fef2f2',
        borderRadius: '4px',
        color: '#7f1d1d',
        fontSize: '0.8rem'
      }}>
        {falseAlarmInfo.interpretation}
      </div>
    </div>
  );
};

export default AnalysisStageSelector;
