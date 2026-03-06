import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'rep');
const DB_PATH = path.join(CONFIG_DIR, 'data.db');
// const MEDIA_DIR = path.join(CONFIG_DIR, 'media');
let db;
function getDb() {
    if (!db) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
        // fs.mkdirSync(MEDIA_DIR, { recursive: true });
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initSchema(db);
    }
    return db;
}
function initSchema(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      -- front_image TEXT,
      -- back_image TEXT,
      state TEXT NOT NULL DEFAULT 'new',
      learning_step INTEGER NOT NULL DEFAULT 0,
      interval INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
  `);
    // Migration: Add state and learning_step columns if they don't exist
    const tableInfo = db.prepare("PRAGMA table_info(cards)").all();
    const columns = tableInfo.map((c) => c.name);
    if (!columns.includes('state')) {
        try {
            db.exec("ALTER TABLE cards ADD COLUMN state TEXT NOT NULL DEFAULT 'new';");
        }
        catch (err) {
            // Column already exists
        }
    }
    if (!columns.includes('learning_step')) {
        try {
            db.exec("ALTER TABLE cards ADD COLUMN learning_step INTEGER NOT NULL DEFAULT 0;");
        }
        catch (err) {
            // Column already exists
        }
    }
}
export function createDeck(name, description = '') {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO decks (name, description) VALUES (?, ?) RETURNING *');
    const row = stmt.get(name, description);
    return rowToDeck(row);
}
export function getAllDecks() {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM decks ORDER BY name').all();
    return rows.map(rowToDeck);
}
export function getDeckById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
    return row ? rowToDeck(row) : null;
}
export function deleteDeck(id) {
    const db = getDb();
    db.prepare('DELETE FROM decks WHERE id = ?').run(id);
}
export function deleteDecks(ids) {
    const db = getDb();
    const drop = db.transaction((ids) => {
        const stmt = db.prepare('DELETE FROM decks WHERE id = ?');
        for (const id of ids)
            stmt.run(id);
    });
    drop(ids);
}
export function getDeckStats() {
    const db = getDb();
    const decks = getAllDecks();
    const today = new Date().toISOString().split('T')[0];
    return decks.map(deck => {
        const total = db.prepare('SELECT COUNT(*) as count FROM cards WHERE deck_id = ?').get(deck.id).count;
        const due = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND state = 'review' AND due_date <= ?`).get(deck.id, today).count;
        const newCards = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND state = 'new'`).get(deck.id).count;
        const learning = db.prepare(`SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND state IN ('learning', 'relearning')`).get(deck.id).count;
        return { deck, total, due, newCards, learning };
    });
}
export function createCard(deckId, front, back) {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?) RETURNING *');
    const row = stmt.get(deckId, front, back);
    return rowToCard(row);
}
export function updateCard(id, updates) {
    const db = getDb();
    const fields = Object.keys(updates).map(k => {
        const dbKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = ?`;
    });
    const values = Object.values(updates).map(v => v ?? null);
    if (fields.length === 0)
        return;
    const sql = `UPDATE cards SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`;
    db.prepare(sql).run(...values, id);
}
export function getCardsByDeckId(deckId) {
    const db = getDb();
    const rows = db
        .prepare('SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC')
        .all(deckId);
    return rows.map(rowToCard);
}
export function getDueCards(deckId, limit = 20) {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const rows = db
        .prepare(`SELECT * FROM cards WHERE deck_id = ? AND state = 'review' AND due_date <= ? ORDER BY due_date ASC LIMIT ?`)
        .all(deckId, today, limit);
    return rows.map(rowToCard);
}
export function getNewCards(deckId, limit = 20) {
    const db = getDb();
    const rows = db
        .prepare(`SELECT * FROM cards WHERE deck_id = ? AND state = 'new' ORDER BY created_at ASC LIMIT ?`)
        .all(deckId, limit);
    return rows.map(rowToCard);
}
export function getLearningCards(deckId) {
    const db = getDb();
    const rows = db
        .prepare(`SELECT * FROM cards WHERE deck_id = ? AND state IN ('learning', 'relearning') ORDER BY due_date ASC`)
        .all(deckId);
    return rows.map(rowToCard);
}
export function updateCardAfterReview(cardId, state, learningStep, interval, easeFactor, repetitions, dueDate) {
    const db = getDb();
    db.prepare(`UPDATE cards SET state=?, learning_step=?, interval=?, ease_factor=?, repetitions=?, due_date=?,
     updated_at=datetime('now') WHERE id=?`).run(state, learningStep, interval, easeFactor, repetitions, dueDate, cardId);
}
export function deleteCard(id) {
    const db = getDb();
    db.prepare('DELETE FROM cards WHERE id = ?').run(id);
}
export function deleteCards(ids) {
    const db = getDb();
    const deleteMany = db.transaction((ids) => {
        const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
        for (const id of ids)
            stmt.run(id);
    });
    deleteMany(ids);
}
function rowToDeck(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function rowToCard(row) {
    return {
        id: row.id,
        deckId: row.deck_id,
        front: row.front,
        back: row.back,
        // frontImage: row.front_image ?? undefined,
        // backImage: row.back_image ?? undefined,
        state: (row.state ?? 'new'),
        learningStep: row.learning_step ?? 0,
        interval: row.interval,
        easeFactor: row.ease_factor,
        repetitions: row.repetitions,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export { DB_PATH, CONFIG_DIR /*, MEDIA_DIR */ };
