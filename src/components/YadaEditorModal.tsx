import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { YadaEditorModalProps, DiagramSavePayload } from '../types';
import { buildYadaEditorUrl, DEFAULT_YADA_URL } from '../utils/urlBuilder';
import { injectPngMetadata, extractPngMetadata, DEFAULT_YADA_KEYWORD } from '../utils/pngMetadata';
import { decodeBase64ToUint8Array } from '../utils/binaryResolver';
import { CloseIcon, SpinnerIcon, EditIcon } from './Icons';

export const YadaEditorModal: React.FC<YadaEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMetadata,
  sourceBytes,
  yadaUrl = DEFAULT_YADA_URL,
  theme = 'auto',
  lang = 'en',
  title = 'YADA Diagram Editor',
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeReady, setIframeReady] = useState<boolean>(false);

  // Resolve metadata: use provided initialMetadata or extract from sourceBytes as fallback
  const resolvedMetadata = useMemo(() => {
    if (initialMetadata && (initialMetadata.logicalData || initialMetadata.visualData)) {
      return initialMetadata;
    }
    if (sourceBytes) {
      try {
        return extractPngMetadata(sourceBytes);
      } catch (err) {
        console.warn('[yada-preview] Failed to extract PNG metadata for editor:', err);
      }
    }
    return null;
  }, [initialMetadata, sourceBytes]);

  const editorSrc = useMemo(() => {
    return buildYadaEditorUrl({
      yadaUrl,
      theme,
      lang,
    });
  }, [yadaUrl, theme, lang]);

  const sendLoadDiagram = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;

    let logicalJson = '{"schemaVersion":2,"nodes":[],"edges":[],"sequences":[]}';
    let visualJson =
      '{"canvas":{"zoom":1,"pan":{"x":0,"y":0}},"layoutNodes":{},"layoutEdges":{},"timelines":{},"annotations":{}}';

    if (resolvedMetadata) {
      if (resolvedMetadata.logicalData) {
        logicalJson =
          typeof resolvedMetadata.logicalData === 'string'
            ? resolvedMetadata.logicalData
            : JSON.stringify(resolvedMetadata.logicalData);
      }
      if (resolvedMetadata.visualData) {
        visualJson =
          typeof resolvedMetadata.visualData === 'string'
            ? resolvedMetadata.visualData
            : JSON.stringify(resolvedMetadata.visualData);
      }
    }

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'LOAD_DIAGRAM',
        payload: {
          logicalJson,
          visualJson,
        },
      },
      '*'
    );
  }, [resolvedMetadata]);

  // Message listener for YADA iframe events
  useEffect(() => {
    if (!isOpen) {
      setIframeReady(false);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'READY') {
        setIframeReady(true);
        sendLoadDiagram();
      } else if (data.type === 'SAVE_DIAGRAM') {
        const payload = data.payload || {};
        const parsedLogical =
          typeof payload.logicalJson === 'string'
            ? JSON.parse(payload.logicalJson)
            : payload.logicalJson || {};
        const parsedVisual =
          typeof payload.visualJson === 'string'
            ? JSON.parse(payload.visualJson)
            : payload.visualJson || {};

        let enrichedBlob: Blob | undefined;
        let previewUri = payload.previewDataUri;

        // If previewDataUri (PNG base64) is provided by YADA, inject metadata into it
        if (previewUri && previewUri.includes(';base64,')) {
          try {
            const rawBase64 = previewUri.split(';base64,')[1];
            const rawBytes = decodeBase64ToUint8Array(rawBase64);
            const enrichedBytes = injectPngMetadata(rawBytes, DEFAULT_YADA_KEYWORD, {
              logicalData: parsedLogical,
              visualData: parsedVisual,
            });
            if (typeof Blob !== 'undefined') {
              enrichedBlob = new Blob([enrichedBytes as BlobPart], { type: 'image/png' });
            }
          } catch (err) {
            console.warn('[yada-preview] Failed to inject metadata into previewDataUri:', err);
          }
        } else if (sourceBytes) {
          try {
            const enrichedBytes = injectPngMetadata(sourceBytes, DEFAULT_YADA_KEYWORD, {
              logicalData: parsedLogical,
              visualData: parsedVisual,
            });
            if (typeof Blob !== 'undefined') {
              enrichedBlob = new Blob([enrichedBytes as BlobPart], { type: 'image/png' });
            }
          } catch (err) {
            console.warn('[yada-preview] Failed to inject metadata into sourceBytes:', err);
          }
        }

        const savePayload: DiagramSavePayload = {
          logicalJson: typeof payload.logicalJson === 'string' ? payload.logicalJson : JSON.stringify(parsedLogical),
          visualJson: typeof payload.visualJson === 'string' ? payload.visualJson : JSON.stringify(parsedVisual),
          logicalData: parsedLogical,
          visualData: parsedVisual,
          previewDataUri: previewUri,
          aiSummary: payload.aiSummary,
          pngBlob: enrichedBlob,
        };

        onSave(savePayload);
      } else if (data.type === 'CLOSE_DIAGRAM') {
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, sendLoadDiagram, onSave, onClose, sourceBytes]);

  // Resend if resolvedMetadata updates while open and iframe is ready
  useEffect(() => {
    if (isOpen && iframeReady) {
      sendLoadDiagram();
    }
  }, [isOpen, iframeReady, sendLoadDiagram]);

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

  const handleRequestClose = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'REQUEST_SAVE_AND_CLOSE' }, '*');
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="yada-modal-overlay" onClick={handleRequestClose}>
      <div className="yada-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="yada-modal-header">
          <h3 className="yada-modal-title">
            <EditIcon size={16} />
            <span>{title}</span>
          </h3>
          <button
            type="button"
            onClick={handleRequestClose}
            className="yada-modal-close-btn"
            title="Close Editor"
            aria-label="Close Editor"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="yada-modal-body">
          {!iframeReady && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              <SpinnerIcon size={20} />
              <span>Loading YADA Editor...</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={editorSrc}
            title={title}
            className="yada-preview-iframe"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              opacity: iframeReady ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
            allow="clipboard-read; clipboard-write; fullscreen"
            onLoad={() => {
              // Send backup LOAD_DIAGRAM in case READY was dispatched early
              setTimeout(() => {
                sendLoadDiagram();
              }, 300);
            }}
          />
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }

  return content;
};
