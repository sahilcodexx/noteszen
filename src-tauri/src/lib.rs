mod db;

use db::{
    create_vault, delete_folder, delete_sql_note, delete_template, export_sync_data,
    get_folders, get_note_versions, get_setting, get_sql_notes, get_templates, get_vaults,
    import_notes, import_sync_data, purge_old_trash, restore_version, save_folder, save_setting,
    save_sql_note, save_template, search_notes_fts, set_active_vault, Folder, Note, NoteVersion,
    SearchResult, Template, Vault,
};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, Window,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub struct DbState {
    pub conn: Mutex<rusqlite::Connection>,
    pub db_path: PathBuf,
}

fn conn_lock<'a>(
    state: &'a State<'_, DbState>,
) -> Result<std::sync::MutexGuard<'a, rusqlite::Connection>, String> {
    state.conn.lock().map_err(|e| e.to_string())
}

fn images_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("images");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn emit_notes_changed(app: &AppHandle) {
    let _ = app.emit("notes-changed", ());
}

#[tauri::command]
fn get_notes(state: State<DbState>, vault_id: Option<String>) -> Result<Vec<Note>, String> {
    let conn = conn_lock(&state)?;
    get_sql_notes(&conn, vault_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_note(
    app: AppHandle,
    state: State<DbState>,
    note: Note,
    save_version: Option<bool>,
) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    save_sql_note(&conn, &note, save_version.unwrap_or(true))
        .map(|_| true)
        .map_err(|e| e.to_string())?;
    emit_notes_changed(&app);
    Ok(true)
}

#[tauri::command]
fn delete_note(app: AppHandle, state: State<DbState>, note_id: String) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    delete_sql_note(&conn, &note_id)
        .map(|_| true)
        .map_err(|e| e.to_string())?;
    emit_notes_changed(&app);
    Ok(true)
}

#[tauri::command]
fn import_notes_cmd(
    app: AppHandle,
    state: State<DbState>,
    notes: Vec<Note>,
    merge: bool,
) -> Result<usize, String> {
    let conn = conn_lock(&state)?;
    let count = import_notes(&conn, &notes, merge).map_err(|e| e.to_string())?;
    emit_notes_changed(&app);
    Ok(count)
}

#[tauri::command]
fn search_notes(
    state: State<DbState>,
    query: String,
    vault_id: Option<String>,
) -> Result<Vec<SearchResult>, String> {
    let conn = conn_lock(&state)?;
    search_notes_fts(&conn, &query, vault_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_folders_cmd(state: State<DbState>, vault_id: String) -> Result<Vec<Folder>, String> {
    let conn = conn_lock(&state)?;
    get_folders(&conn, &vault_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_folder_cmd(state: State<DbState>, folder: Folder) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    save_folder(&conn, &folder).map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_folder_cmd(state: State<DbState>, folder_id: String) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    delete_folder(&conn, &folder_id)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_templates_cmd(state: State<DbState>) -> Result<Vec<Template>, String> {
    let conn = conn_lock(&state)?;
    get_templates(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_template_cmd(state: State<DbState>, template: Template) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    save_template(&conn, &template)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_template_cmd(state: State<DbState>, template_id: String) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    delete_template(&conn, &template_id)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_note_versions_cmd(
    state: State<DbState>,
    note_id: String,
) -> Result<Vec<NoteVersion>, String> {
    let conn = conn_lock(&state)?;
    get_note_versions(&conn, &note_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn restore_version_cmd(
    app: AppHandle,
    state: State<DbState>,
    version_id: String,
) -> Result<Option<Note>, String> {
    let conn = conn_lock(&state)?;
    let note = restore_version(&conn, &version_id).map_err(|e| e.to_string())?;
    if note.is_some() {
        emit_notes_changed(&app);
    }
    Ok(note)
}

#[tauri::command]
fn get_vaults_cmd(state: State<DbState>) -> Result<Vec<Vault>, String> {
    let conn = conn_lock(&state)?;
    get_vaults(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_active_vault_cmd(state: State<DbState>, vault_id: String) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    set_active_vault(&conn, &vault_id)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn create_vault_cmd(state: State<DbState>, vault: Vault) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    create_vault(&conn, &vault)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_setting_cmd(state: State<DbState>, key: String) -> Result<Option<String>, String> {
    let conn = conn_lock(&state)?;
    get_setting(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_setting_cmd(state: State<DbState>, key: String, value: String) -> Result<bool, String> {
    let conn = conn_lock(&state)?;
    save_setting(&conn, &key, &value)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn purge_old_trash_cmd(app: AppHandle, state: State<DbState>, days: i64) -> Result<usize, String> {
    let conn = conn_lock(&state)?;
    let count = purge_old_trash(&conn, days).map_err(|e| e.to_string())?;
    if count > 0 {
        emit_notes_changed(&app);
    }
    Ok(count)
}

#[tauri::command]
fn export_sync_data_cmd(state: State<DbState>, vault_id: String) -> Result<String, String> {
    let conn = conn_lock(&state)?;
    export_sync_data(&conn, &vault_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_sync_data_cmd(
    app: AppHandle,
    state: State<DbState>,
    data: String,
    merge: bool,
) -> Result<usize, String> {
    let conn = conn_lock(&state)?;
    let count = import_sync_data(&conn, &data, merge).map_err(|e| e.to_string())?;
    emit_notes_changed(&app);
    Ok(count)
}

#[tauri::command]
fn save_image(
    app: AppHandle,
    note_id: String,
    data_url: String,
) -> Result<String, String> {
    let dir = images_dir(&app)?;
    let note_dir = dir.join(&note_id);
    fs::create_dir_all(&note_dir).map_err(|e| e.to_string())?;

    let (mime, b64) = data_url
        .split_once(',')
        .ok_or_else(|| "Invalid data URL".to_string())?;
    let ext = if mime.contains("png") {
        "png"
    } else if mime.contains("webp") {
        "webp"
    } else if mime.contains("gif") {
        "gif"
    } else {
        "jpg"
    };

    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(b64)
        .map_err(|e| e.to_string())?;

    let filename = format!("{}-{}.{}", note_id, chrono::Utc::now().timestamp_millis(), ext);
    let path = note_dir.join(&filename);
    fs::write(&path, bytes).map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn read_image_data_url(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let mime = if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".webp") {
        "image/webp"
    } else if path.ends_with(".gif") {
        "image/gif"
    } else {
        "image/jpeg"
    };
    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(format!("data:{mime};base64,{b64}"))
}

#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn maximize_window(window: Window) -> Result<(), String> {
    if window.is_maximized().map_err(|e| e.to_string())? {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn close_window(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_quick_capture(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("quick-capture") {
        window.hide().map_err(|e| e.to_string())?;
        emit_notes_changed(&app_handle);
    }
    Ok(())
}

#[tauri::command]
fn show_main_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn log(args: Vec<serde_json::Value>) {
    println!("[FRONTEND LOG] {:?}", args);
}

fn toggle_quick_capture(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("quick-capture") {
        let is_visible = window.is_visible().unwrap_or(false);
        if is_visible {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.center();
            let _ = window.set_focus();
        }
    }
}

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show NotesZen", true, None::<&str>)?;
    let capture = MenuItem::with_id(app, "capture", "Quick Capture", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &capture, &quit])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("NotesZen")
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "show" => {
                let _ = show_main_window(app.clone());
            }
            "capture" => toggle_quick_capture(app),
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                let _ = show_main_window(app.clone());
            }
        })
        .build(app)?;

    Ok(())
}

fn run_trash_purge(app: AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_secs(3600));
            if let Some(state) = app.try_state::<DbState>() {
                if let Ok(conn) = state.conn.lock() {
                    if let Ok(Some(days_str)) = get_setting(&conn, "trashAutoPurgeDays") {
                        if let Ok(days) = days_str.parse::<i64>() {
                            if days > 0 {
                                let _ = purge_old_trash(&conn, days);
                            }
                        }
                    }
                }
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "macos")]
    let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let modifiers = Modifiers::CONTROL | Modifiers::SHIFT;
    let shortcut = Shortcut::new(Some(modifiers), Code::Space);

    tauri::Builder::default()
        .setup(move |app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = app_data_dir.join("noteszen.db");
            let conn = db::init_db(&db_path).map_err(|e| e.to_string())?;
            app.manage(DbState {
                conn: Mutex::new(conn),
                db_path,
            });

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app_handle, triggered_shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if triggered_shortcut == &shortcut {
                                toggle_quick_capture(app_handle);
                            }
                        }
                    })
                    .build(),
            )?;

            let _ = app.handle().global_shortcut().register(shortcut);

            #[cfg(desktop)]
            {
                let _ = setup_tray(app.handle());
            }

            run_trash_purge(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_notes,
            save_note,
            delete_note,
            import_notes_cmd,
            search_notes,
            get_folders_cmd,
            save_folder_cmd,
            delete_folder_cmd,
            get_templates_cmd,
            save_template_cmd,
            delete_template_cmd,
            get_note_versions_cmd,
            restore_version_cmd,
            get_vaults_cmd,
            set_active_vault_cmd,
            create_vault_cmd,
            get_setting_cmd,
            save_setting_cmd,
            purge_old_trash_cmd,
            export_sync_data_cmd,
            import_sync_data_cmd,
            save_image,
            read_image_data_url,
            minimize_window,
            maximize_window,
            close_window,
            close_quick_capture,
            show_main_window,
            log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}