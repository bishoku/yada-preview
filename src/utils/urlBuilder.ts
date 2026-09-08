import LZString from 'lz-string';
import type { YadaDiagramData, YadaTheme } from '../types';

export const DEFAULT_YADA_URL = 'https://bishoku.github.io/yada/';

export interface BuildEmbedUrlOptions {
  yadaUrl?: string;
  theme?: YadaTheme;
  lang?: string;
  projectData?: YadaDiagramData | null;
}

export interface BuildEditorUrlOptions {
  yadaUrl?: string;
  theme?: YadaTheme;
  lang?: string;
}

/**
 * Resolves a YadaTheme ('light' | 'dark' | 'auto') to an explicit 'light' or 'dark' string.
 * Detects system color scheme preference when in 'auto' mode.
 */
export function resolveTheme(theme: YadaTheme = 'auto'): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Normalizes the base YADA URL by removing trailing slashes.
 */
export function normalizeYadaUrl(url: string = DEFAULT_YADA_URL): string {
  return url.replace(/\/+$/, '');
}

/**
 * Builds the URL used to embed and auto-play a YADA diagram simulation.
 * Appends `#share=${compressed}` when projectData is provided.
 */
export function buildYadaEmbedUrl({
  yadaUrl = DEFAULT_YADA_URL,
  theme = 'auto',
  lang = 'en',
  projectData,
}: BuildEmbedUrlOptions): string {
  const base = normalizeYadaUrl(yadaUrl);
  const resolvedTheme = resolveTheme(theme);
  const query = `embed=true&theme=${encodeURIComponent(resolvedTheme)}&lang=${encodeURIComponent(lang)}`;

  if (projectData && (projectData.logicalData || projectData.visualData)) {
    const jsonStr = JSON.stringify(projectData);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return `${base}/?${query}#share=${compressed}`;
  }

  return `${base}/?${query}`;
}

/**
 * Builds the URL used to embed the YADA Diagram Editor modal.
 * Note: Must NOT contain #share=, as #share= triggers view-only simulation playback
 * instead of opening the diagram in full interactive edit mode.
 * The diagram data is passed to the editor via window.postMessage ('LOAD_DIAGRAM').
 */
export function buildYadaEditorUrl({
  yadaUrl = DEFAULT_YADA_URL,
  theme = 'auto',
  lang = 'en',
}: BuildEditorUrlOptions): string {
  const base = normalizeYadaUrl(yadaUrl);
  const resolvedTheme = resolveTheme(theme);
  const query = `mode=modal&embed=true&theme=${encodeURIComponent(resolvedTheme)}&lang=${encodeURIComponent(lang)}`;
  return `${base}/?${query}`;
}
