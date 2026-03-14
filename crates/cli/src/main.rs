use std::fs;
use std::path::Path;

use anyhow::{bail, Context, Result};
use clap::{Args, Parser, Subcommand};
use pdflo_core::{
    ops::{extract_pages, inspect_pdf, merge_pdfs, reorder_pages, split_pdf},
    ExtractRequest, InfoRequest, MergeRequest, ReorderRequest, SplitMode, SplitRequest,
};
use serde_json::json;

#[derive(Debug, Parser)]
#[command(name = "pdflo")]
#[command(about = "Privacy-first PDF tools that run locally")]
#[command(
    after_help = "Examples:\n  pdflo merge -i a.pdf b.pdf -o merged.pdf\n  pdflo extract -i in.pdf -p 2-4 -o out.pdf\n  pdflo split -i in.pdf --every 2 -d ./out\n  pdflo reorder -i in.pdf -p 3,1,2 -o out.pdf\n  pdflo info -i in.pdf"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    #[command(about = "Merge multiple PDF files into one output PDF")]
    Merge(MergeArgs),
    #[command(about = "Extract selected pages from a PDF into a new PDF")]
    Extract(ExtractArgs),
    #[command(about = "Split a PDF into multiple output files")]
    Split(SplitArgs),
    #[command(about = "Reorder pages in a PDF and save a new file")]
    Reorder(ReorderArgs),
    #[command(about = "Show metadata and structure information for a PDF")]
    Info(InfoArgs),
}

#[derive(Debug, Args)]
struct MergeArgs {
    #[arg(short = 'i', long = "input", required = true, num_args = 2.., value_name = "PDF", help = "Input PDF files (at least 2)")]
    input: Vec<String>,
    #[arg(short, long, value_name = "PDF", help = "Output PDF file")]
    output: String,
}

#[derive(Debug, Args)]
struct ExtractArgs {
    #[arg(
        short = 'i',
        long = "input",
        value_name = "PDF",
        help = "Input PDF file"
    )]
    input: String,
    #[arg(
        short = 'p',
        long = "pages",
        value_name = "RANGE",
        help = "Page selection, example: 1,3,5-8"
    )]
    pages: String,
    #[arg(short, long, value_name = "PDF", help = "Output PDF file")]
    output: String,
}

#[derive(Debug, Args)]
struct SplitArgs {
    #[arg(
        short = 'i',
        long = "input",
        value_name = "PDF",
        help = "Input PDF file"
    )]
    input: String,
    #[arg(long = "every", value_name = "N", help = "Split every N pages")]
    every: Option<u32>,
    #[arg(
        long = "ranges",
        value_name = "RANGES",
        help = "Split by ranges, example: 1-2,5"
    )]
    ranges: Option<String>,
    #[arg(
        short = 'd',
        long = "out-dir",
        value_name = "DIR",
        help = "Output directory for split files"
    )]
    out_dir: String,
}

#[derive(Debug, Args)]
struct ReorderArgs {
    #[arg(
        short = 'i',
        long = "input",
        value_name = "PDF",
        help = "Input PDF file"
    )]
    input: String,
    #[arg(
        short = 'p',
        long = "pages",
        value_name = "ORDER",
        help = "Page order, example: 3,1,2 or 4-6,1-3"
    )]
    pages: String,
    #[arg(short, long, value_name = "PDF", help = "Output PDF file")]
    output: String,
}

#[derive(Debug, Args)]
struct InfoArgs {
    #[arg(
        short = 'i',
        long = "input",
        value_name = "PDF",
        help = "Input PDF file"
    )]
    input: String,
    #[arg(long = "json", help = "Print output as JSON")]
    json: bool,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Merge(args) => {
            let mut documents = Vec::with_capacity(args.input.len());
            for input in &args.input {
                let bytes = fs::read(input)
                    .with_context(|| format!("failed to read input PDF: {input}"))?;
                documents.push(bytes);
            }

            let request = MergeRequest { documents };
            let output_bytes = merge_pdfs(&request).context("merge operation failed")?;
            fs::write(&args.output, output_bytes)
                .with_context(|| format!("failed to write output PDF: {}", args.output))?;

            println!("merged {} files into {}", args.input.len(), args.output);
        }
        Commands::Extract(args) => {
            let input_bytes = fs::read(&args.input)
                .with_context(|| format!("failed to read input PDF: {}", args.input))?;

            let request = ExtractRequest {
                document: input_bytes,
                page_ranges: args.pages.clone(),
            };

            let output_bytes = extract_pages(&request).context("extract operation failed")?;
            fs::write(&args.output, output_bytes)
                .with_context(|| format!("failed to write output PDF: {}", args.output))?;

            println!(
                "extracted pages {} from {} into {}",
                args.pages, args.input, args.output
            );
        }
        Commands::Split(args) => {
            let has_every = args.every.is_some();
            let has_ranges = args.ranges.is_some();

            if has_every == has_ranges {
                bail!("choose exactly one split mode: --every or --ranges");
            }

            let input_bytes = fs::read(&args.input)
                .with_context(|| format!("failed to read input PDF: {}", args.input))?;
            let mode = if let Some(n) = args.every {
                SplitMode::EveryNPages(n)
            } else {
                SplitMode::ByPageRanges(args.ranges.clone().expect("ranges should be set"))
            };
            let request = SplitRequest {
                document: input_bytes,
                mode,
            };

            let outputs = split_pdf(&request).context("split operation failed")?;
            fs::create_dir_all(&args.out_dir)
                .with_context(|| format!("failed to create output directory: {}", args.out_dir))?;

            let stem = Path::new(&args.input)
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("output");

            for (index, output_bytes) in outputs.iter().enumerate() {
                let output_path =
                    Path::new(&args.out_dir).join(format!("{stem}_part_{:03}.pdf", index + 1));
                fs::write(&output_path, output_bytes).with_context(|| {
                    format!("failed to write split output: {}", output_path.display())
                })?;
            }

            println!("split {} into {} file(s)", args.input, outputs.len());
        }
        Commands::Reorder(args) => {
            let input_bytes = fs::read(&args.input)
                .with_context(|| format!("failed to read input PDF: {}", args.input))?;
            let page_order = parse_page_order(&args.pages)?;
            let request = ReorderRequest {
                document: input_bytes,
                page_order,
            };

            let output_bytes = reorder_pages(&request).context("reorder operation failed")?;
            fs::write(&args.output, output_bytes)
                .with_context(|| format!("failed to write output PDF: {}", args.output))?;

            println!(
                "reordered pages {} from {} into {}",
                args.pages, args.input, args.output
            );
        }
        Commands::Info(args) => {
            let input_bytes = fs::read(&args.input)
                .with_context(|| format!("failed to read input PDF: {}", args.input))?;
            let request = InfoRequest {
                document: input_bytes,
            };
            let info = inspect_pdf(&request).context("info operation failed")?;
            let size_bytes = fs::metadata(&args.input)
                .with_context(|| format!("failed to read file metadata: {}", args.input))?
                .len();

            if args.json {
                let payload = json!({
                    "file": args.input,
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
                        .context("failed to serialize info JSON output")?
                );
            } else {
                println!("File: {}", args.input);
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
        }
    }

    Ok(())
}

fn parse_page_order(input: &str) -> Result<Vec<u32>> {
    let mut pages = Vec::new();
    for token in input
        .split(',')
        .map(str::trim)
        .filter(|token| !token.is_empty())
    {
        if let Some((start, end)) = token.split_once('-') {
            let start = start
                .trim()
                .parse::<u32>()
                .with_context(|| format!("invalid page number in range: `{token}`"))?;
            let end = end
                .trim()
                .parse::<u32>()
                .with_context(|| format!("invalid page number in range: `{token}`"))?;
            if start > end {
                bail!("invalid range `{token}`: start cannot be greater than end");
            }
            pages.extend(start..=end);
        } else {
            let page = token
                .parse::<u32>()
                .with_context(|| format!("invalid page number `{token}`"))?;
            pages.push(page);
        }
    }

    if pages.is_empty() {
        bail!("page order cannot be empty (example: 3,1,2)");
    }

    Ok(pages)
}
