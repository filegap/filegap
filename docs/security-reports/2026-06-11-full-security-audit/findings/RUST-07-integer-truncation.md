# RUST-07 — Integer truncation in merge page/object counts

- **Severity:** Low
- **Category:** Integer Overflow / Incorrect Output
- **Location:** `crates/core/src/ops/merge.rs:82`, `crates/core/src/ops/merge.rs:105`

## Description
Two `as u32` casts truncate `usize` values: `pages_map.len() as u32` (the PDF `Count` field) and `output.objects.len() as u32` (`output.max_id`). On 64-bit systems these silently truncate if the value ever exceeds `u32::MAX`.

## Impact
No practical exploit — a PDF with >4 billion pages/objects cannot be constructed and parsed. Worst case is a malformed output PDF that fails to parse. Correctness rather than security.

## Evidence
```rust
// merge.rs:82
pages_dict.set("Count", pages_map.len() as u32);
// merge.rs:105
output.max_id = output.objects.len() as u32;
```

## Remediation
Use explicit fallible conversion:
```rust
u32::try_from(pages_map.len())
    .map_err(|_| CoreError::Processing("page count exceeds u32 limit".to_string()))?
```
