use crate::{CoreError, MergeRequest};

pub fn merge_pdfs(request: &MergeRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;
    Err(CoreError::Unsupported(
        "merge implementation not wired yet (v0.1 scaffold)".to_string(),
    ))
}
