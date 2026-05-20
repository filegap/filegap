import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export type PdfImageFormat = 'jpeg' | 'png';

export type PdfPageImage = {
  pageNumber: number;
  filename: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

export type RenderPdfPagesToImagesOptions = {
  format: PdfImageFormat;
  scale: number;
  jpegQuality: number;
  baseFilename: string;
};

GlobalWorkerOptions.workerSrc = workerSrc;

function stripPdfExtension(filename: string): string {
  const trimmed = filename.trim() || 'filegap';
  return trimmed.toLowerCase().endsWith('.pdf') ? trimmed.slice(0, -4) : trimmed;
}

function getImageMime(format: PdfImageFormat): string {
  return format === 'png' ? 'image/png' : 'image/jpeg';
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const [, base64 = ''] = dataUrl.split(',');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function canvasToBytes(
  canvas: HTMLCanvasElement,
  format: PdfImageFormat,
  jpegQuality: number
): Promise<Uint8Array> {
  const mime = getImageMime(format);
  if (typeof canvas.toBlob === 'function') {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mime, format === 'jpeg' ? jpegQuality : undefined);
    });
    if (blob) {
      return new Uint8Array(await blob.arrayBuffer());
    }
  }

  return dataUrlToBytes(canvas.toDataURL(mime, format === 'jpeg' ? jpegQuality : undefined));
}

export async function renderPdfPagesToImages(
  fileBytes: Uint8Array,
  options: RenderPdfPagesToImagesOptions,
  onProgress?: (completedPages: number, totalPages: number) => void
): Promise<PdfPageImage[]> {
  const pdfDocument = await getDocument({ data: fileBytes }).promise;
  const pageCount = pdfDocument.numPages;
  const baseFilename = stripPdfExtension(options.baseFilename);
  const extension = options.format === 'png' ? 'png' : 'jpg';
  const pageDigits = Math.max(2, String(pageCount).length);
  const images: PdfPageImage[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: options.scale });
    const canvas = globalThis.document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create canvas context');
    }

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    await page.render({ canvasContext: context, viewport, canvas }).promise;
    const bytes = await canvasToBytes(canvas, options.format, options.jpegQuality);
    const paddedPageNumber = String(pageNumber).padStart(pageDigits, '0');

    images.push({
      pageNumber,
      filename: `${baseFilename}-page-${paddedPageNumber}.${extension}`,
      bytes,
      width: canvas.width,
      height: canvas.height,
    });
    onProgress?.(pageNumber, pageCount);
  }

  await pdfDocument.destroy();
  return images;
}
