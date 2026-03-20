use std::fs;

use filegap_core::{ops::merge_pdfs as core_merge_pdfs, CoreError, MergeRequest};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct MergeResult {
    pub output_path: String,
    pub input_count: usize,
}

fn map_core_error(err: CoreError) -> String {
    match err {
        CoreError::InvalidInput(_) => "Invalid input PDF files.".to_string(),
        CoreError::Processing(_) => "PDF processing failed.".to_string(),
        CoreError::Unsupported(_) => "Unsupported PDF operation.".to_string(),
    }
}

#[tauri::command]
pub fn merge_pdfs(input_paths: Vec<String>, output_path: String) -> Result<MergeResult, String> {
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
}
