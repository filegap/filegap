use std::io::Cursor;

use lopdf::Document;

use crate::{CoreError, OptimizeRequest};

pub fn optimize_pdf(request: &OptimizeRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;

    let mut doc = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;

    optimize_document(&mut doc);
    serialize_document(&mut doc)
}

pub(crate) fn optimize_document(doc: &mut Document) {
    doc.delete_zero_length_streams();
    doc.prune_objects();
    doc.renumber_objects();
}

pub(crate) fn serialize_document(doc: &mut Document) -> Result<Vec<u8>, CoreError> {
    let mut cursor = Cursor::new(Vec::new());
    doc.save_to(&mut cursor)
        .map_err(|err| CoreError::Processing(format!("failed to serialize output PDF: {err}")))?;

    Ok(cursor.into_inner())
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::optimize_pdf, OptimizeRequest};

    fn build_pdf_with_unused_object() -> Vec<u8> {
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
                Operation::new("Tj", vec![Object::string_literal("hello")]),
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
        doc.add_object(Object::string_literal("unused object"));

        let mut buffer = Cursor::new(Vec::new());
        doc.save_to(&mut buffer)
            .expect("pdf should serialize correctly");
        buffer.into_inner()
    }

    #[test]
    fn optimize_returns_valid_pdf() {
        let output = optimize_pdf(&OptimizeRequest {
            document: build_pdf_with_unused_object(),
        })
        .expect("optimize should succeed");

        let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
        assert_eq!(parsed.get_pages().len(), 1);
    }
}
