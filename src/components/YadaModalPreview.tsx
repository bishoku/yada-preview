import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { YadaModalPreviewProps } from '../types';
import { CloseIcon, PlayIcon, StopIcon } from './Icons';
import { YadaSimulationIframe } from './YadaSimulationIframe';

export const YadaModalPreview: React.FC<YadaModalPreviewProps> = ({
  isOpen,
  onClose,
  embedUrl,
  imageSrc,
  alt = 'YADA Diagram Preview',
  isSimulating,
  onToggleSimulation,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="yada-modal-overlay" onClick={onClose}>
      <div className="yada-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="yada-modal-header">
          <h3 className="yada-modal-title">
            <span>{alt}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onToggleSimulation}
              className="yada-preview-toolbar-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                width: 'auto',
                padding: '5px 12px',
                fontSize: '13px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                color: isSimulating ? '#059669' : '#475569',
                backgroundColor: isSimulating ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.05)',
              }}
              title={isSimulating ? 'Switch to Image View' : 'Start Live Simulation'}
            >
              {isSimulating ? <StopIcon size={15} /> : <PlayIcon size={15} />}
              <span>{isSimulating ? 'Static View' : 'Run Simulation'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="yada-modal-close-btn"
              title="Close Fullscreen"
              aria-label="Close Fullscreen"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="yada-modal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isSimulating ? (
            <YadaSimulationIframe embedUrl={embedUrl} title={alt} />
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={alt}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }

  return content;
};
