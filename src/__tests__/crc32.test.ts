import { describe, it, expect } from 'vitest';
import { calculateCrc32 } from '../utils/crc32';

describe('calculateCrc32', () => {
  it('calculates expected CRC32 for standard test vectors', () => {
    const encoder = new TextEncoder();
    // Test 1: "123456789" is a standard CRC32 test vector (0xcbf43926)
    const testBytes = encoder.encode('123456789');
    const crc = calculateCrc32(testBytes);
    expect(crc).toBe(0xcbf43926);
  });

  it('calculates CRC32 for empty buffer', () => {
    const empty = new Uint8Array(0);
    const crc = calculateCrc32(empty);
    expect(crc).toBe(0);
  });

  it('calculates consistent CRC32 across multiple runs', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const crc1 = calculateCrc32(data);
    const crc2 = calculateCrc32(data);
    expect(crc1).toBe(crc2);
  });
});
