import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { extractEmbeddedImages } from './pdfEngine';

const TEST_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AT//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AT//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABH/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABH/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAABH/2gAIAQEAAT8QH//Z';

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

describe('extractEmbeddedImages', () => {
  it('extracts JPEG image XObjects without recompressing bytes', async () => {
    const jpegBytes = decodeBase64(TEST_JPEG_BASE64);
    const doc = await PDFDocument.create();
    const image = await doc.embedJpg(jpegBytes);
    const page = doc.addPage([8, 8]);
    page.drawImage(image, { x: 0, y: 0, width: 8, height: 8 });

    const images = await extractEmbeddedImages(await doc.save());

    expect(images).toHaveLength(1);
    expect(images[0].filename).toBe('image-001.jpg');
    expect(images[0].format).toBe('jpeg');
    expect(images[0].bytes).toEqual(jpegBytes);
  });

  it('rejects PDFs without supported embedded image streams', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);

    await expect(extractEmbeddedImages(await doc.save())).rejects.toThrow(
      'No supported embedded images found.'
    );
  });
});
