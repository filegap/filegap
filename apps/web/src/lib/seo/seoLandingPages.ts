import type {
  CompressPageSeoConfig,
  SplitPageSeoConfig,
  ToolPageSeoConfig,
} from './toolPageConfig';

export const SITE_URL = 'https://www.filegap.app';
export const NOINDEX_FOLLOW = 'noindex,follow';

export function canonicalUrl(path: string): string {
  return new URL(path, SITE_URL).toString().replace(/\/$/, path === '/' ? '/' : '');
}

const splitRelated = [
  {
    href: '/split-pdf-into-individual-pages',
    label: 'Split into Individual Pages',
    description: 'Create one file per page when a PDF needs to be separated completely.',
  },
  {
    href: '/split-pdf-without-uploading',
    label: 'Split without Uploading',
    description: 'Use the same local splitter with privacy-first no-upload positioning.',
  },
  {
    href: '/extract-specific-pages-from-pdf',
    label: 'Extract PDF Pages',
    description: 'Keep selected pages and export a new private PDF.',
  },
  {
    href: '/merge-pdf',
    label: 'Merge PDF',
    description: 'Combine multiple PDFs locally without uploading files.',
  },
  {
    href: '/compress-pdf',
    label: 'Compress PDF',
    description: 'Reduce PDF overhead in your browser with local presets.',
  },
];

const mergeRelated = [
  {
    href: '/combine-pdf-files',
    label: 'Combine PDF Files',
    description: 'Put several PDFs into one document with no server upload.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDF',
    description: 'Separate one PDF into smaller files using page ranges.',
  },
  {
    href: '/reorder-pdf-pages',
    label: 'Reorder PDF Pages',
    description: 'Arrange pages into the order you need before export.',
  },
];

const extractRelated = [
  {
    href: '/extract-pages-from-pdf',
    label: 'Extract Pages from PDF',
    description: 'Use the broad extract page that points to the focused extraction workflow.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDF',
    description: 'Create multiple PDFs from one source document.',
  },
  {
    href: '/save-single-pages-from-pdf',
    label: 'Save Single Pages',
    description: 'Export individual pages from a longer PDF.',
  },
  {
    href: '/reorder-pdf-pages',
    label: 'Reorder PDF Pages',
    description: 'Move pages into the right sequence in your browser.',
  },
];

const reorderRelated = [
  {
    href: '/organize-pdf-pages',
    label: 'Organize PDF Pages',
    description: 'Clean up page order before sharing or archiving a PDF.',
  },
  {
    href: '/extract-pages-from-pdf',
    label: 'Extract PDF Pages',
    description: 'Keep only the pages you need in a new PDF.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDF',
    description: 'Break a PDF into parts using local page ranges.',
  },
];

const compressRelated = [
  {
    href: '/compress-pdf-for-email',
    label: 'Compress PDF for Email',
    description: 'Use local compression settings suited to email attachments.',
  },
  {
    href: '/optimize-pdf',
    label: 'Optimize PDF',
    description: 'Rewrite PDF structure locally without intentional quality loss.',
  },
  {
    href: '/split-pdf',
    label: 'Split PDF',
    description: 'Split large PDFs into smaller, easier-to-share files.',
  },
];

export const baseRelatedTools = {
  split: splitRelated,
  merge: mergeRelated,
  extract: extractRelated,
  reorder: reorderRelated,
  compress: compressRelated,
  optimize: [
    {
      href: '/compress-pdf',
      label: 'Compress PDF',
      description: 'Apply local compression presets after structural optimization.',
    },
    {
      href: '/reorder-pdf-pages',
      label: 'Reorder PDF Pages',
      description: 'Fix page order before optimizing a document.',
    },
    {
      href: '/extract-pages-from-pdf',
      label: 'Extract PDF Pages',
      description: 'Export selected pages from a PDF locally.',
    },
  ],
  images: [
    {
      href: '/extract-images',
      label: 'Extract Images',
      description: 'Extract supported embedded image assets from PDFs.',
    },
    {
      href: '/split-pdf',
      label: 'Split PDF',
      description: 'Split a PDF before converting pages to images.',
    },
    {
      href: '/compress-pdf',
      label: 'Compress PDF',
      description: 'Reduce PDF size with local compression presets.',
    },
  ],
} as const;

export const extractPagesCanonicalConfig: ToolPageSeoConfig = {
  routePath: '/extract-pages-from-pdf',
  title: 'Pull selected pages from a PDF',
  description: 'Extract specific pages from a PDF directly in your browser. No uploads, no account required.',
  robots: NOINDEX_FOLLOW,
  trustLine: 'Free - No signup - Works in your browser',
  metaTitle: 'Extract Pages from PDF Online - No Upload | Filegap',
  metaDescription:
    'Select the PDF pages you need and export a smaller file on your device. Private by design, with no server-side document handling.',
  canonicalPath: canonicalUrl('/extract-specific-pages-from-pdf'),
  breadcrumbLabel: 'Extract pages from PDF',
  relatedTools: extractRelated,
  landingContent: {
    howItWorksTitle: 'How to extract pages from a PDF',
    howItWorksSteps: [
      'Upload one PDF file from your device.',
      'Select the page ranges you want to keep.',
      'Extract locally and download a new PDF with only those pages.',
    ],
    whyTitle: 'Why use this extract pages tool',
    whyItems: [
      {
        title: 'No uploads',
        text: 'The PDF is processed in your browser and never sent to a server.',
      },
      {
        title: 'Precise page selection',
        text: 'Keep single pages, ranges, or mixed selections in one output file.',
      },
      {
        title: 'Private workflow',
        text: 'File content and selected page ranges stay on your device.',
      },
    ],
    faqTitle: 'Frequently asked questions',
    faqItems: [
      {
        question: 'Can I extract pages from a PDF without uploading it?',
        answer: 'Yes. Filegap extracts pages locally in your browser, so your PDF is not uploaded.',
      },
      {
        question: 'Can I select specific page ranges?',
        answer: 'Yes. You can enter ranges like 1-3,5,8-10 and export one new PDF.',
      },
      {
        question: 'Is this PDF page extractor free?',
        answer: 'Yes. You can extract pages for free with no signup required.',
      },
    ],
    seoTitle: 'Extract only the PDF pages you need',
    seoParagraphs: [
      'Use Filegap when you need a focused PDF that contains only selected pages from a larger file.',
      'The browser reads and rewrites the PDF locally, which avoids upload waiting time and keeps private documents on your device.',
    ],
    finalCtaTitle: 'Ready to extract PDF pages?',
    finalCtaText: 'Select your PDF and keep only the pages you need.',
    finalCtaLabel: 'Extract PDF pages',
    finalCtaHref: '#extract-pdf-tool',
  },
};

export const reorderPagesCanonicalConfig: ToolPageSeoConfig = {
  routePath: '/reorder-pdf-pages',
  title: 'Reorder PDF pages in a private workspace',
  description: 'Rearrange PDF pages directly in your browser with local processing and no uploads.',
  trustLine: 'Free - No signup - Works in your browser',
  metaTitle: 'Reorder PDF Pages Online - No Upload | Filegap',
  metaDescription:
    'Move PDF pages into the right order, preview changes, and export a clean file while documents stay on your device.',
  canonicalPath: canonicalUrl('/reorder-pdf-pages'),
  breadcrumbLabel: 'Reorder PDF pages',
  relatedTools: reorderRelated,
  landingContent: {
    howItWorksTitle: 'How to reorder PDF pages',
    howItWorksSteps: [
      'Upload one PDF file from your device.',
      'Arrange every page in the order you need.',
      'Export a reordered PDF locally from your browser.',
    ],
    whyTitle: 'Why use this reorder PDF tool',
    whyItems: [
      {
        title: 'Local page ordering',
        text: 'Page order changes happen in browser memory, not on a remote service.',
      },
      {
        title: 'Visual control',
        text: 'Use page previews and order input to fix sequence problems quickly.',
      },
      {
        title: 'No signup',
        text: 'Open the tool, reorder pages, and download the result.',
      },
    ],
    faqTitle: 'Frequently asked questions',
    faqItems: [
      {
        question: 'Can I reorder PDF pages without uploading the file?',
        answer: 'Yes. Filegap processes page order locally in your browser.',
      },
      {
        question: 'Do I need to include every page?',
        answer: 'Yes. Reorder keeps the full document, so every page must appear exactly once.',
      },
      {
        question: 'Can I organize PDF pages for free?',
        answer: 'Yes. Reordering PDF pages is free and does not require an account.',
      },
    ],
    seoTitle: 'Organize PDF page order privately',
    seoParagraphs: [
      'Use Filegap to fix page sequence issues before sending, printing, or archiving a PDF.',
      'Because the workflow is local, filenames, page order, and document contents are not uploaded for processing.',
    ],
    finalCtaTitle: 'Ready to reorder your PDF?',
    finalCtaText: 'Move pages into the right order without uploading your file.',
    finalCtaLabel: 'Reorder PDF pages',
    finalCtaHref: '#reorder-pdf-tool',
  },
};

export const splitSeoLandingConfigs: SplitPageSeoConfig[] = [
  {
    routePath: '/split-pdf-into-individual-pages',
    title: 'Split every PDF page into its own file',
    description: 'Create one PDF per page directly in your browser. Files stay on your device.',
    robots: NOINDEX_FOLLOW,
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Split PDF into Individual Pages - No Upload | Filegap',
    metaDescription:
      'Create one PDF file per page for sorting, review, or sharing. Filegap runs the split on your device and keeps files private.',
    canonicalPath: canonicalUrl('/split-pdf-by-page-ranges'),
    breadcrumbLabel: 'Split PDF into individual pages',
    initialMode: 'individual-pages',
    relatedTools: splitRelated,
    landingContent: {
      howItWorksTitle: 'How to split a PDF into individual pages',
      howItWorksSteps: [
        'Upload one PDF file from your device.',
        'Filegap prepares one range for each page after reading the page count.',
        'Split locally and download the individual page files.',
      ],
      whyTitle: 'Why split into single pages with Filegap',
      whyItems: [
        {
          title: 'One file per page',
          text: 'Each page can be exported as its own PDF for sharing or sorting.',
        },
        {
          title: 'No upload step',
          text: 'Your source PDF stays in your browser while the split runs.',
        },
        {
          title: 'Quick review',
          text: 'Page previews help you confirm the document before export.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can Filegap split every PDF page into a separate file?',
          answer: 'Yes. This page prepares individual page ranges after your PDF is loaded.',
        },
        {
          question: 'Are individual pages uploaded?',
          answer: 'No. The input PDF and output pages are generated locally in your browser.',
        },
        {
          question: 'Can I change the ranges after upload?',
          answer: 'Yes. You can edit the generated ranges before splitting.',
        },
      ],
      seoTitle: 'Create separate PDF files from each page',
      seoParagraphs: [
        'This page is built for the common task of separating a PDF into single-page files.',
        'Filegap reads the PDF locally, generates the page ranges, and lets you download the output files without a server upload.',
      ],
      finalCtaTitle: 'Ready to split every page?',
      finalCtaText: 'Upload a PDF and create individual page files locally.',
      finalCtaLabel: 'Split into individual pages',
      finalCtaHref: '#split-pdf-tool',
    },
  },
  {
    routePath: '/split-pdf-by-page-ranges',
    title: 'Split PDF by custom page ranges',
    description: 'Enter exact page ranges and export separate PDFs locally in your browser.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Split PDF by Page Ranges - No Upload | Filegap',
    metaDescription:
      'Split PDF files by custom page ranges like 1-3 or 8-12. Fast local processing directly in your browser, no uploads required.',
    canonicalPath: canonicalUrl('/split-pdf-by-page-ranges'),
    breadcrumbLabel: 'Split PDF by page ranges',
    initialMode: 'manual',
    relatedTools: splitRelated,
    landingContent: {
      howItWorksTitle: 'How to split PDF by ranges',
      howItWorksSteps: [
        'Upload one PDF file from your device.',
        'Enter ranges such as 1-3,4-7,8-10.',
        'Split locally and download the generated PDF parts.',
      ],
      whyTitle: 'Why use range-based splitting',
      whyItems: [
        {
          title: 'Exact control',
          text: 'Choose the sections you want instead of splitting blindly.',
        },
        {
          title: 'Local processing',
          text: 'The page range selection is applied in your browser.',
        },
        {
          title: 'Useful for long PDFs',
          text: 'Separate chapters, forms, or appendices into cleaner files.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'What page range format can I use?',
          answer: 'Use comma-separated ranges like 1-3,4,5-10.',
        },
        {
          question: 'Can I split a PDF by ranges without uploading it?',
          answer: 'Yes. Filegap applies ranges locally in the browser.',
        },
        {
          question: 'Can a range contain one page?',
          answer: 'Yes. Single pages and multi-page ranges can be mixed.',
        },
        {
          question: 'Will splitting change the original PDF?',
          answer: 'No. Filegap reads the source file and creates new PDF outputs without modifying the original.',
        },
      ],
      seoTitle: 'Split PDFs into custom page ranges',
      seoParagraphs: [
        'Range-based splitting is useful when each output file should contain a specific section of the source PDF.',
        'Filegap keeps that workflow private by applying your ranges locally on the device.',
      ],
      finalCtaTitle: 'Ready to split by ranges?',
      finalCtaText: 'Choose exact page ranges and create separate PDFs.',
      finalCtaLabel: 'Split by page ranges',
      finalCtaHref: '#split-pdf-tool',
    },
  },
  {
    routePath: '/split-pdf-without-uploading',
    title: 'Split a PDF without sending it to a server',
    description: 'Split PDFs locally in your browser so your files never leave your device.',
    robots: NOINDEX_FOLLOW,
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Split PDF Without Uploading - Local Browser Tool | Filegap',
    metaDescription:
      'Separate PDF pages without handing the file to an upload service. Filegap keeps the workflow local and private.',
    canonicalPath: canonicalUrl('/split-pdf-by-page-ranges'),
    breadcrumbLabel: 'Split PDF without uploading',
    relatedTools: splitRelated,
    landingContent: {
      howItWorksTitle: 'How to split a PDF without uploading',
      howItWorksSteps: [
        'Open the tool in your browser.',
        'Choose a PDF from your device and enter page ranges.',
        'Download the split PDFs generated locally.',
      ],
      whyTitle: 'Why local splitting matters',
      whyItems: [
        {
          title: 'No server copy',
          text: 'Filegap does not upload your PDF for processing.',
        },
        {
          title: 'Private ranges',
          text: 'Your page selections stay in browser state.',
        },
        {
          title: 'Fast workflow',
          text: 'There is no upload queue before splitting begins.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Does Filegap upload PDFs to split them?',
          answer: 'No. Splitting runs locally in your browser.',
        },
        {
          question: 'Is a server involved in PDF processing?',
          answer: 'No. The web flow has no PDF upload endpoint.',
        },
        {
          question: 'Do I need an account?',
          answer: 'No. You can split PDFs without signup.',
        },
      ],
      seoTitle: 'Private PDF splitting in the browser',
      seoParagraphs: [
        'Many online split tools require uploading a document first. Filegap avoids that pattern for PDF processing.',
        'Your browser reads the file, applies the selected ranges, and creates the downloads locally.',
      ],
      finalCtaTitle: 'Ready to split locally?',
      finalCtaText: 'Split your PDF without uploading it to a server.',
      finalCtaLabel: 'Split without uploading',
      finalCtaHref: '#split-pdf-tool',
    },
  },
  {
    routePath: '/split-large-pdf',
    title: 'Break large PDFs into smaller files',
    description: 'Break large PDFs into smaller files in your browser, with desktop fallback for heavier jobs.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Split Large PDF Files Locally | Filegap',
    metaDescription:
      'Break a large PDF into smaller parts for email, review, or archiving. Use browser tools first, then desktop or CLI for heavier files.',
    canonicalPath: canonicalUrl('/split-large-pdf'),
    breadcrumbLabel: 'Split large PDF',
    relatedTools: [
      {
        href: '/split-pdf-by-page-ranges',
        label: 'Split by Page Ranges',
        description: 'Break a large PDF into specific sections such as chapters or attachments.',
      },
      {
        href: '/compress-pdf-for-email',
        label: 'Compress for Email',
        description: 'Reduce PDF size after splitting when an attachment is still too large.',
      },
      {
        href: '/offline-pdf-tools',
        label: 'Offline PDF Tools',
        description: 'Use desktop or CLI workflows when browser memory is not enough.',
      },
    ],
    landingContent: {
      howItWorksTitle: 'How to split a large PDF',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Select smaller page ranges for each output file.',
        'Split locally, or use desktop/CLI for heavier files.',
      ],
      whyTitle: 'Why split large PDFs',
      whyItems: [
        {
          title: 'Smaller outputs',
          text: 'Create parts that are easier to email, review, or archive.',
        },
        {
          title: 'Local-first',
          text: 'Browser processing avoids upload time and keeps files on the device.',
        },
        {
          title: 'Fallback available',
          text: 'Use Filegap Desktop or CLI when a file is too heavy for the browser.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can Filegap split large PDFs?',
          answer: 'Yes, within the memory limits of your browser and device.',
        },
        {
          question: 'What should I do if the browser struggles?',
          answer: 'Use Filegap Desktop or CLI for heavier local workflows.',
        },
        {
          question: 'Are large PDFs uploaded?',
          answer: 'No. PDF processing remains local.',
        },
        {
          question: 'When should I use desktop instead of the browser?',
          answer: 'Use the desktop app when a PDF is very large, preview rendering feels slow, or you need an offline-first workflow.',
        },
      ],
      seoTitle: 'Break large PDFs into smaller private files',
      seoParagraphs: [
        'Splitting a large PDF can make review, sharing, and archiving easier.',
        'Filegap keeps the operation local and gives you desktop and CLI options when browser memory is not enough.',
      ],
      finalCtaTitle: 'Ready to split a large PDF?',
      finalCtaText: 'Create smaller PDF parts with local processing.',
      finalCtaLabel: 'Split large PDF',
      finalCtaHref: '#split-pdf-tool',
    },
  },
];

export const mergeSeoLandingConfigs: ToolPageSeoConfig[] = [
  {
    routePath: '/merge-pdf-without-uploading',
    title: 'Merge PDFs without uploading them',
    description: 'Combine PDFs locally in your browser. Your files stay on your device.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Merge PDF Without Uploading - Local Browser Tool | Filegap',
    metaDescription:
      'Combine PDF files without sending documents to a remote service. Arrange files, merge on your device, and download the result.',
    canonicalPath: canonicalUrl('/merge-pdf-without-uploading'),
    breadcrumbLabel: 'Merge PDF without uploading',
    relatedTools: mergeRelated,
    landingContent: {
      howItWorksTitle: 'How to merge PDFs without uploading',
      howItWorksSteps: [
        'Choose two or more PDFs from your device.',
        'Reorder files before combining them.',
        'Merge locally and download the combined PDF.',
      ],
      whyTitle: 'Why merge locally',
      whyItems: [
        {
          title: 'No upload queue',
          text: 'Combining starts in your browser without sending PDFs to a server.',
        },
        {
          title: 'Private file order',
          text: 'Your filenames and file order stay on your device.',
        },
        {
          title: 'Simple output',
          text: 'Download one combined PDF after local processing finishes.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can I merge PDFs without uploading them?',
          answer: 'Yes. Filegap merges PDFs locally in your browser.',
        },
        {
          question: 'Do I need to install anything?',
          answer: 'No. The web merge tool runs in the browser.',
        },
        {
          question: 'Can I reorder files before merging?',
          answer: 'Yes. You can arrange PDFs before creating the merged output.',
        },
        {
          question: 'What happens to file names and order?',
          answer: 'They stay in local browser state. Filegap does not send file names or ordering choices to a PDF backend.',
        },
      ],
      seoTitle: 'Private PDF merging without server processing',
      seoParagraphs: [
        'Filegap is built for users who need a fast PDF merge tool without handing documents to an upload service.',
        'The selected PDFs are read locally, combined in browser memory, and exported back to your device.',
      ],
      finalCtaTitle: 'Ready to merge without uploading?',
      finalCtaText: 'Combine PDFs locally in your browser.',
      finalCtaLabel: 'Merge without uploading',
      finalCtaHref: '#merge-pdf-tool',
    },
  },
  {
    routePath: '/combine-pdf-files',
    title: 'Combine PDF files into one document',
    description: 'Combine multiple PDF files into one document with private local processing.',
    robots: NOINDEX_FOLLOW,
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Combine PDF Files Online - No Upload | Filegap',
    metaDescription:
      'Join several PDFs into one ordered document. Filegap keeps the merge workflow on your device instead of an upload queue.',
    canonicalPath: canonicalUrl('/merge-pdf-without-uploading'),
    breadcrumbLabel: 'Combine PDF files',
    relatedTools: mergeRelated,
    landingContent: {
      howItWorksTitle: 'How to combine PDF files',
      howItWorksSteps: [
        'Add the PDF files you want to combine.',
        'Put them in the correct order.',
        'Create one combined PDF locally and download it.',
      ],
      whyTitle: 'Why combine PDFs with Filegap',
      whyItems: [
        {
          title: 'Multiple PDFs, one output',
          text: 'Turn separate documents into a single clean PDF.',
        },
        {
          title: 'No signup',
          text: 'Open the tool and combine files immediately.',
        },
        {
          title: 'Local processing',
          text: 'The combined file is created on your device.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can I combine PDF files for free?',
          answer: 'Yes. Filegap lets you combine PDFs for free with no account.',
        },
        {
          question: 'Are the PDFs uploaded?',
          answer: 'No. The combine operation runs locally in your browser.',
        },
        {
          question: 'Can I choose the output order?',
          answer: 'Yes. Reorder the files before merging.',
        },
      ],
      seoTitle: 'Combine PDFs into one local output',
      seoParagraphs: [
        'Use Filegap to combine contracts, forms, notes, or scans into one PDF without uploading them.',
        'The browser creates the final document locally so you can download it immediately.',
      ],
      finalCtaTitle: 'Ready to combine PDFs?',
      finalCtaText: 'Add your files and create one PDF locally.',
      finalCtaLabel: 'Combine PDF files',
      finalCtaHref: '#merge-pdf-tool',
    },
  },
];

export const extractSeoLandingConfigs: ToolPageSeoConfig[] = [
  {
    ...extractPagesCanonicalConfig,
    routePath: '/extract-specific-pages-from-pdf',
    title: 'Extract exactly the PDF pages you need',
    description: 'Choose exact PDF pages or ranges and export a new file locally in your browser.',
    robots: undefined,
    metaTitle: 'Extract Specific Pages from PDF - No Upload | Filegap',
    metaDescription:
      'Choose exact pages or ranges from a PDF and export a focused file. Private browser-based extraction, built for sensitive documents.',
    canonicalPath: canonicalUrl('/extract-specific-pages-from-pdf'),
    breadcrumbLabel: 'Extract specific pages from PDF',
    relatedTools: [
      {
        href: '/reorder-pdf-pages',
        label: 'Reorder PDF Pages',
        description: 'Change the sequence after extracting selected pages.',
      },
      {
        href: '/split-pdf-by-page-ranges',
        label: 'Split by Page Ranges',
        description: 'Create multiple PDF parts instead of one extracted output.',
      },
      {
        href: '/offline-pdf-tools',
        label: 'Offline PDF Tools',
        description: 'Keep sensitive PDF workflows local across web, desktop, and CLI.',
      },
    ],
    landingContent: {
      howItWorksTitle: 'How to extract specific PDF pages',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Enter the exact pages or ranges you need, such as 2,5,8-10.',
        'Export a new PDF locally with only that selection.',
      ],
      whyTitle: 'Why extract specific pages',
      whyItems: [
        {
          title: 'Exact selection',
          text: 'Keep only the pages that matter for a form, chapter, appendix, or handoff.',
        },
        {
          title: 'No uploads',
          text: 'Filegap applies the selection locally in your browser.',
        },
        {
          title: 'Clean output',
          text: 'Download one focused PDF instead of sharing the full source document.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can I extract non-consecutive pages?',
          answer: 'Yes. Use comma-separated pages and ranges such as 2,5,8-10.',
        },
        {
          question: 'Will the original PDF be changed?',
          answer: 'No. Filegap creates a new PDF output and leaves the source file untouched.',
        },
        {
          question: 'Are selected pages uploaded?',
          answer: 'No. Selection and extraction happen locally in the browser.',
        },
        {
          question: 'Can I reorder pages after extracting them?',
          answer: 'Yes. If the output needs a different sequence, use the Reorder PDF Pages tool after extraction.',
        },
      ],
      seoTitle: 'Extract exact pages into a smaller PDF',
      seoParagraphs: [
        'Use this page when you know exactly which pages should be kept from a larger PDF.',
        'Filegap creates a new local output so you can share or archive only the selected pages.',
      ],
      finalCtaTitle: 'Ready to extract specific pages?',
      finalCtaText: 'Choose exact pages and export a focused PDF locally.',
      finalCtaLabel: 'Extract specific pages',
      finalCtaHref: '#extract-pdf-tool',
    },
  },
  {
    routePath: '/save-single-pages-from-pdf',
    title: 'Save individual pages from a PDF',
    description: 'Select individual PDF pages and save them into a new local PDF output.',
    robots: NOINDEX_FOLLOW,
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Save Single Pages from PDF - No Upload | Filegap',
    metaDescription:
      'Pick one page or a few separate pages from a PDF and save a cleaner copy. Your document stays on your device.',
    canonicalPath: canonicalUrl('/extract-specific-pages-from-pdf'),
    breadcrumbLabel: 'Save single pages from PDF',
    relatedTools: extractRelated,
    landingContent: {
      howItWorksTitle: 'How to save single pages from a PDF',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Select the page or pages you want to keep.',
        'Export a new PDF locally from the selected pages.',
      ],
      whyTitle: 'Why save individual pages',
      whyItems: [
        {
          title: 'Focused output',
          text: 'Create a smaller PDF containing only the pages you need.',
        },
        {
          title: 'No uploads',
          text: 'Single-page extraction runs in your browser.',
        },
        {
          title: 'Flexible selection',
          text: 'Choose one page or multiple single pages.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can I save just one page from a PDF?',
          answer: 'Yes. Select a single page and export it as a new PDF.',
        },
        {
          question: 'Can I save several separate pages?',
          answer: 'Yes. Select pages like 2,5,9 and export them together.',
        },
        {
          question: 'Is my PDF uploaded?',
          answer: 'No. The PDF stays on your device.',
        },
      ],
      seoTitle: 'Save selected PDF pages locally',
      seoParagraphs: [
        'This page is for extracting one or more individual pages from a PDF into a cleaner output document.',
        'Filegap keeps the selection and PDF processing local, so sensitive documents are not uploaded.',
      ],
      finalCtaTitle: 'Ready to save PDF pages?',
      finalCtaText: 'Select the pages you need and export them locally.',
      finalCtaLabel: 'Save single pages',
      finalCtaHref: '#extract-pdf-tool',
    },
  },
];

export const reorderSeoLandingConfigs: ToolPageSeoConfig[] = [
  {
    routePath: '/organize-pdf-pages',
    title: 'Organize pages inside a PDF',
    description: 'Organize PDF page order locally in your browser before sharing or archiving.',
    robots: NOINDEX_FOLLOW,
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Organize PDF Pages Online - No Upload | Filegap',
    metaDescription:
      'Arrange PDF pages into a cleaner order before sharing, printing, or archiving. Filegap keeps the document on your device.',
    canonicalPath: canonicalUrl('/reorder-pdf-pages'),
    breadcrumbLabel: 'Organize PDF pages',
    relatedTools: reorderRelated,
    landingContent: {
      howItWorksTitle: 'How to organize PDF pages',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Move pages into the order you need.',
        'Download the organized PDF created locally.',
      ],
      whyTitle: 'Why organize pages with Filegap',
      whyItems: [
        {
          title: 'Clean page order',
          text: 'Fix scan order, misplaced pages, or presentation flow.',
        },
        {
          title: 'Private by design',
          text: 'Page order and document content stay in your browser.',
        },
        {
          title: 'Fast corrections',
          text: 'Preview pages and export the corrected PDF quickly.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can I organize PDF pages without uploading?',
          answer: 'Yes. Filegap organizes pages locally in your browser.',
        },
        {
          question: 'Can I remove pages with this tool?',
          answer: 'Use Extract Pages when you want to remove pages. Reorder keeps every page.',
        },
        {
          question: 'Is organizing PDF pages free?',
          answer: 'Yes. No signup is required.',
        },
      ],
      seoTitle: 'Organize pages without uploading your PDF',
      seoParagraphs: [
        'Use Filegap when a PDF has the right pages but the wrong order.',
        'The page organization workflow runs locally and exports a corrected PDF from your browser.',
      ],
      finalCtaTitle: 'Ready to organize pages?',
      finalCtaText: 'Put your PDF pages in the right order locally.',
      finalCtaLabel: 'Organize PDF pages',
      finalCtaHref: '#reorder-pdf-tool',
    },
  },
];

export const compressSeoLandingConfigs: CompressPageSeoConfig[] = [
  {
    routePath: '/compress-pdf-to-100kb',
    title: 'Try to compress a PDF toward 100KB',
    description:
      'Use strong local compression settings for smaller PDFs. Exact 100KB output is not guaranteed in browser mode.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Compress PDF to 100KB Online - Local Tool | Filegap',
    metaDescription:
      'Use Filegap’s strongest browser preset when a form asks for a smaller PDF. See the real output size before downloading.',
    canonicalPath: canonicalUrl('/compress-pdf-to-100kb'),
    breadcrumbLabel: 'Compress PDF to 100KB',
    initialPreset: 'strong',
    relatedTools: compressRelated,
    landingContent: {
      howItWorksTitle: 'How to compress a PDF toward 100KB',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Use the strong preset selected for smaller output.',
        'Compress locally and check the resulting file size before download.',
      ],
      whyTitle: 'What to expect from browser compression',
      whyItems: [
        {
          title: 'Honest target-size behavior',
          text: 'Filegap can reduce PDF overhead locally, but browser mode does not guarantee an exact 100KB result.',
        },
        {
          title: 'No uploads',
          text: 'Compression runs on your device instead of a remote server.',
        },
        {
          title: 'Desktop fallback',
          text: 'Use Filegap Desktop or CLI for heavier local compression workflows.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can Filegap guarantee a 100KB PDF?',
          answer: 'No. Browser mode uses local presets and reports the actual result, but exact size targets are not guaranteed.',
        },
        {
          question: 'Why is the strong preset selected?',
          answer: 'The strong preset is the best browser-local option for smaller output.',
        },
        {
          question: 'Is my PDF uploaded for compression?',
          answer: 'No. Compression runs locally in your browser.',
        },
        {
          question: 'What if the result is still above 100KB?',
          answer: 'Try splitting unnecessary pages first or use Filegap Desktop for heavier local compression options.',
        },
      ],
      seoTitle: 'Compress PDFs toward smaller upload limits',
      seoParagraphs: [
        'Some forms ask for PDFs near 100KB. Filegap provides a local compression path without pretending every PDF can hit that exact size.',
        'After processing, the result panel shows the before and after size so you can decide whether the output works.',
      ],
      finalCtaTitle: 'Ready to try 100KB compression?',
      finalCtaText: 'Use the strong local preset and review the actual output size.',
      finalCtaLabel: 'Compress toward 100KB',
      finalCtaHref: '#compress-pdf-tool',
    },
  },
  {
    routePath: '/compress-pdf-to-200kb',
    title: 'Reduce a PDF toward a 200KB limit',
    description:
      'Use strong local compression settings for smaller PDFs. Exact 200KB output is not guaranteed in browser mode.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Compress PDF to 200KB Online - Local Tool | Filegap',
    metaDescription:
      'Need a smaller PDF for an upload limit? Start with strong local compression and check whether the result fits 200KB.',
    canonicalPath: canonicalUrl('/compress-pdf-to-200kb'),
    breadcrumbLabel: 'Compress PDF to 200KB',
    initialPreset: 'strong',
    relatedTools: compressRelated,
    landingContent: {
      howItWorksTitle: 'How to compress a PDF toward 200KB',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Use the strong preset selected for smaller output.',
        'Compress locally and compare the before and after size.',
      ],
      whyTitle: 'Why use Filegap for 200KB intent',
      whyItems: [
        {
          title: 'Clear limits',
          text: 'Filegap aims to reduce size locally but does not claim exact 200KB output in browser mode.',
        },
        {
          title: 'Private processing',
          text: 'Your PDF is not uploaded to a compression service.',
        },
        {
          title: 'Result visibility',
          text: 'The output state shows the actual file size after compression.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can Filegap make every PDF exactly 200KB?',
          answer: 'No. The result depends on the PDF structure and embedded content.',
        },
        {
          question: 'Can I use this for upload portals?',
          answer: 'Yes, if the resulting size meets the portal requirement after compression.',
        },
        {
          question: 'Does compression upload my PDF?',
          answer: 'No. Browser compression is local.',
        },
        {
          question: 'Should I optimize or compress first?',
          answer: 'Use Compress PDF when you care about size. Optimize is better for structural cleanup without targeting attachment limits.',
        },
      ],
      seoTitle: 'Try private PDF compression for 200KB limits',
      seoParagraphs: [
        'Use this page when you need a smaller PDF for forms, portals, or email, while keeping the file local.',
        'Filegap reports the actual output size so the workflow stays honest about what browser compression achieved.',
      ],
      finalCtaTitle: 'Ready to try 200KB compression?',
      finalCtaText: 'Compress locally and review the real output size.',
      finalCtaLabel: 'Compress toward 200KB',
      finalCtaHref: '#compress-pdf-tool',
    },
  },
  {
    routePath: '/compress-pdf-for-email',
    title: 'Compress PDFs for email attachments',
    description: 'Use local compression settings suited to email attachments, with no file uploads.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Compress PDF for Email - No Upload | Filegap',
    metaDescription:
      'Prepare PDFs for email attachments with a balanced local preset. Check the final size before sending through Gmail or Outlook.',
    canonicalPath: canonicalUrl('/compress-pdf-for-email'),
    breadcrumbLabel: 'Compress PDF for email',
    relatedTools: [
      {
        href: '/compress-pdf-to-100kb',
        label: 'Compress toward 100KB',
        description: 'Try the strongest browser preset for strict upload limits.',
      },
      {
        href: '/compress-pdf-to-200kb',
        label: 'Compress toward 200KB',
        description: 'Use local compression when a portal requires a smaller PDF.',
      },
      {
        href: '/compress-pdf-without-uploading',
        label: 'Compress without Uploading',
        description: 'Keep compression private when documents cannot leave your device.',
      },
      {
        href: '/offline-pdf-tools',
        label: 'Offline PDF Tools',
        description: 'Switch to desktop or CLI for larger attachment workflows.',
      },
    ],
    initialPreset: 'balanced',
    landingContent: {
      howItWorksTitle: 'How to compress a PDF for email',
      howItWorksSteps: [
        'Upload one PDF from your device.',
        'Use the balanced preset for email-friendly local compression.',
        'Download the compressed PDF and attach it from your device.',
      ],
      whyTitle: 'Why compress before emailing',
      whyItems: [
        {
          title: 'Smaller attachments',
          text: 'Compression can reduce overhead and make PDFs easier to send.',
        },
        {
          title: 'No upload service',
          text: 'You do not need to send the PDF to a third-party compressor.',
        },
        {
          title: 'Simple output check',
          text: 'Review the output size before using it as an attachment.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'What PDF size works best for Gmail attachments?',
          answer: 'Gmail supports attachments up to 25 MB, but smaller PDFs send faster and are easier for recipients to download.',
        },
        {
          question: 'What about Outlook attachment limits?',
          answer: 'Outlook limits vary by account and organization. Compress locally first, then verify the final file size against your mail client.',
        },
        {
          question: 'How should I balance size and quality?',
          answer: 'Start with the balanced preset. Use stronger compression only when the attachment still exceeds the limit.',
        },
        {
          question: 'Is the PDF sent to Filegap before I email it?',
          answer: 'No. Filegap prepares the compressed PDF on your device; you attach it yourself from the downloaded file.',
        },
      ],
      seoTitle: 'Prepare smaller PDFs for email locally',
      seoParagraphs: [
        'Email attachment limits can be strict, especially for scanned or image-heavy PDFs.',
        'Filegap gives you a local compression workflow and shows the actual result size before download.',
      ],
      finalCtaTitle: 'Ready to compress for email?',
      finalCtaText: 'Use local compression before attaching your PDF.',
      finalCtaLabel: 'Compress for email',
      finalCtaHref: '#compress-pdf-tool',
    },
  },
  {
    routePath: '/compress-pdf-without-uploading',
    title: 'Compress a PDF without uploading it',
    description: 'Compress PDFs locally in your browser so your documents never leave your device.',
    trustLine: 'Free - No signup - Works in your browser',
    metaTitle: 'Compress PDF Without Uploading - Local Browser Tool | Filegap',
    metaDescription:
      'Shrink PDF files without using an upload-based compressor. Filegap keeps compression on your device and reports the real size change.',
    canonicalPath: canonicalUrl('/compress-pdf-without-uploading'),
    breadcrumbLabel: 'Compress PDF without uploading',
    initialPreset: 'balanced',
    relatedTools: compressRelated,
    landingContent: {
      howItWorksTitle: 'How to compress a PDF without uploading',
      howItWorksSteps: [
        'Open the compression tool in your browser.',
        'Choose a PDF from your device.',
        'Compress locally and download the result.',
      ],
      whyTitle: 'Why local compression matters',
      whyItems: [
        {
          title: 'No remote processing',
          text: 'Your PDF is not sent to an upload endpoint for compression.',
        },
        {
          title: 'Private file details',
          text: 'File content and document metadata stay on your device.',
        },
        {
          title: 'Clear results',
          text: 'The tool reports the actual size change after local processing.',
        },
      ],
      faqTitle: 'Frequently asked questions',
      faqItems: [
        {
          question: 'Can I compress a PDF without uploading it?',
          answer: 'Yes. Filegap compresses PDFs locally in your browser.',
        },
        {
          question: 'Does Filegap store my PDF?',
          answer: 'No. The web app does not persist or upload user PDFs for processing.',
        },
        {
          question: 'Can I use desktop for larger files?',
          answer: 'Yes. Filegap Desktop and CLI are recommended for heavier local workflows.',
        },
      ],
      seoTitle: 'Private browser-based PDF compression',
      seoParagraphs: [
        'Use this page when privacy is the main requirement and you do not want an online compressor to receive your PDF.',
        'Filegap applies local compression presets and exports the result directly from your browser.',
      ],
      finalCtaTitle: 'Ready to compress locally?',
      finalCtaText: 'Compress your PDF without uploading it.',
      finalCtaLabel: 'Compress without uploading',
      finalCtaHref: '#compress-pdf-tool',
    },
  },
];

export const allSeoLandingPaths = [
  '/merge-pdf',
  '/split-pdf',
  '/reorder-pdf-pages',
  '/optimize-pdf',
  '/compress-pdf',
  '/pdf-to-images',
  extractPagesCanonicalConfig.routePath,
  ...splitSeoLandingConfigs.map((config) => config.routePath),
  ...mergeSeoLandingConfigs.map((config) => config.routePath),
  ...extractSeoLandingConfigs.map((config) => config.routePath),
  ...reorderSeoLandingConfigs.map((config) => config.routePath),
  ...compressSeoLandingConfigs.map((config) => config.routePath),
  '/offline-pdf-tools',
];

export const indexableSeoLandingPaths = allSeoLandingPaths.filter((path) => {
  const configs: ToolPageSeoConfig[] = [
    extractPagesCanonicalConfig,
    reorderPagesCanonicalConfig,
    ...splitSeoLandingConfigs,
    ...mergeSeoLandingConfigs,
    ...extractSeoLandingConfigs,
    ...reorderSeoLandingConfigs,
    ...compressSeoLandingConfigs,
  ];
  const config = configs.find((item) => item.routePath === path);
  return config?.robots !== NOINDEX_FOLLOW;
});
