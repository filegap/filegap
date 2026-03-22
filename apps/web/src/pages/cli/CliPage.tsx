import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function CliPage() {
  return (
    <ToolLayout
      title='Filegap CLI'
      description='Run private PDF tools from your terminal.'
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
          <p>
            Processing is local and private: files stay on your device, with no uploads or server
            processing.
          </p>
          <div className='space-y-2'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>
              Install with Homebrew
            </h2>
            <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
              <code>{`brew tap filegap/filegap
brew install filegap`}</code>
            </pre>
            <p className='text-xs'>
              Direct install also works: <code>brew install filegap/filegap/filegap</code>
            </p>
          </div>
          <div className='space-y-2'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>Quick checks</h2>
            <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
              <code>{`filegap --version
filegap --help`}</code>
            </pre>
          </div>
          <section className='space-y-4'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>Examples</h2>

            <div className='space-y-2'>
              <h3 className='font-heading text-sm font-semibold text-ui-text'>Basic usage</h3>
              <p className='text-xs'>Simple commands to get started quickly.</p>
              <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
                <code>{`filegap merge a.pdf b.pdf -o merged.pdf
filegap split document.pdf --pages 1-5
filegap extract report.pdf --pages 2,4,6 -o extracted.pdf
filegap reorder input.pdf --order 3,1,2 -o reordered.pdf`}</code>
              </pre>
            </div>

            <div className='space-y-2'>
              <h3 className='font-heading text-sm font-semibold text-ui-text'>
                Pipe-first workflows
              </h3>
              <p className='text-xs'>Use Filegap in pipelines to integrate with other CLI tools.</p>
              <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
                <code>{`cat input.pdf | filegap extract --pages 1-3 > output.pdf

filegap merge a.pdf b.pdf | filegap reorder --order 2,1 > final.pdf

ls *.pdf | xargs filegap merge -o combined.pdf`}</code>
              </pre>
            </div>

            <div className='space-y-2'>
              <h3 className='font-heading text-sm font-semibold text-ui-text'>Chaining commands</h3>
              <p className='text-xs'>Combine multiple operations in a single workflow.</p>
              <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
                <code>{`filegap merge a.pdf b.pdf -o temp.pdf && \\
filegap extract temp.pdf --pages 1-3 -o final.pdf

filegap split big.pdf --pages 1-10 -o part.pdf && \\
filegap reorder part.pdf --order 10,9,8,7,6,5,4,3,2,1 -o reversed.pdf`}</code>
              </pre>
            </div>
          </section>
          <p>
            Source code and releases:{' '}
            <a
              href='https://github.com/filegap/filegap'
              target='_blank'
              rel='noreferrer'
              className='underline hover:text-ui-text'
            >
              github.com/filegap/filegap
            </a>
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
