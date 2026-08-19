import { useCallback, useRef, useState } from 'react';
import { uploadInvoice } from '../api.js';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function UploadPage() {
  const [items, setItems] = useState([]); // { id, file, status, result, error }
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const processFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (files.length === 0) return;

    const newItems = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'uploading',
      result: null,
      error: null,
    }));

    setItems((prev) => [...newItems, ...prev]);

    for (const item of newItems) {
      uploadInvoice(item.file)
        .then((result) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: result.extraction_error ? 'error' : 'done', result, error: result.extraction_error }
                : it
            )
          );
        })
        .catch((err) => {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: 'error', error: err.message } : it))
          );
        });
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="upload-page">
      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <p>Sleep facturen of bonnetjes hierheen, of klik om te selecteren</p>
        <p className="hint">Ondersteunt PDF, JPG, PNG</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          multiple
          hidden
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="upload-list">
          {items.map((item) => (
            <li key={item.id} className={`upload-item ${item.status}`}>
              <div className="upload-item-name">{item.file.name}</div>
              {item.status === 'uploading' && <div className="upload-item-status">Wordt gelezen met Claude…</div>}
              {item.status === 'error' && (
                <div className="upload-item-status error">
                  {item.error || 'Uploaden mislukt'}
                  {item.result && ' — opgeslagen, vul de gegevens handmatig aan op het dashboard.'}
                </div>
              )}
              {item.status === 'done' && item.result && (
                <div className="upload-item-summary">
                  <span>{item.result.vendor || 'Onbekende leverancier'}</span>
                  <span>{item.result.invoice_date || '—'}</span>
                  <span>{item.result.category || 'Geen categorie'}</span>
                  <span>{formatCurrency(item.result.total_amount)}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
