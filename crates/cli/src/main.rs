use std::fs;
use std::io::{self, IsTerminal, Read, Write};
use std::path::Path;
use std::process::ExitCode;

use clap::{Args, Parser, Subcommand, ValueEnum};
use filegap_core::{
    ops::{extract_pages, inspect_pdf, merge_pdfs, reorder_pages, split_pdf},
    CoreError, ExtractRequest, InfoRequest, MergeRequest, ReorderRequest, SplitMode, SplitRequest,
};
use lopdf::Document;
use serde_json::json;
use zip::write::{SimpleFileOptions, ZipWriter};

#[derive(Debug, Parser)]
#[command(name = "filegap")]
#[command(about = "Private PDF tools that run locally")]
#[command(version)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    #[command(
        about = "Merge multiple PDFs preserving input order",
        after_help = "Examples:\n  filegap merge a.pdf b.pdf > out.pdf\n  filegap merge a.pdf - > out.pdf\n  cat a.pdf b.pdf | filegap merge > out.pdf"
    )]
    Merge(MergeArgs),
    #[command(
        about = "Extract pages from one PDF",
        after_help = "Examples:\n  filegap extract input.pdf --pages 1-3 > out.pdf\n  cat input.pdf | filegap extract --pages 1,3,5 > out.pdf\n  filegap extract - --pages 1-3 -o out.pdf"
    )]
    Extract(ExtractArgs),
    #[command(
        about = "Split one PDF by page ranges",
        after_help = "Examples:\n  filegap split input.pdf --pages 1-3 > out.pdf\n  filegap split input.pdf --pages 1-3,5 --output-pattern \"part-%d.pdf\"\n  filegap split input.pdf --pages 1-3,5 --format zip > parts.zip"
    )]
    Split(SplitArgs),
    #[command(
        about = "Reorder PDF pages",
        after_help = "Examples:\n  filegap reorder input.pdf --pages 3,1,2 > out.pdf\n  cat input.pdf | filegap reorder --pages 5,4,3,2,1 > out.pdf"
    )]
    Reorder(ReorderArgs),
    #[command(
        about = "Show PDF metadata and structure information",
        after_help = "Examples:\n  filegap info input.pdf\n  cat input.pdf | filegap info --json"
    )]
    Info(InfoArgs),
}

#[derive(Debug, Args)]
struct MergeArgs {
    #[arg(value_name = "INPUT", help = "Input PDF files. Use '-' for stdin")]
    inputs: Vec<String>,
    #[arg(
        short,
        long,
        value_name = "FILE",
        help = "Write output to file (default: stdout)"
    )]
    output: Option<String>,
}

#[derive(Debug, Args)]
struct ExtractArgs {
    #[arg(value_name = "INPUT", help = "Input PDF file. Use '-' for stdin")]
    input: Option<String>,
    #[arg(
        short = 'p',
        long = "pages",
        value_name = "RANGES",
        help = "Pages syntax: 1-3,5,7-9"
    )]
    pages: String,
    #[arg(
        short,
        long,
        value_name = "FILE",
        help = "Write output to file (default: stdout)"
    )]
    output: Option<String>,
}

#[derive(Debug, Clone, Copy, ValueEnum, PartialEq, Eq)]
enum SplitFormat {
    Pdf,
    Zip,
}

#[derive(Debug, Args)]
struct SplitArgs {
    #[arg(value_name = "INPUT", help = "Input PDF file. Use '-' for stdin")]
    input: Option<String>,
    #[arg(
        short = 'p',
        long = "pages",
        value_name = "RANGES",
        help = "Pages syntax: 1-3,5,7-9"
    )]
    pages: String,
    #[arg(
        long = "output-pattern",
        value_name = "PATTERN",
        help = "Write multiple parts to files, e.g. part-%d.pdf"
    )]
    output_pattern: Option<String>,
    #[arg(long, value_enum, default_value_t = SplitFormat::Pdf)]
    format: SplitFormat,
    #[arg(
        short,
        long,
        value_name = "FILE",
        help = "Write output to file (default: stdout)"
    )]
    output: Option<String>,
}

#[derive(Debug, Args)]
struct ReorderArgs {
    #[arg(value_name = "INPUT", help = "Input PDF file. Use '-' for stdin")]
    input: Option<String>,
    #[arg(
        short = 'p',
        long = "pages",
        value_name = "ORDER",
        help = "Page order syntax: 3,1,2 or 4-6,1-3"
    )]
    pages: String,
    #[arg(
        short,
        long,
        value_name = "FILE",
        help = "Write output to file (default: stdout)"
    )]
    output: Option<String>,
}

#[derive(Debug, Args)]
struct InfoArgs {
    #[arg(value_name = "INPUT", help = "Input PDF file. Use '-' for stdin")]
    input: Option<String>,
    #[arg(long = "json", help = "Print output as JSON")]
    json: bool,
}

#[derive(Debug)]
struct CliError {
    code: u8,
    message: String,
}

// ⚠️ Do not log user file data. This project is privacy-first.
// Error messages must stay generic and must not include filenames, paths, page counts, or user input.
impl CliError {
    fn generic(message: impl Into<String>) -> Self {
        Self {
            code: 1,
            message: message.into(),
        }
    }

    fn invalid_input(message: impl Into<String>) -> Self {
        Self {
            code: 2,
            message: message.into(),
        }
    }

    fn invalid_page_syntax(message: impl Into<String>) -> Self {
        Self {
            code: 3,
            message: message.into(),
        }
    }

    fn from_core(err: CoreError) -> Self {
        match err {
            CoreError::InvalidInput(message) => {
                if looks_like_page_error(&message) {
                    Self::invalid_page_syntax("invalid page syntax")
                } else {
                    Self::invalid_input("invalid input")
                }
            }
            CoreError::Processing(_) => Self::generic("pdf processing failed"),
            CoreError::Unsupported(_) => Self::generic("unsupported operation"),
        }
    }
}

fn main() -> ExitCode {
    let cli = match Cli::try_parse() {
        Ok(cli) => cli,
        Err(err) => {
            let exit_code = u8::try_from(err.exit_code()).unwrap_or(2);
            let _ = err.print();
            return ExitCode::from(exit_code);
        }
    };

    let result = match cli.command {
        Commands::Merge(args) => handle_merge(args),
        Commands::Extract(args) => handle_extract(args),
        Commands::Split(args) => handle_split(args),
        Commands::Reorder(args) => handle_reorder(args),
        Commands::Info(args) => handle_info(args),
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => {
            eprintln!("Error: {}", err.message);
            ExitCode::from(err.code)
        }
    }
}

fn handle_merge(args: MergeArgs) -> Result<(), CliError> {
    let source_args = if args.inputs.is_empty() && is_stdin_piped() {
        vec!["-".to_string()]
    } else {
        args.inputs
    };

    if source_args.is_empty() {
        return Err(CliError::invalid_input(
            "merge requires at least 2 inputs (file paths or stdin)",
        ));
    }

    let mut stdin_cache = None;
    let mut docs = Vec::new();
    for source in source_args {
        if source == "-" {
            if stdin_cache.is_none() {
                stdin_cache = Some(read_stdin_all()?);
            }
            let stdin_bytes = stdin_cache
                .as_ref()
                .expect("stdin bytes should exist after read");
            let split_docs = split_concatenated_pdf_stream(stdin_bytes);
            if split_docs.is_empty() {
                return Err(CliError::invalid_input(
                    "stdin does not contain a valid PDF stream",
                ));
            }
            docs.extend(split_docs);
        } else {
            docs.push(read_file(&source)?);
        }
    }

    if docs.len() < 2 {
        return Err(CliError::invalid_input(
            "merge requires at least 2 PDFs (example: filegap merge a.pdf b.pdf > out.pdf)",
        ));
    }

    let output = merge_pdfs(&MergeRequest { documents: docs }).map_err(CliError::from_core)?;
    write_bytes_output(&output, args.output.as_deref())
}

fn handle_extract(args: ExtractArgs) -> Result<(), CliError> {
    let input_bytes = read_single_input(args.input.as_deref())?;
    let total_pages = get_page_count(&input_bytes)?;
    parse_page_sequence(&args.pages, total_pages)?;

    let output = extract_pages(&ExtractRequest {
        document: input_bytes,
        page_ranges: args.pages,
    })
    .map_err(CliError::from_core)?;
    write_bytes_output(&output, args.output.as_deref())
}

fn handle_split(args: SplitArgs) -> Result<(), CliError> {
    let input_bytes = read_single_input(args.input.as_deref())?;
    let total_pages = get_page_count(&input_bytes)?;
    let groups = parse_page_groups(&args.pages, total_pages)?;
    let normalized_ranges = groups
        .iter()
        .map(|group| {
            if group.len() == 1 {
                group[0].to_string()
            } else {
                format!("{}-{}", group[0], group[group.len() - 1])
            }
        })
        .collect::<Vec<_>>()
        .join(",");

    if args.format == SplitFormat::Zip && args.output_pattern.is_some() {
        return Err(CliError::invalid_input(
            "--output-pattern cannot be used with --format zip",
        ));
    }

    if args.format == SplitFormat::Pdf && groups.len() > 1 && args.output_pattern.is_none() {
        return Err(CliError::invalid_input(
            "multiple ranges require --output-pattern or --format zip",
        ));
    }

    if groups.len() == 1 && args.format == SplitFormat::Pdf && args.output_pattern.is_none() {
        let output = extract_pages(&ExtractRequest {
            document: input_bytes,
            page_ranges: normalized_ranges,
        })
        .map_err(CliError::from_core)?;
        return write_bytes_output(&output, args.output.as_deref());
    }

    let parts = split_pdf(&SplitRequest {
        document: input_bytes,
        mode: SplitMode::ByPageRanges(normalized_ranges),
    })
    .map_err(CliError::from_core)?;

    match args.format {
        SplitFormat::Pdf => {
            let pattern = args
                .output_pattern
                .as_deref()
                .ok_or_else(|| CliError::invalid_input("missing --output-pattern"))?;
            write_parts_to_pattern(pattern, &parts)
        }
        SplitFormat::Zip => {
            let zip_bytes = build_zip(parts)?;
            write_bytes_output(&zip_bytes, args.output.as_deref())
        }
    }
}

fn handle_reorder(args: ReorderArgs) -> Result<(), CliError> {
    let input_bytes = read_single_input(args.input.as_deref())?;
    let total_pages = get_page_count(&input_bytes)?;
    let page_order = parse_page_sequence(&args.pages, total_pages)?;

    let output = reorder_pages(&ReorderRequest {
        document: input_bytes,
        page_order,
    })
    .map_err(CliError::from_core)?;
    write_bytes_output(&output, args.output.as_deref())
}

fn handle_info(args: InfoArgs) -> Result<(), CliError> {
    let input_bytes = read_single_input(args.input.as_deref())?;
    let size_bytes = input_bytes.len() as u64;
    let info = inspect_pdf(&InfoRequest {
        document: input_bytes,
    })
    .map_err(CliError::from_core)?;

    if args.json {
        let payload = json!({
            "size_bytes": size_bytes,
            "pdf_version": info.pdf_version,
            "pages": info.page_count,
            "encrypted": info.is_encrypted,
            "title": info.title,
            "author": info.author,
            "creator": info.creator,
            "producer": info.producer,
            "creation_date": info.creation_date,
            "modification_date": info.modification_date
        });
        println!(
            "{}",
            serde_json::to_string_pretty(&payload)
                .map_err(|err| CliError::generic(format!("failed to serialize JSON: {err}")))?
        );
    } else {
        println!("Size (bytes): {size_bytes}");
        println!("PDF Version: {}", info.pdf_version);
        println!("Pages: {}", info.page_count);
        println!(
            "Encrypted: {}",
            if info.is_encrypted { "yes" } else { "no" }
        );
        println!("Title: {}", info.title.unwrap_or_else(|| "-".to_string()));
        println!("Author: {}", info.author.unwrap_or_else(|| "-".to_string()));
        println!(
            "Creator: {}",
            info.creator.unwrap_or_else(|| "-".to_string())
        );
        println!(
            "Producer: {}",
            info.producer.unwrap_or_else(|| "-".to_string())
        );
        println!(
            "Creation Date: {}",
            info.creation_date.unwrap_or_else(|| "-".to_string())
        );
        println!(
            "Modification Date: {}",
            info.modification_date.unwrap_or_else(|| "-".to_string())
        );
    }

    Ok(())
}

fn read_single_input(input: Option<&str>) -> Result<Vec<u8>, CliError> {
    match input {
        Some("-") => read_stdin_all(),
        Some(path) => read_file(path),
        None if is_stdin_piped() => read_stdin_all(),
        None => Err(CliError::invalid_input(
            "missing input PDF (provide a path, '-' for stdin, or pipe input)",
        )),
    }
}

fn read_file(path: &str) -> Result<Vec<u8>, CliError> {
    fs::read(path).map_err(|err| CliError::generic(format!("failed to read input file: {err}")))
}

fn read_stdin_all() -> Result<Vec<u8>, CliError> {
    let mut bytes = Vec::new();
    io::stdin()
        .read_to_end(&mut bytes)
        .map_err(|err| CliError::generic(format!("failed to read stdin: {err}")))?;

    if bytes.is_empty() {
        return Err(CliError::invalid_input("stdin is empty"));
    }

    Ok(bytes)
}

fn write_bytes_output(bytes: &[u8], output: Option<&str>) -> Result<(), CliError> {
    if let Some(path) = output {
        fs::write(path, bytes)
            .map_err(|err| CliError::generic(format!("failed to write output file: {err}")))?;
        return Ok(());
    }

    let mut stdout = io::stdout().lock();
    stdout
        .write_all(bytes)
        .map_err(|err| CliError::generic(format!("failed to write stdout: {err}")))?;
    stdout
        .flush()
        .map_err(|err| CliError::generic(format!("failed to flush stdout: {err}")))?;
    Ok(())
}

fn write_parts_to_pattern(pattern: &str, parts: &[Vec<u8>]) -> Result<(), CliError> {
    if !pattern.contains("%d") {
        return Err(CliError::invalid_input(
            "output pattern must contain %d placeholder",
        ));
    }

    for (index, part) in parts.iter().enumerate() {
        let filename = pattern.replace("%d", &(index + 1).to_string());
        if let Some(parent) = Path::new(&filename).parent() {
            if !parent.as_os_str().is_empty() {
                fs::create_dir_all(parent).map_err(|err| {
                    CliError::generic(format!("failed to create output directory: {err}"))
                })?;
            }
        }

        fs::write(&filename, part).map_err(|err| {
            CliError::generic(format!("failed to write one of the output files: {err}"))
        })?;
    }
    Ok(())
}

fn build_zip(parts: Vec<Vec<u8>>) -> Result<Vec<u8>, CliError> {
    let mut cursor = io::Cursor::new(Vec::new());
    let mut writer = ZipWriter::new(&mut cursor);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for (index, part) in parts.iter().enumerate() {
        let name = format!("part-{}.pdf", index + 1);
        writer
            .start_file(name, options)
            .map_err(|err| CliError::generic(format!("failed to write zip entry: {err}")))?;
        writer
            .write_all(part)
            .map_err(|err| CliError::generic(format!("failed to write zip entry data: {err}")))?;
    }

    writer
        .finish()
        .map_err(|err| CliError::generic(format!("failed to finalize zip: {err}")))?;
    Ok(cursor.into_inner())
}

fn get_page_count(bytes: &[u8]) -> Result<u32, CliError> {
    let doc = Document::load_mem(bytes)
        .map_err(|_| CliError::invalid_input("failed to parse input PDF"))?;
    let count = doc.get_pages().len() as u32;
    if count == 0 {
        return Err(CliError::invalid_input("input PDF has no pages"));
    }
    Ok(count)
}

fn parse_page_groups(input: &str, total_pages: u32) -> Result<Vec<Vec<u32>>, CliError> {
    let mut groups = Vec::new();
    for token in input
        .split(',')
        .map(str::trim)
        .filter(|token| !token.is_empty())
    {
        let pages = parse_range_token(token, total_pages)?;
        groups.push(pages);
    }

    if groups.is_empty() {
        return Err(CliError::invalid_page_syntax("invalid page syntax"));
    }

    Ok(groups)
}

fn parse_page_sequence(input: &str, total_pages: u32) -> Result<Vec<u32>, CliError> {
    let groups = parse_page_groups(input, total_pages)?;
    Ok(groups.into_iter().flatten().collect())
}

fn parse_range_token(token: &str, total_pages: u32) -> Result<Vec<u32>, CliError> {
    if let Some((start_raw, end_raw)) = token.split_once('-') {
        let start = parse_page_number(start_raw.trim(), total_pages)?;
        let end = parse_page_number(end_raw.trim(), total_pages)?;
        if start > end {
            return Err(CliError::invalid_page_syntax("invalid page syntax"));
        }
        return Ok((start..=end).collect());
    }

    Ok(vec![parse_page_number(token, total_pages)?])
}

fn parse_page_number(value: &str, total_pages: u32) -> Result<u32, CliError> {
    let page = value
        .parse::<u32>()
        .map_err(|_| CliError::invalid_page_syntax("invalid page syntax"))?;
    if page == 0 || page > total_pages {
        return Err(CliError::invalid_page_syntax("invalid page syntax"));
    }
    Ok(page)
}

fn split_concatenated_pdf_stream(input: &[u8]) -> Vec<Vec<u8>> {
    let marker = b"%PDF-";
    let mut starts = Vec::new();
    let mut index = 0usize;

    while index + marker.len() <= input.len() {
        if &input[index..index + marker.len()] == marker {
            starts.push(index);
            index += marker.len();
        } else {
            index += 1;
        }
    }

    if starts.is_empty() {
        return Vec::new();
    }

    let mut docs = Vec::new();
    for (idx, start) in starts.iter().enumerate() {
        let end = if idx + 1 < starts.len() {
            starts[idx + 1]
        } else {
            input.len()
        };
        let candidate = input[*start..end].to_vec();
        if Document::load_mem(&candidate).is_ok() {
            docs.push(candidate);
        }
    }

    docs
}

fn looks_like_page_error(message: &str) -> bool {
    let msg = message.to_lowercase();
    msg.contains("page") || msg.contains("range")
}

fn is_stdin_piped() -> bool {
    !io::stdin().is_terminal()
}
