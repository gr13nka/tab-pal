#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Local-first storage (TauriFsPaletteStore) and folder pickers go through these.
        // No custom commands are needed for the MVP — the JS fs/dialog plugins suffice.
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tab-pal");
}
