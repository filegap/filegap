# RUST-06 — Repeated `Document::load_mem` on concatenated stdin stream

- **Severity:** Low
- **Category:** DoS / Resource Exhaustion
- **Location:** `crates/cli/src/main.rs:716-748`

## Description
When merging from stdin, `split_concatenated_pdf_stream` scans for all `%PDF-` byte positions, slices candidates, and calls `Document::load_mem` on each to validate it. A crafted stream with many `%PDF-` markers produces a large number of parse attempts (a 10 MB input with a marker every 6 bytes yields ~1.6M attempts). Reachable only when piping multiple PDFs to `filegap merge` via stdin.

## Impact
CPU exhaustion for the duration of the parse loop. Per-attempt cost for early-failing PDFs is likely low (lopdf fails fast on bad headers), but the attempt count is unbounded.

## Evidence
```rust
// main.rs:720-726 — O(input_size) marker scan
while index + marker.len() <= input.len() {
    if &input[index..index + marker.len()] == marker {
        starts.push(index);
        index += marker.len();
    } else { index += 1; }
}
// then Document::load_mem(&candidate) per marker
```

## Remediation
Cap detected markers at a sane limit (e.g. 1000) before the parse loop and error out beyond it — piping thousands of concatenated PDFs is not a realistic workflow.
