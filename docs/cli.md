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

- `merge` and `extract` are wired to real core operations.
- `split` is wired to real core operations.
- `reorder` and `info` are still scaffold commands for now.
- Page ranges follow `1,3,5-8` syntax and are 1-based.
- `split --ranges` interprets each comma-separated token as one output file
  (example: `1-2,5` produces two files).
