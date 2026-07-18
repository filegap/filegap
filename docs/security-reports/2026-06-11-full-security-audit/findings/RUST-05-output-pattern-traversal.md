# RUST-05 — Path traversal writes via `--output-pattern`

- **Severity:** Low
- **Category:** Path Traversal (Operator-controlled)
- **Location:** `crates/cli/src/main.rs:595-616`

## Description
`--output-pattern` is used verbatim as a filesystem path after substituting `%d` with a counter. No validation constrains it to a directory. A pattern like `../../etc/cron.d/%d` causes `fs::create_dir_all` to create arbitrary directories and `fs::write` to overwrite arbitrary files writable by the process user. The only check is that the pattern contains `%d`.

## Impact
By design in interactive trusted-operator use. Risk rises when filegap is invoked by automation (CI, server scripts, GUI wrappers) where the pattern may derive from untrusted config/parameters, enabling writes to attacker-controlled paths.

## Evidence
```rust
// main.rs:603-612
let filename = pattern.replace("%d", &(index + 1).to_string());
if let Some(parent) = Path::new(&filename).parent() {
    if !parent.as_os_str().is_empty() {
        fs::create_dir_all(parent)...?;  // arbitrary dirs
    }
}
fs::write(&filename, part)...?;  // arbitrary path
```

## Remediation
Document that `--output-pattern` must come from trusted sources (minimum). For library/integration callers, validate the resolved path is within a supplied base directory before writing.
