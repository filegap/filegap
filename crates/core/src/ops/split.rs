use crate::{CoreError, SplitRequest};

pub fn split_pdf(request: &SplitRequest) -> Result<Vec<Vec<u8>>, CoreError> {
    request.validate()?;
    Err(CoreError::Unsupported(
        "split implementation not wired yet (v0.1 scaffold)".to_string(),
    ))
}
