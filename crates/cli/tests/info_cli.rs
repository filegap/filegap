use std::fs;
use std::io::Cursor;

use assert_cmd::Command;
use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use tempfile::tempdir;

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
        "Title" => Object::string_literal("info-test"),
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
fn info_command_prints_expected_fields() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    fs::write(&input_path, build_single_page_pdf_bytes()).expect("write input.pdf");

    Command::cargo_bin("pdflo-cli")
        .expect("binary should build")
        .args(["info", "-i", input_path.to_str().expect("valid utf-8 path")])
        .assert()
        .success()
        .stdout(predicates::str::contains("Pages: 1"))
        .stdout(predicates::str::contains("PDF Version: 1.5"))
        .stdout(predicates::str::contains("Title: info-test"));
}

#[test]
fn info_command_json_outputs_valid_payload() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    fs::write(&input_path, build_single_page_pdf_bytes()).expect("write input.pdf");

    Command::cargo_bin("pdflo-cli")
        .expect("binary should build")
        .args([
            "info",
            "-i",
            input_path.to_str().expect("valid utf-8 path"),
            "--json",
        ])
        .assert()
        .success()
        .stdout(predicates::str::contains("\"pages\": 1"))
        .stdout(predicates::str::contains("\"pdf_version\": \"1.5\""))
        .stdout(predicates::str::contains("\"title\": \"info-test\""));
}
