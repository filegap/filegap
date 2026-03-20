import { Link } from 'react-router-dom';
import { ToolLayout } from '../../components/layout/ToolLayout';
import { Card } from '../../components/ui/Card';

export function NotFoundPage() {
  return (
    <ToolLayout title="Page not found" description="The requested desktop route does not exist.">
      <Card>
        <p>Return to the desktop home to continue.</p>
        <p>
          <Link to="/" className="text-link">
            Go to home
          </Link>
        </p>
      </Card>
    </ToolLayout>
  );
}
