import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function TermsPage() {
  return (
    <ToolLayout
      title='Terms of Use'
      description="Simple terms for using Filegap's private PDF tools that run locally in your browser."
      metaTitle='Terms of Use | Filegap'
      metaDescription='Simple terms for using Filegap private PDF tools with local browser processing and no file uploads.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-5 text-sm leading-relaxed text-ui-muted'>
          <p>Last updated: March 16, 2026.</p>
          <p>
            Filegap provides privacy-first PDF tools that run locally in your browser. Your files
            are processed on your device and are not uploaded to any server.
          </p>
          <p>
            Filegap is provided as open-source software on an "as is" and "as available" basis,
            without warranties of any kind, including accuracy, reliability, availability,
            compatibility, or fitness for a particular purpose.
          </p>
          <p>
            You are responsible for how you use Filegap and for verifying the accuracy, integrity,
            and suitability of any generated output before relying on it.
          </p>
          <p>
            All file processing happens locally in your browser. Filegap does not transmit, store,
            or retain your files on any server. However, you remain responsible for the security of
            your device, browser, and environment.
          </p>
          <p>
            You must use Filegap in compliance with applicable laws and third-party rights,
            including copyright, confidentiality, and data protection obligations.
          </p>
          <p>
            The maintainers are not liable for any direct, indirect, incidental, or consequential
            loss or damage arising from the use, misuse, or inability to use the software,
            including data loss, file corruption, or business interruption.
          </p>
          <p>
            Filegap is intended as a convenient document utility, not as a substitute for
            professional document handling, legal review, or archival systems.
          </p>
          <p>
            Filegap is open-source software, and its use, modification, and distribution may also
            be subject to the terms of the applicable open-source license published in the project
            repository.
          </p>
          <p>
            These terms may be updated from time to time. Continued use of Filegap after changes
            take effect means you accept the revised terms.
          </p>
          <p className='text-xs font-medium'>
            Local processing only. Your files stay on your device.
          </p>
        </div>
      </Card>
    </ToolLayout>
  );
}
