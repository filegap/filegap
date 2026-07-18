# RUST-02 — O(N × parse-cost) CPU/memory amplification in reorder and split

- **Severity:** Medium
- **Category:** DoS / Resource Exhaustion
- **Location:** `crates/core/src/ops/reorder.rs:23-38`, `crates/core/src/ops/split.rs:26-46`

## Description
Both `reorder_pages` and `split_pdf` call `Document::load_mem(&request.document)` inside a loop — once per page (reorder) or once per output group (split). For a 500-page PDF, reorder parses the document ~501 times, and the subsequent `merge_pdfs` parses each single-page result again. The original bytes plus N in-progress `Document` objects plus N serialized buffers are held simultaneously.

## Impact
A large many-page PDF supplied via automation and reordered in full causes CPU cost and peak memory orders of magnitude above the input size. Not network-reachable (local tool), but a practical DoS for CI/automation processing untrusted PDFs. The amplification factor equals the document's page count (`validate_page_order` requires `page_order.len() == total_pages`).

## Evidence
```rust
// reorder.rs:23-38 — N full parses for an N-page document
for page in &request.page_order {
    let mut doc = Document::load_mem(&request.document)?; // repeated parse
    let pages_to_delete: Vec<u32> = (1..=total_pages).filter(|p| p != page).collect();
    doc.delete_pages(&pages_to_delete);
    ...
    single_page_docs.push(cursor.into_inner());
}
// then merge_pdfs(...) — another N parses
```

## Remediation
Parse the document once and extract each page in a single pass instead of re-parsing per iteration (e.g. `Document::extract_pages`, or clone the already-parsed `Document` and delete pages on the clone). Apply the same to `split_pdf`.
