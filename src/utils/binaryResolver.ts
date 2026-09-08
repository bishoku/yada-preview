import { isPngSignature } from './pngMetadata';

/**
 * Resolves binary PNG bytes (Uint8Array) from versatile source types:
 * - URL strings (http://, https://, blob:, relative paths)
 * - Base64 data URIs (data:image/png;base64,...)
 * - Raw base64 strings
 * - Blob or File instances
 * - ArrayBuffer or Uint8Array
 */
export async function resolveBinaryBytes(
  source: string | Blob | File | ArrayBuffer | Uint8Array
): Promise<Uint8Array> {
  if (source instanceof Uint8Array) {
    return source;
  }

  if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }

  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    if (typeof source.arrayBuffer === 'function') {
      const buffer = await source.arrayBuffer();
      return new Uint8Array(buffer);
    }
    // Fallback for older environments / jsdom without Blob.prototype.arrayBuffer
    return new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      };
      reader.onerror = () => {
        reject(reader.error || new Error('Failed to read Blob as ArrayBuffer'));
      };
      reader.readAsArrayBuffer(source);
    });
  }

  if (typeof source === 'string') {
    // 1. Data URI with base64
    if (source.includes(';base64,')) {
      const base64 = source.split(';base64,')[1];
      return decodeBase64ToUint8Array(base64);
    }

    // 2. Absolute URL (http, https, blob)
    if (
      source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('blob:')
    ) {
      const res = await fetch(source);
      if (!res.ok) {
        throw new Error(`Failed to fetch diagram image from "${source}": HTTP ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    }

    // 3. Raw base64 string check
    try {
      const decoded = decodeBase64ToUint8Array(source);
      if (isPngSignature(decoded)) {
        return decoded;
      }
    } catch {
      // Not a valid raw base64 string; treat as relative path
    }

    // 4. Relative URL path (e.g. '/assets/diagram.png')
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Failed to fetch diagram image from "${source}": HTTP ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  throw new Error('Unsupported source type passed to resolveBinaryBytes.');
}

/**
 * Decodes a base64 string into a Uint8Array.
 * Safe across browsers and Node.js environments.
 */
export function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binaryString =
    typeof atob === 'function'
      ? atob(base64.trim())
      : Buffer.from(base64.trim(), 'base64').toString('binary');

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Uint8Array into a data URI string.
 */
export function bytesToDataUri(bytes: Uint8Array, mimeType = 'image/png'): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return `data:${mimeType};base64,${base64}`;
}
