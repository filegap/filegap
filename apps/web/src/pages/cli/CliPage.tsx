import { useState } from 'react';

import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

type CodeSnippetProps = {
  code: string;
};

type ExampleCommandProps = {
  description: string;
  command: string;
};

function CodeSnippet({ code }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => void handleCopy()}
        className='absolute right-2 top-2 rounded-md border border-ui-border bg-ui-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ui-muted transition hover:text-ui-text'
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-surface p-4 pr-16 text-xs text-ui-text'>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ExampleCommand({ description, command }: ExampleCommandProps) {
  return (
    <div className='space-y-1.5'>
      <p className='text-xs text-ui-text'>{description}</p>
      <CodeSnippet code={command} />
    </div>
  );
}

export function CliPage() {
  return (
    <ToolLayout
      title='Filegap CLI'
      description='Private PDF tools, right from your terminal.'
      metaTitle='Filegap CLI | Private PDF tools in your terminal'
      metaDescription='Use Filegap CLI to run PDF tools locally from your terminal with no file uploads.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-5 text-sm leading-relaxed text-ui-muted'>
          <p>
            Filegap CLI lets you run merge, split, extract, and reorder operations directly from
            your terminal.
          </p>
          <p className='font-medium text-ui-text'>
            Local processing only. No uploads. No servers. Your files stay on your device.
          </p>
          <div className='space-y-2'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>
              Install with Homebrew
            </h2>
            <CodeSnippet
              code={`brew tap filegap/filegap
brew install filegap`}
            />
            <p className='text-xs'>
              Direct install also works: <code>brew install filegap/filegap/filegap</code>
            </p>
          </div>
          <div className='space-y-2'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>Quick checks</h2>
            <CodeSnippet
              code={`filegap --version
filegap --help`}
            />
          </div>
          <section className='space-y-5'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-ui-text'>
                From quick one-liners to full workflows.
              </p>
              <p className='text-xs text-ui-muted'>
                Ideal for automation, scripting, and repeatable tasks.
              </p>
            </div>
            <h2 className='font-heading text-base font-semibold text-ui-text'>Examples</h2>

            <div className='space-y-3 rounded-xl border border-ui-border/70 bg-ui-bg/60 p-4'>
              <h3 className='font-heading text-sm font-semibold text-ui-text'>Basic usage</h3>
              <p className='text-xs'>Start with simple, direct commands.</p>
              <div className='space-y-3'>
                <ExampleCommand
                  description='Combine two PDF files into one'
                  command='filegap merge a.pdf b.pdf -o merged.pdf'
                />
                <ExampleCommand
                  description='Split a PDF into a specific page range'
                  command='filegap split document.pdf --pages 1-5'
                />
                <ExampleCommand
                  description='Extract specific pages from a PDF'
                  command='filegap extract report.pdf --pages 2,4,6 -o extracted.pdf'
                />
                <ExampleCommand
                  description='Reorder pages in a PDF file'
                  command='filegap reorder input.pdf --order 3,1,2 -o reordered.pdf'
                />
              </div>
            </div>

            <div className='space-y-3 rounded-xl border border-ui-border/70 bg-ui-bg/60 p-4'>
              <h3 className='font-heading text-sm font-semibold text-ui-text'>
                Pipe-first workflows
              </h3>
              <p className='text-xs'>Use Filegap in Unix-style pipelines.</p>
              <div className='space-y-3'>
                <ExampleCommand
                  description='Extract pages using standard input and output'
                  command='cat input.pdf | filegap extract --pages 1-3 > output.pdf'
                />
                <ExampleCommand
                  description='Merge and reorder PDFs in a single pipeline'
                  command='filegap merge a.pdf b.pdf | filegap reorder --order 2,1 > final.pdf'
                />
                <ExampleCommand
                  description='Merge multiple PDF files at once'
                  command='filegap merge *.pdf -o combined.pdf'
                />
                <ExampleCommand
                  description='Merge multiple PDFs in a defined order'
                  command='ls *.pdf | sort | xargs filegap merge -o combined.pdf'
                />
              </div>
            </div>

            <div className='space-y-3 rounded-xl border border-ui-border/70 bg-ui-bg/60 p-4'>
              <h3 className='font-heading text-sm font-semibold text-ui-text'>Chaining commands</h3>
              <p className='text-xs'>Automate multi-step workflows.</p>
              <div className='space-y-3'>
                <ExampleCommand
                  description='Merge two PDFs and then extract selected pages'
                  command={`filegap merge a.pdf b.pdf -o temp.pdf && \\
filegap extract temp.pdf --pages 1-3 -o final.pdf`}
                />
                <ExampleCommand
                  description='Split a PDF and reverse the page order'
                  command={`filegap split big.pdf --pages 1-10 -o part.pdf && \\
filegap reorder part.pdf --order 10,9,8,7,6,5,4,3,2,1 -o reversed.pdf`}
                />
              </div>
            </div>
          </section>
          <p>
            <a
              href='https://github.com/filegap/filegap'
              target='_blank'
              rel='noreferrer'
              className='underline hover:text-ui-text'
            >
              View source code and releases on GitHub →
            </a>
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
