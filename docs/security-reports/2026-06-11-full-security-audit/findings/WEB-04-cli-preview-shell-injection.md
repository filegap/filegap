# WEB-04 — Shell injection via filename in CLI-preview "Copy command"

- **Severity:** Low
- **Category:** Shell Injection (via clipboard)
- **Location:** `apps/web/src/pages/merge-pdf/MergePdfPage.tsx:411-413`, `apps/web/src/pages/split-pdf/SplitPdfPage.tsx:598-602` (and other tool pages)

## Description
User-supplied file names (from the OS picker) are interpolated into a shell command string shown in `CliPreviewCard`. Rendered as React text (not `dangerouslySetInnerHTML`), so this is **not XSS** — HTML is escaped. But the string with surrounding double-quotes is handed to `navigator.clipboard.writeText()` on "Copy command". A filename like `a.pdf"; rm -rf ~; echo "` produces a clipboard payload that executes injected commands if pasted into a terminal.

## Impact
An attacker who delivers a maliciously named PDF (email, download) can socially-engineer command injection when the victim uses the copy-command feature and pastes into a shell.

## Evidence
```typescript
// MergePdfPage.tsx:411-413
const cliPreview = useMemo(() => {
  if (files.length >= 2) {
    return `filegap merge ${files.map((f) => `"${f.file.name}"`).join(' ')} > merged.pdf`;
  }
  return 'filegap merge "input-a.pdf" "input-b.pdf" > merged.pdf';
}, [files]);
```
Filename `a.pdf"; rm -rf ~/important; echo "` → `filegap merge "a.pdf"; rm -rf ~/important; echo "" > merged.pdf`.

## Remediation
Sanitize filenames before embedding in the preview string:
```typescript
function shellEscapeFilename(name: string): string {
  return name.replace(/["`$\\|;&()!<>]/g, '_');
}
```
Add a visible note that filenames are sanitized for CLI safety.
