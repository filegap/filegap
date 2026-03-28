# Roadmap

## v0.1

- Rust workspace bootstrap
- Core operations implemented (`merge`, `extract`, `split`, `reorder`)
- CLI commands implemented (`merge`, `extract`, `split`, `reorder`, `info`)
- Automated tests for core + CLI integration
- Web app scaffold (React + Vite + Worker local merge flow)
- Desktop MVP scaffold (Tauri + React) with home + merge flow wired to `filegap_core`

## v0.2

- Add richer info/reporting (`--json` extensions, page-level insights)
- Add fixtures and golden output tests for edge-case PDFs
- Expand web operations beyond merge (extract/split/reorder)
- Start desktop integration with Tauri

## Future

- Compression
- Rotation
- Metadata cleanup
- Watermark
- Redaction
- Desktop distribution roadmap: GitHub Releases, Homebrew Cask, paid store distribution, and OSS/support positioning. See [`docs/desktop-distribution-roadmap.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/desktop-distribution-roadmap.md).
