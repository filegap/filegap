# DESK-01 — Arbitrary file read via `read_pdf_bytes` command

- **Severity:** High
- **Category:** Tauri IPC — Unconstrained File Access
- **Location:** `apps/desktop/src-tauri/src/commands.rs:861-870`

## Description
The `read_pdf_bytes` command accepts a caller-supplied path and passes it directly to `fs::read()` with no scope restriction, no extension check, and no directory-containment check. Any path the OS accepts is valid — `/etc/passwd`, `~/.ssh/id_rsa`, `~/.aws/credentials`, etc. Every `#[tauri::command]` is callable from the webview.

## Impact
If the webview is ever compromised (e.g. a malicious PDF triggers a pdf.js bug achieving renderer code execution, or a future XSS is introduced), the attacker can exfiltrate any file readable by the OS user. The Tauri ACL (`capabilities/default.json`) grants no `fs` plugin permissions, but this bespoke command bypasses the plugin layer entirely.

## Evidence
```rust
// commands.rs:861
pub async fn read_pdf_bytes(path: String) -> Result<Vec<u8>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        fs::read(path).map_err(|_| "Failed to read input PDF file.".to_string())
    })
```

## Remediation
Canonicalize the path and enforce constraints server-side before reading:
```rust
let canonical = Path::new(&path).canonicalize()
    .map_err(|_| "Invalid path.".to_string())?;
if canonical.extension().and_then(|e| e.to_str()) != Some("pdf") {
    return Err("Only PDF files are supported.".to_string());
}
```
Stronger: assert `canonical` is under a user-chosen directory (e.g. `document_dir()` or a path the user selected via the native picker, tracked in Rust-side state). Frontend checks cannot be trusted as a security control. Closes together with DESK-02 and DESK-03 via a shared scope helper.
