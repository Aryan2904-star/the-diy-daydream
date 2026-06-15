import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { getToken } from "./api.js";
import { ToastProvider } from "./toast.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Categories from "./pages/Categories.jsx";
import Orders from "./pages/Orders.jsx";
import Analytics from "./pages/Analytics.jsx";

function Protected() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
