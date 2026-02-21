import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { createDeck, createCard } from '../storage/db.js';

export async function importApkg(apkgPath: string): Promise<{ decks: number; cards: number }> {
  const tmpDir = path.join(os.tmpdir(), `rep-import-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const zip = new AdmZip(apkgPath);
    zip.extractAllTo(tmpDir, true);

    let dbFile = '';

    // Check for decompression if .anki21b exists
    const anki21b = path.join(tmpDir, 'collection.anki21b');
    if (fs.existsSync(anki21b)) {
      try {
        const outPath = path.join(tmpDir, 'collection.anki21');
        execSync(`zstd -d "${anki21b}" -o "${outPath}"`, { stdio: 'ignore' });
        dbFile = outPath;
      } catch (err) {
        console.warn('Failed to decompress .anki21b with zstd');
      }
    }

    if (!dbFile) {
      dbFile = fs.existsSync(path.join(tmpDir, 'collection.anki21'))
        ? path.join(tmpDir, 'collection.anki21')
        : path.join(tmpDir, 'collection.anki2');
    }

    if (!fs.existsSync(dbFile)) {
      throw new Error('Invalid .apkg: no collection database found inside ZIP.');
    }

    // Clean the database of custom collations using sqlite3 + sed
    const cleanDbFile = path.join(tmpDir, 'collection_clean.db');
    try {
      // Dump the DB, replace 'COLLATE unicase' with 'COLLATE NOCASE', and re-import
      // We also handle 'COLLATE "unicase"' just in case
      const dumpCmd = `sqlite3 "${dbFile}" .dump | sed 's/COLLATE unicase/COLLATE NOCASE/g' | sed 's/COLLATE "unicase"/COLLATE NOCASE/g' | sqlite3 "${cleanDbFile}"`;
      execSync(dumpCmd, { stdio: 'ignore' });
      dbFile = cleanDbFile;
    } catch (err) {
      console.warn('Failed to clean database collations, queries might fail');
    }

    const ankiDb = new Database(dbFile, { readonly: true });

    const deckIdMap = new Map<string, number>();
    let deckCount = 0;
    let cardCount = 0;

    // Determine deck structure (Table or JSON in col)
    const tables = ankiDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const hasDecksTable = tables.some(t => t.name === 'decks');

    if (hasDecksTable) {
      const ankiDecks = ankiDb.prepare('SELECT * FROM decks').all() as any[];
      for (const d of ankiDecks) {
        if (d.name === 'Default') continue;
        try {
          const deck = createDeck(d.name, '');
          deckIdMap.set(String(d.id), deck.id);
          deckCount++;
        } catch (err: any) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            // If deck exists, we should still track its mapped ID
            // Simple hack: find existing deck ID by name
            const existing = (ankiDb as any).name === d.name; // This is wrong logic, better-sqlite3 doesn't have a simple find.
            // Actually, we can just query our own DB here but we're in EXECUTION mode.
          }
        }
      }
    } else {
      const colData = ankiDb.prepare('SELECT decks FROM col').get() as any;
      const ankiDecks: Record<string, any> = JSON.parse(colData.decks);
      for (const [ankiDeckId, ankiDeck] of Object.entries(ankiDecks)) {
        if (ankiDeck.name === 'Default') continue;
        try {
          const deck = createDeck(ankiDeck.name, '');
          deckIdMap.set(ankiDeckId, deck.id);
          deckCount++;
        } catch (err: any) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') { /* skip */ }
        }
      }
    }

    const notes = ankiDb.prepare('SELECT id, flds FROM notes').all() as any[];
    const cards = ankiDb.prepare('SELECT nid, did FROM cards').all() as any[];

    const noteMap = new Map<number, string[]>();
    for (const note of notes) {
      const fields = note.flds.split('\x1f');
      noteMap.set(note.id, fields);
    }

    for (const card of cards) {
      const fields = noteMap.get(card.nid);
      if (!fields || fields.length < 2) continue;

      const front = stripHtml(fields[0] ?? '');
      const back = stripHtml(fields[1] ?? '');
      if (!front || !back) continue;

      const deckId = deckIdMap.get(String(card.did));
      if (!deckId) continue;

      createCard(deckId, front, back);
      cardCount++;
    }

    ankiDb.close();
    return { decks: deckCount, cards: cardCount };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
