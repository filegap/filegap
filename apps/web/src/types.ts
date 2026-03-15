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

export type ExtractRequest = {
  type: 'extract';
  payload: {
    file: ArrayBuffer;
    ranges: SplitRangeSegment[];
  };
};

export type ReorderRequest = {
  type: 'reorder';
  payload: {
    file: ArrayBuffer;
    pageOrder: number[];
  };
};

export type WorkerRequest = MergeRequest | SplitRequest | ExtractRequest | ReorderRequest;

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

export type ExtractSuccessResponse = {
  ok: true;
  type: 'extract';
  payload: {
    output: Uint8Array;
  };
};

export type ReorderSuccessResponse = {
  ok: true;
  type: 'reorder';
  payload: {
    output: Uint8Array;
  };
};

export type WorkerSuccessResponse =
  | MergeSuccessResponse
  | SplitSuccessResponse
  | ExtractSuccessResponse
  | ReorderSuccessResponse;

export type WorkerErrorResponse = {
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
