# CLI (v0.1)

Binary: `pdflo`

## Commands

- `pdflo merge -i a.pdf b.pdf -o out.pdf`
- `pdflo extract -i in.pdf -p 1,3,5-8 -o out.pdf`
- `pdflo split -i in.pdf --every 1 -d ./out`
- `pdflo split -i in.pdf --ranges 1-2,3-5 -d ./out`
- `pdflo reorder -i in.pdf -p 3,1,2 -o out.pdf`
- `pdflo info -i in.pdf`

## Notes

- `merge`, `extract`, `split`, `reorder`, and `info` are wired to real core operations.
- Page ranges follow `1,3,5-8` syntax and are 1-based.
- `split --ranges` interprets each comma-separated token as one output file
  (example: `1-2,5` produces two files).
- `reorder -p` accepts explicit order and ranges
  (example: `3,1,2` or `4-6,1-3`).
- `info` prints document summary (size, version, pages, encryption, metadata fields).
- `info --json` prints machine-readable output for scripting.
