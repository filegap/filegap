import { describe, expect, it } from 'vitest';
import { fileNameFromPath } from './pathUtils';

describe('pathUtils', () => {
  it('extracts file name from unix path', () => {
    expect(fileNameFromPath('/tmp/alpha/report.pdf')).toBe('report.pdf');
  });

  it('extracts file name from windows path', () => {
    expect(fileNameFromPath('C:\\tmp\\alpha\\report.pdf')).toBe('report.pdf');
  });
});
