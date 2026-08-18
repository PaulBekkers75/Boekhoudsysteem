import express from 'express';
import { db, CATEGORIES } from '../db.js';

const router = express.Router();

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

router.get('/summary', (req, res) => {
  const month = req.query.month || currentMonth();

  const rows = db
    .prepare(
      `SELECT category, SUM(amount_excl_btw) as total_excl_btw, SUM(btw_amount) as total_btw, SUM(total_amount) as total_incl_btw, COUNT(*) as count
       FROM invoices
       WHERE strftime('%Y-%m', invoice_date) = ?
       GROUP BY category`
    )
    .all(month);

  const byCategory = Object.fromEntries(
    CATEGORIES.map((cat) => [cat, { total_excl_btw: 0, total_btw: 0, total_incl_btw: 0, count: 0 }])
  );

  for (const row of rows) {
    const key = row.category && CATEGORIES.includes(row.category) ? row.category : 'Uncategorized';
    byCategory[key] = {
      total_excl_btw: row.total_excl_btw || 0,
      total_btw: row.total_btw || 0,
      total_incl_btw: row.total_incl_btw || 0,
      count: row.count,
    };
  }

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(amount_excl_btw), 0) as total_excl_btw,
         COALESCE(SUM(btw_amount), 0) as total_btw,
         COALESCE(SUM(total_amount), 0) as total_incl_btw,
         COUNT(*) as count
       FROM invoices
       WHERE strftime('%Y-%m', invoice_date) = ?`
    )
    .get(month);

  res.json({
    month,
    byCategory,
    totals,
  });
});

export default router;
