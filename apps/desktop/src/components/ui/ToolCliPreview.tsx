import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SidebarSection } from './SidebarSection';

type ToolCliPreviewProps = {
  helperText: string;
  command: string;
};

export function ToolCliPreview({ helperText, command }: ToolCliPreviewProps) {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }
    const timer = window.setTimeout(() => setHasCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [hasCopied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setHasCopied(true);
    } catch {
      setHasCopied(false);
    }
  }

  return (
    <SidebarSection title="CLI preview" className="output-panel-section">
      <div className="tool-cli-preview-head">
        <p className="tool-cli-preview-helper">{helperText}</p>
        <button
          type="button"
          className="icon-button"
          onClick={() => void handleCopy()}
          aria-label="Copy CLI command"
          title="Copy CLI command"
        >
          {hasCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
      </div>
      <pre className="tool-cli-preview-code">
        <code>{command}</code>
      </pre>
    </SidebarSection>
  );
}
