export type WorkerRequest = {
  type: 'merge';
  payload: {
    files: ArrayBuffer[];
  };
};

export type WorkerSuccessResponse = {
  ok: true;
  type: 'merge';
  payload: {
    output: Uint8Array;
  };
};

export type WorkerErrorResponse = {
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
