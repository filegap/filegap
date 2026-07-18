# RUST-01 — Unbounded stdin read (memory exhaustion DoS)

- **Severity:** Medium
- **Category:** DoS / Resource Exhaustion
- **Location:** `crates/cli/src/main.rs:565-576`

## Description
`read_stdin_all()` calls `io::stdin().read_to_end(&mut bytes)` with no size limit. Every stdin-accepting command (`merge`, `extract`, `split`, `reorder`, `optimize`, `compress`, `extract-images`, `info`) is affected. An attacker who can pipe input (a malicious wrapper script, a CI pipeline processing uploaded PDFs, a desktop integration forwarding stdin) can feed an arbitrarily large stream and exhaust process memory before any PDF parsing occurs.

## Impact
Process OOM. In constrained environments (containers, serverless wrappers, CI agents) it can crash the host or stall the pipeline. Local interactive risk is low (OS kills the process); the risk rises when filegap is invoked from automation on untrusted input.

## Evidence
```rust
fn read_stdin_all() -> Result<Vec<u8>, CliError> {
    let mut bytes = Vec::new();
    io::stdin().read_to_end(&mut bytes)   // no limit
        .map_err(|err| ...)?;
    if bytes.is_empty() { return Err(...); }
    Ok(bytes)
}
```

## Remediation
Bound the read with a configurable cap:
```rust
io::stdin().take(MAX_BYTES).read_to_end(&mut bytes)
```
Return `CliError::invalid_input("input exceeds maximum allowed size")` when the limit is hit. `MAX_BYTES` could default to e.g. 500 MB or be overridable via `--max-input`.
