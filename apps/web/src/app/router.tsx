import { createBrowserRouter } from 'react-router-dom';
import { CliPage } from '../pages/cli/CliPage';
import { CompressPdfPage } from '../pages/compress-pdf/CompressPdfPage';
import { DownloadPage } from '../pages/download/DownloadPage';
import { ExtractPagesPage } from '../pages/extract-pages/ExtractPagesPage';
import { HomePage } from '../pages/home/HomePage';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';
import { OptimizePdfPage } from '../pages/optimize-pdf/OptimizePdfPage';
import { PrivacyPage } from '../pages/privacy/PrivacyPage';
import { ReorderPdfPage } from '../pages/reorder-pdf/ReorderPdfPage';
import { SplitPdfPage } from '../pages/split-pdf/SplitPdfPage';
import { TermsPage } from '../pages/terms/TermsPage';
import { WorkflowBuilderPage } from '../pages/workflow-builder/WorkflowBuilderPage';

export const router = createBrowserRouter([
  {
    path: '/cli',
    element: <CliPage />,
  },
  {
    path: '/download',
    element: <DownloadPage />,
  },
  {
    path: '/compress-pdf',
    element: <CompressPdfPage />,
  },
  {
    path: '/merge-pdf',
    element: <MergePdfPage />,
  },
  {
    path: '/split-pdf',
    element: <SplitPdfPage />,
  },
  {
    path: '/extract-pages',
    element: <ExtractPagesPage />,
  },
  {
    path: '/reorder-pdf',
    element: <ReorderPdfPage />,
  },
  {
    path: '/optimize-pdf',
    element: <OptimizePdfPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/workflow-builder',
    element: <WorkflowBuilderPage />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
