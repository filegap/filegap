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

Current implementation is scaffold-only and prints operation stubs.
Core integration and PDF execution logic will be wired in next steps.
