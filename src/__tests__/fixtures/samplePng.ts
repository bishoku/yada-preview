import { decodeBase64ToUint8Array } from '../../utils/binaryResolver';

export const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const getMinimalPngBytes = (): Uint8Array => {
  return decodeBase64ToUint8Array(MINIMAL_PNG_BASE64);
};

export const sampleYadaPayload = {
  logicalData: {
    schemaVersion: 2,
    nodes: [
      { id: 'node-client', name: 'Web Client', type: 'browser' },
      { id: 'node-api', name: 'API Gateway', type: 'service' },
      { id: 'node-db', name: 'PostgreSQL', type: 'database' },
    ],
    edges: [
      { id: 'edge-1', source: 'node-client', target: 'node-api', label: 'HTTP GET /data' },
      { id: 'edge-2', source: 'node-api', target: 'node-db', label: 'SQL Query' },
    ],
    sequences: [
      {
        id: 'seq-1',
        name: 'User Data Fetch Flow',
        steps: [
          { from: 'node-client', to: 'node-api', description: 'Request payload' },
          { from: 'node-api', to: 'node-db', description: 'Query DB' },
        ],
      },
    ],
  },
  visualData: {
    canvas: { zoom: 1.25, pan: { x: 120, y: 80 } },
    layoutNodes: {
      'node-client': { x: 50, y: 100, width: 140, height: 80 },
      'node-api': { x: 280, y: 100, width: 140, height: 80 },
      'node-db': { x: 520, y: 100, width: 140, height: 80 },
    },
    layoutEdges: {},
    timelines: {},
    annotations: {},
  },
};
