use rusqlite::{params, Connection, OptionalExtension};
use std::path::Path;

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
    pub icon: Option<String>,
    pub cover: Option<String>,
    pub status: Option<String>,
    pub editor_mode: String,
    pub trashed_at: Option<String>,
    pub vault_id: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub color: String,
    pub sort_order: i32,
    pub vault_id: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: String,
    pub name: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NoteVersion {
    pub id: String,
    pub note_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Vault {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_active: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub note: Note,
    pub snippet: String,
}

fn add_column_if_missing(conn: &Connection, table: &str, column: &str, definition: &str) {
    let sql = format!("ALTER TABLE {table} ADD COLUMN {column} {definition}");
    let _ = conn.execute(&sql, []);
}

pub fn init_db(db_path: &Path) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch(
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
        );
        CREATE TABLE IF NOT EXISTS tags (
            noteId TEXT,
            tag TEXT,
            PRIMARY KEY (noteId, tag)
        );
        CREATE TABLE IF NOT EXISTS backlinks (
            sourceId TEXT,
            targetId TEXT,
            PRIMARY KEY (sourceId, targetId)
        );
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT DEFAULT 'text-primary',
            sortOrder INTEGER DEFAULT 0,
            vaultId TEXT DEFAULT 'default'
        );
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            title TEXT,
            content TEXT,
            tags TEXT DEFAULT '[]'
        );
        CREATE TABLE IF NOT EXISTS note_versions (
            id TEXT PRIMARY KEY,
            noteId TEXT NOT NULL,
            title TEXT,
            content TEXT,
            createdAt TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS vaults (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT,
            isActive INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );",
    )?;

    add_column_if_missing(&conn, "notes", "icon", "TEXT");
    add_column_if_missing(&conn, "notes", "cover", "TEXT");
    add_column_if_missing(&conn, "notes", "status", "TEXT");
    add_column_if_missing(&conn, "notes", "editorMode", "TEXT DEFAULT 'wysiwyg'");
    add_column_if_missing(&conn, "notes", "trashedAt", "TEXT");
    add_column_if_missing(&conn, "notes", "vaultId", "TEXT DEFAULT 'default'");

    conn.execute_batch(
        "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            note_id UNINDEXED,
            title,
            content,
            tags,
            tokenize='porter'
        );",
    )?;

    let fts_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM notes_fts", [], |r| r.get(0))
        .unwrap_or(0);
    if fts_count == 0 {
        if let Ok(notes) = get_sql_notes(&conn, None) {
            for note in notes {
                let _ = upsert_fts(&conn, &note);
            }
        }
    }

    let vault_count: i64 = conn.query_row("SELECT COUNT(*) FROM vaults", [], |r| r.get(0))?;
    if vault_count == 0 {
        conn.execute(
            "INSERT INTO vaults (id, name, path, isActive) VALUES ('default', 'Default Vault', '', 1)",
            [],
        )?;
    }

    let template_count: i64 = conn.query_row("SELECT COUNT(*) FROM templates", [], |r| r.get(0))?;
    if template_count == 0 {
        conn.execute(
            "INSERT INTO templates (id, name, title, content, tags) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                "daily-template",
                "Daily Note",
                "Daily Note",
                "## Daily Log\n\n- [ ] Task 1\n- [ ] Task 2\n\n### Thoughts\n- ",
                "[]"
            ],
        )?;
        conn.execute(
            "INSERT INTO templates (id, name, title, content, tags) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                "meeting-template",
                "Meeting Notes",
                "Meeting Notes",
                "## Attendees\n\n## Agenda\n\n## Notes\n\n## Action Items\n- [ ] ",
                "[\"meeting\"]"
            ],
        )?;
    }

    Ok(conn)
}

fn row_to_note(row: &rusqlite::Row) -> Result<Note, rusqlite::Error> {
    let tag_list: Option<String> = row.get("tagList")?;
    let target_list: Option<String> = row.get("targetList")?;
    let tags = tag_list
        .map(|s| s.split(',').map(|t| t.to_string()).collect())
        .unwrap_or_default();
    let backlinks = target_list
        .map(|s| s.split(',').map(|b| b.to_string()).collect())
        .unwrap_or_default();

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
        icon: row.get("icon")?,
        cover: row.get("cover")?,
        status: row.get("status")?,
        editor_mode: row
            .get::<_, Option<String>>("editorMode")?
            .unwrap_or_else(|| "wysiwyg".to_string()),
        trashed_at: row.get("trashedAt")?,
        vault_id: row
            .get::<_, Option<String>>("vaultId")?
            .unwrap_or_else(|| "default".to_string()),
    })
}

pub fn get_sql_notes(conn: &Connection, vault_id: Option<&str>) -> Result<Vec<Note>, rusqlite::Error> {
    get_sql_notes_with_content_expr(conn, vault_id, "n.content")
}

pub fn get_sql_note_previews(conn: &Connection, vault_id: Option<&str>) -> Result<Vec<Note>, rusqlite::Error> {
    get_sql_notes_with_content_expr(conn, vault_id, "substr(n.content, 1, 1200)")
}

pub fn get_sql_note(conn: &Connection, note_id: &str) -> Result<Option<Note>, rusqlite::Error> {
    let sql = "SELECT n.id, n.title, n.content, n.folder, n.isPinned, n.isFavorite, n.isArchived,
                    n.createdAt, n.updatedAt, n.icon, n.cover, n.status, n.editorMode, n.trashedAt, n.vaultId,
                    (SELECT group_concat(tag) FROM tags WHERE noteId = n.id) as tagList,
                    (SELECT group_concat(targetId) FROM backlinks WHERE sourceId = n.id) as targetList
             FROM notes n WHERE n.id = ?1";
    conn.query_row(sql, [note_id], row_to_note).optional()
}

fn get_sql_notes_with_content_expr(
    conn: &Connection,
    vault_id: Option<&str>,
    content_expr: &str,
) -> Result<Vec<Note>, rusqlite::Error> {
    let (sql, vault_param): (String, Option<String>) = match vault_id {
        Some(v) => (
            format!("SELECT n.id, n.title, {content_expr} as content, n.folder, n.isPinned, n.isFavorite, n.isArchived,
                    n.createdAt, n.updatedAt, n.icon, n.cover, n.status, n.editorMode, n.trashedAt, n.vaultId,
                    (SELECT group_concat(tag) FROM tags WHERE noteId = n.id) as tagList,
                    (SELECT group_concat(targetId) FROM backlinks WHERE sourceId = n.id) as targetList
             FROM notes n WHERE n.vaultId = ?1"),
            Some(v.to_string()),
        ),
        None => (
            format!("SELECT n.id, n.title, {content_expr} as content, n.folder, n.isPinned, n.isFavorite, n.isArchived,
                    n.createdAt, n.updatedAt, n.icon, n.cover, n.status, n.editorMode, n.trashedAt, n.vaultId,
                    (SELECT group_concat(tag) FROM tags WHERE noteId = n.id) as tagList,
                    (SELECT group_concat(targetId) FROM backlinks WHERE sourceId = n.id) as targetList
             FROM notes n"),
            None,
        ),
    };

    let mut stmt = conn.prepare(&sql)?;
    let note_iter = if let Some(v) = vault_param {
        stmt.query_map([v], row_to_note)?
    } else {
        stmt.query_map([], row_to_note)?
    };

    let mut notes = Vec::new();
    for note in note_iter {
        notes.push(note?);
    }
    Ok(notes)
}

fn upsert_fts(conn: &Connection, note: &Note) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM notes_fts WHERE note_id = ?1", [&note.id])?;
    let tags = note.tags.join(" ");
    conn.execute(
        "INSERT INTO notes_fts (note_id, title, content, tags) VALUES (?1, ?2, ?3, ?4)",
        params![note.id, note.title, note.content, tags],
    )?;
    Ok(())
}

pub fn save_sql_note(conn: &Connection, note: &Note, save_version: bool) -> Result<(), rusqlite::Error> {
    if save_version {
        let existing: Option<(String, String)> = conn
            .query_row(
                "SELECT title, content FROM notes WHERE id = ?1",
                [&note.id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()?;
        if let Some((old_title, old_content)) = existing {
            if old_title != note.title || old_content != note.content {
                let version_id = format!("{}-{}", note.id, chrono::Utc::now().timestamp_millis());
                conn.execute(
                    "INSERT INTO note_versions (id, noteId, title, content, createdAt) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![
                        version_id,
                        note.id,
                        old_title,
                        old_content,
                        chrono::Utc::now().to_rfc3339()
                    ],
                )?;
                let count: i64 = conn.query_row(
                    "SELECT COUNT(*) FROM note_versions WHERE noteId = ?1",
                    [&note.id],
                    |r| r.get(0),
                )?;
                if count > 50 {
                    conn.execute(
                        "DELETE FROM note_versions WHERE id IN (
                            SELECT id FROM note_versions WHERE noteId = ?1
                            ORDER BY createdAt ASC LIMIT ?2
                        )",
                        params![note.id, count - 50],
                    )?;
                }
            }
        }
    }

    conn.execute(
        "INSERT OR REPLACE INTO notes (
            id, title, content, folder, isPinned, isFavorite, isArchived,
            createdAt, updatedAt, icon, cover, status, editorMode, trashedAt, vaultId
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            note.id,
            note.title,
            note.content,
            note.folder,
            if note.is_pinned { 1 } else { 0 },
            if note.is_favorite { 1 } else { 0 },
            if note.is_archived { 1 } else { 0 },
            note.created_at,
            note.updated_at,
            note.icon,
            note.cover,
            note.status,
            note.editor_mode,
            note.trashed_at,
            note.vault_id,
        ],
    )?;

    conn.execute("DELETE FROM tags WHERE noteId = ?1", [&note.id])?;
    for tag in &note.tags {
        if !tag.trim().is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO tags (noteId, tag) VALUES (?1, ?2)",
                (&note.id, tag.trim()),
            )?;
        }
    }

    conn.execute("DELETE FROM backlinks WHERE sourceId = ?1", [&note.id])?;
    for target_id in &note.backlinks {
        if !target_id.trim().is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO backlinks (sourceId, targetId) VALUES (?1, ?2)",
                (&note.id, target_id.trim()),
            )?;
        }
    }

    upsert_fts(conn, note)?;
    Ok(())
}

pub fn delete_sql_note(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM notes WHERE id = ?1", [id])?;
    conn.execute("DELETE FROM tags WHERE noteId = ?1", [id])?;
    conn.execute(
        "DELETE FROM backlinks WHERE sourceId = ?1 OR targetId = ?2",
        [id, id],
    )?;
    conn.execute("DELETE FROM notes_fts WHERE note_id = ?1", [id])?;
    conn.execute("DELETE FROM note_versions WHERE noteId = ?1", [id])?;
    Ok(())
}

pub fn import_notes(conn: &Connection, notes: &[Note], merge: bool) -> Result<usize, rusqlite::Error> {
    if !merge {
        let existing = get_sql_notes(conn, None)?;
        for note in existing {
            delete_sql_note(conn, &note.id)?;
        }
    }
    let mut count = 0;
    for note in notes {
        save_sql_note(conn, note, false)?;
        count += 1;
    }
    Ok(count)
}

pub fn search_notes_fts(conn: &Connection, query: &str, vault_id: Option<&str>) -> Result<Vec<SearchResult>, rusqlite::Error> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    let fts_query = query
        .split_whitespace()
        .map(|w| format!("\"{w}\"*"))
        .collect::<Vec<_>>()
        .join(" AND ");

    let sql = if vault_id.is_some() {
        "SELECT f.note_id, snippet(notes_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
         FROM notes_fts f
         JOIN notes n ON n.id = f.note_id
         WHERE notes_fts MATCH ?1 AND n.vaultId = ?2 AND n.folder != 'trash'
         ORDER BY rank LIMIT 50"
    } else {
        "SELECT f.note_id, snippet(notes_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
         FROM notes_fts f
         JOIN notes n ON n.id = f.note_id
         WHERE notes_fts MATCH ?1 AND n.folder != 'trash'
         ORDER BY rank LIMIT 50"
    };

    fn map_fts_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<(String, String)> {
        Ok((row.get(0)?, row.get(1)?))
    }

    let mut stmt = conn.prepare(sql)?;
    let row_pairs: Vec<(String, String)> = if let Some(v) = vault_id {
        stmt.query_map(params![fts_query, v], map_fts_row)?
            .collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map(params![fts_query], map_fts_row)?
            .collect::<Result<Vec<_>, _>>()?
    };

    let mut results = Vec::new();
    for (id, snippet) in row_pairs {
        if let Some(note) = get_sql_note(conn, &id)? {
            results.push(SearchResult {
                note,
                snippet: snippet.replace("<mark>", "").replace("</mark>", ""),
            });
        }
    }
    Ok(results)
}

pub fn get_folders(conn: &Connection, vault_id: &str) -> Result<Vec<Folder>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, name, color, sortOrder, vaultId FROM folders WHERE vaultId = ?1 ORDER BY sortOrder ASC, name ASC",
    )?;
    let iter = stmt.query_map([vault_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            sort_order: row.get(3)?,
            vault_id: row.get(4)?,
        })
    })?;
    let mut folders = Vec::new();
    for f in iter {
        folders.push(f?);
    }
    Ok(folders)
}

pub fn save_folder(conn: &Connection, folder: &Folder) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT OR REPLACE INTO folders (id, name, color, sortOrder, vaultId) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            folder.id,
            folder.name,
            folder.color,
            folder.sort_order,
            folder.vault_id
        ],
    )?;
    Ok(())
}

pub fn delete_folder(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM folders WHERE id = ?1", [id])?;
    conn.execute(
        "UPDATE notes SET folder = 'personal' WHERE folder = ?1",
        [id],
    )?;
    Ok(())
}

pub fn get_templates(conn: &Connection) -> Result<Vec<Template>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT id, name, title, content, tags FROM templates ORDER BY name ASC")?;
    let iter = stmt.query_map([], |row| {
        let tags_json: String = row.get(4)?;
        let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
        Ok(Template {
            id: row.get(0)?,
            name: row.get(1)?,
            title: row.get(2)?,
            content: row.get(3)?,
            tags,
        })
    })?;
    let mut templates = Vec::new();
    for t in iter {
        templates.push(t?);
    }
    Ok(templates)
}

pub fn save_template(conn: &Connection, template: &Template) -> Result<(), rusqlite::Error> {
    let tags_json = serde_json::to_string(&template.tags).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT OR REPLACE INTO templates (id, name, title, content, tags) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            template.id,
            template.name,
            template.title,
            template.content,
            tags_json
        ],
    )?;
    Ok(())
}

pub fn delete_template(conn: &Connection, id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM templates WHERE id = ?1", [id])?;
    Ok(())
}

pub fn get_note_versions(conn: &Connection, note_id: &str) -> Result<Vec<NoteVersion>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, noteId, title, content, createdAt FROM note_versions WHERE noteId = ?1 ORDER BY createdAt DESC LIMIT 50",
    )?;
    let iter = stmt.query_map([note_id], |row| {
        Ok(NoteVersion {
            id: row.get(0)?,
            note_id: row.get(1)?,
            title: row.get(2)?,
            content: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    let mut versions = Vec::new();
    for v in iter {
        versions.push(v?);
    }
    Ok(versions)
}

pub fn restore_version(conn: &Connection, version_id: &str) -> Result<Option<Note>, rusqlite::Error> {
    let version: NoteVersion = conn.query_row(
        "SELECT id, noteId, title, content, createdAt FROM note_versions WHERE id = ?1",
        [version_id],
        |row| {
            Ok(NoteVersion {
                id: row.get(0)?,
                note_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        },
    )?;

    let mut notes = get_sql_notes(conn, None)?;
    let note = notes.iter_mut().find(|n| n.id == version.note_id);
    if let Some(note) = note {
        note.title = version.title;
        note.content = version.content;
        note.updated_at = chrono::Utc::now().to_rfc3339();
        let updated = note.clone();
        save_sql_note(conn, &updated, true)?;
        return Ok(Some(updated));
    }
    Ok(None)
}

pub fn get_vaults(conn: &Connection) -> Result<Vec<Vault>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT id, name, path, isActive FROM vaults ORDER BY name ASC")?;
    let iter = stmt.query_map([], |row| {
        Ok(Vault {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            is_active: row.get::<_, i32>(3)? == 1,
        })
    })?;
    let mut vaults = Vec::new();
    for v in iter {
        vaults.push(v?);
    }
    Ok(vaults)
}

pub fn set_active_vault(conn: &Connection, vault_id: &str) -> Result<(), rusqlite::Error> {
    conn.execute("UPDATE vaults SET isActive = 0", [])?;
    conn.execute("UPDATE vaults SET isActive = 1 WHERE id = ?1", [vault_id])?;
    Ok(())
}

pub fn create_vault(conn: &Connection, vault: &Vault) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT OR REPLACE INTO vaults (id, name, path, isActive) VALUES (?1, ?2, ?3, ?4)",
        params![
            vault.id,
            vault.name,
            vault.path,
            if vault.is_active { 1 } else { 0 }
        ],
    )?;
    Ok(())
}

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, rusqlite::Error> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get(0),
    )
    .optional()
}

pub fn save_setting(conn: &Connection, key: &str, value: &str) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )?;
    Ok(())
}

pub fn purge_old_trash(conn: &Connection, days: i64) -> Result<usize, rusqlite::Error> {
    let cutoff = chrono::Utc::now() - chrono::Duration::days(days);
    let cutoff_str = cutoff.to_rfc3339();
    let mut stmt = conn.prepare(
        "SELECT id FROM notes WHERE folder = 'trash' AND trashedAt IS NOT NULL AND trashedAt < ?1",
    )?;
    let ids: Vec<String> = stmt
        .query_map([&cutoff_str], |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();
    let count = ids.len();
    for id in ids {
        delete_sql_note(conn, &id)?;
    }
    Ok(count)
}

pub fn export_sync_data(conn: &Connection, vault_id: &str) -> Result<String, rusqlite::Error> {
    let notes = get_sql_notes(conn, Some(vault_id))?;
    let folders = get_folders(conn, vault_id)?;
    let payload = serde_json::json!({
        "version": 1,
        "exportedAt": chrono::Utc::now().to_rfc3339(),
        "vaultId": vault_id,
        "notes": notes,
        "folders": folders,
    });
    Ok(payload.to_string())
}

pub fn import_sync_data(conn: &Connection, data: &str, merge: bool) -> Result<usize, rusqlite::Error> {
    let parsed: serde_json::Value = serde_json::from_str(data).map_err(|e| {
        rusqlite::Error::InvalidParameterName(e.to_string())
    })?;
    let notes: Vec<Note> = serde_json::from_value(parsed["notes"].clone()).map_err(|e| {
        rusqlite::Error::InvalidParameterName(e.to_string())
    })?;
    if let Ok(folders) = serde_json::from_value::<Vec<Folder>>(parsed["folders"].clone()) {
        for folder in folders {
            save_folder(conn, &folder)?;
        }
    }
    import_notes(conn, &notes, merge)
}
