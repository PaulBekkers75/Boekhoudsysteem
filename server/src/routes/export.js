import express from 'express';
import ExcelJS from 'exceljs';
import { db } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const month = req.query.month;
  if (!month) {
    return res.status(400).json({ error: 'Queryparameter month (YYYY-MM) is verplicht' });
  }

  const invoices = db
    .prepare(
      `SELECT * FROM invoices WHERE strftime('%Y-%m', invoice_date) = ? ORDER BY invoice_date ASC, id ASC`
    )
    .all(month);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Facturen ${month}`);

  sheet.columns = [
    { header: 'Datum', key: 'invoice_date', width: 14 },
    { header: 'Leverancier', key: 'vendor', width: 30 },
    { header: 'Categorie', key: 'category', width: 16 },
    { header: 'Bedrag excl. BTW', key: 'amount_excl_btw', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'BTW-tarief (%)', key: 'btw_rate', width: 14 },
    { header: 'BTW-bedrag', key: 'btw_amount', width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'Totaalbedrag', key: 'total_amount', width: 16, style: { numFmt: '#,##0.00' } },
    { header: 'Oorspronkelijke bestandsnaam', key: 'original_filename', width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const inv of invoices) {
    sheet.addRow({
      invoice_date: inv.invoice_date,
      vendor: inv.vendor,
      category: inv.category,
      amount_excl_btw: inv.amount_excl_btw,
      btw_rate: inv.btw_rate,
      btw_amount: inv.btw_amount,
      total_amount: inv.total_amount,
      original_filename: inv.original_filename,
    });
  }

  const totalsRowIndex = invoices.length + 2;
  sheet.getCell(`A${totalsRowIndex}`).value = 'Totalen';
  sheet.getCell(`A${totalsRowIndex}`).font = { bold: true };
  sheet.getCell(`D${totalsRowIndex}`).value = { formula: `SUM(D2:D${invoices.length + 1})` };
  sheet.getCell(`F${totalsRowIndex}`).value = { formula: `SUM(F2:F${invoices.length + 1})` };
  sheet.getCell(`G${totalsRowIndex}`).value = { formula: `SUM(G2:G${invoices.length + 1})` };
  sheet.getRow(totalsRowIndex).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="facturen-${month}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

export default router;
