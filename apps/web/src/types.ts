import type { SplitRangeSegment } from './adapters/pdfEngine';

export type MergeRequest = {
  type: 'merge';
  payload: {
    files: ArrayBuffer[];
  };
};

export type SplitRequest = {
  type: 'split';
  payload: {
    file: ArrayBuffer;
    ranges: SplitRangeSegment[];
  };
};

export type WorkerRequest = MergeRequest | SplitRequest;

export type MergeSuccessResponse = {
  ok: true;
  type: 'merge';
  payload: {
    output: Uint8Array;
  };
};

export type SplitSuccessResponse = {
  ok: true;
  type: 'split';
  payload: {
    outputs: Uint8Array[];
  };
};

export type WorkerSuccessResponse = MergeSuccessResponse | SplitSuccessResponse;

export type WorkerErrorResponse = {
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
