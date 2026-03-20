import { Link } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/ui/Card';

export function NotFoundPage() {
  return (
    <AppShell>
      <PageContainer>
        <Card>
          <p>Return to the desktop home to continue.</p>
          <p>
            <Link to="/" className="text-link">
              Go to home
            </Link>
          </p>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
