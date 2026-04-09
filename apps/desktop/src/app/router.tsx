import { createHashRouter } from 'react-router-dom';
import { CompressPdfPage } from '../pages/compress-pdf/CompressPdfPage';
import { ExtractPagesPage } from '../pages/extract-pages/ExtractPagesPage';
import { HomePage } from '../pages/home/HomePage';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';
import { OptimizePdfPage } from '../pages/optimize-pdf/OptimizePdfPage';
import { ReorderPdfPage } from '../pages/reorder-pdf/ReorderPdfPage';
import { SplitPdfPage } from '../pages/split-pdf/SplitPdfPage';
import { WorkflowBuilderPage } from '../pages/workflow-builder/WorkflowBuilderPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />,
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
    path: '/compress-pdf',
    element: <CompressPdfPage />,
  },
  {
    path: '/workflow-builder',
    element: <WorkflowBuilderPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
