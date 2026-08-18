import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'boekhoudsysteem.sqlite');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    invoice_date TEXT,
    vendor TEXT,
    amount_excl_btw REAL,
    btw_rate REAL,
    btw_amount REAL,
    total_amount REAL,
    category TEXT,
    ai_confidence TEXT,
    extraction_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const CATEGORIES = [
  'Kantoorbenodigdheden',
  'Huur',
  'Salarissen',
  'Nutsvoorzieningen',
  'Marketing',
  'Reiskosten',
  'Software',
];
