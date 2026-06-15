import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useCatalogVersion } from "../useSocket.js";
import Page from "../components/Page.jsx";
import { inr, priceRange, badgeText } from "../util.js";

function Kpi({ em, label, value }) {
  return (
    <div className="card kpi">
      <div className="label">
        <span className="badge-em">{em}</span>
        {label}
      </div>
      <div className="value">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const version = useCatalogVersion();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([api.getAnalytics(), api.getProducts()]);
        if (!alive) return;
        setStats(s);
        setProducts(p);
      } catch (e) {
        if (alive) setErr(e.message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);

  const recent = products.slice(0, 5);

  return (
    <Page title="Dashboard" subtitle="Overview of your store">
      {err && <div className="login-error">{err}</div>}

      <div className="kpi-grid">
        <Kpi em="🎁" label="Products" value={stats?.productCount ?? "—"} />
        <Kpi em="✅" label="Active" value={stats?.activeProductCount ?? "—"} />
        <Kpi em="🗂️" label="Categories" value={stats?.categoryCount ?? "—"} />
        <Kpi em="🧺" label="Orders" value={stats?.orderCount ?? "—"} />
        <Kpi em="💰" label="Revenue" value={stats ? inr(stats.revenue) : "—"} />
      </div>

      <div className="card section-card">
        <div className="page-head" style={{ marginBottom: 14 }}>
          <div>
            <h3>Recent products</h3>
            <span className="muted">Latest items in your catalogue</span>
          </div>
          <Link className="btn btn--ghost btn--sm" to="/products">
            Manage →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty">
            <span className="em">🎁</span>
            No products yet — add your first one.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="thumb-cell">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" /> : "🎁"}
                      </div>
                    </td>
                    <td>
                      <b>{p.name}</b>
                      {p.badge && (
                        <span className={`pill pill--${p.badge}`} style={{ marginLeft: 8 }}>
                          {badgeText[p.badge]}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="pill pill--cat">{p.category?.name || "—"}</span>
                    </td>
                    <td>{priceRange(p.options)}</td>
                    <td>
                      <span className={`pill ${p.active ? "pill--on" : "pill--off"}`}>
                        {p.active ? "Active" : "Hidden"}
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
