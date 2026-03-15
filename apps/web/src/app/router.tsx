import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ExtractPagesPage } from '../pages/extract-pages/ExtractPagesPage';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';
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
    path: '*',
    element: <Navigate to='/merge-pdf' replace />,
  },
]);
