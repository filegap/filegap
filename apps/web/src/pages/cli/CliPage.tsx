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
        <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
          <p>
            Filegap CLI lets you run merge, split, extract, and reorder operations directly from
            your terminal.
          </p>
          <p>
            Processing is local and private: files stay on your device, with no uploads or server
            processing.
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
