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
              <code>brew install filegap/filegap/filegap</code>
            </pre>
          </div>
          <div className='space-y-2'>
            <h2 className='font-heading text-base font-semibold text-ui-text'>Quick checks</h2>
            <pre className='overflow-x-auto rounded-lg border border-ui-border bg-ui-bg p-3 text-xs text-ui-text'>
              <code>{`filegap --version
filegap --help`}</code>
            </pre>
          </div>
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
