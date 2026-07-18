# DESK-03 — All PDF-operation commands accept unscoped input/output paths

- **Severity:** High
- **Category:** Tauri IPC — Path Traversal / Unconstrained File Access
- **Location:** `apps/desktop/src-tauri/src/commands.rs:220, 252, 307, 336, 367, 396, 420, 451, 692, 820, 832`

## Description
Every command — `merge_pdfs`, `split_pdf`, `extract_pages`, `extract_images`, `reorder_pdf`, `optimize_pdf`, `compress_pdf`, `execute_workflow`, `prepare_workflow_pdf_bytes`, `inspect_pdf_files`, `inspect_pdf_metadata` — accepts input and/or output paths as plain strings and performs file I/O with no canonicalization, no directory containment, and no extension allowlist. Path traversal sequences (`../../sensitive`) are accepted silently. This is the same root cause as DESK-01/DESK-02 spread across the whole command surface.

## Impact
Any `../` in an input path allows reading arbitrary files; any in an output path allows writing processed data to arbitrary locations (overwriting system files, configs, login items).

## Evidence
```rust
// commands.rs:231-232 (merge_pdfs, representative of all commands)
for path in &input_paths {
    let bytes = fs::read(path).map_err(...)?;
}
// No canonicalize(), no starts_with(allowed_dir), no extension check anywhere.
```

## Remediation
Introduce a single shared helper and apply it to every path argument before I/O:
```rust
fn validate_input_path(path: &str) -> Result<PathBuf, String> {
    let canonical = Path::new(path).canonicalize()
        .map_err(|_| "Path does not exist or is inaccessible.".to_string())?;
    if canonical.extension().and_then(|e| e.to_str()) != Some("pdf") {
        return Err("Only PDF files are supported as input.".to_string());
    }
    Ok(canonical)
}
```
For output paths, validate against the user's configured output directory held in Rust-side state. A single canonicalize-and-scope helper closes DESK-01, DESK-02, and DESK-03 together.
