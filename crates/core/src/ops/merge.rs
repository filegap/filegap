use std::collections::BTreeMap;
use std::io::Cursor;

use lopdf::{Document, Object, ObjectId};

use crate::{CoreError, MergeRequest};

pub fn merge_pdfs(request: &MergeRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;

    let mut max_id = 1;
    let mut pages_map: BTreeMap<ObjectId, Object> = BTreeMap::new();
    let mut objects_map: BTreeMap<ObjectId, Object> = BTreeMap::new();
    let mut output = Document::with_version("1.5");

    for bytes in &request.documents {
        let mut doc = Document::load_mem(bytes)
            .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;

        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        for object_id in doc.get_pages().into_values() {
            let page = doc.get_object(object_id).map_err(|err| {
                CoreError::Processing(format!("failed to read page object: {err}"))
            })?;
            pages_map.insert(object_id, page.to_owned());
        }

        objects_map.extend(doc.objects);
    }

    let mut catalog_object: Option<(ObjectId, Object)> = None;
    let mut pages_object: Option<(ObjectId, Object)> = None;

    for (object_id, object) in objects_map {
        match object.type_name().unwrap_or(b"") {
            b"Catalog" => {
                catalog_object = Some((
                    catalog_object.map(|(id, _)| id).unwrap_or(object_id),
                    object,
                ));
            }
            b"Pages" => {
                if let Ok(dict) = object.as_dict() {
                    let mut merged = dict.clone();
                    if let Some((_, existing_obj)) = &pages_object {
                        if let Ok(existing_dict) = existing_obj.as_dict() {
                            merged.extend(existing_dict);
                        }
                    }
                    pages_object = Some((
                        pages_object.map(|(id, _)| id).unwrap_or(object_id),
                        Object::Dictionary(merged),
                    ));
                }
            }
            b"Page" | b"Outlines" | b"Outline" => {}
            _ => {
                output.objects.insert(object_id, object);
            }
        }
    }

    let (pages_root_id, pages_root_obj) = pages_object
        .ok_or_else(|| CoreError::Processing("pages root not found in input PDFs".to_string()))?;
    let (catalog_id, catalog_obj) = catalog_object
        .ok_or_else(|| CoreError::Processing("catalog root not found in input PDFs".to_string()))?;

    for (object_id, object) in &pages_map {
        if let Ok(dict) = object.as_dict() {
            let mut page_dict = dict.clone();
            page_dict.set("Parent", pages_root_id);
            output
                .objects
                .insert(*object_id, Object::Dictionary(page_dict));
        }
    }

    if let Ok(dict) = pages_root_obj.as_dict() {
        let mut pages_dict = dict.clone();
        pages_dict.set("Count", pages_map.len() as u32);
        pages_dict.set(
            "Kids",
            pages_map
                .keys()
                .map(|id| Object::Reference(*id))
                .collect::<Vec<_>>(),
        );
        output
            .objects
            .insert(pages_root_id, Object::Dictionary(pages_dict));
    }

    if let Ok(dict) = catalog_obj.as_dict() {
        let mut catalog_dict = dict.clone();
        catalog_dict.set("Pages", pages_root_id);
        catalog_dict.remove(b"Outlines");
        output
            .objects
            .insert(catalog_id, Object::Dictionary(catalog_dict));
    }

    output.trailer.set("Root", catalog_id);
    output.max_id = output.objects.len() as u32;
    output.renumber_objects();

    let mut cursor = Cursor::new(Vec::new());
    output
        .save_to(&mut cursor)
        .map_err(|err| CoreError::Processing(format!("failed to serialize merged PDF: {err}")))?;

    Ok(cursor.into_inner())
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::merge_pdfs, CoreError, MergeRequest};

    fn build_single_page_pdf_bytes(label: &str) -> Vec<u8> {
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
        let content = Content {
            operations: vec![
                Operation::new("BT", vec![]),
                Operation::new("Tf", vec!["F1".into(), 24.into()]),
                Operation::new("Td", vec![72.into(), 720.into()]),
                Operation::new("Tj", vec![Object::string_literal(label)]),
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
        doc.objects.insert(
            pages_id,
            Object::Dictionary(dictionary! {
                "Type" => "Pages",
                "Kids" => vec![page_id.into()],
                "Count" => 1,
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
    fn merge_two_valid_pdfs_returns_a_valid_merged_document() {
        let request = MergeRequest {
            documents: vec![
                build_single_page_pdf_bytes("doc-a"),
                build_single_page_pdf_bytes("doc-b"),
            ],
        };

        let merged = merge_pdfs(&request).expect("merge should succeed");
        let parsed = Document::load_mem(&merged).expect("merged pdf should be parseable");

        assert_eq!(parsed.get_pages().len(), 2);
    }

    #[test]
    fn merge_requires_at_least_two_documents() {
        let request = MergeRequest {
            documents: vec![build_single_page_pdf_bytes("only-one")],
        };

        let err = merge_pdfs(&request).expect_err("merge should fail");
        assert!(matches!(err, CoreError::InvalidInput(_)));
    }

    #[test]
    fn merge_fails_on_invalid_pdf_input() {
        let request = MergeRequest {
            documents: vec![build_single_page_pdf_bytes("valid"), b"not-a-pdf".to_vec()],
        };

        let err = merge_pdfs(&request).expect_err("merge should fail");
        assert!(matches!(err, CoreError::Processing(_)));
    }
}
