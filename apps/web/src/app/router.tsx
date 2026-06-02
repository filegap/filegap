import { Navigate, createBrowserRouter } from 'react-router-dom';
import { CliPage } from '../pages/cli/CliPage';
import { CompressPdfPage } from '../pages/compress-pdf/CompressPdfPage';
import { DownloadPage } from '../pages/download/DownloadPage';
import { ExtractImagesPage } from '../pages/extract-images/ExtractImagesPage';
import { ExtractPagesPage } from '../pages/extract-pages/ExtractPagesPage';
import { HomePage } from '../pages/home/HomePage';
import { MergePdfPage } from '../pages/merge-pdf/MergePdfPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';
import { OfflinePdfToolsPage } from '../pages/offline-pdf-tools/OfflinePdfToolsPage';
import { OptimizePdfPage } from '../pages/optimize-pdf/OptimizePdfPage';
import { PdfToImagesPage } from '../pages/pdf-to-images/PdfToImagesPage';
import { PrivacyPage } from '../pages/privacy/PrivacyPage';
import { ReorderPdfPage } from '../pages/reorder-pdf/ReorderPdfPage';
import { SplitPdfPage } from '../pages/split-pdf/SplitPdfPage';
import { TermsPage } from '../pages/terms/TermsPage';
import { WorkflowBuilderPage } from '../pages/workflow-builder/WorkflowBuilderPage';
import {
  compressSeoLandingConfigs,
  extractPagesCanonicalConfig,
  extractSeoLandingConfigs,
  imageSeoLandingConfigs,
  mergeSeoLandingConfigs,
  reorderPagesCanonicalConfig,
  reorderSeoLandingConfigs,
  splitSeoLandingConfigs,
} from '../lib/seo/seoLandingPages';

const splitSeoRoutes = splitSeoLandingConfigs.map((config) => ({
  path: config.routePath,
  element: <SplitPdfPage seoConfig={config} />,
}));

const mergeSeoRoutes = mergeSeoLandingConfigs.map((config) => ({
  path: config.routePath,
  element: <MergePdfPage seoConfig={config} />,
}));

const extractSeoRoutes = extractSeoLandingConfigs.map((config) => ({
  path: config.routePath,
  element: <ExtractPagesPage seoConfig={config} />,
}));

const reorderSeoRoutes = reorderSeoLandingConfigs.map((config) => ({
  path: config.routePath,
  element: <ReorderPdfPage seoConfig={config} />,
}));

const compressSeoRoutes = compressSeoLandingConfigs.map((config) => ({
  path: config.routePath,
  element: <CompressPdfPage seoConfig={config} />,
}));

const imageSeoRoutes = imageSeoLandingConfigs.map((config) => ({
  path: config.routePath,
  element: <PdfToImagesPage seoConfig={config} />,
}));

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
  ...compressSeoRoutes,
  {
    path: '/merge-pdf',
    element: <MergePdfPage />,
  },
  ...mergeSeoRoutes,
  {
    path: '/split-pdf',
    element: <SplitPdfPage />,
  },
  ...splitSeoRoutes,
  {
    path: '/extract-pages-from-pdf',
    element: <ExtractPagesPage seoConfig={extractPagesCanonicalConfig} />,
  },
  ...extractSeoRoutes,
  {
    path: '/extract-pages',
    element: <ExtractPagesPage />,
  },
  {
    path: '/reorder-pdf',
    element: <ReorderPdfPage />,
  },
  {
    path: '/reorder-pdf-pages',
    element: <ReorderPdfPage seoConfig={reorderPagesCanonicalConfig} />,
  },
  ...reorderSeoRoutes,
  {
    path: '/optimize-pdf',
    element: <OptimizePdfPage />,
  },
  {
    path: '/pdf-to-images',
    element: <PdfToImagesPage />,
  },
  ...imageSeoRoutes,
  {
    path: '/extract-images',
    element: <ExtractImagesPage />,
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
    path: '/term',
    element: <Navigate to="/terms" replace />,
  },
  {
    path: '/workflow-builder',
    element: <WorkflowBuilderPage />,
  },
  {
    path: '/offline-pdf-tools',
    element: <OfflinePdfToolsPage />,
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
