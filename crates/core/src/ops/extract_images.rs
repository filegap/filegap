use lopdf::{Document, Object, Stream};

use crate::{CoreError, ExtractImagesRequest, ExtractedImage, ExtractedImageFormat};

pub fn extract_images(request: &ExtractImagesRequest) -> Result<Vec<ExtractedImage>, CoreError> {
    request.validate()?;

    let doc = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;

    let mut images = Vec::new();
    for object in doc.objects.values() {
        let Ok(stream) = object.as_stream() else {
            continue;
        };
        if !is_image_stream(stream) {
            continue;
        }

        let Some(format) = supported_image_format(stream) else {
            continue;
        };
        let filename = format!("image-{:03}.{}", images.len() + 1, format.extension());
        images.push(ExtractedImage {
            filename,
            bytes: stream.content.clone(),
            format,
        });
    }

    if images.is_empty() {
        return Err(CoreError::Unsupported(
            "no supported embedded images found".to_string(),
        ));
    }

    Ok(images)
}

fn is_image_stream(stream: &Stream) -> bool {
    matches!(
        stream.dict.get(b"Subtype").and_then(Object::as_name),
        Ok(b"Image")
    )
}

fn supported_image_format(stream: &Stream) -> Option<ExtractedImageFormat> {
    let filters = filter_names(stream)?;
    if filters.len() != 1 {
        return None;
    }

    match filters[0].as_slice() {
        b"DCTDecode" => Some(ExtractedImageFormat::Jpeg),
        b"JPXDecode" => Some(ExtractedImageFormat::Jpeg2000),
        _ => None,
    }
}

fn filter_names(stream: &Stream) -> Option<Vec<Vec<u8>>> {
    match stream.dict.get(b"Filter").ok()? {
        Object::Name(name) => Some(vec![name.clone()]),
        Object::Array(filters) => {
            let mut names = Vec::with_capacity(filters.len());
            for filter in filters {
                let Object::Name(name) = filter else {
                    return None;
                };
                names.push(name.clone());
            }
            Some(names)
        }
        _ => None,
    }
}

impl ExtractedImageFormat {
    fn extension(self) -> &'static str {
        match self {
            Self::Jpeg => "jpg",
            Self::Jpeg2000 => "jp2",
        }
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use image::{ImageBuffer, Rgb};
    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::extract_images, ExtractImagesRequest, ExtractedImageFormat};

    fn encode_test_jpeg() -> Vec<u8> {
        let image = ImageBuffer::from_fn(8, 8, |x, y| {
            Rgb([
                ((x * 13 + y * 7) % 255) as u8,
                ((x * 3 + y * 17) % 255) as u8,
                ((x * 11 + y * 5) % 255) as u8,
            ])
        });
        let mut jpeg = Vec::new();
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg, 90);
        encoder
            .encode_image(&image)
            .expect("jpeg should encode correctly");
        jpeg
    }

    fn serialize_doc(mut doc: Document) -> Vec<u8> {
        let mut buffer = Cursor::new(Vec::new());
        doc.save_to(&mut buffer)
            .expect("pdf should serialize correctly");
        buffer.into_inner()
    }

    fn build_pdf_with_jpeg_image() -> (Vec<u8>, Vec<u8>) {
        let jpeg = encode_test_jpeg();
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let image_id = doc.add_object(Stream::new(
            dictionary! {
                "Type" => "XObject",
                "Subtype" => "Image",
                "Width" => 8,
                "Height" => 8,
                "ColorSpace" => "DeviceRGB",
                "BitsPerComponent" => 8,
                "Filter" => "DCTDecode",
            },
            jpeg.clone(),
        ));
        let resources_id = doc.add_object(dictionary! {
            "XObject" => dictionary! {
                "Im1" => image_id,
            },
        });
        let content = Content {
            operations: vec![Operation::new("Do", vec!["Im1".into()])],
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
            "MediaBox" => vec![0.into(), 0.into(), 8.into(), 8.into()],
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

        (serialize_doc(doc), jpeg)
    }

    fn build_pdf_without_supported_images() -> Vec<u8> {
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let content = Content {
            operations: vec![Operation::new("BT", vec![]), Operation::new("ET", vec![])],
        };
        let content_id = doc.add_object(Stream::new(
            dictionary! {},
            content.encode().expect("content encoding should succeed"),
        ));
        let page_id = doc.add_object(dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Contents" => content_id,
            "MediaBox" => vec![0.into(), 0.into(), 100.into(), 100.into()],
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
        serialize_doc(doc)
    }

    #[test]
    fn extract_images_returns_supported_jpeg_xobjects() {
        let (input, jpeg) = build_pdf_with_jpeg_image();
        let images = extract_images(&ExtractImagesRequest { document: input })
            .expect("image extraction should succeed");

        assert_eq!(images.len(), 1);
        assert_eq!(images[0].filename, "image-001.jpg");
        assert_eq!(images[0].format, ExtractedImageFormat::Jpeg);
        assert_eq!(images[0].bytes, jpeg);
    }

    #[test]
    fn extract_images_rejects_pdf_without_supported_images() {
        let input = build_pdf_without_supported_images();
        let err = extract_images(&ExtractImagesRequest { document: input })
            .expect_err("unsupported image extraction should fail");

        assert!(matches!(err, crate::CoreError::Unsupported(_)));
    }
}
