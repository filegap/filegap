use std::fs;

use anyhow::{bail, Context, Result};
use clap::{Args, Parser, Subcommand};
use pdflo_core::{ops::merge_pdfs, MergeRequest};

#[derive(Debug, Parser)]
#[command(name = "pdflo")]
#[command(about = "Privacy-first PDF tools that run locally")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Merge(MergeArgs),
    Extract(ExtractArgs),
    Split(SplitArgs),
    Reorder(ReorderArgs),
    Info(InfoArgs),
}

#[derive(Debug, Args)]
struct MergeArgs {
    #[arg(short = 'i', long = "input", required = true, num_args = 2..)]
    input: Vec<String>,
    #[arg(short, long)]
    output: String,
}

#[derive(Debug, Args)]
struct ExtractArgs {
    #[arg(short = 'i', long = "input")]
    input: String,
    #[arg(short = 'p', long = "pages")]
    pages: String,
    #[arg(short, long)]
    output: String,
}

#[derive(Debug, Args)]
struct SplitArgs {
    #[arg(short = 'i', long = "input")]
    input: String,
    #[arg(long = "every")]
    every: Option<u32>,
    #[arg(long = "ranges")]
    ranges: Option<String>,
    #[arg(short = 'd', long = "out-dir")]
    out_dir: String,
}

#[derive(Debug, Args)]
struct ReorderArgs {
    #[arg(short = 'i', long = "input")]
    input: String,
    #[arg(short = 'p', long = "pages")]
    pages: String,
    #[arg(short, long)]
    output: String,
}

#[derive(Debug, Args)]
struct InfoArgs {
    #[arg(short = 'i', long = "input")]
    input: String,
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
            println!(
                "[stub] extract -> input: {}, pages: {}, output: {}",
                args.input, args.pages, args.output
            );
        }
        Commands::Split(args) => {
            let has_every = args.every.is_some();
            let has_ranges = args.ranges.is_some();

            if has_every == has_ranges {
                bail!("choose exactly one split mode: --every or --ranges");
            }

            println!(
                "[stub] split -> input: {}, every: {:?}, ranges: {:?}, out_dir: {}",
                args.input, args.every, args.ranges, args.out_dir
            );
        }
        Commands::Reorder(args) => {
            println!(
                "[stub] reorder -> input: {}, pages: {}, output: {}",
                args.input, args.pages, args.output
            );
        }
        Commands::Info(args) => {
            println!("[stub] info -> input: {}", args.input);
        }
    }

    Ok(())
}
