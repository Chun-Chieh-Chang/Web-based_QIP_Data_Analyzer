import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';

export const GuidancePanel = ({ title, description, keyPoints, sections, tips }) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  return (
    <div style={{
      backgroundColor: '#f0f9ff',
      border: '1px solid #0ea5e9',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
        <HelpCircle size={24} color='#0284c7' style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#0c4a6e', fontSize: '1rem', fontWeight: '600' }}>
            {title}
          </h3>
          <p style={{ margin: '0', color: '#0369a1', fontSize: '0.9rem' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <div style={{ marginBottom: '12px', paddingLeft: '36px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '0.85rem', fontWeight: '500' }}>
            🎯 關鍵要點:
          </p>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#0369a1', fontSize: '0.85rem' }}>
            {keyPoints.map((point, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Sections */}
      {sections && Object.entries(sections).map(([sectionKey, section]) => (
        <div key={sectionKey} style={{ marginBottom: '8px', paddingLeft: '36px' }}>
          <button
            onClick={() => toggleSection(sectionKey)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0284c7',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            {expandedSections[sectionKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {section.title}
          </button>

          {expandedSections[sectionKey] && (
            <div style={{ paddingLeft: '26px', paddingTop: '8px', borderLeft: '2px solid #0ea5e9', marginLeft: '0' }}>
              {section.items ? (
                <ul style={{ margin: '0', paddingLeft: '20px', color: '#0369a1', fontSize: '0.85rem' }}>
                  {section.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: '#0369a1', fontSize: '0.85rem' }}>
                  {Object.entries(section).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '8px' }}>
                      {typeof value === 'object' ? (
                        <div>
                          <strong>{value.name || key}:</strong> {value.description || value.meaning || value}
                        </div>
                      ) : (
                        <div><strong>{key}:</strong> {value}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Tips */}
      {tips && (
        <div style={{ marginTop: '12px', paddingLeft: '36px', paddingTop: '12px', borderTop: '1px solid #0ea5e9' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Lightbulb size={16} color='#0284c7' style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 6px 0', color: '#0c4a6e', fontSize: '0.85rem', fontWeight: '500' }}>
                💡 提示:
              </p>
              <p style={{ margin: '0', color: '#0369a1', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {tips}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidancePanel;
