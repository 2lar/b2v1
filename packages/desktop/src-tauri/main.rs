// packages/desktop/src-tauri/src/main.rs
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
  )]
  
  use serde::{Deserialize, Serialize};
  use std::fs;
  use std::path::Path;
  use tauri::command;
  
  #[derive(Serialize, Deserialize)]
  struct Note {
    id: String,
    content: String,
    created_at: String,
    updated_at: Option<String>,
  }
  
  #[derive(Serialize, Deserialize)]
  struct Connection {
    id: String,
    source_id: String,
    target_id: String,
    strength: f32,
    type_name: String,
    created_at: String,
  }
  
  #[derive(Serialize, Deserialize)]
  struct DataFile<T> {
    data: Vec<T>,
  }
  
  #[command]
  fn check_vault_path(path: &str) -> bool {
    Path::new(path).exists()
  }
  
  #[command]
  fn read_notes(vault_path: &str) -> Result<Vec<Note>, String> {
    let notes_path = Path::new(vault_path).join("notes.json");
    
    if !notes_path.exists() {
      return Ok(Vec::new());
    }
    
    let notes_content = fs::read_to_string(notes_path)
      .map_err(|e| format!("Failed to read notes: {}", e))?;
      
    let notes: Vec<Note> = serde_json::from_str(&notes_content)
      .map_err(|e| format!("Failed to parse notes: {}", e))?;
      
    Ok(notes)
  }
  
  #[command]
  fn write_notes(vault_path: &str, notes: Vec<Note>) -> Result<(), String> {
    let notes_path = Path::new(vault_path).join("notes.json");
    
    let notes_content = serde_json::to_string_pretty(&notes)
      .map_err(|e| format!("Failed to serialize notes: {}", e))?;
      
    fs::write(notes_path, notes_content)
      .map_err(|e| format!("Failed to write notes: {}", e))?;
      
    Ok(())
  }
  
  // Similar commands for connections and other data...
  
  fn main() {
    tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![
        check_vault_path,
        read_notes,
        write_notes,
        // Other commands...
      ])
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
  }