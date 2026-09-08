import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type {
  UseYadaDiagramOptions,
  UseYadaDiagramReturn,
  YadaDiagramData,
} from '../types';
import { resolveBinaryBytes, bytesToDataUri } from '../utils/binaryResolver';
import { extractPngMetadata, DEFAULT_YADA_KEYWORD } from '../utils/pngMetadata';
import { buildYadaEmbedUrl, DEFAULT_YADA_URL } from '../utils/urlBuilder';

/**
 * Headless React hook for managing YADA diagram data, simulation state,
 * PNG metadata extraction, and embed URL generation.
 */
export function useYadaDiagram({
  src,
  projectData: explicitProjectData,
  yadaUrl = DEFAULT_YADA_URL,
  theme = 'auto',
  lang = 'en',
  autoPlay = false,
  metadataKeyword = DEFAULT_YADA_KEYWORD,
  onMetadataExtracted,
  onError,
}: UseYadaDiagramOptions = {}): UseYadaDiagramReturn {
  const [extractedData, setExtractedData] = useState<YadaDiagramData | null>(null);
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Keep track of object URLs to clean up and prevent memory leaks
  const objectUrlRef = useRef<string | null>(null);

  // Active project data prefers explicit prop if provided, else extracted metadata
  const activeProjectData = useMemo(() => {
    return explicitProjectData ?? extractedData;
  }, [explicitProjectData, extractedData]);

  // Clean up object URLs on unmount or replacement
  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current && typeof window !== 'undefined' && window.URL?.revokeObjectURL) {
      window.URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupObjectUrl();
    };
  }, [cleanupObjectUrl]);

  // Load binary data, set image URL, and extract PNG metadata
  useEffect(() => {
    let isCancelled = false;

    if (!src) {
      setExtractedData(null);
      setRawBytes(null);
      setImageUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // If source is already a clean string URL, we can immediately display it as image
    if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))) {
      setImageUrl(src);
    }

    resolveBinaryBytes(src)
      .then((bytes) => {
        if (isCancelled) return;
        setRawBytes(bytes);

        // If source was a Blob/File/Uint8Array or raw base64, set a displayable URL
        if (typeof src !== 'string' || (!src.startsWith('http') && !src.startsWith('/'))) {
          cleanupObjectUrl();
          if (typeof Blob !== 'undefined' && typeof window !== 'undefined' && window.URL?.createObjectURL) {
            const blob = new Blob([bytes as BlobPart], { type: 'image/png' });
            const url = window.URL.createObjectURL(blob);
            objectUrlRef.current = url;
            setImageUrl(url);
          } else {
            setImageUrl(bytesToDataUri(bytes));
          }
        }

        // Extract metadata unless already explicitly provided
        if (!explicitProjectData) {
          try {
            const data = extractPngMetadata(bytes, metadataKeyword);
            if (!isCancelled) {
              setExtractedData(data);
              if (data && onMetadataExtracted) {
                onMetadataExtracted(data);
              }
            }
          } catch (metaErr) {
            console.warn('[yada-preview] Failed to extract PNG metadata:', metaErr);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        const resolvedError = err instanceof Error ? err : new Error(String(err));
        setError(resolvedError);
        setIsLoading(false);
        if (onError) {
          onError(resolvedError);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [src, explicitProjectData, metadataKeyword, onMetadataExtracted, onError, cleanupObjectUrl]);

  // Auto-play trigger
  useEffect(() => {
    if (autoPlay && activeProjectData && !isSimulating) {
      setIsSimulating(true);
    }
  }, [autoPlay, activeProjectData, isSimulating]);

  // Build the embed URL
  const embedUrl = useMemo(() => {
    return buildYadaEmbedUrl({
      yadaUrl,
      theme,
      lang,
      projectData: activeProjectData,
    });
  }, [yadaUrl, theme, lang, activeProjectData]);

  const startSimulation = useCallback(() => {
    setIsSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const setNaturalDimensions = useCallback((width: number, height: number) => {
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, []);

  const aspectRatio = useMemo(() => {
    if (dimensions && dimensions.height > 0) {
      return dimensions.width / dimensions.height;
    }
    return null;
  }, [dimensions]);

  return {
    imageUrl,
    projectData: activeProjectData,
    embedUrl,
    isLoading,
    error,
    isSimulating,
    startSimulation,
    stopSimulation,
    toggleSimulation,
    aspectRatio,
    setNaturalDimensions,
    rawBytes,
  };
}
