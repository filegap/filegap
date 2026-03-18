import {
  extractPdfByRanges,
  mergePdfBuffers,
  reorderPdfPages,
  splitPdfByRanges,
} from '../adapters/pdfEngine';
import type { WorkerRequest, WorkerResponse } from '../types';

// ⚠️ Do not log user file data. This project is privacy-first.
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === 'merge') {
      const output = await mergePdfBuffers(event.data.payload.files);
      const response: WorkerResponse = {
        ok: true,
        type: 'merge',
        payload: { output },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    if (event.data.type === 'split') {
      const outputs = await splitPdfByRanges(event.data.payload.file, event.data.payload.ranges);
      const response: WorkerResponse = {
        ok: true,
        type: 'split',
        payload: { outputs },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    if (event.data.type === 'extract') {
      const output = await extractPdfByRanges(event.data.payload.file, event.data.payload.ranges);
      const response: WorkerResponse = {
        ok: true,
        type: 'extract',
        payload: { output },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    if (event.data.type === 'reorder') {
      const output = await reorderPdfPages(event.data.payload.file, event.data.payload.pageOrder);
      const response: WorkerResponse = {
        ok: true,
        type: 'reorder',
        payload: { output },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    const unknownResponse: WorkerResponse = {
      ok: false,
      error: 'unsupported operation',
    };
    (self as unknown as Worker).postMessage(unknownResponse);
  } catch (error) {
    const response: WorkerResponse = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown worker error',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
