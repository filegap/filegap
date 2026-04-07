use std::fs;
use std::path::Path;
use std::process::Command;

use filegap_core::{
    ops::{
        compress_pdf as core_compress_pdf, extract_pages as core_extract_pages,
        inspect_pdf as core_inspect_pdf, merge_pdfs as core_merge_pdfs,
        optimize_pdf as core_optimize_pdf,
        reorder_pages as core_reorder_pages, split_pdf as core_split_pdf,
    },
    CompressionPreset, CompressRequest, CoreError, ExtractRequest, MergeRequest,
    InfoRequest, OptimizeRequest, ReorderRequest, SplitMode, SplitRequest,
};
use lopdf::Document;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct MergeResult {
    pub output_path: String,
    pub input_count: usize,
}

#[derive(Debug, Serialize)]
pub struct SplitResult {
    pub output_dir: String,
    pub output_count: usize,
    pub first_output_path: String,
}

#[derive(Debug, Serialize)]
pub struct ExtractResult {
    pub output_path: String,
}

#[derive(Debug, Serialize)]
pub struct ReorderResult {
    pub output_path: String,
}

#[derive(Debug, Serialize)]
pub struct OptimizeResult {
    pub output_path: String,
}

#[derive(Debug, Serialize)]
pub struct CompressResult {
    pub output_path: String,
}

#[derive(Debug, Serialize)]
pub struct PdfFileInfo {
    pub path: String,
    pub size_bytes: u64,
    pub page_count: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct PdfMetadata {
    pub size_bytes: u64,
    pub pdf_version: String,
    pub pages: u32,
    pub encrypted: bool,
    pub title: Option<String>,
    pub author: Option<String>,
    pub creator: Option<String>,
    pub producer: Option<String>,
    pub creation_date: Option<String>,
    pub modification_date: Option<String>,
}

fn map_core_error(err: CoreError) -> String {
    match err {
        CoreError::InvalidInput(_) => "Invalid input PDF files.".to_string(),
        CoreError::Processing(_) => "PDF processing failed.".to_string(),
        CoreError::Unsupported(_) => "Unsupported PDF operation.".to_string(),
    }
}

fn parse_compression_preset(preset: &str) -> Result<CompressionPreset, String> {
    match preset.trim().to_ascii_lowercase().as_str() {
        "low" => Ok(CompressionPreset::Low),
        "balanced" => Ok(CompressionPreset::Balanced),
        "strong" => Ok(CompressionPreset::Strong),
        _ => Err("Invalid compression preset.".to_string()),
    }
}

fn inspect_pdf_file(path: &str) -> PdfFileInfo {
    let size_bytes = fs::metadata(path).map(|meta| meta.len()).unwrap_or(0);
    let page_count = fs::read(path)
        .ok()
        .and_then(|bytes| Document::load_mem(&bytes).ok())
        .map(|doc| doc.get_pages().len() as u32);

    PdfFileInfo {
        path: path.to_string(),
        size_bytes,
        page_count,
    }
}

#[tauri::command]
pub async fn merge_pdfs(input_paths: Vec<String>, output_path: String) -> Result<MergeResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_paths.len() < 2 {
            return Err("Select at least 2 PDF files.".to_string());
        }

        if output_path.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }

        let mut documents = Vec::with_capacity(input_paths.len());
        for path in &input_paths {
            let bytes = fs::read(path).map_err(|_| "Failed to read one or more input PDF files.".to_string())?;
            if bytes.is_empty() {
                return Err("One or more input files are empty.".to_string());
            }
            documents.push(bytes);
        }

        let merged = core_merge_pdfs(&MergeRequest { documents }).map_err(map_core_error)?;
        fs::write(&output_path, merged).map_err(|_| "Failed to write merged PDF.".to_string())?;

        Ok(MergeResult {
            output_path,
            input_count: input_paths.len(),
        })
    })
    .await
    .map_err(|_| "Failed to complete merge operation.".to_string())?
}

#[tauri::command]
pub async fn split_pdf(
    input_path: String,
    output_dir: String,
    output_base_name: String,
    pages_per_file: u32,
    page_ranges: Option<String>,
) -> Result<SplitResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        if output_dir.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }
        if output_base_name.trim().is_empty() {
            return Err("Provide a valid output file name.".to_string());
        }

        let input_bytes = fs::read(&input_path).map_err(|_| "Failed to read input PDF file.".to_string())?;
        let split_mode = page_ranges
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
            .map(|value| SplitMode::ByPageRanges(value.to_string()))
            .unwrap_or(SplitMode::EveryNPages(pages_per_file));

        let parts = core_split_pdf(&SplitRequest {
            document: input_bytes,
            mode: split_mode,
        })
        .map_err(map_core_error)?;

        let base_name = output_base_name.trim().trim_end_matches(".pdf");
        let mut first_output_path = String::new();
        for (index, part) in parts.iter().enumerate() {
            let part_path = Path::new(&output_dir)
                .join(format!("{base_name}-part-{}.pdf", index + 1))
                .to_string_lossy()
                .to_string();
            fs::write(&part_path, part).map_err(|_| "Failed to write split output PDF.".to_string())?;
            if index == 0 {
                first_output_path = part_path;
            }
        }

        Ok(SplitResult {
            output_dir,
            output_count: parts.len(),
            first_output_path,
        })
    })
    .await
    .map_err(|_| "Failed to complete split operation.".to_string())?
}

#[tauri::command]
pub async fn extract_pages(
    input_path: String,
    output_path: String,
    page_ranges: String,
) -> Result<ExtractResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        if output_path.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }

        let input_bytes = fs::read(&input_path).map_err(|_| "Failed to read input PDF file.".to_string())?;
        let extracted = core_extract_pages(&ExtractRequest {
            document: input_bytes,
            page_ranges,
        })
        .map_err(map_core_error)?;

        fs::write(&output_path, extracted).map_err(|_| "Failed to write extracted PDF.".to_string())?;

        Ok(ExtractResult { output_path })
    })
    .await
    .map_err(|_| "Failed to complete extract operation.".to_string())?
}

#[tauri::command]
pub async fn reorder_pdf(
    input_path: String,
    output_path: String,
    page_order: Vec<u32>,
) -> Result<ReorderResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        if output_path.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }

        let input_bytes = fs::read(&input_path).map_err(|_| "Failed to read input PDF file.".to_string())?;
        let reordered = core_reorder_pages(&ReorderRequest {
            document: input_bytes,
            page_order,
        })
        .map_err(map_core_error)?;

        fs::write(&output_path, reordered).map_err(|_| "Failed to write reordered PDF.".to_string())?;

        Ok(ReorderResult { output_path })
    })
    .await
    .map_err(|_| "Failed to complete reorder operation.".to_string())?
}

#[tauri::command]
pub async fn optimize_pdf(input_path: String, output_path: String) -> Result<OptimizeResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        if output_path.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }

        let input_bytes = fs::read(&input_path).map_err(|_| "Failed to read input PDF file.".to_string())?;
        let optimized = core_optimize_pdf(&OptimizeRequest {
            document: input_bytes,
        })
        .map_err(map_core_error)?;

        fs::write(&output_path, optimized).map_err(|_| "Failed to write optimized PDF.".to_string())?;

        Ok(OptimizeResult { output_path })
    })
    .await
    .map_err(|_| "Failed to complete optimize operation.".to_string())?
}

#[tauri::command]
pub async fn compress_pdf(
    input_path: String,
    output_path: String,
    preset: String,
) -> Result<CompressResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        if output_path.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }

        let compression_preset = parse_compression_preset(&preset)?;
        let input_bytes = fs::read(&input_path).map_err(|_| "Failed to read input PDF file.".to_string())?;
        let compressed = core_compress_pdf(&CompressRequest {
            document: input_bytes,
            preset: compression_preset,
        })
        .map_err(map_core_error)?;

        fs::write(&output_path, compressed).map_err(|_| "Failed to write compressed PDF.".to_string())?;

        Ok(CompressResult { output_path })
    })
    .await
    .map_err(|_| "Failed to complete compress operation.".to_string())?
}

#[tauri::command]
pub async fn inspect_pdf_files(paths: Vec<String>) -> Result<Vec<PdfFileInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        paths
            .into_iter()
            .map(|path| inspect_pdf_file(&path))
            .collect::<Vec<PdfFileInfo>>()
    })
    .await
    .map_err(|_| "Failed to inspect selected PDF files.".to_string())
}

#[tauri::command]
pub async fn inspect_pdf_metadata(path: String) -> Result<PdfMetadata, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }

        let bytes = fs::read(path).map_err(|_| "Failed to read input PDF file.".to_string())?;
        let size_bytes = bytes.len() as u64;
        let info = core_inspect_pdf(&InfoRequest { document: bytes }).map_err(map_core_error)?;

        Ok(PdfMetadata {
            size_bytes,
            pdf_version: info.pdf_version,
            pages: info.page_count,
            encrypted: info.is_encrypted,
            title: info.title,
            author: info.author,
            creator: info.creator,
            producer: info.producer,
            creation_date: info.creation_date,
            modification_date: info.modification_date,
        })
    })
    .await
    .map_err(|_| "Failed to inspect selected PDF files.".to_string())?
}

#[tauri::command]
pub async fn read_pdf_bytes(path: String) -> Result<Vec<u8>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if path.trim().is_empty() {
            return Err("Select a valid input PDF file.".to_string());
        }
        fs::read(path).map_err(|_| "Failed to read input PDF file.".to_string())
    })
    .await
    .map_err(|_| "Failed to read input PDF file.".to_string())?
}

#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err("Target path does not exist.".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(path)
            .status()
            .map_err(|_| "Failed to open file location.".to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(path)
            .status()
            .map_err(|_| "Failed to open file location.".to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        let folder = target
            .parent()
            .and_then(|value| value.to_str())
            .ok_or_else(|| "Failed to resolve folder path.".to_string())?;
        Command::new("xdg-open")
            .arg(folder)
            .status()
            .map_err(|_| "Failed to open file location.".to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if !target.exists() {
        return Err("Target path does not exist.".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .status()
            .map_err(|_| "Failed to open file.".to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .arg("/C")
            .arg("start")
            .arg("")
            .arg(path)
            .status()
            .map_err(|_| "Failed to open file.".to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path)
            .status()
            .map_err(|_| "Failed to open file.".to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}
