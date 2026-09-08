import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveBinaryBytes,
  decodeBase64ToUint8Array,
  bytesToDataUri,
} from '../utils/binaryResolver';
import { MINIMAL_PNG_BASE64, getMinimalPngBytes } from './fixtures/samplePng';

describe('binaryResolver utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes through Uint8Array directly', async () => {
    const bytes = getMinimalPngBytes();
    const result = await resolveBinaryBytes(bytes);
    expect(result).toBe(bytes);
  });

  it('converts ArrayBuffer to Uint8Array', async () => {
    const bytes = getMinimalPngBytes();
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const result = await resolveBinaryBytes(buffer);
    expect(result instanceof Uint8Array).toBe(true);
    expect(result.length).toBe(bytes.length);
  });

  it('resolves base64 data URI', async () => {
    const dataUri = `data:image/png;base64,${MINIMAL_PNG_BASE64}`;
    const result = await resolveBinaryBytes(dataUri);
    expect(result instanceof Uint8Array).toBe(true);
    expect(result.length).toBe(getMinimalPngBytes().length);
    expect(result[0]).toBe(0x89);
  });

  it('resolves raw base64 string matching PNG header', async () => {
    const result = await resolveBinaryBytes(MINIMAL_PNG_BASE64);
    expect(result instanceof Uint8Array).toBe(true);
    expect(result.length).toBe(getMinimalPngBytes().length);
    expect(result[0]).toBe(0x89);
  });

  it('resolves Blob or File instances', async () => {
    const bytes = getMinimalPngBytes();
    const blob = new Blob([bytes], { type: 'image/png' });
    const result = await resolveBinaryBytes(blob);
    expect(result instanceof Uint8Array).toBe(true);
    expect(result.length).toBe(bytes.length);
  });

  it('resolves HTTP / HTTPS URLs using fetch', async () => {
    const bytes = getMinimalPngBytes();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(bytes.buffer),
    } as any);

    const result = await resolveBinaryBytes('https://example.com/diagram.png');
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/diagram.png');
    expect(result.length).toBe(bytes.length);
  });

  it('throws helpful error on HTTP failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    await expect(resolveBinaryBytes('https://example.com/notfound.png')).rejects.toThrow(
      'Failed to fetch diagram image from "https://example.com/notfound.png": HTTP 404'
    );
  });

  it('converts Uint8Array to Data URI', () => {
    const bytes = getMinimalPngBytes();
    const dataUri = bytesToDataUri(bytes, 'image/png');
    expect(dataUri.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('decodes base64 string cleanly', () => {
    const bytes = decodeBase64ToUint8Array(MINIMAL_PNG_BASE64);
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
  });
});
