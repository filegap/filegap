use crate::{CoreError, ExtractRequest};

pub fn extract_pages(request: &ExtractRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;
    Err(CoreError::Unsupported(
        "extract implementation not wired yet (v0.1 scaffold)".to_string(),
    ))
}
