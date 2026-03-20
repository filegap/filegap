import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { chooseOutputPdf, choosePdfInputs, mergePdfs } from '../../lib/desktop';
import { fileNameFromPath, outputDefaultName } from '../../lib/pathUtils';

type StatusTone = 'neutral' | 'info' | 'error' | 'success';

type StatusState = {
  tone: StatusTone;
  message: string;
};

function readErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    if (message.trim().length > 0) {
      return message;
    }
  }
  return 'Unknown merge error.';
}

export function MergePdfPage() {
  const [inputPaths, setInputPaths] = useState<string[]>([]);
  const [outputPath, setOutputPath] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    tone: 'neutral',
    message: 'Add PDF files to start.',
  });

  const canMerge = useMemo(() => inputPaths.length >= 2 && outputPath.trim().length > 0, [inputPaths, outputPath]);

  async function handleSelectInputs() {
    const selected = await choosePdfInputs();
    if (selected.length === 0) {
      return;
    }

    setInputPaths((current) => [...current, ...selected]);
    setStatus({
      tone: selected.length > 1 || inputPaths.length + selected.length > 1 ? 'info' : 'neutral',
      message: selected.length > 1 || inputPaths.length + selected.length > 1 ? 'Ready to merge locally.' : 'Add at least 2 files to merge.',
    });
  }

  async function handleChooseOutput() {
    const chosen = await chooseOutputPdf(outputDefaultName(inputPaths));
    if (!chosen) {
      return;
    }
    setOutputPath(chosen);
    setStatus({ tone: 'info', message: 'Output destination selected.' });
  }

  function moveItem(index: number, direction: -1 | 1) {
    setInputPaths((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function removeItem(index: number) {
    setInputPaths((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setStatus({ tone: 'info', message: 'Input list updated.' });
  }

  async function handleMerge() {
    if (!canMerge || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatus({ tone: 'info', message: 'Merging locally...' });

    try {
      const result = await mergePdfs(inputPaths, outputPath);
      setStatus({
        tone: 'success',
        message: `Merged ${result.input_count} files successfully.`,
      });
    } catch (error) {
      const reason = readErrorMessage(error);
      console.error('[desktop.merge] command failed:', reason);
      setStatus({
        tone: 'error',
        message: `Merge failed: ${reason}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <ToolLayout
      title="Merge PDF files online — fast, private, and local"
      description="Combine multiple PDF files into one document directly in your browser. No uploads. No accounts. Your files never leave your device."
      trustLine="Free • No signup • Works in your browser"
    >
      <Card className="merge-workspace-card">
        <section
          className="merge-dropzone"
          onClick={() => void handleSelectInputs()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              void handleSelectInputs();
            }
          }}
        >
          <h2>Drag &amp; drop PDF files</h2>
          <p>Or select files from your device. Files stay in your browser.</p>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              void handleSelectInputs();
            }}
            variant="secondary"
          >
            Select PDF files
          </Button>
        </section>

        <div className="merge-trust-notice">
          <Lock aria-hidden="true" />
          <span>Local processing only — your files never leave your device</span>
        </div>

        <section className="merge-files-section">
          <h2>Uploaded files</h2>
          {inputPaths.length === 0 ? (
            <p className="muted-text">No files selected yet.</p>
          ) : (
            <ol className="file-list">
              {inputPaths.map((path, index) => (
                <li key={`${path}-${index}`} className="file-item">
                  <div className="file-meta">
                    <strong>{fileNameFromPath(path)}</strong>
                    <span>{path}</span>
                  </div>
                  <div className="file-actions">
                    <Button onClick={() => moveItem(index, -1)} variant="ghost" disabled={index === 0}>
                      Up
                    </Button>
                    <Button onClick={() => moveItem(index, 1)} variant="ghost" disabled={index === inputPaths.length - 1}>
                      Down
                    </Button>
                    <Button onClick={() => removeItem(index)} variant="ghost">
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="merge-output-row">
          <div className="merge-output-meta">
            <h3>Output file</h3>
            {outputPath ? <p className="output-path">{outputPath}</p> : <p className="muted-text">No output file selected.</p>}
          </div>
          <Button onClick={() => void handleChooseOutput()} variant="secondary">
            Choose output file
          </Button>
        </section>

        <section className="merge-actions-row">
          <Button onClick={() => void handleMerge()} loading={isProcessing} disabled={!canMerge}>
            Merge PDF
          </Button>
          <p className={`status status-${status.tone}`}>{status.message}</p>
        </section>
      </Card>
    </ToolLayout>
  );
}
