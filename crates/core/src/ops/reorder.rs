use crate::{CoreError, ReorderRequest};

pub fn reorder_pages(request: &ReorderRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;
    Err(CoreError::Unsupported(
        "reorder implementation not wired yet (v0.1 scaffold)".to_string(),
    ))
}
