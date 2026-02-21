import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'rep');
const DB_PATH = path.join(CONFIG_DIR, 'data.db');
let db;
function getDb() {
    if (!db) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
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
      front_image TEXT,
      back_image TEXT,
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
export function getDeckStats() {
    const db = getDb();
    const decks = getAllDecks();
    const today = new Date().toISOString().split('T')[0];
    return decks.map(deck => {
        const total = db.prepare('SELECT COUNT(*) as count FROM cards WHERE deck_id = ?').get(deck.id).count;
        const due = db.prepare('SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND due_date <= ?').get(deck.id, today).count;
        const newCards = db.prepare('SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND repetitions = 0').get(deck.id).count;
        return { deck, total, due, newCards };
    });
}
export function createCard(deckId, front, back, frontImage, backImage) {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO cards (deck_id, front, back, front_image, back_image) VALUES (?, ?, ?, ?, ?) RETURNING *');
    const row = stmt.get(deckId, front, back, frontImage, backImage);
    return rowToCard(row);
}
export function updateCard(id, updates) {
    const db = getDb();
    const fields = Object.keys(updates).map(k => {
        const dbKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${dbKey} = ?`;
    });
    const values = Object.values(updates);
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
        .prepare('SELECT * FROM cards WHERE deck_id = ? AND due_date <= ? ORDER BY due_date ASC LIMIT ?')
        .all(deckId, today, limit);
    return rows.map(rowToCard);
}
export function updateCardAfterReview(cardId, interval, easeFactor, repetitions, dueDate) {
    const db = getDb();
    db.prepare(`UPDATE cards SET interval=?, ease_factor=?, repetitions=?, due_date=?,
     updated_at=datetime('now') WHERE id=?`).run(interval, easeFactor, repetitions, dueDate, cardId);
}
export function deleteCard(id) {
    const db = getDb();
    db.prepare('DELETE FROM cards WHERE id = ?').run(id);
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
        frontImage: row.front_image ?? undefined,
        backImage: row.back_image ?? undefined,
        interval: row.interval,
        easeFactor: row.ease_factor,
        repetitions: row.repetitions,
        dueDate: row.due_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export { DB_PATH };
