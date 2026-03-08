import AdmZip from 'adm-zip';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
// import crypto from 'crypto';
import { execSync } from 'child_process';
import { createDeck, createCard, getAllDecks /*, MEDIA_DIR */ } from '../storage/db.js';
export async function importApkg(apkgPath) {
    // Ensure DB (and MEDIA_DIR) is initialised before we copy any media files
    getAllDecks();
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
            }
            catch (err) {
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
        }
        catch (err) {
            console.warn('Failed to clean database collations, queries might fail');
        }
        const ankiDb = new Database(dbFile, { readonly: true });
        const deckIdMap = new Map();
        let deckCount = 0;
        let cardCount = 0;
        // // Build media map: zip entry name ("0", "1"...) -> real filename
        // const mediaEntry = path.join(tmpDir, 'media');
        // let mediaMap: Record<string, string> = {};
        // if (fs.existsSync(mediaEntry)) {
        //   mediaMap = readMediaManifest(mediaEntry, tmpDir) ?? {};
        // }
        // Determine deck structure (Table or JSON in col)
        const tables = ankiDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const hasDecksTable = tables.some(t => t.name === 'decks');
        // Build a lookup of our existing decks by name for duplicate resolution
        const existingDecksByName = new Map(getAllDecks().map(d => [d.name, d.id]));
        if (hasDecksTable) {
            const ankiDecks = ankiDb.prepare('SELECT * FROM decks').all();
            for (const d of ankiDecks) {
                if (d.name === 'Default')
                    continue;
                try {
                    const deck = createDeck(d.name, '');
                    deckIdMap.set(String(d.id), deck.id);
                    deckCount++;
                }
                catch (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        // Deck already exists — still map the Anki ID so its cards are imported
                        const existingId = existingDecksByName.get(d.name);
                        if (existingId !== undefined)
                            deckIdMap.set(String(d.id), existingId);
                    }
                }
            }
        }
        else {
            const colData = ankiDb.prepare('SELECT decks FROM col').get();
            const ankiDecks = JSON.parse(colData.decks);
            for (const [ankiDeckId, ankiDeck] of Object.entries(ankiDecks)) {
                if (ankiDeck.name === 'Default')
                    continue;
                try {
                    const deck = createDeck(ankiDeck.name, '');
                    deckIdMap.set(ankiDeckId, deck.id);
                    deckCount++;
                }
                catch (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        // Deck already exists — still map the Anki ID so its cards are imported
                        const existingId = existingDecksByName.get(ankiDeck.name);
                        if (existingId !== undefined)
                            deckIdMap.set(ankiDeckId, existingId);
                    }
                }
            }
        }
        const notes = ankiDb.prepare('SELECT id, flds FROM notes').all();
        const cards = ankiDb.prepare('SELECT nid, did FROM cards').all();
        const noteMap = new Map();
        for (const note of notes) {
            const fields = note.flds.split('\x1f');
            noteMap.set(note.id, fields);
        }
        for (const card of cards) {
            const fields = noteMap.get(card.nid);
            if (!fields || fields.length < 2)
                continue;
            const frontRaw = fields[0] ?? '';
            const backRaw = fields[1] ?? '';
            // const frontImage = extractImage(frontRaw);
            // const backImage = extractImage(backRaw);
            // if (frontImage) copyMedia(frontImage, mediaMap, tmpDir);
            // if (backImage) copyMedia(backImage, mediaMap, tmpDir);
            // For image-only cards, use a placeholder so the card isn't silently dropped
            const front = stripHtml(frontRaw);
            const back = stripHtml(backRaw);
            if (!front || !back)
                continue;
            const deckId = deckIdMap.get(String(card.did));
            if (!deckId)
                continue;
            createCard(deckId, front, back);
            cardCount++;
        }
        ankiDb.close();
        return { decks: deckCount, cards: cardCount };
    }
    finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}
function stripHtml(html) {
    if (!html)
        return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<img[^>]+>/gi, '') // Strip image tags
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}
// function extractImage(html: string): string | undefined {
//   if (!html) return undefined;
//   const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
//   return match ? match[1] : undefined;
// }
// function copyMedia(filename: string, mediaMap: Record<string, string>, tmpDir: string) {
//   // mediaMap is { zipEntryName -> realFilename }; find the zip entry for this filename
//   const internalName = Object.keys(mediaMap).find(k => mediaMap[k] === filename);
//   if (!internalName) return;
//   const src = path.join(tmpDir, internalName);
//   const dest = path.join(MEDIA_DIR, filename);
//   if (!fs.existsSync(src)) return;
//
//   try {
//     // Modern Anki stores each media file zstd-compressed inside the zip.
//     // Check for the zstd magic number (28 b5 2f fd) before deciding how to copy.
//     const header = Buffer.alloc(4);
//     const fd = fs.openSync(src, 'r');
//     fs.readSync(fd, header, 0, 4, 0);
//     fs.closeSync(fd);
//
//     if (header.toString('hex') === '28b52ffd') {
//       execSync(`zstd -d "${src}" -o "${dest}" --force`, { stdio: 'ignore' });
//     } else {
//       fs.copyFileSync(src, dest);
//     }
//   } catch (err) {
//     console.warn(`Failed to copy media file ${filename}:`, err);
//   }
// }
// interface MediaProtoEntry {
//   name: string;
//   sha1: Buffer | null;
// }
// /**
//  * Reads the Anki media manifest and returns a map of { zipEntryName -> realFilename }.
//  *
//  * Legacy format: plain JSON  { "0": "cat.jpg", "1": "dog.jpg" }
//  * Modern format: zstd-compressed protobuf where the zip entry names are still
//  *   numeric strings, but the manifest proto stores { name, sha1 } pairs.
//  *   We identify which numeric file maps to which real name by SHA1 digest.
//  */
// function readMediaManifest(mediaPath: string, tmpDir: string): Record<string, string> | null {
//   const raw = fs.readFileSync(mediaPath);
//
//   // --- Legacy: plain JSON ---
//   try {
//     const obj = JSON.parse(raw.toString('utf8'));
//     if (typeof obj === 'object' && obj !== null) return obj as Record<string, string>;
//   } catch { /* not JSON */ }
//
//   // --- Modern: zstd + protobuf ---
//   try {
//     const decPath = mediaPath + '_dec';
//     execSync(`zstd -d "${mediaPath}" -o "${decPath}" --force`, { stdio: 'ignore' });
//     const buf = fs.readFileSync(decPath);
//     try { fs.unlinkSync(decPath); } catch { /* best-effort */ }
//
//     const entries = parseMediaProtobuf(buf);
//     return matchMediaBySha1(entries, tmpDir);
//   } catch (err) {
//     console.warn('Failed to decode media manifest:', err);
//     return null;
//   }
// }
// /**
//  * Match protobuf entries to their numbered zip files by SHA1 digest.
//  * Returns { zipEntryName -> realFilename }, e.g. { "0": "cat.jpg" }.
//  */
// function matchMediaBySha1(entries: MediaProtoEntry[], tmpDir: string): Record<string, string> {
//   const result: Record<string, string> = {};
//
//   // Index proto entries by their sha1 hex for O(1) lookup
//   const bySha1 = new Map<string, string>();
//   for (const e of entries) {
//     if (e.sha1) bySha1.set(e.sha1.toString('hex'), e.name);
//   }
//
//   // Scan numbered files in tmpDir and match by sha1.
//   // In modern Anki, each media file is individually zstd-compressed inside the zip,
//   // so the proto SHA1 is of the DECOMPRESSED bytes. We must decompress before hashing.
//   const files = fs.readdirSync(tmpDir);
//   for (const f of files) {
//     if (!/^\d+$/.test(f)) continue;
//     const filePath = path.join(tmpDir, f);
//     try {
//       let data = fs.readFileSync(filePath);
//
//       // Check for zstd magic (28 b5 2f fd) and decompress in-memory for hashing
//       if (data.length >= 4 && data.readUInt32BE(0) === 0x28b52ffd) {
//         const decPath = filePath + '_hash';
//         execSync(`zstd -d "${filePath}" -o "${decPath}" --force`, { stdio: 'ignore' });
//         data = fs.readFileSync(decPath);
//         try { fs.unlinkSync(decPath); } catch { /* best-effort */ }
//       }
//
//       const digest = crypto.createHash('sha1').update(data).digest('hex');
//       const realName = bySha1.get(digest);
//       if (realName) result[f] = realName;
//     } catch { /* skip unreadable files */ }
//   }
//
//   return result;
// }
// /**
//  * Minimal protobuf parser for Anki's media manifest.
//  * Schema (MediaChanges.changes = repeated MediaEntry):
//  *   message MediaEntry { string name = 1; uint32 usn = 2; bytes sha1 = 3; bool deleted = 5; }
//  * Returns { name, sha1 } pairs — sha1 is what we use to identify the zip file.
//  */
// function parseMediaProtobuf(buf: Buffer): MediaProtoEntry[] {
//   const result: MediaProtoEntry[] = [];
//   let pos = 0;
//
//   function readVarint(): number {
//     let value = 0, shift = 0;
//     while (pos < buf.length) {
//       const b = buf[pos++]!;
//       value |= (b & 0x7f) << shift;
//       if ((b & 0x80) === 0) break;
//       shift += 7;
//     }
//     return value;
//   }
//
//   function readBytes(len: number): Buffer {
//     const slice = buf.slice(pos, pos + len);
//     pos += len;
//     return slice;
//   }
//
//   while (pos < buf.length) {
//     const outerTag = readVarint();
//     const outerWire = outerTag & 0x07;
//
//     if (outerWire === 2) {
//       const msgLen = readVarint();
//       const msgEnd = pos + msgLen;
//       let name = '';
//       let sha1: Buffer | null = null;
//
//       while (pos < msgEnd) {
//         const tag = readVarint();
//         const wire = tag & 0x07;
//         const field = tag >>> 3;
//
//         if (field === 1 && wire === 2) {
//           name = readBytes(readVarint()).toString('utf8');
//         } else if (field === 3 && wire === 2) {
//           sha1 = readBytes(readVarint());
//         } else {
//           // skip: field 2 (usn varint), field 5 (deleted bool), any others
//           if (wire === 0) readVarint();
//           else if (wire === 2) readBytes(readVarint());
//           else break;
//         }
//       }
//       pos = msgEnd;
//
//       if (name) result.push({ name, sha1 });
//     } else {
//       if (outerWire === 0) readVarint();
//       else if (outerWire === 2) readBytes(readVarint());
//       else break;
//     }
//   }
//
//   return result;
// }
