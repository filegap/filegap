use std::fs;
use std::io::Cursor;

use assert_cmd::Command;
use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use tempfile::tempdir;

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
fn extract_command_creates_a_valid_output_pdf() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    let output_path = dir.path().join("output.pdf");

    fs::write(&input_path, build_multi_page_pdf_bytes(4)).expect("write input.pdf");

    Command::cargo_bin("pdflo-cli")
        .expect("binary should build")
        .args([
            "extract",
            "-i",
            input_path.to_str().expect("valid utf-8 path"),
            "-p",
            "2-3",
            "-o",
            output_path.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success();

    let output_bytes = fs::read(&output_path).expect("output should exist");
    let output_doc = Document::load_mem(&output_bytes).expect("output should be a valid pdf");
    assert_eq!(output_doc.get_pages().len(), 2);
}

#[test]
fn extract_command_fails_for_out_of_bounds_pages() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    let output_path = dir.path().join("output.pdf");

    fs::write(&input_path, build_multi_page_pdf_bytes(2)).expect("write input.pdf");

    Command::cargo_bin("pdflo-cli")
        .expect("binary should build")
        .args([
            "extract",
            "-i",
            input_path.to_str().expect("valid utf-8 path"),
            "-p",
            "3",
            "-o",
            output_path.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .failure();
}
