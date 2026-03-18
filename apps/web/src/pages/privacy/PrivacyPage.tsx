import { Card } from '../../components/ui/Card';
import { ToolLayout } from '../../components/layout/ToolLayout';

export function PrivacyPage() {
  return (
    <ToolLayout
      title='Privacy & Security'
      description='Your files never leave your device. Period.'
      metaTitle='Privacy & Security | Filegap'
      metaDescription='Your files never leave your device. Filegap processes PDFs locally with no uploads and no server-side file inspection.'
      heroVariant='brand'
    >
      <Card>
        <div className='space-y-6 text-sm leading-relaxed text-ui-muted'>
          <p>Last updated: March 16, 2026.</p>

          <section className='space-y-2'>
            <p className='text-ui-text'>
              Filegap works differently from most online PDF tools. No uploads. No servers. No
              surprises.
            </p>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>Instant proof</h2>
            <ul className='list-disc space-y-1 pl-5'>
              <li>Runs entirely in your browser</li>
              <li>No file uploads to any server</li>
              <li>Works even without internet</li>
              <li>No tracking of your documents</li>
            </ul>
            <p>Try it yourself: disconnect your internet and use the tool. It still works.</p>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>How processing works</h2>
            <ul className='list-disc space-y-1 pl-5'>
              <li>PDF processing happens locally on your device.</li>
              <li>Your files are never uploaded.</li>
              <li>Your files are never stored by Filegap.</li>
              <li>Your files are never inspected by Filegap.</li>
            </ul>
            <p>Think of it as an air-gapped environment for your files - without the complexity.</p>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>Analytics</h2>
            <p>We collect only aggregated usage data, for example which tools are used most.</p>
            <p>We do not collect:</p>
            <ul className='list-disc space-y-1 pl-5'>
              <li>File content</li>
              <li>File names</li>
              <li>Document metadata</li>
              <li>Personal identifiers</li>
            </ul>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>Ads</h2>
            <p>
              Filegap does not profile users for ads. If ads are enabled, they are privacy-first:
              no tracking, no cross-site profiling, and only ethical ad placements.
            </p>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>Open source transparency</h2>
            <p>
              Filegap is open source. You can verify how it works in the codebase and validate our
              privacy claims directly.
            </p>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>Technical details</h2>
            <ul className='list-disc space-y-1 pl-5'>
              <li>Processing runs locally in your browser runtime.</li>
              <li>No network requests are required during PDF processing.</li>
              <li>You can verify network activity in your browser DevTools.</li>
            </ul>
          </section>

          <section className='space-y-2'>
            <h2 className='font-heading text-lg font-semibold text-ui-text'>In short</h2>
            <ul className='list-disc space-y-1 pl-5'>
              <li>Your files stay on your device</li>
              <li>Nothing is uploaded</li>
              <li>Nothing is stored</li>
              <li>Only high-level tool usage is tracked, never your files</li>
            </ul>
          </section>
        </div>
      </Card>
    </ToolLayout>
  );
}
