use std::fs;
use std::path::Path;
use std::process::Command;

use filegap_core::{ops::{merge_pdfs as core_merge_pdfs, split_pdf as core_split_pdf}, CoreError, MergeRequest, SplitMode, SplitRequest};
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
pub struct PdfFileInfo {
    pub path: String,
    pub size_bytes: u64,
    pub page_count: Option<u32>,
}

fn map_core_error(err: CoreError) -> String {
    match err {
        CoreError::InvalidInput(_) => "Invalid input PDF files.".to_string(),
        CoreError::Processing(_) => "PDF processing failed.".to_string(),
        CoreError::Unsupported(_) => "Unsupported PDF operation.".to_string(),
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
        let parts = core_split_pdf(&SplitRequest {
            document: input_bytes,
            mode: SplitMode::EveryNPages(pages_per_file),
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
