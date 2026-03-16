import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function PrivacyPage() {
  return (
    <ToolLayout
      title='Privacy Policy'
      description='How PDFlo handles your data while providing privacy-first PDF tools.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
          <p>Last updated: March 16, 2026.</p>
          <p>
            PDFlo is designed to process PDF files locally in your browser. By default, files you
            select stay on your device and are not uploaded to our servers for PDF operations.
          </p>
          <p>
            We may collect limited technical information such as aggregated analytics, error logs,
            and basic usage metrics to improve reliability and usability. This data does not
            include the contents of your PDF files.
          </p>
          <p>
            If third-party services are used in the future (for example analytics or ads), we will
            document them clearly and update this page.
          </p>
          <p>
            If you have questions about privacy, contact the project maintainers through the
            project repository.
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
