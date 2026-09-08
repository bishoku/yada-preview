/**
 * CRC32 Lookup Table for PNG Chunks computation.
 * Pre-computed once for maximum performance.
 */
const crcTable: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

/**
 * Calculates the 32-bit Cyclic Redundancy Check (CRC32) over the provided buffer.
 * Compliant with ISO 3309 and PNG chunk CRC specifications.
 *
 * @param buf Uint8Array containing chunk type and chunk data bytes
 * @returns 32-bit unsigned integer CRC
 */
export function calculateCrc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
