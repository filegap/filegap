import { Navigate, createBrowserRouter } from 'react-router-dom';
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
    path: '*',
    element: <Navigate to='/merge-pdf' replace />,
  },
]);
