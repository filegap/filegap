mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::merge_pdfs,
            commands::split_pdf,
            commands::extract_pages,
            commands::reorder_pdf,
            commands::optimize_pdf,
            commands::compress_pdf,
            commands::inspect_pdf_files,
            commands::inspect_pdf_metadata,
            commands::read_pdf_bytes,
            commands::show_in_folder,
            commands::open_file,
            commands::path_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running filegap desktop app");
}

fn main() {
    run();
}
