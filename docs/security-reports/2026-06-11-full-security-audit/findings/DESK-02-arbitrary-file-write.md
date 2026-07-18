# DESK-02 — Arbitrary file write via `write_binary_file` command

- **Severity:** High
- **Category:** Tauri IPC — Unconstrained File Access
- **Location:** `apps/desktop/src-tauri/src/commands.rs:873-885`

## Description
`write_binary_file` writes a caller-controlled byte payload to a caller-controlled path with no scope restriction, no extension check, no allowed-directory check, and no canonicalization. A compromised webview can overwrite any file writable by the OS user.

## Impact
Persistence / privilege escalation. An attacker with webview code execution can write to `~/.bashrc`, `~/.zshrc`, `~/Library/LaunchAgents/evil.plist`, or `~/.ssh/authorized_keys`. Combined with `read_pdf_bytes` (DESK-01), this yields a full arbitrary read-write primitive over the user's filesystem.

## Evidence
```rust
// commands.rs:873
pub async fn write_binary_file(output_path: String, bytes: Vec<u8>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        // only checks: non-empty path, non-empty bytes
        fs::write(output_path, bytes).map_err(|_| "Failed to write output file.".to_string())
    })
```

## Remediation
Canonicalize the output path and assert it is under an expected, user-chosen output directory (stored in Rust-side app state). Reject writes outside that scope and constrain the extension to known outputs (`.pdf`, `.zip`). The frontend `resolveOutputPathByOverwrite` helper must not be treated as a security boundary — enforce on the Rust side. Prefer `OpenOptions::create_new(true)` when overwrite is not intended (see DESK-06).
