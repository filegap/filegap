import { createHashRouter } from 'react-router-dom';
import { HomePage } from '../pages/home/HomePage';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';

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
    path: '*',
    element: <NotFoundPage />,
  },
]);
