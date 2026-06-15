import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../api.js";

const I = {
  dash: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
  product: "M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9l9 6 9-6 M12 15v6",
  category: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  orders: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0",
  analytics: "M3 3v18h18M8 16V9M13 16V5M18 16v-7",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
};

function Icon({ d }) {
  return (
    <svg
      className="ic"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const LINKS = [
  { to: "/", label: "Dashboard", icon: I.dash, end: true },
  { to: "/products", label: "Products", icon: I.product },
  { to: "/categories", label: "Categories", icon: I.category },
  { to: "/orders", label: "Orders", icon: I.orders },
  { to: "/analytics", label: "Analytics", icon: I.analytics },
];

export default function Layout() {
  const nav = useNavigate();
  const email = localStorage.getItem("ddd_admin_email") || "Admin";

  function logout() {
    clearToken();
    localStorage.removeItem("ddd_admin_email");
    nav("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">💌</span>
          <span>
            <small>THE</small>
            <strong>
              DIY <i>Daydream</i>
            </strong>
          </span>
        </div>

        <nav className="nav">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <Icon d={l.icon} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">{email}</div>
          <button className="nav-item" onClick={logout} style={{ width: "100%", cursor: "pointer", background: "none", border: "none", textAlign: "left", color: "#cdbcc9" }}>
            <Icon d={I.logout} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
