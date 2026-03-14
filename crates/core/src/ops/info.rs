use lopdf::{Document, Object};

use crate::{CoreError, InfoRequest, PdfInfo};

pub fn inspect_pdf(request: &InfoRequest) -> Result<PdfInfo, CoreError> {
    request.validate()?;

    let doc = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;

    let info_dict = doc
        .trailer
        .get(b"Info")
        .ok()
        .and_then(|obj| obj.as_reference().ok())
        .and_then(|id| doc.get_dictionary(id).ok());

    let read_field = |key: &[u8]| -> Option<String> {
        info_dict
            .and_then(|dict| dict.get(key).ok())
            .and_then(object_to_display_string)
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    };

    Ok(PdfInfo {
        pdf_version: doc.version.clone(),
        page_count: doc.get_pages().len() as u32,
        is_encrypted: doc.is_encrypted(),
        title: read_field(b"Title"),
        author: read_field(b"Author"),
        creator: read_field(b"Creator"),
        producer: read_field(b"Producer"),
        creation_date: read_field(b"CreationDate"),
        modification_date: read_field(b"ModDate"),
    })
}

fn object_to_display_string(object: &Object) -> Option<String> {
    match object {
        Object::String(bytes, _) => Some(String::from_utf8_lossy(bytes).to_string()),
        Object::Name(bytes) => Some(String::from_utf8_lossy(bytes).to_string()),
        Object::Integer(value) => Some(value.to_string()),
        Object::Real(value) => Some(value.to_string()),
        Object::Boolean(value) => Some(value.to_string()),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::inspect_pdf, InfoRequest};

    fn build_single_page_pdf_bytes() -> Vec<u8> {
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

        let info_id = doc.add_object(dictionary! {
            "Title" => Object::string_literal("demo"),
            "Producer" => Object::string_literal("pdflo-tests"),
        });
        let catalog_id = doc.add_object(dictionary! {
            "Type" => "Catalog",
            "Pages" => pages_id,
        });
        doc.trailer.set("Root", catalog_id);
        doc.trailer.set("Info", info_id);

        let mut buffer = Cursor::new(Vec::new());
        doc.save_to(&mut buffer)
            .expect("pdf should serialize correctly");
        buffer.into_inner()
    }

    #[test]
    fn inspect_pdf_returns_basic_metadata() {
        let request = InfoRequest {
            document: build_single_page_pdf_bytes(),
        };

        let info = inspect_pdf(&request).expect("inspect should succeed");
        assert_eq!(info.page_count, 1);
        assert_eq!(info.pdf_version, "1.5");
        assert!(!info.is_encrypted);
        assert_eq!(info.title.as_deref(), Some("demo"));
        assert_eq!(info.producer.as_deref(), Some("pdflo-tests"));
    }
}
