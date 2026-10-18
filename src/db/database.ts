import Database from "better-sqlite3";

const db:Database.Database = new Database("../../data/count.db")

db.pragma("journal_mode = WAL");

db.exec(`
    
    CREATE TABLE IF NOT EXISTS contadores(
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     guild_id TEXT NOT NULL,
     name TEXT NOT NULL,
     points INTEGER NOT NULL DEFAULT 0
     UNIQUE (guild_id, name)
    );    
`);

export default db;