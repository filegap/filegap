import type { RelatedTool, ToolLandingSectionsProps } from '../../components/seo/ToolLandingSections';
import type { CompressPreset } from '../../adapters/pdfEngine';

export type ToolPageSeoConfig = {
  routePath: string;
  title: string;
  description: string;
  trustLine?: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  robots?: string;
  breadcrumbLabel?: string;
  landingContent: ToolLandingSectionsProps;
  relatedTools: RelatedTool[];
};

export type CompressPageSeoConfig = ToolPageSeoConfig & {
  initialPreset?: CompressPreset;
};

export type SplitPageSeoConfig = ToolPageSeoConfig & {
  initialMode?: 'manual' | 'individual-pages';
};
