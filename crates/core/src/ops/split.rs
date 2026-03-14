use std::collections::HashSet;
use std::io::Cursor;

use lopdf::Document;

use crate::{CoreError, SplitMode, SplitRequest};

pub fn split_pdf(request: &SplitRequest) -> Result<Vec<Vec<u8>>, CoreError> {
    request.validate()?;

    let source = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;
    let total_pages = source.get_pages().len() as u32;
    if total_pages == 0 {
        return Err(CoreError::Processing(
            "input PDF has no pages to split".to_string(),
        ));
    }

    let groups = match &request.mode {
        SplitMode::EveryNPages(n) => build_every_n_groups(total_pages, *n),
        SplitMode::ByPageRanges(ranges) => parse_split_ranges(ranges, total_pages)?,
    };

    let mut outputs = Vec::with_capacity(groups.len());
    for group in groups {
        let selected: HashSet<u32> = group.into_iter().collect();
        let mut doc = Document::load_mem(&request.document).map_err(|err| {
            CoreError::Processing(format!(
                "failed to parse input PDF for chunk creation: {err}"
            ))
        })?;

        let delete_list: Vec<u32> = (1..=total_pages)
            .filter(|page| !selected.contains(page))
            .collect();

        doc.delete_pages(&delete_list);
        doc.prune_objects();
        doc.renumber_objects();

        let mut cursor = Cursor::new(Vec::new());
        doc.save_to(&mut cursor).map_err(|err| {
            CoreError::Processing(format!("failed to serialize split part: {err}"))
        })?;
        outputs.push(cursor.into_inner());
    }

    Ok(outputs)
}

fn build_every_n_groups(total_pages: u32, chunk_size: u32) -> Vec<Vec<u32>> {
    let mut groups = Vec::new();
    let mut start = 1;
    while start <= total_pages {
        let end = (start + chunk_size - 1).min(total_pages);
        groups.push((start..=end).collect());
        start = end + 1;
    }
    groups
}

fn parse_split_ranges(input: &str, total_pages: u32) -> Result<Vec<Vec<u32>>, CoreError> {
    let mut groups = Vec::new();
    let mut seen = HashSet::new();

    for token in input
        .split(',')
        .map(str::trim)
        .filter(|token| !token.is_empty())
    {
        let group = if let Some((start_str, end_str)) = token.split_once('-') {
            let start = parse_page_number(start_str.trim(), total_pages)?;
            let end = parse_page_number(end_str.trim(), total_pages)?;
            if start > end {
                return Err(CoreError::InvalidInput(format!(
                    "invalid range `{token}`: start cannot be greater than end"
                )));
            }
            (start..=end).collect::<Vec<_>>()
        } else {
            vec![parse_page_number(token, total_pages)?]
        };

        for page in &group {
            if !seen.insert(*page) {
                return Err(CoreError::InvalidInput(format!(
                    "page `{page}` appears in multiple split ranges"
                )));
            }
        }
        groups.push(group);
    }

    if groups.is_empty() {
        return Err(CoreError::InvalidInput(
            "no valid split ranges provided".to_string(),
        ));
    }

    Ok(groups)
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

    use crate::{ops::split_pdf, CoreError, SplitMode, SplitRequest};

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
    fn split_every_n_pages_produces_expected_parts() {
        let request = SplitRequest {
            document: build_multi_page_pdf_bytes(5),
            mode: SplitMode::EveryNPages(2),
        };

        let parts = split_pdf(&request).expect("split should succeed");
        assert_eq!(parts.len(), 3);

        let first = Document::load_mem(&parts[0]).expect("first part should be valid");
        let second = Document::load_mem(&parts[1]).expect("second part should be valid");
        let third = Document::load_mem(&parts[2]).expect("third part should be valid");
        assert_eq!(first.get_pages().len(), 2);
        assert_eq!(second.get_pages().len(), 2);
        assert_eq!(third.get_pages().len(), 1);
    }

    #[test]
    fn split_by_ranges_produces_expected_parts() {
        let request = SplitRequest {
            document: build_multi_page_pdf_bytes(5),
            mode: SplitMode::ByPageRanges("1-2,5".to_string()),
        };

        let parts = split_pdf(&request).expect("split should succeed");
        assert_eq!(parts.len(), 2);

        let first = Document::load_mem(&parts[0]).expect("first part should be valid");
        let second = Document::load_mem(&parts[1]).expect("second part should be valid");
        assert_eq!(first.get_pages().len(), 2);
        assert_eq!(second.get_pages().len(), 1);
    }

    #[test]
    fn split_rejects_overlapping_ranges() {
        let request = SplitRequest {
            document: build_multi_page_pdf_bytes(4),
            mode: SplitMode::ByPageRanges("1-2,2-3".to_string()),
        };

        let err = split_pdf(&request).expect_err("split should fail");
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }
}
