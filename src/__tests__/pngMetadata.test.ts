import { describe, it, expect } from 'vitest';
import {
  injectPngMetadata,
  extractPngMetadata,
  createTextChunk,
  isPngSignature,
  DEFAULT_YADA_KEYWORD,
} from '../utils/pngMetadata';
import { getMinimalPngBytes, sampleYadaPayload } from './fixtures/samplePng';

describe('pngMetadata utilities', () => {
  it('correctly validates PNG signature', () => {
    const validBytes = getMinimalPngBytes();
    expect(isPngSignature(validBytes)).toBe(true);

    const invalidBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(isPngSignature(invalidBytes)).toBe(false);

    const empty = new Uint8Array(0);
    expect(isPngSignature(empty)).toBe(false);
  });

  it('creates valid PNG tEXt chunk with keyword and payload', () => {
    const keyword = 'TEST_KEYWORD';
    const text = 'Hello YADA';
    const chunk = createTextChunk(keyword, text);

    // 4 len + 4 type ('tEXt') + data + 4 crc
    const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    const dataLen = view.getUint32(0, false);
    expect(dataLen).toBe(keyword.length + 1 + text.length);

    const typeStr = String.fromCharCode(chunk[4], chunk[5], chunk[6], chunk[7]);
    expect(typeStr).toBe('tEXt');
  });

  it('injects and extracts YADA metadata in a PNG buffer', () => {
    const rawBuffer = getMinimalPngBytes();
    const enriched = injectPngMetadata(rawBuffer, DEFAULT_YADA_KEYWORD, sampleYadaPayload);

    expect(enriched.byteLength).toBeGreaterThan(rawBuffer.byteLength);
    expect(isPngSignature(enriched)).toBe(true);

    const extracted = extractPngMetadata(enriched, DEFAULT_YADA_KEYWORD);
    expect(extracted).not.toBeNull();
    expect(extracted?.logicalData?.nodes?.[0]?.name).toBe('Web Client');
    expect(extracted?.logicalData?.nodes?.[1]?.name).toBe('API Gateway');
    expect(extracted?.visualData?.canvas?.zoom).toBe(1.25);
  });

  it('handles custom keywords for metadata injection and extraction', () => {
    const rawBuffer = getMinimalPngBytes();
    const customKeyword = 'CUSTOM_KEYWORD';
    const payload = { testField: 'custom value' };

    const enriched = injectPngMetadata(rawBuffer, customKeyword, payload);
    const extractedDefault = extractPngMetadata(enriched, DEFAULT_YADA_KEYWORD);
    expect(extractedDefault).toBeNull();

    const extractedCustom = extractPngMetadata(enriched, customKeyword);
    expect(extractedCustom).toEqual(payload);
  });

  it('supports stringified JSON input for injectPngMetadata', () => {
    const rawBuffer = getMinimalPngBytes();
    const jsonString = JSON.stringify(sampleYadaPayload);

    const enriched = injectPngMetadata(rawBuffer, DEFAULT_YADA_KEYWORD, jsonString);
    const extracted = extractPngMetadata(enriched, DEFAULT_YADA_KEYWORD);
    expect(extracted?.logicalData?.nodes?.[0]?.name).toBe('Web Client');
  });

  it('throws an error when trying to inject metadata into an invalid PNG', () => {
    const invalid = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(() => {
      injectPngMetadata(invalid, DEFAULT_YADA_KEYWORD, sampleYadaPayload);
    }).toThrow('Invalid PNG signature');
  });

  it('returns null when extracting from a PNG without the specified metadata', () => {
    const rawBuffer = getMinimalPngBytes();
    const extracted = extractPngMetadata(rawBuffer, 'NON_EXISTENT_KEYWORD');
    expect(extracted).toBeNull();
  });

  it('returns null when extracting from non-PNG data', () => {
    const invalid = new Uint8Array([1, 2, 3]);
    const extracted = extractPngMetadata(invalid, DEFAULT_YADA_KEYWORD);
    expect(extracted).toBeNull();
  });

  it('falls back to plain JSON if payload in tEXt chunk is uncompressed JSON', () => {
    // Manually create a chunk containing uncompressed JSON
    const rawBuffer = getMinimalPngBytes();
    const plainJson = JSON.stringify({ hello: 'world' });
    const chunk = createTextChunk(DEFAULT_YADA_KEYWORD, plainJson);

    // Insert chunk after IHDR
    const ihdrEndOffset = 33;
    const output = new Uint8Array(rawBuffer.length + chunk.length);
    output.set(rawBuffer.subarray(0, ihdrEndOffset), 0);
    output.set(chunk, ihdrEndOffset);
    output.set(rawBuffer.subarray(ihdrEndOffset), ihdrEndOffset + chunk.length);

    const extracted = extractPngMetadata(output, DEFAULT_YADA_KEYWORD);
    expect(extracted).toEqual({ hello: 'world' });
  });
});
