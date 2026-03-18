import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function DownloadPage() {
  return (
    <ToolLayout
      title='Download Filegap Desktop App'
      description='Use Filegap locally on your desktop, even offline.'
      metaTitle='Download Filegap Desktop App | Private PDF tools'
      metaDescription='Download the Filegap desktop app to process PDF files locally without browser uploads.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
          <p>
            Filegap Desktop App gives you the same private PDF workflow without relying on a
            browser tab.
          </p>
          <p>
            Process your documents fully offline on your machine, with no uploads and no account
            required.
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
