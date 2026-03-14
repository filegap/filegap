use std::collections::HashSet;
use std::io::Cursor;

use lopdf::Document;

use crate::{CoreError, ExtractRequest};

pub fn extract_pages(request: &ExtractRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;

    let mut doc = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;

    let total_pages = doc.get_pages().len() as u32;
    if total_pages == 0 {
        return Err(CoreError::Processing(
            "input PDF has no pages to extract".to_string(),
        ));
    }

    let selected_pages = parse_page_ranges(&request.page_ranges, total_pages)?;
    let selected_set: HashSet<u32> = selected_pages.into_iter().collect();

    let pages_to_delete: Vec<u32> = (1..=total_pages)
        .filter(|page| !selected_set.contains(page))
        .collect();

    doc.delete_pages(&pages_to_delete);
    doc.prune_objects();
    doc.renumber_objects();

    let mut cursor = Cursor::new(Vec::new());
    doc.save_to(&mut cursor)
        .map_err(|err| CoreError::Processing(format!("failed to serialize output PDF: {err}")))?;

    Ok(cursor.into_inner())
}

fn parse_page_ranges(input: &str, total_pages: u32) -> Result<Vec<u32>, CoreError> {
    let mut pages = Vec::new();
    let mut seen = HashSet::new();

    for token in input
        .split(',')
        .map(str::trim)
        .filter(|token| !token.is_empty())
    {
        if let Some((start_str, end_str)) = token.split_once('-') {
            let start = parse_page_number(start_str.trim(), total_pages)?;
            let end = parse_page_number(end_str.trim(), total_pages)?;
            if start > end {
                return Err(CoreError::InvalidInput(format!(
                    "invalid range `{token}`: start cannot be greater than end"
                )));
            }

            for page in start..=end {
                if seen.insert(page) {
                    pages.push(page);
                }
            }
        } else {
            let page = parse_page_number(token, total_pages)?;
            if seen.insert(page) {
                pages.push(page);
            }
        }
    }

    if pages.is_empty() {
        return Err(CoreError::InvalidInput(
            "no valid pages selected (example: 1,3,5-8)".to_string(),
        ));
    }

    Ok(pages)
}

fn parse_page_number(value: &str, total_pages: u32) -> Result<u32, CoreError> {
    let page = value.parse::<u32>().map_err(|_| {
        CoreError::InvalidInput(format!(
            "invalid page number `{value}`: expected a positive integer"
        ))
    })?;

    if page == 0 || page > total_pages {
        return Err(CoreError::InvalidInput(format!(
            "page `{page}` out of bounds (document has {total_pages} pages)"
        )));
    }

    Ok(page)
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::extract_pages, CoreError, ExtractRequest};

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
    fn extract_selected_pages_returns_pdf_with_expected_page_count() {
        let request = ExtractRequest {
            document: build_multi_page_pdf_bytes(4),
            page_ranges: "2-3".to_string(),
        };

        let output = extract_pages(&request).expect("extract should succeed");
        let parsed = Document::load_mem(&output).expect("result should be a valid pdf");
        assert_eq!(parsed.get_pages().len(), 2);
    }

    #[test]
    fn extract_rejects_out_of_bounds_pages() {
        let request = ExtractRequest {
            document: build_multi_page_pdf_bytes(2),
            page_ranges: "3".to_string(),
        };

        let err = extract_pages(&request).expect_err("extract should fail");
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[test]
    fn extract_rejects_invalid_range_syntax() {
        let request = ExtractRequest {
            document: build_multi_page_pdf_bytes(3),
            page_ranges: "3-1".to_string(),
        };

        let err = extract_pages(&request).expect_err("extract should fail");
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }
}
