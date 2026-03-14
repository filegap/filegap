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
- `split`, `reorder`, and `info` are still scaffold commands for now.
- Page ranges follow `1,3,5-8` syntax and are 1-based.
