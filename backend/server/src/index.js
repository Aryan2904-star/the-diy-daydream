import "dotenv/config";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import { initSocket } from "./lib/socket.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import settingsRoutes from "./routes/settings.js";
import orderRoutes from "./routes/orders.js";
import analyticsRoutes from "./routes/analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, "..", "..", "..", "frontend");
const ADMIN_DIST = path.join(__dirname, "..", "..", "admin", "dist");

const app = express();

// Allowed origins (frontend + admin). Comma-separated in CORS_ORIGIN.
const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    // allow same-origin / curl / server-to-server (no Origin header)
    if (!origin) return cb(null, true);
    if (allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS: " + origin));
  },
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);

// Admin dashboard (built SPA) at /admin
app.use("/admin", express.static(ADMIN_DIST));

// Storefront at / (single-origin — handy for tunnels / one-box deploys)
app.use(express.static(FRONTEND_DIR));

// 404 (unknown /api/* routes or missing files)
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.message?.startsWith("Not allowed by CORS"))
    return res.status(403).json({ error: err.message });
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ error: "Image too large (max 5 MB)" });
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowed.length ? allowed : "*" },
});
initSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🌸 The DIY Daydream API running on http://localhost:${PORT}`)
);
