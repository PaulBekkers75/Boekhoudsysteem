import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'node:url';
import { db, CATEGORIES } from '../db.js';
import { extractInvoiceData } from '../services/extract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Only PDF, JPG and PNG files are allowed'));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { filename: stored_filename, originalname: original_filename, mimetype } = req.file;
  let extraction = null;
  let extraction_error = null;

  try {
    extraction = await extractInvoiceData(
      path.join(uploadsDir, stored_filename),
      mimetype
    );
  } catch (err) {
    extraction_error = err.message || 'Extraction failed';
  }

  const stmt = db.prepare(`
    INSERT INTO invoices (
      original_filename, stored_filename, mime_type,
      invoice_date, vendor, amount_excl_btw, btw_rate, btw_amount, total_amount,
      category, ai_confidence, extraction_error
    ) VALUES (
      @original_filename, @stored_filename, @mime_type,
      @invoice_date, @vendor, @amount_excl_btw, @btw_rate, @btw_amount, @total_amount,
      @category, @ai_confidence, @extraction_error
    )
  `);

  const result = stmt.run({
    original_filename,
    stored_filename,
    mime_type: mimetype,
    invoice_date: extraction?.invoice_date ?? null,
    vendor: extraction?.vendor ?? null,
    amount_excl_btw: extraction?.amount_excl_btw ?? null,
    btw_rate: extraction?.btw_rate ?? null,
    btw_amount: extraction?.btw_amount ?? null,
    total_amount: extraction?.total_amount ?? null,
    category: extraction?.category ?? null,
    ai_confidence: extraction?.confidence ?? null,
    extraction_error,
  });

  const invoice = db
    .prepare('SELECT * FROM invoices WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(invoice);
});

router.get('/', (req, res) => {
  const { month } = req.query; // format YYYY-MM
  let invoices;
  if (month) {
    invoices = db
      .prepare(
        `SELECT * FROM invoices WHERE strftime('%Y-%m', invoice_date) = ? ORDER BY invoice_date DESC, id DESC`
      )
      .all(month);
  } else {
    invoices = db.prepare('SELECT * FROM invoices ORDER BY invoice_date DESC, id DESC').all();
  }
  res.json(invoices);
});

router.get('/:id', (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

const EDITABLE_FIELDS = [
  'invoice_date',
  'vendor',
  'amount_excl_btw',
  'btw_rate',
  'btw_amount',
  'total_amount',
  'category',
];

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  if (req.body.category && !CATEGORIES.includes(req.body.category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` });
  }

  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const setClause = Object.keys(updates)
    .map((field) => `${field} = @${field}`)
    .join(', ');

  if (setClause) {
    db.prepare(`UPDATE invoices SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run({
      ...updates,
      id: req.params.id,
    });
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(invoice);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);

  const filePath = path.join(uploadsDir, existing.stored_filename);
  fs.unlink(filePath, () => {});

  res.status(204).end();
});

export default router;
export { uploadsDir };
