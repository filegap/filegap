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
fn split_every_command_creates_multiple_output_files() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    let out_dir = dir.path().join("out_every");
    fs::write(&input_path, build_multi_page_pdf_bytes(5)).expect("write input.pdf");

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "split",
            "-i",
            input_path.to_str().expect("valid utf-8 path"),
            "--every",
            "2",
            "-d",
            out_dir.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success();

    let part1 = out_dir.join("input_part_001.pdf");
    let part2 = out_dir.join("input_part_002.pdf");
    let part3 = out_dir.join("input_part_003.pdf");
    assert!(part1.exists());
    assert!(part2.exists());
    assert!(part3.exists());

    let doc1 = Document::load_mem(&fs::read(&part1).expect("read part1")).expect("valid part1");
    let doc2 = Document::load_mem(&fs::read(&part2).expect("read part2")).expect("valid part2");
    let doc3 = Document::load_mem(&fs::read(&part3).expect("read part3")).expect("valid part3");
    assert_eq!(doc1.get_pages().len(), 2);
    assert_eq!(doc2.get_pages().len(), 2);
    assert_eq!(doc3.get_pages().len(), 1);
}

#[test]
fn split_ranges_command_creates_expected_outputs() {
    let dir = tempdir().expect("tempdir should be created");
    let input_path = dir.path().join("input.pdf");
    let out_dir = dir.path().join("out_ranges");
    fs::write(&input_path, build_multi_page_pdf_bytes(5)).expect("write input.pdf");

    Command::cargo_bin("filegap")
        .expect("binary should build")
        .args([
            "split",
            "-i",
            input_path.to_str().expect("valid utf-8 path"),
            "--ranges",
            "1-2,5",
            "-d",
            out_dir.to_str().expect("valid utf-8 path"),
        ])
        .assert()
        .success();

    let part1 = out_dir.join("input_part_001.pdf");
    let part2 = out_dir.join("input_part_002.pdf");
    assert!(part1.exists());
    assert!(part2.exists());

    let doc1 = Document::load_mem(&fs::read(&part1).expect("read part1")).expect("valid part1");
    let doc2 = Document::load_mem(&fs::read(&part2).expect("read part2")).expect("valid part2");
    assert_eq!(doc1.get_pages().len(), 2);
    assert_eq!(doc2.get_pages().len(), 1);
}
