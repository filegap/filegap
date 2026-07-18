# WEB-05 — pdf.js `isEvalSupported` not disabled

- **Severity:** Low
- **Category:** PDF Parsing / Sandbox Hardening
- **Location:** `apps/web/src/lib/pdfPreview.ts:9`, `apps/web/src/lib/pdfImages.ts:21`

## Description
The pdf.js config sets only `GlobalWorkerOptions.workerSrc`. `isEvalSupported` is left at its default (`true`), so pdf.js may use `eval()`/`new Function()` in the worker for JIT font rendering. This also blocks adopting a strict CSP: under `script-src 'self'` without `'unsafe-eval'` (see WEB-01), pdf.js fails at runtime unless `isEvalSupported: false` is set.

## Impact
Primarily a deployment blocker for the CSP fix. Secondarily, allowing `eval` in a worker processing untrusted PDFs marginally widens the attack surface for a hypothetical pdf.js parser bug.

## Evidence
```typescript
// pdfPreview.ts:1-9
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerSrc;
const pdfDocument = await getDocument({ data: fileBytes }).promise;
// no isEvalSupported: false
```

## Remediation
```typescript
const pdfDocument = await getDocument({
  data: fileBytes,
  isEvalSupported: false,   // required for strict CSP + defense-in-depth
}).promise;
```
Apply in both `pdfPreview.ts` and `pdfImages.ts`. Test font rendering on complex PDFs before shipping.
