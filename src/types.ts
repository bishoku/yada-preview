import type { CSSProperties, ReactNode } from 'react';

/**
 * YADA diagram logical data representation.
 * Contains nodes, edges, sequence flows, and schema version.
 */
export interface YadaLogicalData {
  schemaVersion?: number;
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  sequences?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * YADA diagram visual layout data representation.
 * Contains canvas pan/zoom, node positions, edge geometries, and annotations.
 */
export interface YadaVisualData {
  canvas?: {
    zoom?: number;
    pan?: { x: number; y: number };
    [key: string]: unknown;
  };
  layoutNodes?: Record<string, unknown>;
  layoutEdges?: Record<string, unknown>;
  timelines?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Complete project payload embedded within a YADA PNG or passed directly.
 */
export interface YadaDiagramData {
  logicalData?: YadaLogicalData;
  visualData?: YadaVisualData;
  [key: string]: unknown;
}

/**
 * Supported themes for YADA embed.
 */
export type YadaTheme = 'light' | 'dark' | 'auto';

/**
 * Position options for the floating play badge or button.
 */
export type PlayButtonPosition =
  | 'top-right'
  | 'bottom-right'
  | 'center'
  | 'top-left'
  | 'bottom-left'
  | 'none';

/**
 * Presentation mode for the simulation.
 * - 'inline': Swaps the image for the interactive iframe in-place.
 * - 'modal': Opens a fullscreen lightbox modal running the simulation.
 */
export type YadaPreviewMode = 'inline' | 'modal';

/**
 * Payload delivered when saving from the YADA Diagram Editor.
 */
export interface DiagramSavePayload {
  logicalJson: string;
  visualJson: string;
  logicalData: YadaLogicalData;
  visualData: YadaVisualData;
  previewDataUri?: string;
  aiSummary?: string;
  pngBlob?: Blob;
}

/**
 * Arguments provided to custom play button render functions.
 */
export interface PlayButtonRenderProps {
  isSimulating: boolean;
  isLoading: boolean;
  hasMetadata: boolean;
  toggle: () => void;
  start: () => void;
  stop: () => void;
}

/**
 * Arguments provided to custom toolbar render functions.
 */
export interface ToolbarRenderProps {
  isSimulating: boolean;
  isLoading: boolean;
  hasMetadata: boolean;
  toggleSimulation: () => void;
  openFullscreen: () => void;
  openEditor?: () => void;
  downloadPng?: () => void;
}

/**
 * Props for the main <YadaPreview /> component.
 */
export interface YadaPreviewProps {
  /**
   * Source of the YADA diagram PNG.
   * Can be a URL string, base64 data URI, Blob, File, ArrayBuffer, or Uint8Array.
   */
  src?: string | Blob | File | Uint8Array | ArrayBuffer;

  /**
   * Direct diagram JSON payload. If provided, metadata extraction from PNG is skipped.
   */
  projectData?: YadaDiagramData;

  /**
   * Alternate text for the preview image.
   */
  alt?: string;

  /**
   * Base URL of the YADA application host.
   * @default 'https://bishoku.github.io/yada/'
   */
  yadaUrl?: string;

  /**
   * Visual theme passed to YADA ('light', 'dark', or 'auto').
   * @default 'auto'
   */
  theme?: YadaTheme;

  /**
   * Language code passed to YADA (e.g., 'en', 'tr').
   * @default 'en'
   */
  lang?: string;

  /**
   * Simulation display mode: 'inline' (default) or 'modal' (lightbox).
   * @default 'inline'
   */
  mode?: YadaPreviewMode;

  /**
   * Automatically start simulation once diagram data is loaded.
   * @default false
   */
  autoPlay?: boolean;

  /**
   * Controlled simulation state. When provided, component behaves as a controlled component.
   */
  isSimulating?: boolean;

  /**
   * Callback invoked when controlled or uncontrolled simulation state changes.
   */
  onSimulationChange?: (isSimulating: boolean) => void;

  /**
   * Enable YADA diagram editor integration.
   * When true, displays an Edit button in the toolbar/overlay to modify the diagram.
   * @default false
   */
  editable?: boolean;

  /**
   * Whether to display the play/simulation button overlay.
   * @default true
   */
  showPlayButton?: boolean;

  /**
   * Placement of the play button.
   * @default 'top-right'
   */
  playButtonPosition?: PlayButtonPosition;

  /**
   * Whether to show a floating action toolbar with playback, fullscreen, and edit controls.
   * @default false
   */
  showToolbar?: boolean;

  /**
   * Allow expanding diagram into a fullscreen modal view.
   * @default true
   */
  allowFullscreen?: boolean;

  /**
   * Container width (number of pixels or CSS string e.g. "100%", "720px").
   */
  width?: string | number;

  /**
   * Container height (number of pixels or CSS string).
   */
  height?: string | number;

  /**
   * Fixed aspect ratio for the container (e.g. 16/9, "16 / 9").
   * If not set, automatically inherits from the natural dimensions of the image to avoid layout shift.
   */
  aspectRatio?: number | string;

  /**
   * Root container CSS class name.
   */
  className?: string;

  /**
   * Root container inline CSS style.
   */
  style?: CSSProperties;

  /**
   * CSS class name for the static <img> element.
   */
  imageClassName?: string;

  /**
   * Inline style for the static <img> element.
   */
  imageStyle?: CSSProperties;

  /**
   * CSS class name for the simulation <iframe> element.
   */
  iframeClassName?: string;

  /**
   * Inline style for the simulation <iframe> element.
   */
  iframeStyle?: CSSProperties;

  /**
   * CSS class name for the play button element.
   */
  playButtonClassName?: string;

  /**
   * Inline style for the play button element.
   */
  playButtonStyle?: CSSProperties;

  /**
   * Custom render function for the play button.
   */
  renderPlayButton?: (props: PlayButtonRenderProps) => ReactNode;

  /**
   * Custom render function for the toolbar.
   */
  renderToolbar?: (props: ToolbarRenderProps) => ReactNode;

  /**
   * Custom loading indicator rendered while resolving bytes or extracting metadata.
   */
  loadingPlaceholder?: ReactNode;

  /**
   * Custom error indicator rendered when binary resolution or metadata parsing fails.
   */
  errorPlaceholder?: (error: Error) => ReactNode;

  /**
   * Callback fired when simulation playback begins.
   */
  onSimulationStart?: () => void;

  /**
   * Callback fired when simulation playback is stopped.
   */
  onSimulationStop?: () => void;

  /**
   * Callback fired when saving changes in the YADA Editor modal.
   */
  onSave?: (payload: DiagramSavePayload) => void;

  /**
   * Callback fired once diagram metadata is successfully extracted or provided.
   */
  onMetadataExtracted?: (data: YadaDiagramData) => void;

  /**
   * Callback fired when an error occurs during binary resolution or metadata parsing.
   */
  onError?: (error: Error) => void;

  /**
   * Callback fired when the preview image successfully loads.
   */
  onLoad?: () => void;
}

/**
 * Options for the `useYadaDiagram` hook.
 */
export interface UseYadaDiagramOptions {
  src?: string | Blob | File | Uint8Array | ArrayBuffer;
  projectData?: YadaDiagramData;
  yadaUrl?: string;
  theme?: YadaTheme;
  lang?: string;
  autoPlay?: boolean;
  metadataKeyword?: string;
  onMetadataExtracted?: (data: YadaDiagramData) => void;
  onError?: (error: Error) => void;
}

/**
 * Return type for the `useYadaDiagram` hook.
 */
export interface UseYadaDiagramReturn {
  imageUrl: string | null;
  projectData: YadaDiagramData | null;
  embedUrl: string;
  isLoading: boolean;
  error: Error | null;
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
  toggleSimulation: () => void;
  aspectRatio: number | null;
  setNaturalDimensions: (width: number, height: number) => void;
  rawBytes: Uint8Array | null;
}

/**
 * Props for the standalone <YadaEditorModal /> component.
 */
export interface YadaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: DiagramSavePayload) => void;
  initialMetadata?: YadaDiagramData | null;
  sourceBytes?: Uint8Array | null;
  yadaUrl?: string;
  theme?: YadaTheme;
  lang?: string;
  title?: string;
}

/**
 * Props for the standalone <YadaSimulationIframe /> component.
 */
export interface YadaSimulationIframeProps {
  embedUrl: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
  allowFullscreen?: boolean;
  onLoad?: () => void;
}

/**
 * Props for the <YadaModalPreview /> lightbox modal.
 */
export interface YadaModalPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  embedUrl: string;
  imageSrc?: string | null;
  alt?: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}
