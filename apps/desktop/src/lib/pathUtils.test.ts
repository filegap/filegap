import { describe, expect, it } from 'vitest';
import { fileNameFromPath, outputDefaultName } from './pathUtils';

describe('pathUtils', () => {
  it('extracts file name from unix path', () => {
    expect(fileNameFromPath('/tmp/alpha/report.pdf')).toBe('report.pdf');
  });

  it('extracts file name from windows path', () => {
    expect(fileNameFromPath('C:\\tmp\\alpha\\report.pdf')).toBe('report.pdf');
  });

  it('uses merged default when multiple files are selected', () => {
    expect(outputDefaultName(['/a.pdf', '/b.pdf'])).toBe('merged.pdf');
  });

  it('uses selected file name when one file is selected', () => {
    expect(outputDefaultName(['/tmp/single.pdf'])).toBe('single.pdf');
  });
});
