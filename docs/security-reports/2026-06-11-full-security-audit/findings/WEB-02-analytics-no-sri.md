# WEB-02 — External analytics script loaded without Subresource Integrity

- **Severity:** Medium
- **Category:** Supply Chain / Privacy
- **Location:** `apps/web/index.html:31-36`

## Description
The SimpleAnalytics script is loaded from `https://scripts.simpleanalyticscdn.com/latest.js` — a `latest.js` URL that silently receives any future vendor update, with no `integrity` hash to detect tampering and no `crossorigin` attribute. The app's privacy promise ("your files never leave your device") depends on this script not being malicious or compromised.

## Impact
A compromised or malicious SimpleAnalytics CDN could inject code that reads processed file bytes from memory. A script executing in the page's JavaScript context can reach any in-scope variable, including the `mergedOutput`/`outputs` React state holding PDF data during an operation.

## Evidence
```html
<!-- apps/web/index.html:31-36 -->
<script async defer data-collect-dnt="true"
  src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
```

## Remediation
Pin to a specific versioned URL with an SRI hash and `crossorigin="anonymous"`, **or** self-host the script. Since the Privacy page already claims the tool works fully offline, self-hosting analytics is consistent with that claim and eliminates this outbound CDN dependency entirely.
