import { Navigate, createBrowserRouter } from 'react-router-dom';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';

export const router = createBrowserRouter([
  {
    path: '/merge-pdf',
    element: <MergePdfPage />,
  },
  {
    path: '*',
    element: <Navigate to='/merge-pdf' replace />,
  },
]);
