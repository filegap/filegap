import { useMemo, useState } from 'react';
import type { WorkerResponse } from '../types';

function saveBlob(filename: string, bytes: ArrayBuffer): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('Ready');

  const worker = useMemo(
    () => new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  async function runMerge(): Promise<void> {
    if (files.length < 2) {
      setStatus('Select at least 2 PDF files.');
      return;
    }

    setStatus('Processing locally in your browser...');
    const buffers = await Promise.all(files.map((file) => file.arrayBuffer()));

    const response = await new Promise<WorkerResponse>((resolve) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => resolve(event.data);
      worker.postMessage(
        {
          type: 'merge',
          payload: { files: buffers },
        },
        buffers
      );
    });

    if (!response.ok) {
      setStatus(`Error: ${response.error}`);
      return;
    }

    saveBlob('merged.pdf', response.payload.output);
    setStatus('Done. File generated locally.');
  }

  return (
    <main className="container">
      <h1>pdflo web</h1>
      <p className="subtitle">Private PDF tools that run entirely in your browser.</p>

      <div className="card">
        <label htmlFor="files">Select PDF files to merge</label>
        <input
          id="files"
          type="file"
          accept="application/pdf"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />

        <ul>
          {files.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>

        <button onClick={() => void runMerge()}>Merge Locally</button>
      </div>

      <p className="status">{status}</p>
      <p className="note">No uploads. No backend processing. Files never leave your device.</p>
    </main>
  );
}
