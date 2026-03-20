mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![commands::merge_pdfs])
        .run(tauri::generate_context!())
        .expect("error while running filegap desktop app");
}

fn main() {
    run();
}
