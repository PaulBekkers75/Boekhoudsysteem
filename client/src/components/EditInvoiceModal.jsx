import { useState } from 'react';
import { CATEGORIES } from '../api.js';

export default function EditInvoiceModal({ invoice, onSave, onClose }) {
  const [form, setForm] = useState({
    invoice_date: invoice.invoice_date || '',
    vendor: invoice.vendor || '',
    amount_excl_btw: invoice.amount_excl_btw ?? '',
    btw_rate: invoice.btw_rate ?? '',
    btw_amount: invoice.btw_amount ?? '',
    total_amount: invoice.total_amount ?? '',
    category: invoice.category || CATEGORIES[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const recalcTotal = () => {
    const excl = parseFloat(form.amount_excl_btw);
    const btw = parseFloat(form.btw_amount);
    if (!Number.isNaN(excl) && !Number.isNaN(btw)) {
      setForm((f) => ({ ...f, total_amount: (excl + btw).toFixed(2) }));
    }
  };

  const recalcBtwFromRate = () => {
    const excl = parseFloat(form.amount_excl_btw);
    const rate = parseFloat(form.btw_rate);
    if (!Number.isNaN(excl) && !Number.isNaN(rate)) {
      const btw = +(excl * (rate / 100)).toFixed(2);
      setForm((f) => ({ ...f, btw_amount: btw, total_amount: (excl + btw).toFixed(2) }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        invoice_date: form.invoice_date || null,
        vendor: form.vendor || null,
        amount_excl_btw: form.amount_excl_btw === '' ? null : parseFloat(form.amount_excl_btw),
        btw_rate: form.btw_rate === '' ? null : parseFloat(form.btw_rate),
        btw_amount: form.btw_amount === '' ? null : parseFloat(form.btw_amount),
        total_amount: form.total_amount === '' ? null : parseFloat(form.total_amount),
        category: form.category,
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Factuur bewerken</h2>
        <form onSubmit={submit}>
          <label>
            Datum
            <input type="date" value={form.invoice_date || ''} onChange={update('invoice_date')} />
          </label>
          <label>
            Leverancier
            <input type="text" value={form.vendor} onChange={update('vendor')} />
          </label>
          <label>
            Categorie
            <select value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Bedrag excl. BTW
              <input type="number" step="0.01" value={form.amount_excl_btw} onChange={update('amount_excl_btw')} onBlur={recalcBtwFromRate} />
            </label>
            <label>
              BTW-tarief (%)
              <select value={form.btw_rate} onChange={update('btw_rate')} onBlur={recalcBtwFromRate}>
                <option value="">—</option>
                <option value="21">21%</option>
                <option value="9">9%</option>
                <option value="0">0%</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              BTW-bedrag
              <input type="number" step="0.01" value={form.btw_amount} onChange={update('btw_amount')} onBlur={recalcTotal} />
            </label>
            <label>
              Totaalbedrag
              <input type="number" step="0.01" value={form.total_amount} onChange={update('total_amount')} />
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose} disabled={saving}>
              Annuleren
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
