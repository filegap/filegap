import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export type PageThumbnail = {
  pageNumber: number;
  imageDataUrl: string;
};

GlobalWorkerOptions.workerSrc = workerSrc;

export async function renderPdfThumbnails(fileBytes: Uint8Array, pageCount: number, maxPreviewPages: number): Promise<PageThumbnail[]> {
  const pdfDocument = await getDocument({ data: fileBytes }).promise;
  const maxPages = Math.min(pageCount, maxPreviewPages);
  const previews: PageThumbnail[] = [];

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.22 });
    const canvas = globalThis.document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      continue;
    }
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    previews.push({
      pageNumber,
      imageDataUrl: canvas.toDataURL('image/jpeg', 0.72),
    });
  }

  return previews;
}
