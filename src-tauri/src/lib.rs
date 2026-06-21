use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, Window};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub folder: String,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Vec<String>,
    pub backlinks: Vec<String>,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

use rusqlite::Connection;

fn init_db(db_path: &std::path::Path) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT,
            content TEXT,
            folder TEXT,
            isPinned INTEGER DEFAULT 0,
            isFavorite INTEGER DEFAULT 0,
            isArchived INTEGER DEFAULT 0,
            createdAt TEXT,
            updatedAt TEXT
        );",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            noteId TEXT,
            tag TEXT,
            PRIMARY KEY (noteId, tag)
        );",
        [],
    )?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS backlinks (
            sourceId TEXT,
            targetId TEXT,
            PRIMARY KEY (sourceId, targetId)
        );",
        [],
    )?;
    Ok(conn)
}

fn get_sql_notes(conn: &Connection) -> Result<Vec<Note>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, folder, isPinned, isFavorite, isArchived, createdAt, updatedAt,
                (SELECT group_concat(tag) FROM tags WHERE noteId = id) as tagList,
                (SELECT group_concat(targetId) FROM backlinks WHERE sourceId = id) as targetList
         FROM notes"
    )?;
    
    let note_iter = stmt.query_map([], |row| {
        let tag_list: Option<String> = row.get("tagList")?;
        let target_list: Option<String> = row.get("targetList")?;
        
        let tags = tag_list
            .map(|s| s.split(',').map(|t| t.to_string()).collect())
            .unwrap_or_else(Vec::new);
            
        let backlinks = target_list
            .map(|s| s.split(',').map(|b| b.to_string()).collect())
            .unwrap_or_else(Vec::new);
            
        Ok(Note {
            id: row.get("id")?,
            title: row.get("title")?,
            content: row.get("content")?,
            folder: row.get("folder")?,
            is_pinned: row.get::<_, i32>("isPinned")? == 1,
            is_favorite: row.get::<_, i32>("isFavorite")? == 1,
            is_archived: row.get::<_, i32>("isArchived")? == 1,
            created_at: row.get("createdAt")?,
            updated_at: row.get("updatedAt")?,
            tags,
            backlinks,
        })
    })?;
    
    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note?);
    }
    Ok(notes)
}

fn save_sql_note(conn: &Connection, note: &Note) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT OR REPLACE INTO notes (id, title, content, folder, isPinned, isFavorite, isArchived, createdAt, updatedAt)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (
            &note.id,
            &note.title,
            &note.content,
            &note.folder,
            if note.is_pinned { 1 } else { 0 },
            if note.is_favorite { 1 } else { 0 },
            if note.is_archived { 1 } else { 0 },
            &note.created_at,
            &note.updated_at,
        ),
    )?;

    // Save tags
    conn.execute("DELETE FROM tags WHERE noteId = ?1", [&note.id])?;
    for tag in &note.tags {
        if !tag.trim().is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO tags (noteId, tag) VALUES (?1, ?2)",
                (&note.id, tag.trim()),
            )?;
        }
    }

    // Save backlinks
    conn.execute("DELETE FROM backlinks WHERE sourceId = ?1", [&note.id])?;
    for target_id in &note.backlinks {
        if !target_id.trim().is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO backlinks (sourceId, targetId) VALUES (?1, ?2)",
                (&note.id, target_id.trim()),
            )?;
        }
    }

    Ok(())
}

fn delete_sql_note(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM notes WHERE id = ?1", [id])?;
    conn.execute("DELETE FROM tags WHERE noteId = ?1", [id])?;
    conn.execute("DELETE FROM backlinks WHERE sourceId = ?1 OR targetId = ?2", [id, id])?;
    Ok(())
}

#[tauri::command]
fn get_notes(state: State<'_, DbState>) -> Result<Vec<Note>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    get_sql_notes(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_note(state: State<'_, DbState>, note: Note) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    save_sql_note(&conn, &note)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_note(state: State<'_, DbState>, note_id: String) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_sql_note(&conn, &note_id)
        .map(|_| true)
        .map_err(|e| e.to_string())
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
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_quick_capture(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("quick-capture") {
        window.hide().map_err(|e| e.to_string())
    } else {
        Ok(())
    }
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "macos")]
    let modifiers = Modifiers::SUPER | Modifiers::SHIFT;
    #[cfg(not(target_os = "macos"))]
    let modifiers = Modifiers::CONTROL | Modifiers::SHIFT;
    let shortcut = Shortcut::new(Some(modifiers), Code::Space);

    tauri::Builder::default()
        .setup(move |app| {
            let app_data_dir = app.path().app_data_dir().expect("Failed to get app data directory");
            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = app_data_dir.join("noteszen.db");
            let conn = init_db(&db_path).map_err(|e| e.to_string())?;
            app.manage(DbState {
                conn: Mutex::new(conn),
            });

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register global shortcut plugin and register shortcut
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app_handle, triggered_shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if triggered_shortcut == &shortcut {
                                toggle_quick_capture(app_handle);
                            }
                        }
                    })
                    .build()
            )?;

            let _ = app.handle().global_shortcut().register(shortcut);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_notes,
            save_note,
            delete_note,
            minimize_window,
            maximize_window,
            close_window,
            close_quick_capture,
            log
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
