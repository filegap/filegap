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
use serde::{Deserialize, Serialize};

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
pub struct WorkflowRunResult {
    pub output_path: String,
    pub output_count: usize,
    pub is_split_output: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowDraftInput {
    pub input_mode: String,
    pub steps: Vec<WorkflowStepInput>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStepInput {
    pub operation: String,
    pub page_ranges: String,
    pub page_order: String,
    pub split_ranges: String,
    pub compression_preset: String,
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

fn normalize_pdf_output_name(name: &str) -> String {
    let trimmed = name.trim();
    if trimmed.to_ascii_lowercase().ends_with(".pdf") {
        trimmed.to_string()
    } else {
        format!("{trimmed}.pdf")
    }
}

fn normalize_split_base_name(name: &str) -> String {
    name.trim().trim_end_matches(".pdf").to_string()
}

fn page_count_from_bytes(bytes: &[u8]) -> Result<u32, String> {
    Document::load_mem(bytes)
        .map(|doc| doc.get_pages().len() as u32)
        .map_err(|_| "Failed to inspect workflow PDF step.".to_string())
}

fn parse_page_order_input(value: &str, page_count: u32) -> Result<Vec<u32>, String> {
    let cleaned = value.trim();
    if cleaned.is_empty() {
        return Err("Page order is required.".to_string());
    }
    if page_count == 0 {
        return Err("No pages are available to reorder.".to_string());
    }

    let tokens: Vec<&str> = cleaned
        .split(',')
        .map(|item| item.trim())
        .filter(|item| !item.is_empty())
        .collect();

    if tokens.len() != page_count as usize {
        return Err(format!(
            "Provide exactly {} pages in the new order.",
            page_count
        ));
    }

    let mut pages = Vec::with_capacity(tokens.len());
    for token in tokens {
        let page = token
            .parse::<u32>()
            .map_err(|_| "Page order must contain numbers separated by commas.".to_string())?;
        if page < 1 || page > page_count {
            return Err(format!("Page order must stay within 1-{}.", page_count));
        }
        if pages.contains(&page) {
            return Err("Page order contains duplicate page numbers.".to_string());
        }
        pages.push(page);
    }

    Ok(pages)
}

enum WorkflowState {
    Single(Vec<u8>),
    Multiple(Vec<Vec<u8>>),
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
pub async fn execute_workflow(
    input_paths: Vec<String>,
    output_dir: String,
    output_name: String,
    draft: WorkflowDraftInput,
) -> Result<WorkflowRunResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        if input_paths.is_empty() {
            return Err("Select one or more PDF files.".to_string());
        }
        if output_dir.trim().is_empty() {
            return Err("Select a valid output destination.".to_string());
        }
        if output_name.trim().is_empty() {
            return Err("Provide a valid output file name.".to_string());
        }
        if draft.steps.is_empty() {
            return Err("Add at least one workflow step.".to_string());
        }

        let mut loaded_inputs = Vec::with_capacity(input_paths.len());
        for path in &input_paths {
            let bytes = fs::read(path).map_err(|_| "Failed to read one or more input PDF files.".to_string())?;
            if bytes.is_empty() {
                return Err("One or more input files are empty.".to_string());
            }
            loaded_inputs.push(bytes);
        }

        let _ = draft.input_mode.as_str();

        let mut state = if loaded_inputs.len() == 1 {
            WorkflowState::Single(loaded_inputs.remove(0))
        } else {
            WorkflowState::Multiple(loaded_inputs)
        };

        let last_step_index = draft.steps.len() - 1;

        for (index, step) in draft.steps.iter().enumerate() {
            match step.operation.trim().to_ascii_lowercase().as_str() {
                "merge" => {
                    if index != 0 {
                        return Err("Merge can only be the first workflow step.".to_string());
                    }
                    let documents = match state {
                        WorkflowState::Multiple(docs) if docs.len() >= 2 => docs,
                        _ => return Err("Merge requires at least two input PDFs.".to_string()),
                    };
                    let merged =
                        core_merge_pdfs(&MergeRequest { documents }).map_err(map_core_error)?;
                    state = WorkflowState::Single(merged);
                }
                "extract" => {
                    let document = match state {
                        WorkflowState::Single(doc) => doc,
                        WorkflowState::Multiple(_) => {
                            return Err(
                                "Use Merge as the first step to work with multiple input PDFs."
                                    .to_string(),
                            )
                        }
                    };
                    let ranges = if step.page_ranges.trim().is_empty() {
                        "1-3".to_string()
                    } else {
                        step.page_ranges.trim().to_string()
                    };
                    let extracted = core_extract_pages(&ExtractRequest {
                        document,
                        page_ranges: ranges,
                    })
                    .map_err(map_core_error)?;
                    state = WorkflowState::Single(extracted);
                }
                "reorder" => {
                    let document = match state {
                        WorkflowState::Single(doc) => doc,
                        WorkflowState::Multiple(_) => {
                            return Err(
                                "Use Merge as the first step to work with multiple input PDFs."
                                    .to_string(),
                            )
                        }
                    };
                    let page_count = page_count_from_bytes(&document)?;
                    let page_order = parse_page_order_input(&step.page_order, page_count)?;
                    let reordered = core_reorder_pages(&ReorderRequest {
                        document,
                        page_order,
                    })
                    .map_err(map_core_error)?;
                    state = WorkflowState::Single(reordered);
                }
                "optimize" => {
                    let document = match state {
                        WorkflowState::Single(doc) => doc,
                        WorkflowState::Multiple(_) => {
                            return Err(
                                "Use Merge as the first step to work with multiple input PDFs."
                                    .to_string(),
                            )
                        }
                    };
                    let optimized =
                        core_optimize_pdf(&OptimizeRequest { document }).map_err(map_core_error)?;
                    state = WorkflowState::Single(optimized);
                }
                "compress" => {
                    let document = match state {
                        WorkflowState::Single(doc) => doc,
                        WorkflowState::Multiple(_) => {
                            return Err(
                                "Use Merge as the first step to work with multiple input PDFs."
                                    .to_string(),
                            )
                        }
                    };
                    let preset = parse_compression_preset(&step.compression_preset)?;
                    let compressed = core_compress_pdf(&CompressRequest { document, preset })
                        .map_err(map_core_error)?;
                    state = WorkflowState::Single(compressed);
                }
                "split" => {
                    if index != last_step_index {
                        return Err("Split must be the last workflow step.".to_string());
                    }
                    let document = match state {
                        WorkflowState::Single(doc) => doc,
                        WorkflowState::Multiple(_) => {
                            return Err(
                                "Use Merge as the first step to work with multiple input PDFs."
                                    .to_string(),
                            )
                        }
                    };
                    let split_ranges = if step.split_ranges.trim().is_empty() {
                        "1-2,3-4".to_string()
                    } else {
                        step.split_ranges.trim().to_string()
                    };
                    let parts = core_split_pdf(&SplitRequest {
                        document,
                        mode: SplitMode::ByPageRanges(split_ranges),
                    })
                    .map_err(map_core_error)?;

                    let base_name = normalize_split_base_name(&output_name);
                    if base_name.is_empty() {
                        return Err("Provide a valid output file name.".to_string());
                    }

                    let mut first_output_path = String::new();
                    for (part_index, part) in parts.iter().enumerate() {
                        let part_path = Path::new(&output_dir)
                            .join(format!("{base_name}-part-{}.pdf", part_index + 1))
                            .to_string_lossy()
                            .to_string();
                        fs::write(&part_path, part)
                            .map_err(|_| "Failed to write workflow output PDF.".to_string())?;
                        if part_index == 0 {
                            first_output_path = part_path;
                        }
                    }

                    return Ok(WorkflowRunResult {
                        output_path: first_output_path,
                        output_count: parts.len(),
                        is_split_output: true,
                    });
                }
                _ => return Err("Unsupported workflow step.".to_string()),
            }
        }

        let document = match state {
            WorkflowState::Single(doc) => doc,
            WorkflowState::Multiple(_) => {
                return Err("Use Merge as the first step to combine multiple inputs.".to_string())
            }
        };
        let final_name = normalize_pdf_output_name(&output_name);
        let output_path = Path::new(&output_dir)
            .join(final_name)
            .to_string_lossy()
            .to_string();
        fs::write(&output_path, document).map_err(|_| "Failed to write workflow output PDF.".to_string())?;

        Ok(WorkflowRunResult {
            output_path,
            output_count: 1,
            is_split_output: false,
        })
    })
    .await
    .map_err(|_| "Failed to complete workflow operation.".to_string())?
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
