use std::collections::HashSet;
use std::io::Cursor;

use lopdf::Document;

use crate::{ops::merge_pdfs, CoreError, MergeRequest, ReorderRequest};

pub fn reorder_pages(request: &ReorderRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;

    let source = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;
    let total_pages = source.get_pages().len() as u32;
    if total_pages == 0 {
        return Err(CoreError::Processing(
            "input PDF has no pages to reorder".to_string(),
        ));
    }

    validate_page_order(&request.page_order, total_pages)?;

    let mut single_page_docs = Vec::with_capacity(request.page_order.len());
    for page in &request.page_order {
        let mut doc = Document::load_mem(&request.document).map_err(|err| {
            CoreError::Processing(format!(
                "failed to parse input PDF for page extraction during reorder: {err}"
            ))
        })?;
        let pages_to_delete: Vec<u32> = (1..=total_pages).filter(|p| p != page).collect();
        doc.delete_pages(&pages_to_delete);
        doc.prune_objects();
        doc.renumber_objects();

        let mut cursor = Cursor::new(Vec::new());
        doc.save_to(&mut cursor).map_err(|err| {
            CoreError::Processing(format!("failed to serialize reordered page: {err}"))
        })?;
        single_page_docs.push(cursor.into_inner());
    }

    if single_page_docs.len() == 1 {
        return Ok(single_page_docs.remove(0));
    }

    merge_pdfs(&MergeRequest {
        documents: single_page_docs,
    })
}

fn validate_page_order(page_order: &[u32], total_pages: u32) -> Result<(), CoreError> {
    if page_order.len() != total_pages as usize {
        return Err(CoreError::InvalidInput(format!(
            "page order must include exactly {total_pages} pages"
        )));
    }

    let mut seen = HashSet::with_capacity(page_order.len());
    for page in page_order {
        if *page == 0 || *page > total_pages {
            return Err(CoreError::InvalidInput(format!(
                "page `{page}` out of bounds (document has {total_pages} pages)"
            )));
        }
        if !seen.insert(*page) {
            return Err(CoreError::InvalidInput(format!(
                "page `{page}` appears more than once in page order"
            )));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::reorder_pages, CoreError, ReorderRequest};

    fn build_multi_page_pdf_bytes(page_count: u32) -> Vec<u8> {
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let font_id = doc.add_object(dictionary! {
            "Type" => "Font",
            "Subtype" => "Type1",
            "BaseFont" => "Courier",
        });
        let resources_id = doc.add_object(dictionary! {
            "Font" => dictionary! {
                "F1" => font_id,
            },
        });

        let mut kids = Vec::new();
        for page_index in 1..=page_count {
            let content = Content {
                operations: vec![
                    Operation::new("BT", vec![]),
                    Operation::new("Tf", vec!["F1".into(), 24.into()]),
                    Operation::new("Td", vec![72.into(), 720.into()]),
                    Operation::new(
                        "Tj",
                        vec![Object::string_literal(format!("page-{page_index}"))],
                    ),
                    Operation::new("ET", vec![]),
                ],
            };
            let content_id = doc.add_object(Stream::new(
                dictionary! {},
                content.encode().expect("content encoding should succeed"),
            ));
            let page_id = doc.add_object(dictionary! {
                "Type" => "Page",
                "Parent" => pages_id,
                "Contents" => content_id,
                "Resources" => resources_id,
                "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
            });
            kids.push(page_id.into());
        }

        doc.objects.insert(
            pages_id,
            Object::Dictionary(dictionary! {
                "Type" => "Pages",
                "Kids" => kids,
                "Count" => page_count,
            }),
        );
        let catalog_id = doc.add_object(dictionary! {
            "Type" => "Catalog",
            "Pages" => pages_id,
        });
        doc.trailer.set("Root", catalog_id);

        let mut buffer = Cursor::new(Vec::new());
        doc.save_to(&mut buffer)
            .expect("pdf should serialize correctly");
        buffer.into_inner()
    }

    #[test]
    fn reorder_pages_reorders_content_as_expected() {
        let request = ReorderRequest {
            document: build_multi_page_pdf_bytes(3),
            page_order: vec![3, 1, 2],
        };

        let output = reorder_pages(&request).expect("reorder should succeed");
        let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
        assert_eq!(parsed.get_pages().len(), 3);

        let first_page_text = parsed
            .extract_text(&[1])
            .expect("first page text extraction should succeed");
        assert!(first_page_text.contains("page-3"));
    }

    #[test]
    fn reorder_pages_rejects_duplicates() {
        let request = ReorderRequest {
            document: build_multi_page_pdf_bytes(3),
            page_order: vec![1, 1, 2],
        };

        let err = reorder_pages(&request).expect_err("reorder should fail");
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[test]
    fn reorder_pages_rejects_missing_pages() {
        let request = ReorderRequest {
            document: build_multi_page_pdf_bytes(3),
            page_order: vec![1, 2],
        };

        let err = reorder_pages(&request).expect_err("reorder should fail");
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }
}
