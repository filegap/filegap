import { mergePdfBuffers, splitPdfByRanges } from '../adapters/pdfEngine';
import { logDebug, logError, logInfo, logWarn } from '../lib/logging/logger';
import type { WorkerRequest, WorkerResponse } from '../types';

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === 'merge') {
      logDebug('Worker merge request received.', {
        fileCount: event.data.payload.files.length,
      });
      const output = await mergePdfBuffers(event.data.payload.files);
      logInfo('Worker merge completed.');
      const response: WorkerResponse = {
        ok: true,
        type: 'merge',
        payload: { output },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    if (event.data.type === 'split') {
      logDebug('Worker split request received.', {
        ranges: event.data.payload.ranges.length,
      });
      const outputs = await splitPdfByRanges(event.data.payload.file, event.data.payload.ranges);
      logInfo('Worker split completed.');
      const response: WorkerResponse = {
        ok: true,
        type: 'split',
        payload: { outputs },
      };
      (self as unknown as Worker).postMessage(response);
      return;
    }

    const unknownResponse: WorkerResponse = {
      ok: false,
      error: 'unsupported operation',
    };
    logWarn('Worker operation not supported.');
    (self as unknown as Worker).postMessage(unknownResponse);
  } catch (error) {
    logError('Worker merge error.', {
      reason: error instanceof Error ? error.message : 'unknown worker error',
    });
    const response: WorkerResponse = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown worker error',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
