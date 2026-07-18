# WEB-03 — Analytics auto-collects page URLs (privacy-claim nuance)

- **Severity:** Low
- **Category:** Privacy
- **Location:** `apps/web/index.html:31-36`, `apps/web/src/pages/privacy/PrivacyPage.tsx:49`

## Description
SimpleAnalytics' standard script auto-collects page views including full page URL, referrer, and screen resolution. The `data-collect-dnt="true"` attribute only excludes DNT-signalling users — it does not disable URL collection. Today the SPA routes are fixed paths (`/merge-pdf`, etc.) that embed no file content, so nothing sensitive leaks. The Privacy page states no file names/paths/content are collected, which is accurate — but the gap between strong privacy claims and auto-pageview behavior is worth documenting.

## Impact
Low in current form. Becomes a real issue if any future feature encodes file metadata into a URL or query parameter.

## Evidence
Privacy policy discloses SimpleAnalytics (`PrivacyPage.tsx:49`). The nuance is `latest.js` auto-pageview collection with no explicit suppression of URL collection.

## Remediation
Verify no future feature encodes file metadata into URLs. Add an inline comment in `index.html` documenting exactly what SimpleAnalytics collects and why it was assessed acceptable. Self-hosting (see WEB-02) further reduces exposure.
