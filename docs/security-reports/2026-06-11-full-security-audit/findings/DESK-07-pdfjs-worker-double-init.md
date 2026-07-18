# DESK-07 — pdf.js worker initialized twice at module level

- **Severity:** Low
- **Category:** PDF Rendering — Configuration
- **Location:** `apps/desktop/src/lib/pdfPreview.ts:9`, `apps/desktop/src/lib/pdfImages.ts:21`

## Description
`GlobalWorkerOptions.workerSrc` is a mutable global shared across the pdfjs-dist instance. Both `pdfPreview.ts` and `pdfImages.ts` set it at import time; last-write wins. Currently both set the same value (harmless), but the pattern is fragile: if one module were changed to a different (e.g. CDN) worker URL, both code paths would use whichever was registered last — potentially conflicting with the strict `script-src 'self'` CSP.

## Impact
Low — no current exploit. Latent risk of silent misconfiguration / CSP violation if the two paths ever diverge.

## Evidence
```typescript
// pdfPreview.ts:9
GlobalWorkerOptions.workerSrc = workerSrc;
// pdfImages.ts:21
GlobalWorkerOptions.workerSrc = workerSrc;
```

## Remediation
Extract a single `initPdfWorker()` in a shared module, guarded by an init flag, called once at startup. Import it from both files instead of setting the global directly.
