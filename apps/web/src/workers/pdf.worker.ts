import { mergePdfBuffers } from '../adapters/pdfEngine';
import type { WorkerRequest, WorkerResponse } from '../types';

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === 'merge') {
      const output = await mergePdfBuffers(event.data.payload.files);
      const response: WorkerResponse = {
        ok: true,
        type: 'merge',
        payload: { output },
      };
      (self as unknown as Worker).postMessage(response, [output]);
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
