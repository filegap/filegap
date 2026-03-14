use std::fs;
use std::io::Cursor;

use assert_cmd::Command;
use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use tempfile::tempdir;

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
fn merge_command_creates_a_valid_output_pdf() {
    let dir = tempdir().expect("tempdir should be created");
    let a_path = dir.path().join("a.pdf");
    let b_path = dir.path().join("b.pdf");
    let output_path = dir.path().join("merged.pdf");

    fs::write(&a_path, build_single_page_pdf_bytes("doc-a")).expect("write a.pdf");
    fs::write(&b_path, build_single_page_pdf_bytes("doc-b")).expect("write b.pdf");

    Command::cargo_bin("pdflo-cli")
        .expect("binary should build")
        .args([
            "merge",
            "-i",
            a_path.to_str().expect("valid utf-8 path"),
            b_path.to_str().expect("valid utf-8 path"),
            "-o",
            output_path.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success();

    let merged_bytes = fs::read(&output_path).expect("merged output should exist");
    let merged_doc = Document::load_mem(&merged_bytes).expect("merged output should be a valid PDF");
    assert_eq!(merged_doc.get_pages().len(), 2);
}

#[test]
fn merge_command_fails_with_single_input_file() {
    let dir = tempdir().expect("tempdir should be created");
    let a_path = dir.path().join("a.pdf");
    let output_path = dir.path().join("merged.pdf");
    fs::write(&a_path, build_single_page_pdf_bytes("doc-a")).expect("write a.pdf");

    Command::cargo_bin("pdflo-cli")
        .expect("binary should build")
        .args([
            "merge",
            "-i",
            a_path.to_str().expect("valid utf-8 path"),
            "-o",
            output_path.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .failure();
}
