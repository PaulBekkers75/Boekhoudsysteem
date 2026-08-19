function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function InvoiceTable({ invoices, onEdit, onDelete }) {
  if (invoices.length === 0) {
    return <p className="empty-state">Nog geen facturen voor deze maand.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Leverancier</th>
            <th>Categorie</th>
            <th>Excl. BTW</th>
            <th>BTW</th>
            <th>Totaal</th>
            <th>Bestand</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className={inv.extraction_error ? 'row-warning' : ''}>
              <td>{inv.invoice_date || '—'}</td>
              <td>{inv.vendor || '—'}</td>
              <td>
                <span className="category-badge">{inv.category || 'Geen categorie'}</span>
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
                  bekijken
                </a>
              </td>
              <td className="actions">
                <button className="btn small" onClick={() => onEdit(inv)}>
                  Bewerken
                </button>
                <button className="btn small danger" onClick={() => onDelete(inv)}>
                  Verwijderen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
