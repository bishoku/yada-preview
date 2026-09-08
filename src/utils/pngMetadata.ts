import LZString from 'lz-string';
import { calculateCrc32 } from './crc32';
import type { YadaDiagramData } from '../types';

export const DEFAULT_YADA_KEYWORD = 'YADA_DIAGRAM';

/**
 * Validates the standard 8-byte PNG header signature:
 * 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A (\x89PNG\r\n\x1a\n)
 */
export function isPngSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  return (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

/**
 * Creates a PNG `tEXt` chunk from a keyword and text payload.
 *
 * @param keyword Keyword string (e.g. 'YADA_DIAGRAM')
 * @param text Encoded text or compressed string payload
 */
export function createTextChunk(keyword: string, text: string): Uint8Array {
  const encoder = new TextEncoder();
  const keywordBytes = encoder.encode(keyword);
  const textBytes = encoder.encode(text);

  // Chunk Data: Keyword + null separator (0x00) + Text
  const dataLength = keywordBytes.length + 1 + textBytes.length;
  const chunkData = new Uint8Array(dataLength);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // null separator
  chunkData.set(textBytes, keywordBytes.length + 1);

  // Chunk Type: 'tEXt' (0x74, 0x45, 0x58, 0x74)
  const typeBytes = new Uint8Array([0x74, 0x45, 0x58, 0x74]);

  // CRC calculated over Type + Data
  const crcInput = new Uint8Array(4 + dataLength);
  crcInput.set(typeBytes, 0);
  crcInput.set(chunkData, 4);
  const crc = calculateCrc32(crcInput);

  // Full Chunk: 4 bytes length + 4 bytes type + data + 4 bytes crc
  const fullChunk = new Uint8Array(4 + 4 + dataLength + 4);
  const view = new DataView(fullChunk.buffer, fullChunk.byteOffset, fullChunk.byteLength);

  view.setUint32(0, dataLength, false); // Big-endian length
  fullChunk.set(typeBytes, 4);
  fullChunk.set(chunkData, 8);
  view.setUint32(8 + dataLength, crc, false); // Big-endian CRC

  return fullChunk;
}

/**
 * Injects LZString-compressed JSON diagram metadata into a PNG buffer.
 * The new tEXt chunk is placed directly after the initial IHDR chunk.
 *
 * @param pngData Raw PNG binary data (Uint8Array or ArrayBuffer)
 * @param keyword Chunk keyword (default: 'YADA_DIAGRAM')
 * @param projectData Data object or JSON string to inject
 * @returns New Uint8Array with the embedded metadata chunk
 */
export function injectPngMetadata(
  pngData: ArrayBufferLike | Uint8Array,
  keyword: string = DEFAULT_YADA_KEYWORD,
  projectData: unknown
): Uint8Array {
  const jsonStr = typeof projectData === 'string' ? projectData : JSON.stringify(projectData);
  const compressed = LZString.compressToBase64(jsonStr);
  const textChunk = createTextChunk(keyword, compressed);

  const src = pngData instanceof Uint8Array ? pngData : new Uint8Array(pngData);

  if (!isPngSignature(src)) {
    throw new Error('Invalid PNG signature: input buffer is not a valid PNG.');
  }

  // Find the end of the IHDR chunk
  // Standard offset: 8 (signature) + 4 (length) + 4 (type: 'IHDR') + IHDR length (13) + 4 (crc) = 33
  const ihdrLenView = new DataView(src.buffer, src.byteOffset + 8, 4);
  const ihdrDataLen = ihdrLenView.getUint32(0, false);
  const ihdrEndOffset = 8 + 4 + 4 + ihdrDataLen + 4;

  if (ihdrEndOffset > src.length) {
    throw new Error('Malformed PNG: truncated IHDR chunk.');
  }

  // Allocate new buffer with space for the injected tEXt chunk
  const output = new Uint8Array(src.length + textChunk.length);
  output.set(src.subarray(0, ihdrEndOffset), 0);
  output.set(textChunk, ihdrEndOffset);
  output.set(src.subarray(ihdrEndOffset), ihdrEndOffset + textChunk.length);

  return output;
}

/**
 * Extracts and decodes JSON metadata embedded within a PNG buffer for a given keyword.
 * Supports both base64 LZ-String compressed payloads and plain JSON fallbacks.
 *
 * @param pngData Raw PNG binary data
 * @param targetKeyword Chunk keyword to match (default: 'YADA_DIAGRAM')
 * @returns Decoded diagram data object, or null if not found or invalid
 */
export function extractPngMetadata(
  pngData: ArrayBufferLike | Uint8Array,
  targetKeyword: string = DEFAULT_YADA_KEYWORD
): YadaDiagramData | null {
  const bytes = pngData instanceof Uint8Array ? pngData : new Uint8Array(pngData);

  if (!isPngSignature(bytes)) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  const decoder = new TextDecoder();

  while (offset + 8 <= bytes.length) {
    const chunkLen = view.getUint32(offset, false);
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    // Guard against malformed chunk lengths that overflow the buffer
    if (offset + 8 + chunkLen + 4 > bytes.length) {
      break;
    }

    if (chunkType === 'tEXt') {
      const dataBytes = bytes.subarray(offset + 8, offset + 8 + chunkLen);
      let nullIndex = -1;
      for (let i = 0; i < dataBytes.length; i++) {
        if (dataBytes[i] === 0) {
          nullIndex = i;
          break;
        }
      }

      if (nullIndex !== -1) {
        const keyword = decoder.decode(dataBytes.subarray(0, nullIndex));
        if (keyword === targetKeyword) {
          const text = decoder.decode(dataBytes.subarray(nullIndex + 1));
          // Try LZString decompress first
          try {
            const decompressed = LZString.decompressFromBase64(text);
            if (decompressed) {
              try {
                return JSON.parse(decompressed);
              } catch {
                // Not JSON after decompression, continue to raw parse
              }
            }
          } catch {
            // LZString decompression failed, continue to raw parse
          }

          // Fallback to direct JSON parse
          try {
            return JSON.parse(text);
          } catch (err) {
            console.warn(
              `[yada-preview] Failed to parse PNG tEXt metadata for keyword "${targetKeyword}":`,
              err
            );
          }
        }
      }
    }

    // Stop early if reached end of file chunk
    if (chunkType === 'IEND') {
      break;
    }

    // Move to next chunk: 4 bytes length + 4 bytes type + chunkLen + 4 bytes CRC
    offset += 8 + chunkLen + 4;
  }

  return null;
}
