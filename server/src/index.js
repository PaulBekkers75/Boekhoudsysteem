import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import invoicesRouter, { uploadsDir } from './routes/invoices.js';
import dashboardRouter from './routes/dashboard.js';
import exportRouter from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Boekhoudsysteem server listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set. Invoice extraction will fail.');
  }
});
