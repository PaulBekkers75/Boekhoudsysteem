# Boekhoudsysteem

Nederlandse boekhoud tool — a simple single-user MVP for Dutch freelance bookkeeping.

Upload invoices and receipts (PDF/JPG/PNG), have Claude read them and extract the
date, vendor, amount excl. BTW, BTW amount/rate and total, auto-categorize the
expense, and review/correct everything on a dashboard. Export any month to Excel.

## Stack

- **Frontend**: React + Vite (`client/`)
- **Backend**: Node.js + Express (`server/`)
- **Database**: SQLite (`server/data/boekhoudsysteem.sqlite`, via `better-sqlite3`)
- **AI extraction**: Claude API (`@anthropic-ai/sdk`), using tool-use for
  structured JSON output. PDFs and images are sent directly to the model.

## Setup

1. Install dependencies for both apps:

   ```bash
   npm run install:all
   ```

2. Configure the backend:

   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env` and set `ANTHROPIC_API_KEY` to your Claude API key
   (get one at https://console.anthropic.com/). Without a key, uploads still
   work and are stored, but automatic field extraction is skipped — you can
   fill in the details manually on the dashboard.

3. Start both the API server (port 3001) and the frontend dev server (port 5173):

   ```bash
   npm run dev
   ```

   Open http://localhost:5173.

## How it works

- **Upload**: drag & drop or pick one or more PDF/JPG/PNG files. Each file is
  uploaded to the backend, saved under `server/uploads/`, and sent to Claude
  for extraction. The extracted date, vendor, amounts, BTW and category are
  stored in SQLite immediately — if extraction fails (e.g. no API key, or the
  document is unreadable), the invoice is still saved so it can be corrected
  by hand.
- **Dashboard**: pick a month to see totals per category, total BTW to
  reclaim, and the full invoice list for that month. Every invoice can be
  edited (date, vendor, category, amounts) or deleted. Clicking "view" opens
  the original uploaded file.
- **Export**: the "Export to Excel" button downloads an `.xlsx` with every
  invoice for the selected month, including a totals row.

## Categories

Expenses are categorized into one of: `Supplies`, `Rent`, `Salaries`,
`Utilities`, `Marketing`, `Travel`, `Software`.

## Notes / limitations (MVP scope)

- Single user, no authentication — do not expose this to the public internet
  as-is.
- BTW rates are limited to the common Dutch rates (21%, 9%, 0%); Claude's
  extraction is a best-effort read of the document and should be spot-checked,
  especially for handwritten or low-quality scans.
- Data lives in a local SQLite file and uploaded files on local disk; there's
  no backup/sync built in.
