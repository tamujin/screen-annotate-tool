import React from 'react';
import { ScreenSource } from '../types';

interface ScreenSelectorProps {
  sources: ScreenSource[];
  onSelect: (source: ScreenSource) => void;
  isLoading: boolean;
}

const ScreenSelector: React.FC<ScreenSelectorProps> = ({ sources, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="screen-selector">
        <div className="placeholder-text">Loading available screens...</div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="screen-selector">
        <div className="placeholder-text">No screen sources found. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="screen-selector">
      <h2 style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}>
        Select a screen or window to capture
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
        {sources.map((source) => (
          <div 
            key={source.id} 
            className="screen-source"
            onClick={() => onSelect(source)}
          >
            <img 
              src={source.thumbnail.toDataURL()} 
              alt={source.name} 
              title={source.name}
            />
            <p>{source.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreenSelector; 