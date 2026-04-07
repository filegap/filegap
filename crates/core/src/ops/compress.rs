use lopdf::Document;
use lopdf::Object;

use crate::ops::optimize::{optimize_document, serialize_document};
use crate::{CompressRequest, CompressionPreset, CoreError};

pub fn compress_pdf(request: &CompressRequest) -> Result<Vec<u8>, CoreError> {
    request.validate()?;

    let mut doc = Document::load_mem(&request.document)
        .map_err(|err| CoreError::Processing(format!("failed to parse input PDF: {err}")))?;

    optimize_document(&mut doc);
    recompress_jpeg_images(&mut doc, request.preset)?;
    doc.compress();
    serialize_document(&mut doc)
}

fn recompress_jpeg_images(doc: &mut Document, preset: CompressionPreset) -> Result<(), CoreError> {
    let settings = ImageCompressionSettings::from_preset(preset);

    for object in doc.objects.values_mut() {
        let Ok(stream) = object.as_stream_mut() else {
            continue;
        };
        if !matches!(
            stream.dict.get(b"Subtype").and_then(Object::as_name),
            Ok(b"Image")
        ) {
            continue;
        }
        if !matches!(
            stream.dict.get(b"Filter").and_then(Object::as_name),
            Ok(b"DCTDecode")
        ) {
            continue;
        }

        let Ok(image) =
            image::load_from_memory_with_format(&stream.content, image::ImageFormat::Jpeg)
        else {
            continue;
        };
        let resized = if image.width().max(image.height()) > settings.max_dimension {
            image.resize(
                settings.max_dimension,
                settings.max_dimension,
                image::imageops::FilterType::Triangle,
            )
        } else {
            image
        };

        let rgb = resized.into_rgb8();
        let mut output = Vec::new();
        let mut encoder =
            image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, settings.quality);
        encoder.encode_image(&rgb).map_err(|err| {
            CoreError::Processing(format!("failed to encode image stream: {err}"))
        })?;

        if output.len() >= stream.content.len() {
            continue;
        }

        stream.dict.set("Width", rgb.width());
        stream.dict.set("Height", rgb.height());
        stream
            .dict
            .set("ColorSpace", Object::Name(b"DeviceRGB".to_vec()));
        stream.dict.set("BitsPerComponent", 8);
        stream
            .dict
            .set("Filter", Object::Name(b"DCTDecode".to_vec()));
        stream.dict.remove(b"DecodeParms");
        stream.set_content(output);
    }

    Ok(())
}

struct ImageCompressionSettings {
    max_dimension: u32,
    quality: u8,
}

impl ImageCompressionSettings {
    fn from_preset(preset: CompressionPreset) -> Self {
        match preset {
            CompressionPreset::Low => Self {
                max_dimension: 3_000,
                quality: 82,
            },
            CompressionPreset::Balanced => Self {
                max_dimension: 2_000,
                quality: 70,
            },
            CompressionPreset::Strong => Self {
                max_dimension: 1_200,
                quality: 55,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use image::{ImageBuffer, Rgb};
    use lopdf::content::{Content, Operation};
    use lopdf::{dictionary, Document, Object, Stream};

    use crate::{ops::compress_pdf, CompressRequest, CompressionPreset};

    fn build_pdf_with_compressible_stream() -> Vec<u8> {
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
        let repeated_text = "compressible ".repeat(1_000);
        let content = Content {
            operations: vec![
                Operation::new("BT", vec![]),
                Operation::new("Tf", vec!["F1".into(), 24.into()]),
                Operation::new("Td", vec![72.into(), 720.into()]),
                Operation::new("Tj", vec![Object::string_literal(repeated_text)]),
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
    fn compress_returns_smaller_valid_pdf_for_compressible_stream() {
        let input = build_pdf_with_compressible_stream();
        let output = compress_pdf(&CompressRequest {
            document: input.clone(),
            preset: CompressionPreset::Balanced,
        })
        .expect("compress should succeed");

        let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
        assert_eq!(parsed.get_pages().len(), 1);
        assert!(
            output.len() < input.len(),
            "compressed output should be smaller for a compressible stream"
        );
    }

    fn build_pdf_with_jpeg_image() -> Vec<u8> {
        let mut jpeg = Vec::new();
        let image = ImageBuffer::from_fn(800, 800, |x, y| {
            let red = ((x * 13 + y * 7) % 255) as u8;
            let green = ((x * 3 + y * 17) % 255) as u8;
            let blue = ((x * 11 + y * 5) % 255) as u8;
            Rgb([red, green, blue])
        });
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg, 100);
        encoder
            .encode_image(&image)
            .expect("jpeg should encode correctly");

        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let image_id = doc.add_object(Stream::new(
            dictionary! {
                "Type" => "XObject",
                "Subtype" => "Image",
                "Width" => 800,
                "Height" => 800,
                "ColorSpace" => "DeviceRGB",
                "BitsPerComponent" => 8,
                "Filter" => "DCTDecode",
            },
            jpeg,
        ));
        let resources_id = doc.add_object(dictionary! {
            "XObject" => dictionary! {
                "Im1" => image_id,
            },
        });
        let page_id = doc.add_object(dictionary! {
            "Type" => "Page",
            "Parent" => pages_id,
            "Resources" => resources_id,
            "MediaBox" => vec![0.into(), 0.into(), 800.into(), 800.into()],
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
    fn strong_preset_downsamples_and_recompresses_jpeg_images() {
        let input = build_pdf_with_jpeg_image();
        let output = compress_pdf(&CompressRequest {
            document: input.clone(),
            preset: CompressionPreset::Strong,
        })
        .expect("compress should succeed");

        let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
        assert_eq!(parsed.get_pages().len(), 1);
        assert!(
            output.len() < input.len() / 2,
            "strong compression should significantly reduce the image-heavy PDF"
        );
    }
}
