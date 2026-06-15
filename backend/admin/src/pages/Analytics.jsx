import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { api } from "../api.js";
import { useCatalogVersion } from "../useSocket.js";
import Page from "../components/Page.jsx";
import { inr, badgeText } from "../util.js";

const COLORS = ["#d4889a", "#c4b0d8", "#c8a84b", "#6a4878", "#e8a8b8", "#4e9c79"];

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

export default function Analytics() {
  const version = useCatalogVersion();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, p, c] = await Promise.all([
          api.getAnalytics(),
          api.getProducts(),
          api.getCategories(),
        ]);
        if (!alive) return;
        setStats(s);
        setProducts(p);
        setCategories(c);
      } catch (e) {
        if (alive) setErr(e.message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [version]);

  // Products per category
  const byCategory = categories.map((c) => ({
    name: c.name,
    count: products.filter((p) => p.categoryId === c.id).length,
  }));

  // Products per badge
  const badgeCounts = ["best", "new", "pop"].map((b) => ({
    name: badgeText[b],
    value: products.filter((p) => p.badge === b).length,
  }));
  const noBadge = products.filter((p) => !p.badge).length;
  if (noBadge) badgeCounts.push({ name: "No badge", value: noBadge });
  const pieData = badgeCounts.filter((d) => d.value > 0);

  return (
    <Page title="Analytics" subtitle="Catalogue insights & store performance">
      {err && <div className="login-error">{err}</div>}

      <div className="kpi-grid">
        <Kpi em="🎁" label="Total products" value={stats?.productCount ?? "—"} />
        <Kpi em="✅" label="Active products" value={stats?.activeProductCount ?? "—"} />
        <Kpi em="🗂️" label="Categories" value={stats?.categoryCount ?? "—"} />
        <Kpi em="🧺" label="Orders" value={stats?.orderCount ?? "—"} />
        <Kpi em="💰" label="Revenue" value={stats ? inr(stats.revenue) : "—"} />
      </div>

      <div className="card chart-card">
        <h3>Products per category</h3>
        {byCategory.length === 0 ? (
          <div className="empty">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8ec" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8a7b84" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8a7b84" }} />
              <Tooltip cursor={{ fill: "#faf3f6" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#d4889a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card chart-card">
        <h3>Products by badge</h3>
        {pieData.length === 0 ? (
          <div className="empty">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(d) => `${d.name}: ${d.value}`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card section-card">
        <h3>Sales analytics</h3>
        <p className="muted">
          Revenue, top sellers and order trends will appear here once the storefront
          checkout goes live (next phase).
        </p>
      </div>
    </Page>
  );
}
