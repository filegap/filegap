# WEB-01 — No Content Security Policy or security headers

- **Severity:** High
- **Category:** Headers / Defense-in-Depth
- **Location:** `apps/web/index.html` (no CSP meta tag); no `vercel.json`, `netlify.toml`, or `public/_headers` found

## Description
The web app ships zero HTTP security headers: no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`. This is an app that explicitly handles sensitive documents (contracts, tax files, medical records) and loads a third-party analytics script from an external CDN.

## Impact
1. Any XSS (in pdf-lib, pdfjs-dist, React, or future code) can freely exfiltrate in-memory document data same-origin. A `script-src 'self'` CSP would contain the blast radius.
2. The SimpleAnalytics script is loaded with no SRI (see WEB-02); a CDN compromise runs with full access to document data held in memory.
3. The app can be embedded in arbitrary iframes (no `X-Frame-Options`), enabling clickjacking of the file picker.

## Evidence
```html
<!-- apps/web/index.html:31-36 — external script, no integrity, no CSP -->
<script async defer data-collect-dnt="true"
  src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
```
No CSP meta tag anywhere; no hosting config file present.

## Remediation
Add response headers at the hosting layer (Vercel/Netlify/CDN). Minimum viable set:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://scripts.simpleanalyticscdn.com;
  connect-src 'self' https://queue.simpleanalyticscdn.com;
  img-src 'self' data: blob:;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  worker-src blob:;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
`worker-src blob:` is required for the Vite-bundled pdf.js worker. Applying `script-src 'self'` (no `unsafe-eval`) requires setting `isEvalSupported: false` for pdf.js first — see WEB-05.
