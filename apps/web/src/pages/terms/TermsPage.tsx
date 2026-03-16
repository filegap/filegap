import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function TermsPage() {
  return (
    <ToolLayout
      title='Terms of Use'
      description='Basic terms for using PDFlo privacy-first PDF tools.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-4 text-sm leading-relaxed text-ui-muted'>
          <p>Last updated: March 16, 2026.</p>
          <p>
            PDFlo is provided as open-source software on an “as is” basis, without warranties of
            any kind. You are responsible for how you use the tools and for validating generated
            output before relying on it.
          </p>
          <p>
            You must use PDFlo in compliance with applicable laws and rights, including copyright,
            data protection, and confidentiality obligations.
          </p>
          <p>
            The maintainers are not liable for losses or damages resulting from use, misuse, or
            inability to use the software.
          </p>
          <p>
            These terms may be updated over time. Continued use after updates means you accept the
            revised terms.
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
