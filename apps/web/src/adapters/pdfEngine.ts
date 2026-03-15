import { PDFDocument } from 'pdf-lib';

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
