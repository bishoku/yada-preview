import { describe, it, expect } from 'vitest';
import LZString from 'lz-string';
import {
  buildYadaEmbedUrl,
  buildYadaEditorUrl,
  resolveTheme,
  normalizeYadaUrl,
  DEFAULT_YADA_URL,
} from '../utils/urlBuilder';
import { sampleYadaPayload } from './fixtures/samplePng';

describe('urlBuilder utilities', () => {
  it('normalizes URLs by trimming trailing slashes', () => {
    expect(normalizeYadaUrl('https://example.com/yada/')).toBe('https://example.com/yada');
    expect(normalizeYadaUrl('https://example.com/yada///')).toBe('https://example.com/yada');
    expect(normalizeYadaUrl('https://example.com/yada')).toBe('https://example.com/yada');
  });

  it('resolves explicit light and dark themes', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('builds embed URL without projectData', () => {
    const url = buildYadaEmbedUrl({
      theme: 'light',
      lang: 'en',
    });
    expect(url).toBe(`${DEFAULT_YADA_URL}?embed=true&theme=light&lang=en`);
  });

  it('builds embed URL with compressed projectData payload in hash', () => {
    const url = buildYadaEmbedUrl({
      theme: 'dark',
      lang: 'tr',
      projectData: sampleYadaPayload,
    });

    expect(url).toContain('embed=true');
    expect(url).toContain('theme=dark');
    expect(url).toContain('lang=tr');
    expect(url).toContain('#share=');

    const shareParam = url.split('#share=')[1];
    expect(shareParam).toBeDefined();

    const decompressed = LZString.decompressFromEncodedURIComponent(shareParam);
    expect(decompressed).not.toBeNull();
    const parsed = JSON.parse(decompressed!);
    expect(parsed.logicalData.nodes[0].name).toBe('Web Client');
  });

  it('supports custom yadaUrl host', () => {
    const customHost = 'https://custom-yada.internal.net';
    const url = buildYadaEmbedUrl({
      yadaUrl: customHost,
      theme: 'light',
      lang: 'en',
    });
    expect(url.startsWith(customHost)).toBe(true);
  });

  it('builds editor modal URL correctly', () => {
    const editorUrl = buildYadaEditorUrl({
      theme: 'dark',
      lang: 'tr',
    });
    expect(editorUrl).toBe(`${DEFAULT_YADA_URL}?mode=modal&embed=true&theme=dark&lang=tr`);
  });
});
