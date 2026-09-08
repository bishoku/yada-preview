import React, { useState } from 'react';
import type { YadaSimulationIframeProps } from '../types';
import { SpinnerIcon } from './Icons';

export const YadaSimulationIframe: React.FC<YadaSimulationIframeProps> = ({
  embedUrl,
  title = 'YADA Diagram Simulation',
  className = '',
  style,
  allowFullscreen = true,
  onLoad,
}) => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '200px',
        ...style,
      }}
      className={`yada-preview-iframe-container ${className}`}
    >
      {!isIframeLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#64748b',
            fontSize: '13px',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <SpinnerIcon size={18} />
          <span>Loading YADA simulation...</span>
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title}
        className="yada-preview-iframe"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          opacity: isIframeLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
        allow={
          allowFullscreen
            ? 'fullscreen; clipboard-read; clipboard-write'
            : 'clipboard-read; clipboard-write'
        }
        onLoad={handleIframeLoad}
      />
    </div>
  );
};
