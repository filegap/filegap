import { describe, expect, it } from 'vitest';

import { createStoredZip } from './zip';

describe('createStoredZip', () => {
  it('creates a stored ZIP with file headers and payload bytes', () => {
    const zip = createStoredZip([
      {
        name: 'page-01.jpg',
        bytes: new Uint8Array([1, 2, 3, 4]),
      },
    ]);

    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint16(8, true)).toBe(0);
    expect(view.getUint32(18, true)).toBe(4);
    expect(view.getUint32(22, true)).toBe(4);

    const filenameLength = view.getUint16(26, true);
    const filename = new TextDecoder().decode(zip.slice(30, 30 + filenameLength));
    expect(filename).toBe('page-01.jpg');
    expect([...zip.slice(30 + filenameLength, 34 + filenameLength)]).toEqual([1, 2, 3, 4]);
  });
});
