import { useEffect, useState } from "react";
import { api } from "../api.js";
import Page from "../components/Page.jsx";
import { inr } from "../util.js";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.getOrders();
        if (alive) setOrders(data);
      } catch (e) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Page title="Orders" subtitle="Customer orders & payment status">
      {err && <div className="login-error">{err}</div>}

      <div className="card section-card">
        {loading ? (
          <div className="loading">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty">
            <span className="em">🧾</span>
            No orders yet.
            <br />
            <span className="muted">
              Orders will appear here once the storefront checkout goes live (next phase).
            </span>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td>
                      <b>{o.customerName}</b>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {o.email}
                      </div>
                    </td>
                    <td>{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td>{inr(o.total)}</td>
                    <td>
                      <span className="pill pill--cat">{o.status}</span>
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          o.paymentStatus === "paid" ? "pill--on" : "pill--off"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
