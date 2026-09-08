import React, { useState, useCallback, useMemo } from 'react';
import type {
  YadaPreviewProps,
  PlayButtonPosition,
  PlayButtonRenderProps,
  ToolbarRenderProps,
  DiagramSavePayload,
} from '../types';
import { useYadaDiagram } from '../hooks/useYadaDiagram';
import { YadaSimulationIframe } from './YadaSimulationIframe';
import { YadaEditorModal } from './YadaEditorModal';
import { YadaModalPreview } from './YadaModalPreview';
import {
  PlayIcon,
  StopIcon,
  FullscreenIcon,
  EditIcon,
  DownloadIcon,
  SpinnerIcon,
} from './Icons';

/**
 * Main YADA Diagram Preview and Live Simulation component.
 *
 * Displays a portable YADA diagram PNG as a high-fidelity image and seamlessly
 * transitions into a live interactive simulation inside an embedded YADA iframe.
 */
export const YadaPreview: React.FC<YadaPreviewProps> = ({
  src,
  projectData: propProjectData,
  alt = 'YADA Architecture Diagram',
  yadaUrl,
  theme = 'auto',
  lang = 'en',
  mode = 'inline',
  autoPlay = false,
  isSimulating: controlledIsSimulating,
  onSimulationChange,
  editable = false,
  showPlayButton = true,
  playButtonPosition = 'top-right',
  showToolbar = false,
  allowFullscreen = true,
  aspectRatio: propAspectRatio,
  width,
  height,
  className = '',
  style,
  imageClassName = '',
  imageStyle,
  iframeClassName = '',
  iframeStyle,
  playButtonClassName = '',
  playButtonStyle,
  renderPlayButton,
  renderToolbar,
  loadingPlaceholder,
  errorPlaceholder,
  onSimulationStart,
  onSimulationStop,
  onSave,
  onMetadataExtracted,
  onError,
  onLoad,
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);
  const [savedData, setSavedData] = useState<DiagramSavePayload | null>(null);

  const activeProjectData = useMemo(() => {
    if (savedData?.logicalData) {
      return {
        logicalData: savedData.logicalData,
        visualData: savedData.visualData,
      };
    }
    return propProjectData;
  }, [savedData, propProjectData]);

  const {
    imageUrl,
    embedUrl,
    isLoading,
    error,
    projectData: hookProjectData,
    isSimulating: hookIsSimulating,
    startSimulation: hookStart,
    stopSimulation: hookStop,
    aspectRatio: detectedAspectRatio,
    setNaturalDimensions,
    rawBytes,
  } = useYadaDiagram({
    src: savedData?.pngBlob || src,
    projectData: activeProjectData,
    yadaUrl,
    theme,
    lang,
    autoPlay,
    onMetadataExtracted,
    onError,
  });

  // Resolved metadata for editor: uses explicit/saved data or extracted PNG metadata
  const resolvedDiagramData = activeProjectData || hookProjectData;

  // Support controlled simulation mode
  const isSimulating =
    typeof controlledIsSimulating === 'boolean' ? controlledIsSimulating : hookIsSimulating;

  const handleStartSimulation = useCallback(() => {
    if (onSimulationChange) {
      onSimulationChange(true);
    } else {
      hookStart();
    }
    if (onSimulationStart) {
      onSimulationStart();
    }
    if (mode === 'modal') {
      setModalPreviewOpen(true);
    }
  }, [mode, onSimulationChange, hookStart, onSimulationStart]);

  const handleStopSimulation = useCallback(() => {
    if (onSimulationChange) {
      onSimulationChange(false);
    } else {
      hookStop();
    }
    if (onSimulationStop) {
      onSimulationStop();
    }
  }, [onSimulationChange, hookStop, onSimulationStop]);

  const handleToggleSimulation = useCallback(() => {
    if (isSimulating) {
      handleStopSimulation();
    } else {
      handleStartSimulation();
    }
  }, [isSimulating, handleStartSimulation, handleStopSimulation]);

  const handleOpenFullscreen = useCallback(() => {
    setModalPreviewOpen(true);
  }, []);

  const handleCloseModalPreview = useCallback(() => {
    setModalPreviewOpen(false);
    if (mode === 'modal') {
      handleStopSimulation();
    }
  }, [mode, handleStopSimulation]);

  const handleOpenEditor = useCallback(() => {
    setEditorOpen(true);
  }, []);

  const handleSaveEditor = useCallback(
    (payload: DiagramSavePayload) => {
      setSavedData(payload);
      setEditorOpen(false);
      if (onSave) {
        onSave(payload);
      }
    },
    [onSave]
  );

  const handleDownloadPng = useCallback(() => {
    if (typeof window === 'undefined') return;
    const downloadUrl = savedData?.previewDataUri || imageUrl;
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${alt.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'yada-diagram'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, savedData, alt]);

  // Compute container dimensions and aspect ratio
  const activeAspectRatio = useMemo(() => {
    if (propAspectRatio) return propAspectRatio;
    if (detectedAspectRatio) return detectedAspectRatio;
    return undefined;
  }, [propAspectRatio, detectedAspectRatio]);

  const containerStyle: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? 'auto',
    ...(activeAspectRatio ? { aspectRatio: String(activeAspectRatio) } : {}),
    ...style,
  };

  // Position class for play button
  const getPositionClass = (pos: PlayButtonPosition): string => {
    switch (pos) {
      case 'bottom-right':
        return 'yada-preview-pos-bottom-right';
      case 'top-left':
        return 'yada-preview-pos-top-left';
      case 'bottom-left':
        return 'yada-preview-pos-bottom-left';
      case 'center':
        return 'yada-preview-pos-center';
      case 'top-right':
      default:
        return 'yada-preview-pos-top-right';
    }
  };

  // Error view
  if (error && errorPlaceholder) {
    return <>{errorPlaceholder(error)}</>;
  }

  return (
    <div className={`yada-preview-root ${className}`} style={containerStyle}>
      <div className="yada-preview-media-wrapper">
        {/* Loading Indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              background: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {loadingPlaceholder || (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <SpinnerIcon size={20} />
                <span style={{ fontSize: '13px' }}>Loading diagram...</span>
              </div>
            )}
          </div>
        )}

        {/* Inline Simulation or Static Image */}
        {isSimulating && mode === 'inline' ? (
          <YadaSimulationIframe
            embedUrl={embedUrl}
            title={alt}
            className={iframeClassName}
            style={iframeStyle}
            allowFullscreen={allowFullscreen}
          />
        ) : (
          imageUrl && (
            <img
              src={imageUrl}
              alt={alt}
              className={`yada-preview-image ${imageClassName}`}
              style={imageStyle}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setNaturalDimensions(img.naturalWidth, img.naturalHeight);
                }
                if (onLoad) {
                  onLoad();
                }
              }}
            />
          )
        )}

        {/* Play Button Overlay (when toolbar is disabled and play button is enabled) */}
        {showPlayButton && playButtonPosition !== 'none' && !showToolbar && (
          <>
            {renderPlayButton ? (
              renderPlayButton({
                isSimulating: mode === 'modal' ? modalPreviewOpen : isSimulating,
                isLoading,
                hasMetadata: !!embedUrl,
                toggle: handleToggleSimulation,
                start: handleStartSimulation,
                stop: handleStopSimulation,
              } as PlayButtonRenderProps)
            ) : (
              <button
                type="button"
                onClick={handleToggleSimulation}
                className={`yada-preview-play-btn ${getPositionClass(playButtonPosition)} ${playButtonClassName}`}
                style={playButtonStyle}
                title={isSimulating && mode === 'inline' ? 'Stop Live Simulation' : 'Start Live Simulation'}
                aria-label={isSimulating && mode === 'inline' ? 'Stop Live Simulation' : 'Start Live Simulation'}
              >
                {isSimulating && mode === 'inline' ? <StopIcon size={14} /> : <PlayIcon size={14} />}
                <span>{isSimulating && mode === 'inline' ? 'Static View' : 'Run Simulation'}</span>
              </button>
            )}
          </>
        )}

        {/* Toolbar Overlay */}
        {showToolbar && (
          <>
            {renderToolbar ? (
              renderToolbar({
                isSimulating,
                isLoading,
                hasMetadata: !!embedUrl,
                toggleSimulation: handleToggleSimulation,
                openFullscreen: handleOpenFullscreen,
                openEditor: editable ? handleOpenEditor : undefined,
                downloadPng: handleDownloadPng,
              } as ToolbarRenderProps)
            ) : (
              <div className="yada-preview-toolbar">
                {/* Simulation Toggle */}
                <button
                  type="button"
                  onClick={handleToggleSimulation}
                  className={`yada-preview-toolbar-btn ${
                    isSimulating && mode === 'inline' ? 'yada-preview-toolbar-btn-sim-active' : ''
                  }`}
                  title={isSimulating && mode === 'inline' ? 'Switch to Image View' : 'Start Live Simulation'}
                  aria-label={isSimulating && mode === 'inline' ? 'Switch to Image View' : 'Start Live Simulation'}
                >
                  {isSimulating && mode === 'inline' ? <StopIcon size={16} /> : <PlayIcon size={16} />}
                </button>

                {/* Edit in YADA */}
                {editable && (
                  <button
                    type="button"
                    onClick={handleOpenEditor}
                    className="yada-preview-toolbar-btn"
                    title="Edit Diagram in YADA"
                    aria-label="Edit Diagram in YADA"
                  >
                    <EditIcon size={16} />
                  </button>
                )}

                {/* Fullscreen Preview */}
                {allowFullscreen && (
                  <button
                    type="button"
                    onClick={handleOpenFullscreen}
                    className="yada-preview-toolbar-btn"
                    title="Fullscreen Lightbox View"
                    aria-label="Fullscreen Lightbox View"
                  >
                    <FullscreenIcon size={16} />
                  </button>
                )}

                {/* Download PNG */}
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="yada-preview-toolbar-btn"
                  title="Download Diagram PNG"
                  aria-label="Download Diagram PNG"
                >
                  <DownloadIcon size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Standalone Fullscreen / Lightbox Modal */}
      {allowFullscreen && (
        <YadaModalPreview
          isOpen={modalPreviewOpen}
          onClose={handleCloseModalPreview}
          embedUrl={embedUrl}
          imageSrc={imageUrl}
          alt={alt}
          isSimulating={isSimulating}
          onToggleSimulation={handleToggleSimulation}
        />
      )}

      {/* YADA Diagram Editor Modal */}
      {editable && (
        <YadaEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveEditor}
          initialMetadata={resolvedDiagramData}
          sourceBytes={rawBytes}
          yadaUrl={yadaUrl}
          theme={theme}
          lang={lang}
          title={`Edit ${alt}`}
        />
      )}
    </div>
  );
};
