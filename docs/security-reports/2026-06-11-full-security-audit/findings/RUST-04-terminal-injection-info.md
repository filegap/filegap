# RUST-04 — Terminal control injection via unescaped PDF metadata in `info`

- **Severity:** Low
- **Category:** Terminal Injection / Output Integrity
- **Location:** `crates/core/src/ops/info.rs:41`, `crates/cli/src/main.rs:520-537`

## Description
The `info` command reads PDF metadata (Title, Author, Creator, Producer, dates) via `String::from_utf8_lossy` and prints it verbatim with `println!`. A crafted PDF can embed ANSI escape sequences (e.g. `\x1b[2J`, `\x1b]0;`, `\x1b[?1049h`) in any metadata field; when the user runs `filegap info malicious.pdf` in a terminal, the emulator interprets them. The `--json` path is safe (`serde_json` escapes control characters).

## Impact
An attacker who gets a user to run `filegap info` on a crafted PDF can manipulate terminal state, forge output, switch screen buffers, or in some emulators abuse bracketed-paste. Low-severity, opportunistic, interactive-only.

## Evidence
```rust
// info.rs:41
Object::String(bytes, _) => Some(String::from_utf8_lossy(bytes).to_string()),
// main.rs:520
println!("Title: {}", info.title.unwrap_or_else(|| "-".to_string()));
```

## Remediation
Strip control characters before printing in the non-JSON path:
```rust
fn sanitize_for_terminal(value: &str) -> String {
    value.chars().filter(|c| !c.is_control() || *c == '\n' || *c == '\t').collect()
}
```
