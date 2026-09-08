import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYadaDiagram } from '../hooks/useYadaDiagram';
import { injectPngMetadata, DEFAULT_YADA_KEYWORD } from '../utils/pngMetadata';
import { getMinimalPngBytes, sampleYadaPayload } from './fixtures/samplePng';

describe('useYadaDiagram hook', () => {
  it('initializes with null state when no src is provided', () => {
    const { result } = renderHook(() => useYadaDiagram());
    expect(result.current.imageUrl).toBeNull();
    expect(result.current.projectData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSimulating).toBe(false);
  });

  it('loads PNG and extracts metadata successfully', async () => {
    const rawBuffer = getMinimalPngBytes();
    const enriched = injectPngMetadata(rawBuffer, DEFAULT_YADA_KEYWORD, sampleYadaPayload);
    const onMetadataExtracted = vi.fn();

    const { result } = renderHook(() =>
      useYadaDiagram({
        src: enriched,
        onMetadataExtracted,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.projectData).not.toBeNull();
    });

    expect(result.current.projectData?.logicalData?.nodes?.[0]?.name).toBe('Web Client');
    expect(onMetadataExtracted).toHaveBeenCalledWith(
      expect.objectContaining({
        logicalData: expect.any(Object),
      })
    );
    expect(result.current.embedUrl).toContain('#share=');
  });

  it('handles simulation start, stop, and toggle', async () => {
    const rawBuffer = getMinimalPngBytes();
    const { result } = renderHook(() => useYadaDiagram({ src: rawBuffer }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSimulating).toBe(false);

    act(() => {
      result.current.startSimulation();
    });
    expect(result.current.isSimulating).toBe(true);

    act(() => {
      result.current.stopSimulation();
    });
    expect(result.current.isSimulating).toBe(false);

    act(() => {
      result.current.toggleSimulation();
    });
    expect(result.current.isSimulating).toBe(true);
  });

  it('calculates aspect ratio when natural dimensions are set', async () => {
    const { result } = renderHook(() => useYadaDiagram());
    expect(result.current.aspectRatio).toBeNull();

    act(() => {
      result.current.setNaturalDimensions(1600, 900);
    });

    expect(result.current.aspectRatio).toBeCloseTo(16 / 9, 2);
  });

  it('handles error when invalid source is passed', async () => {
    const onError = vi.fn();
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() =>
      useYadaDiagram({
        src: 'https://invalid-url.com/diag.png',
        onError,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
