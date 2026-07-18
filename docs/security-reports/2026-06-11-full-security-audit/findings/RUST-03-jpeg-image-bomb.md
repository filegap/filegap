# RUST-03 — JPEG image bomb in `compress` (decode before dimension guard)

- **Severity:** Medium
- **Category:** DoS / Resource Exhaustion
- **Location:** `crates/core/src/ops/compress.rs:39-43`

## Description
`compress_pdf` iterates over every `Image`/`DCTDecode` stream and calls `image::load_from_memory_with_format(&stream.content, ImageFormat::Jpeg)` to fully decode the image into an `ImageBuffer` **before** checking dimensions against `settings.max_dimension`. A crafted PDF can embed a JPEG that decodes to a huge uncompressed image (e.g. 65535×65535×3 ≈ 12 GB), exhausting memory before the resize logic runs. The backend (`zune-jpeg` 0.5.15) has no hardcoded allocation cap.

## Impact
Processing a crafted PDF with `compress` causes process OOM; in automation pipelines this crashes the process/container. Local execution only, but any scripted wrapper calling `filegap compress` on untrusted PDFs is affected.

## Evidence
```rust
// compress.rs:39-51
let Ok(image) = image::load_from_memory_with_format(&stream.content, image::ImageFormat::Jpeg)
else { continue; };
let resized = if image.width().max(image.height()) > settings.max_dimension {
    image.resize(...)  // resize happens AFTER full decode
```

## Remediation
Check the declared `Width`/`Height` dictionary entries (and ideally the JPEG SOF header dimensions) before decoding, and skip streams exceeding a hard cap:
```rust
let w = stream.dict.get(b"Width").and_then(Object::as_i64).unwrap_or(0);
let h = stream.dict.get(b"Height").and_then(Object::as_i64).unwrap_or(0);
if w > MAX_SAFE_DIMENSION as i64 || h > MAX_SAFE_DIMENSION as i64 { continue; }
```
Consider a header-only parse (`zune-jpeg` supports reading dimensions) before allocating.
