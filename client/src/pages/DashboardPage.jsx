import { useEffect, useState, useCallback } from 'react';
import { listInvoices, updateInvoice, deleteInvoice, getDashboardSummary, exportUrl } from '../api.js';
import InvoiceTable from '../components/InvoiceTable.jsx';
import EditInvoiceModal from '../components/EditInvoiceModal.jsx';

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceList, summaryData] = await Promise.all([
        listInvoices(month),
        getDashboardSummary(month),
      ]);
      setInvoices(invoiceList);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Factuur van ${invoice.vendor || 'onbekende leverancier'} verwijderen?`)) return;
    try {
      await deleteInvoice(invoice.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveEdit = async (fields) => {
    await updateInvoice(editing.id, fields);
    setEditing(null);
    load();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-toolbar">
        <label>
          Maand
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <a className="btn primary" href={exportUrl(month)}>
          Exporteren naar Excel
        </a>
      </div>

      {error && <div className="form-error">{error}</div>}

      {summary && (
        <>
          <div className="summary-cards">
            <div className="card highlight">
              <div className="card-label">Totale uitgaven (excl. BTW)</div>
              <div className="card-value">{formatCurrency(summary.totals.total_excl_btw)}</div>
            </div>
            <div className="card highlight">
              <div className="card-label">Terug te vragen BTW</div>
              <div className="card-value">{formatCurrency(summary.totals.total_btw)}</div>
            </div>
            <div className="card highlight">
              <div className="card-label">Totaal incl. BTW</div>
              <div className="card-value">{formatCurrency(summary.totals.total_incl_btw)}</div>
            </div>
          </div>

          <h3>Per categorie</h3>
          <div className="category-cards">
            {Object.entries(summary.byCategory).map(([category, data]) => (
              <div className="card" key={category}>
                <div className="card-label">{category}</div>
                <div className="card-value">{formatCurrency(data.total_excl_btw)}</div>
                <div className="card-sub">{data.count} factu{data.count === 1 ? 'ur' : 'ren'}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h3>Facturen</h3>
      {loading ? (
        <p>Laden…</p>
      ) : (
        <InvoiceTable invoices={invoices} onEdit={setEditing} onDelete={handleDelete} />
      )}

      {editing && (
        <EditInvoiceModal invoice={editing} onSave={handleSaveEdit} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
