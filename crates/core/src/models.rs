use crate::error::CoreError;

#[derive(Debug, Clone)]
pub struct MergeRequest {
    pub documents: Vec<Vec<u8>>,
}

#[derive(Debug, Clone)]
pub struct ExtractRequest {
    pub document: Vec<u8>,
    pub page_ranges: String,
}

#[derive(Debug, Clone)]
pub struct ReorderRequest {
    pub document: Vec<u8>,
    pub page_order: Vec<u32>,
}

#[derive(Debug, Clone)]
pub enum SplitMode {
    EveryNPages(u32),
    ByPageRanges(String),
}

#[derive(Debug, Clone)]
pub struct SplitRequest {
    pub document: Vec<u8>,
    pub mode: SplitMode,
}

impl MergeRequest {
    pub fn validate(&self) -> Result<(), CoreError> {
        if self.documents.len() < 2 {
            return Err(CoreError::InvalidInput(
                "merge requires at least 2 input PDFs".to_string(),
            ));
        }

        if self.documents.iter().any(|doc| doc.is_empty()) {
            return Err(CoreError::InvalidInput(
                "input PDFs cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

impl ExtractRequest {
    pub fn validate(&self) -> Result<(), CoreError> {
        if self.document.is_empty() {
            return Err(CoreError::InvalidInput(
                "input PDF cannot be empty".to_string(),
            ));
        }

        if self.page_ranges.trim().is_empty() {
            return Err(CoreError::InvalidInput(
                "page ranges are required (example: 1,3,5-8)".to_string(),
            ));
        }

        Ok(())
    }
}

impl ReorderRequest {
    pub fn validate(&self) -> Result<(), CoreError> {
        if self.document.is_empty() {
            return Err(CoreError::InvalidInput(
                "input PDF cannot be empty".to_string(),
            ));
        }

        if self.page_order.is_empty() {
            return Err(CoreError::InvalidInput(
                "page order cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}

impl SplitRequest {
    pub fn validate(&self) -> Result<(), CoreError> {
        if self.document.is_empty() {
            return Err(CoreError::InvalidInput(
                "input PDF cannot be empty".to_string(),
            ));
        }

        match self.mode {
            SplitMode::EveryNPages(n) if n == 0 => Err(CoreError::InvalidInput(
                "split size must be greater than zero".to_string(),
            )),
            SplitMode::ByPageRanges(ref ranges) if ranges.trim().is_empty() => {
                Err(CoreError::InvalidInput(
                    "page ranges cannot be empty".to_string(),
                ))
            }
            _ => Ok(()),
        }
    }
}
