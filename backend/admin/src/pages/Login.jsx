import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api.js";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, admin } = await api.login(email, password);
      setToken(token);
      localStorage.setItem("ddd_admin_email", admin.email);
      nav("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="logo">💌</div>
        <h1>Admin Login</h1>
        <p className="sub">The DIY Daydream — store dashboard</p>

        {error && <div className="login-error">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in ✦"}
        </button>
      </form>
    </div>
  );
}
