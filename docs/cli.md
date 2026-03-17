# CLI (v0.1)

Binary: `filegap`

## Design

- Pipe-first and composable
- Input from file path or `stdin`
- Output to `stdout` by default
- No interactive prompts
- Errors on `stderr` with stable exit codes
- No network requests during PDF processing

## Commands

```bash
filegap merge [INPUT ...] [-o FILE]
filegap extract [INPUT|-] --pages RANGES [-o FILE]
filegap split [INPUT|-] --pages RANGES [--output-pattern PATTERN | --format zip] [-o FILE]
filegap reorder [INPUT|-] --pages ORDER [-o FILE]
filegap info [INPUT|-] [--json]
```

## Input Rules

- `-` means explicit `stdin`.
- If no input is provided and `stdin` is piped, `stdin` is used automatically.
- `merge` supports mixing file + `stdin`:
  - `filegap merge a.pdf - > out.pdf`

## Output Rules

- Default output is `stdout`.
- `-o, --output <file>` writes to file only when explicitly requested.

## Exit Codes

- `0` success
- `1` generic error
- `2` invalid input
- `3` invalid page syntax

## Examples

### Merge

```bash
filegap merge a.pdf b.pdf > out.pdf
filegap merge a.pdf - > out.pdf
cat a.pdf b.pdf | filegap merge > out.pdf
```

### Extract

```bash
filegap extract input.pdf --pages 1-5 > out.pdf
cat input.pdf | filegap extract --pages 1-5 > out.pdf
```

### Reorder

```bash
filegap reorder input.pdf --pages 3,1,2 > out.pdf
cat input.pdf | filegap reorder --pages 5,4,3,2,1 > out.pdf
```

### Split

Single range to stdout:

```bash
filegap split input.pdf --pages 1-3 > part.pdf
```

Multiple ranges to files:

```bash
filegap split input.pdf --pages 1-2,5 --output-pattern "part-%d.pdf"
```

Multiple ranges to zip on stdout:

```bash
filegap split input.pdf --pages 1-2,5 --format zip > parts.zip
```

### Pipeline chaining

```bash
cat input.pdf \
| filegap extract --pages 1-5 \
| filegap reorder --pages 5,4,3,2,1 \
> final.pdf
```
