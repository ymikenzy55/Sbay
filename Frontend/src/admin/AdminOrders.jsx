import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import { Search, Banknote, Undo2 } from 'lucide-react';

/**
 * Orders + escrow management.
 *
 * - "Release" pays the seller and marks the order completed (use when
 *   the buyer confirms but stops responding, or for support overrides).
 * - "Refund" cancels the order, restores stock, and refunds the buyer.
 *
 * Both actions are written to the audit log with the admin's name and
 * a free-text reason (mandatory for refunds).
 */
export default function AdminOrders() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setErr('');
    try {
      const { data } = await adminApi.get('/orders', {
        params: {
          q: q.trim() || undefined,
          status: status || undefined,
          escrowStatus: escrowStatus || undefined,
        },
      });
      const sorted = [...(data.items || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setItems(sorted);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }, [q, status, escrowStatus]);

  const isNew = (date) => Date.now() - new Date(date).getTime() < 24 * 3600 * 1000;

  useEffect(() => { load(); }, [load]);

  const release = async (id) => {
    if (!confirm('Release escrow funds to the seller? This cannot be undone.')) return;
    await adminApi.post(`/orders/${id}/release-escrow`);
    load();
  };

  const refund = async (id) => {
    const reason = window.prompt('Reason for refund (will be saved on the order):');
    if (!reason) return;
    await adminApi.post(`/orders/${id}/refund-escrow`, { reason });
    load();
  };

  return (
    <>
      <h1>Orders & Escrow</h1>
      <p className="muted">{items.length} orders.</p>

      <div className="admin-card">
        <form className="admin-toolbar" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <Search size={16} />
          <input placeholder="Invoice contains…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select value={escrowStatus} onChange={(e) => setEscrowStatus(e.target.value)}>
            <option value="">Any escrow</option>
            <option value="held">Held</option>
            <option value="released">Released</option>
            <option value="refunded">Refunded</option>
          </select>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Loading…' : 'Apply'}</button>
        </form>

        {err && <p className="muted" style={{ color: '#a4302a' }}>{err}</p>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Total</th>
              <th>Status</th>
              <th>Escrow</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o._id}>
                <td>
                  <div>
                    <strong>{o.invoiceNumber || o._id}</strong>
                    {isNew(o.createdAt) && <span className="admin-new-badge">NEW</span>}
                  </div>
                  <div className="admin-date" style={{ marginTop: 4 }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </td>
                <td>{o.buyer?.name}<div className="muted small">{o.buyer?.email}</div></td>
                <td>{o.seller?.name}<div className="muted small">{o.seller?.email}</div></td>
                <td>GH₵ {Number(o.total).toLocaleString()}</td>
                <td><span className="admin-pill mute">{o.status}</span></td>
                <td>
                  <span className={`admin-pill ${o.escrow?.status === 'refunded' ? 'bad' : o.escrow?.status === 'released' ? '' : 'warn'}`}>
                    {o.escrow?.status || '—'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    {o.escrow?.status === 'held' && (
                      <>
                        <button className="btn btn-primary" onClick={() => release(o._id)}>
                          <Banknote size={14} /> Release
                        </button>
                        <button className="btn btn-ghost" onClick={() => refund(o._id)}>
                          <Undo2 size={14} /> Refund
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && !busy && (
              <tr><td colSpan={7}>
                <div className="admin-empty">
                  <Search size={32} />
                  <h3>No orders match these filters.</h3>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
