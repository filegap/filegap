import { useEffect, useMemo, useState } from 'react';

import { Card } from '../../components/ui/Card';
import { DropZone } from '../../components/ui/DropZone';
import { Button } from '../../components/ui/Button';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { logDebug, logError, logInfo, logWarn } from '../../lib/logging/logger';
import { mergePdfBuffers } from '../../adapters/pdfEngine';
import type { WorkerResponse } from '../../types';

function saveBlob(filename: string, bytes: Uint8Array): void {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  // jsdom can miss File#arrayBuffer; fallback via Response for tests.
  return new Response(file).arrayBuffer();
}

export function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedOutput, setMergedOutput] = useState<Uint8Array | null>(null);
  const [showDownloadGate, setShowDownloadGate] = useState(false);

  const worker = useMemo(
    () => new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), { type: 'module' }),
    []
  );

  function handleFilesSelected(nextFiles: File[]): void {
    setFiles(nextFiles);
    logInfo('File PDF selezionati.', { selectedFiles: nextFiles.length });
    logDebug('Dettagli tecnici selezione file.', {
      selectedFiles: nextFiles.length,
      totalBytes: nextFiles.reduce((sum, file) => sum + file.size, 0),
    });
  }

  useEffect(() => {
    return () => worker.terminate();
  }, [worker]);

  async function handleMerge(): Promise<void> {
    if (files.length < 2) {
      setStatus('Select at least 2 PDF files to merge.');
      logWarn('Serve selezionare almeno 2 file PDF prima del merge.', {
        selectedFiles: files.length,
      });
      return;
    }

    setIsProcessing(true);
    setStatus('Processing locally in your browser...');
    logInfo('Avvio merge locale nel browser.', { selectedFiles: files.length });

    const buffers = await Promise.all(files.map((file) => fileToArrayBuffer(file)));
    logDebug('Buffer PDF pronti per il worker.', {
      selectedFiles: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    });
    const response = await new Promise<WorkerResponse>((resolve) => {
      const timeoutId = setTimeout(() => {
        logError('Timeout worker merge: nessuna risposta entro 15s.', {
          selectedFiles: files.length,
        });
        resolve({
          ok: false,
          error: 'merge timeout: worker did not respond in time',
        });
      }, 15_000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        worker.onmessage = null;
        worker.onerror = null;
        worker.onmessageerror = null;
      };

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        cleanup();
        resolve(event.data);
      };

      worker.onerror = (event: ErrorEvent) => {
        cleanup();
        logError('Worker error durante merge.', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
        resolve({
          ok: false,
          error: event.message || 'worker error',
        });
      };

      worker.onmessageerror = () => {
        cleanup();
        logError('Worker message error: payload non deserializzabile.');
        resolve({
          ok: false,
          error: 'worker message error',
        });
      };

      worker.postMessage({
        type: 'merge',
        payload: { files: buffers },
      });
    });

    if (!response.ok) {
      logWarn('Worker non disponibile, fallback su main thread.', {
        reason: response.error,
      });
      try {
        const output = await mergePdfBuffers(buffers);
        setMergedOutput(output);
        setShowDownloadGate(false);
        setStatus('Merge completato.');
        logInfo('Merge completato con fallback main-thread.', {
          outputFile: 'merged.pdf',
          selectedFiles: files.length,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown merge error';
        setStatus(`Error: ${reason}`);
        logError('Merge fallito anche in fallback main-thread.', { reason });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    setMergedOutput(response.payload.output);
    setShowDownloadGate(false);
    setStatus('Merge completato.');
    setIsProcessing(false);
    logInfo('Merge completato con successo.', {
      outputFile: 'merged.pdf',
      selectedFiles: files.length,
    });
  }

  function startNewMerge(): void {
    setFiles([]);
    setMergedOutput(null);
    setShowDownloadGate(false);
    setStatus('Ready');
    logInfo('Nuovo merge avviato.');
  }

  function handleDownloadCta(): void {
    setShowDownloadGate(true);
    logInfo('Apertura modale pre-download.');
  }

  function handleConfirmDownload(): void {
    if (!mergedOutput) {
      return;
    }
    saveBlob('merged.pdf', mergedOutput);
    setShowDownloadGate(false);
    logInfo('Download file merged.pdf avviato.');
  }

  return (
    <ToolLayout
      title='Merge PDF'
      description='Combine multiple PDF files into a single document. Files are processed locally in your browser.'
    >
      <Card>
        <div className='space-y-6'>
          <DropZone onFilesSelected={handleFilesSelected} multiple />

          <div className='space-y-2'>
            <h2 className='font-heading text-2xl font-semibold text-ui-text'>Uploaded files</h2>
            {files.length === 0 ? (
              <p className='text-sm text-ui-muted'>No files selected yet.</p>
            ) : (
              <ul className='space-y-2 text-sm text-ui-text'>
                {files.map((file) => (
                  <li key={file.name} className='rounded-lg border border-ui-border px-3 py-2'>
                    {file.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            {!mergedOutput ? (
              <Button onClick={() => void handleMerge()} loading={isProcessing}>
                Merge PDF
              </Button>
            ) : null}
            {!mergedOutput ? <p className='text-sm text-ui-muted'>{status}</p> : null}
          </div>

          {mergedOutput ? (
            <div className='rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4'>
              <p className='font-heading text-lg font-semibold text-ui-text'>Merge completato</p>
              <p className='mt-1 text-sm text-ui-muted'>
                Il file finale e pronto. Continua con il download oppure avvia un nuovo merge.
              </p>
              <div className='mt-4 flex flex-wrap gap-3'>
                <Button onClick={handleDownloadCta}>Scarica PDF</Button>
                <button
                  type='button'
                  onClick={startNewMerge}
                  className='rounded-xl border border-ui-border px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
                >
                  Nuovo merge
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <section className='grid gap-6 md:grid-cols-2'>
        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>How it works</h3>
          <ol className='mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>Drop your PDF files in the upload area.</li>
            <li>Click Merge PDF.</li>
            <li>Download the merged file generated locally.</li>
          </ol>
        </Card>

        <Card>
          <h3 className='font-heading text-2xl font-semibold text-ui-text'>Why PDFlo</h3>
          <ul className='mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ui-muted'>
            <li>No file upload to servers.</li>
            <li>Processing runs entirely in your browser.</li>
            <li>Open source and transparent by design.</li>
          </ul>
        </Card>
      </section>

      {showDownloadGate && mergedOutput ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-md rounded-2xl border border-ui-border bg-ui-surface p-6 shadow-xl'>
            <p className='font-heading text-2xl font-semibold text-ui-text'>Merge completato</p>
            <p className='mt-2 text-sm leading-relaxed text-ui-muted'>
              PDFlo funziona localmente nel tuo browser. Se ti e utile, aiutaci a farlo conoscere:
              condividilo con chi cerca strumenti PDF davvero privati.
            </p>
            <div className='mt-5 flex flex-wrap gap-3'>
              <Button onClick={handleConfirmDownload}>Continua al download</Button>
              <button
                type='button'
                onClick={() => setShowDownloadGate(false)}
                className='rounded-xl border border-ui-border px-4 py-3 text-sm font-semibold text-ui-text transition hover:bg-ui-bg'
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ToolLayout>
  );
}
