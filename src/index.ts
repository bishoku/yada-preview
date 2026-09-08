// Main components
export { YadaPreview } from './components/YadaPreview';
export { YadaSimulationIframe } from './components/YadaSimulationIframe';
export { YadaEditorModal } from './components/YadaEditorModal';
export { YadaModalPreview } from './components/YadaModalPreview';

// Icons
export {
  PlayIcon,
  StopIcon,
  EditIcon,
  FullscreenIcon,
  CloseIcon,
  DownloadIcon,
  SpinnerIcon,
} from './components/Icons';

// Hooks
export { useYadaDiagram } from './hooks/useYadaDiagram';

// Utilities
export {
  extractPngMetadata,
  injectPngMetadata,
  createTextChunk,
  isPngSignature,
  DEFAULT_YADA_KEYWORD,
} from './utils/pngMetadata';

export {
  resolveBinaryBytes,
  bytesToDataUri,
  decodeBase64ToUint8Array,
} from './utils/binaryResolver';

export {
  buildYadaEmbedUrl,
  buildYadaEditorUrl,
  resolveTheme,
  DEFAULT_YADA_URL,
} from './utils/urlBuilder';

export { calculateCrc32 } from './utils/crc32';

// Types
export type {
  YadaLogicalData,
  YadaVisualData,
  YadaDiagramData,
  YadaTheme,
  PlayButtonPosition,
  YadaPreviewMode,
  DiagramSavePayload,
  PlayButtonRenderProps,
  ToolbarRenderProps,
  YadaPreviewProps,
  UseYadaDiagramOptions,
  UseYadaDiagramReturn,
  YadaEditorModalProps,
  YadaSimulationIframeProps,
  YadaModalPreviewProps,
} from './types';
