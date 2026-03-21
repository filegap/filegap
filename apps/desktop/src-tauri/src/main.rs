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
            commands::inspect_pdf_files,
            commands::show_in_folder,
            commands::open_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running filegap desktop app");
}

fn main() {
    run();
}
