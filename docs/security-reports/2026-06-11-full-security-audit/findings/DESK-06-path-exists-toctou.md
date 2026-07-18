# DESK-06 — `path_exists` TOCTOU in output-path resolution

- **Severity:** Low
- **Category:** Race Condition / Logic
- **Location:** `apps/desktop/src-tauri/src/commands.rs:964-967`, `apps/desktop/src/lib/outputSettings.ts:41-77`

## Description
`resolveOutputPathByOverwrite` calls `pathExists(candidatePath)` in a loop (up to 9,999 iterations) to find a free filename. Between the check returning false and the subsequent write, another process can create the file (TOCTOU). The serial `pathExists` round-trips through the webview each iteration, which is also a performance vector. Critically, `pathExists` is being used as a security/safety control, which it cannot be.

## Impact
Low — the race window is small and requires an adversarial co-process. The real issue is treating a non-atomic check as the overwrite/no-overwrite decision.

## Evidence
```typescript
// outputSettings.ts:67
for (let suffix = 2; suffix < 10_000; suffix += 1) {
  const taken = await pathExists(nextCandidate);
  if (!taken) return nextCandidate;
}
```

## Remediation
Perform output-path deconfliction atomically on the Rust side with `OpenOptions::create_new(true)`, retrying with a suffix on collision — without round-tripping through the webview per check.
