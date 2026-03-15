import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ExtractPagesPage } from '../pages/extract-pages/ExtractPagesPage';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';
import { ReorderPdfPage } from '../pages/reorder-pdf/ReorderPdfPage';
import { SplitPdfPage } from '../pages/split-pdf/SplitPdfPage';

export const router = createBrowserRouter([
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
    path: '*',
    element: <Navigate to='/merge-pdf' replace />,
  },
]);
