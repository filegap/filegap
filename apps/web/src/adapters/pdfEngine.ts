import { PDFDocument } from 'pdf-lib';

export type SplitRangeSegment = {
  start: number;
  end: number;
};

export async function mergePdfBuffers(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (buffers.length < 2) {
    throw new Error('merge requires at least 2 input files');
  }

  const merged = await PDFDocument.create();
  for (const bytes of buffers) {
    const doc = await PDFDocument.load(bytes);
    const pageIndices = doc.getPageIndices();
    const copied = await merged.copyPages(doc, pageIndices);
    copied.forEach((page) => merged.addPage(page));
  }

  const output = await merged.save();
  return output;
}

export function parseSplitRanges(input: string, maxPage: number): SplitRangeSegment[] {
  const cleaned = input.trim();
  if (!cleaned) {
    throw new Error('Enter at least one range, for example: 1-3,4-6');
  }
  if (maxPage < 1) {
    throw new Error('Invalid page count.');
  }

  const segments = cleaned.split(',').map((part) => part.trim());
  const parsed: SplitRangeSegment[] = [];

  for (const segment of segments) {
    const singleMatch = /^(\d+)$/.exec(segment);
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(segment);
    if (!singleMatch && !rangeMatch) {
      throw new Error(`Invalid range "${segment}". Use format like 1-3,4,5-8.`);
    }

    const start = Number.parseInt(singleMatch ? singleMatch[1] : rangeMatch![1], 10);
    const end = Number.parseInt(singleMatch ? singleMatch[1] : rangeMatch![2], 10);
    if (start < 1 || end < 1 || start > end) {
      throw new Error(`Invalid range "${segment}".`);
    }
    if (end > maxPage) {
      throw new Error(`Range "${segment}" exceeds total pages (${maxPage}).`);
    }

    parsed.push({ start, end });
  }

  for (let i = 1; i < parsed.length; i += 1) {
    const previous = parsed[i - 1];
    const current = parsed[i];
    if (current.start <= previous.end) {
      throw new Error('Ranges must be ordered and non-overlapping.');
    }
  }

  return parsed;
}

export async function splitPdfByRanges(
  source: ArrayBuffer,
  ranges: SplitRangeSegment[]
): Promise<Uint8Array[]> {
  if (ranges.length === 0) {
    throw new Error('At least one split range is required.');
  }

  const sourceDoc = await PDFDocument.load(source);
  const outputs: Uint8Array[] = [];

  for (const range of ranges) {
    const outputDoc = await PDFDocument.create();
    const pageIndexes = Array.from(
      { length: range.end - range.start + 1 },
      (_, index) => range.start - 1 + index
    );
    const copied = await outputDoc.copyPages(sourceDoc, pageIndexes);
    copied.forEach((page) => outputDoc.addPage(page));
    outputs.push(await outputDoc.save());
  }

  return outputs;
}

export async function extractPdfByRanges(
  source: ArrayBuffer,
  ranges: SplitRangeSegment[]
): Promise<Uint8Array> {
  if (ranges.length === 0) {
    throw new Error('At least one extract range is required.');
  }

  const sourceDoc = await PDFDocument.load(source);
  const outputDoc = await PDFDocument.create();

  for (const range of ranges) {
    const pageIndexes = Array.from(
      { length: range.end - range.start + 1 },
      (_, index) => range.start - 1 + index
    );
    const copied = await outputDoc.copyPages(sourceDoc, pageIndexes);
    copied.forEach((page) => outputDoc.addPage(page));
  }

  return outputDoc.save();
}

export function parsePageOrder(input: string, maxPage: number): number[] {
  const cleaned = input.trim();
  if (!cleaned) {
    throw new Error('Enter page order, for example: 1,3,2,4-6');
  }
  if (maxPage < 1) {
    throw new Error('Invalid page count.');
  }

  const tokens = cleaned.split(',').map((part) => part.trim());
  const order: number[] = [];

  for (const token of tokens) {
    const singleMatch = /^(\d+)$/.exec(token);
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (!singleMatch && !rangeMatch) {
      throw new Error(`Invalid token "${token}". Use 1,3,2,4-6 format.`);
    }

    if (singleMatch) {
      const page = Number.parseInt(singleMatch[1], 10);
      if (page < 1 || page > maxPage) {
        throw new Error(`Page "${page}" is out of bounds (1-${maxPage}).`);
      }
      order.push(page);
      continue;
    }

    const start = Number.parseInt(rangeMatch![1], 10);
    const end = Number.parseInt(rangeMatch![2], 10);
    if (start < 1 || end < 1 || start > end || end > maxPage) {
      throw new Error(`Invalid range "${token}".`);
    }
    for (let page = start; page <= end; page += 1) {
      order.push(page);
    }
  }

  const seen = new Set<number>();
  for (const page of order) {
    if (seen.has(page)) {
      throw new Error('Page order cannot contain duplicates.');
    }
    seen.add(page);
  }
  if (order.length !== maxPage) {
    throw new Error(`Page order must include all pages exactly once (1-${maxPage}).`);
  }

  return order;
}

export async function reorderPdfPages(source: ArrayBuffer, pageOrder: number[]): Promise<Uint8Array> {
  if (pageOrder.length === 0) {
    throw new Error('At least one page is required for reorder.');
  }

  const sourceDoc = await PDFDocument.load(source);
  const outputDoc = await PDFDocument.create();
  const pageIndexes = pageOrder.map((page) => page - 1);
  const copied = await outputDoc.copyPages(sourceDoc, pageIndexes);
  copied.forEach((page) => outputDoc.addPage(page));
  return outputDoc.save();
}
