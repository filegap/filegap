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
fn split_single_range_outputs_pdf_to_stdout() {
    let input = build_multi_page_pdf_bytes(5);

    let output = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["split", "--pages", "1-3"])
        .write_stdin(input)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let output_doc = Document::load_mem(&output).expect("output should be valid PDF");
    assert_eq!(output_doc.get_pages().len(), 3);
}

#[test]
fn split_multi_range_requires_pattern_or_zip() {
    let input = build_multi_page_pdf_bytes(5);

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["split", "--pages", "1-2,5"])
        .write_stdin(input)
        .assert()
        .failure()
        .code(2);
}

#[test]
fn split_multi_range_writes_files_with_pattern() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    fs::write(&input_path, build_multi_page_pdf_bytes(5)).expect("write input");

    let pattern = dir.path().join("part-%d.pdf");

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "split",
            input_path.to_str().expect("valid utf-8 path"),
            "--pages",
            "1-2,5",
            "--output-pattern",
            pattern.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success();

    let first = dir.path().join("part-1.pdf");
    let second = dir.path().join("part-2.pdf");
    assert!(first.exists());
    assert!(second.exists());
}

#[test]
fn split_zip_outputs_zip_archive_to_stdout() {
    let input = build_multi_page_pdf_bytes(5);
    let output = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["split", "--pages", "1-2,5", "--format", "zip"])
        .write_stdin(input)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    assert!(output.starts_with(b"PK"));
}
