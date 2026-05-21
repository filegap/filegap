use std::fs;
use std::io::{Cursor, Read};

use assert_cmd::Command;
use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use predicates::str::contains;
use tempfile::tempdir;
use zip::ZipArchive;

const JPEG_BYTES: &[u8] = &[
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, b'J', b'F', b'I', b'F', 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xd9,
];

fn serialize_doc(mut doc: Document) -> Vec<u8> {
    let mut buffer = Cursor::new(Vec::new());
    doc.save_to(&mut buffer)
        .expect("pdf should serialize correctly");
    buffer.into_inner()
}

fn build_pdf_with_jpeg_image() -> Vec<u8> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let image_id = doc.add_object(Stream::new(
        dictionary! {
            "Type" => "XObject",
            "Subtype" => "Image",
            "Width" => 1,
            "Height" => 1,
            "ColorSpace" => "DeviceRGB",
            "BitsPerComponent" => 8,
            "Filter" => "DCTDecode",
        },
        JPEG_BYTES.to_vec(),
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

fn build_pdf_without_images() -> Vec<u8> {
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

fn read_zip_entry(zip_bytes: &[u8], name: &str) -> Vec<u8> {
    let cursor = Cursor::new(zip_bytes);
    let mut archive = ZipArchive::new(cursor).expect("zip should open");
    let mut entry = archive.by_name(name).expect("zip entry should exist");
    let mut bytes = Vec::new();
    entry
        .read_to_end(&mut bytes)
        .expect("zip entry should be readable");
    bytes
}

#[test]
fn extract_images_outputs_zip_to_stdout() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    fs::write(&input_path, build_pdf_with_jpeg_image()).expect("write input.pdf");

    let output = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "extract-images",
            input_path.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    assert!(output.starts_with(b"PK"));
    assert_eq!(read_zip_entry(&output, "image-001.jpg"), JPEG_BYTES);
}

#[test]
fn extract_images_reads_stdin_and_writes_zip_to_file() {
    let dir = tempdir().expect("tempdir should be created");
    let output_path = dir.path().join("images.zip");

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "extract-images",
            "-",
            "-o",
            output_path.to_str().expect("valid utf-8 path"),
        ])
        .write_stdin(build_pdf_with_jpeg_image())
        .assert()
        .success();

    let output = fs::read(output_path).expect("read images.zip");
    assert_eq!(read_zip_entry(&output, "image-001.jpg"), JPEG_BYTES);
}

#[test]
fn extract_images_fails_when_no_supported_images_are_found() {
    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["extract-images"])
        .write_stdin(build_pdf_without_images())
        .assert()
        .failure()
        .code(1)
        .stderr(contains("no supported embedded images found"));
}
