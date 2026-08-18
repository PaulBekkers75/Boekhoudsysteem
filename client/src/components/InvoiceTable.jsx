function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function InvoiceTable({ invoices, onEdit, onDelete }) {
  if (invoices.length === 0) {
    return <p className="empty-state">No invoices for this month yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Vendor</th>
            <th>Category</th>
            <th>Excl. BTW</th>
            <th>BTW</th>
            <th>Total</th>
            <th>File</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className={inv.extraction_error ? 'row-warning' : ''}>
              <td>{inv.invoice_date || '—'}</td>
              <td>{inv.vendor || '—'}</td>
              <td>
                <span className="category-badge">{inv.category || 'Uncategorized'}</span>
              </td>
              <td>{formatCurrency(inv.amount_excl_btw)}</td>
              <td>
                {formatCurrency(inv.btw_amount)}
                {inv.btw_rate !== null && inv.btw_rate !== undefined && (
                  <span className="btw-rate"> ({inv.btw_rate}%)</span>
                )}
              </td>
              <td>{formatCurrency(inv.total_amount)}</td>
              <td>
                <a href={`/uploads/${inv.stored_filename}`} target="_blank" rel="noreferrer">
                  view
                </a>
              </td>
              <td className="actions">
                <button className="btn small" onClick={() => onEdit(inv)}>
                  Edit
                </button>
                <button className="btn small danger" onClick={() => onDelete(inv)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
