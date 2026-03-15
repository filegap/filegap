import '@testing-library/jest-dom/vitest';

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  postMessage(): void {
    // Trigger messageerror to exercise UI fallback path in tests.
    queueMicrotask(() => {
      this.onmessageerror?.({} as MessageEvent);
    });
  }

  terminate(): void {
    // No-op
  }
}

Object.defineProperty(globalThis, 'Worker', {
  writable: true,
  value: MockWorker,
});

if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: () => 'blob:mock',
  });
}

if (typeof URL.revokeObjectURL !== 'function') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: () => {},
  });
}

Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  writable: true,
  value: () => {},
});
