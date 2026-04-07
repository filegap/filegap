use std::fs;
use std::io::Cursor;
use std::path::PathBuf;

use assert_cmd::Command;
use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use predicates::str::contains;
use tempfile::tempdir;

fn build_compressible_pdf_bytes(page_count: u32) -> Vec<u8> {
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
        let repeated_text = format!("page-{page_index} ").repeat(1_000);
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
fn optimize_command_writes_valid_pdf_to_stdout() {
    let input = build_compressible_pdf_bytes(1);

    let output = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["optimize"])
        .write_stdin(input)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
    assert_eq!(parsed.get_pages().len(), 1);
}

#[test]
fn compress_command_writes_smaller_valid_pdf_to_file() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    let output_path = dir.path().join("compressed.pdf");
    let input = build_compressible_pdf_bytes(1);
    fs::write(&input_path, &input).expect("write input.pdf");

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "compress",
            "--preset",
            "balanced",
            input_path.to_str().expect("valid utf-8 path"),
            "-o",
            output_path.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success();

    let output = fs::read(output_path).expect("read output.pdf");
    let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
    assert_eq!(parsed.get_pages().len(), 1);
    assert!(
        output.len() < input.len(),
        "compressed output should be smaller for a compressible PDF"
    );
}

#[test]
fn optimize_compress_extract_pipeline_works_with_stdin_stdout() {
    let input = build_compressible_pdf_bytes(3);
    let optimized = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["optimize"])
        .write_stdin(input)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let compressed = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["compress", "--preset", "balanced"])
        .write_stdin(optimized)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let extracted = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["extract", "--pages", "2"])
        .write_stdin(compressed)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let output_doc = Document::load_mem(&extracted).expect("output should be valid pdf");
    assert_eq!(output_doc.get_pages().len(), 1);
    let text = output_doc
        .extract_text(&[1])
        .expect("page text extraction should succeed");
    assert!(text.contains("page-2"));
}

#[test]
fn help_explains_optimize_and_compress_difference() {
    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["optimize", "--help"])
        .assert()
        .success()
        .stdout(contains("without intentional visual quality reduction"))
        .stdout(contains("does not downsample images"))
        .stdout(contains("use `compress` when size reduction is the goal"));

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args(["compress", "--help"])
        .assert()
        .success()
        .stdout(contains("quality presets"))
        .stdout(contains("may reduce visual quality"))
        .stdout(contains("same structural cleanup as `optimize`"));
}

#[test]
fn strong_compress_reduces_image_heavy_fixture() {
    let fixture = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../testdata/fixtures/big.pdf")
        .canonicalize()
        .expect("fixture should exist");
    let input = fs::read(&fixture).expect("fixture should be readable");
    let output = Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "compress",
            "--preset",
            "strong",
            fixture.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let parsed = Document::load_mem(&output).expect("output should be a valid pdf");
    assert_eq!(parsed.get_pages().len(), 4);
    assert!(
        output.len() < input.len() / 2,
        "strong compression should significantly reduce the image-heavy fixture"
    );
}
