import { useMemo, useState } from 'react';
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
    message: 'Select at least two PDF files to begin.',
  });

  const canMerge = useMemo(() => inputPaths.length >= 2 && outputPath.trim().length > 0, [inputPaths, outputPath]);

  async function handleSelectInputs() {
    const selected = await choosePdfInputs();
    if (selected.length === 0) {
      return;
    }

    setInputPaths((current) => [...current, ...selected]);
    setStatus({ tone: 'info', message: 'Input files loaded locally.' });
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
    setStatus({ tone: 'info', message: 'Merging files locally. Please wait.' });

    try {
      const result = await mergePdfs(inputPaths, outputPath);
      setStatus({
        tone: 'success',
        message: `Merged ${result.input_count} files successfully.`,
      });
    } catch (error) {
      const reason = readErrorMessage(error);
      // Safe debug signal: no file names, paths, or payloads.
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
      title="Merge PDF"
      description="Select local PDF files, reorder them, and create one merged document using the Rust core engine."
      trustLine="Processing is local-only and never sent to external services."
    >
      <Card>
        <div className="stack-row">
          <Button onClick={handleSelectInputs} variant="secondary">
            Add PDF Files
          </Button>
          <Button onClick={handleChooseOutput} variant="secondary">
            Choose Output File
          </Button>
          <Button onClick={handleMerge} loading={isProcessing} disabled={!canMerge}>
            Merge PDF
          </Button>
        </div>

        <div className="status-wrap">
          <p className={`status status-${status.tone}`}>{status.message}</p>
        </div>
      </Card>

      <Card>
        <h2>Input Order</h2>
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
                  <Button
                    onClick={() => moveItem(index, 1)}
                    variant="ghost"
                    disabled={index === inputPaths.length - 1}
                  >
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
      </Card>

      <Card>
        <h2>Output</h2>
        {outputPath ? <p className="output-path">{outputPath}</p> : <p className="muted-text">No output file selected.</p>}
      </Card>
    </ToolLayout>
  );
}
