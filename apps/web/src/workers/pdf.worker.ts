import { mergePdfBuffers } from '../adapters/pdfEngine';
import { logDebug, logError, logInfo, logWarn } from '../lib/logging/logger';
import type { WorkerRequest, WorkerResponse } from '../types';

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === 'merge') {
      logDebug('Worker merge request ricevuta.', {
        fileCount: event.data.payload.files.length,
      });
      const output = await mergePdfBuffers(event.data.payload.files);
      logInfo('Worker merge completato.');
      const response: WorkerResponse = {
        ok: true,
        type: 'merge',
        payload: { output },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    const unknownResponse: WorkerResponse = {
      ok: false,
      error: 'unsupported operation',
    };
    logWarn('Worker operation non supportata.');
    (self as unknown as Worker).postMessage(unknownResponse);
  } catch (error) {
    logError('Errore nel worker durante il merge.', {
      reason: error instanceof Error ? error.message : 'unknown worker error',
    });
    const response: WorkerResponse = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown worker error',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
