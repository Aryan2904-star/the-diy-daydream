/* ============================================================
   DEMO server — in-memory, no database, no Cloudinary needed.
   ------------------------------------------------------------
   Same API + Socket.IO contract as src/index.js, so the REAL
   frontend and REAL admin panel run against it unchanged.
   Data lives in memory only (resets when you stop the server).
   Run:  node demo-server.js
   ============================================================ */
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend");

const DEMO_ADMIN = { email: "admin@demo.com", password: "demo1234" };
const PORT = 4000;

/* ---------- in-memory data ---------- */
let seq = 0;
const id = (p) => `${p}-${++seq}`;
const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const categories = [
  { id: "cat-bouquets", name: "Bouquets", slug: "bouquets", emoji: "🌸", tint: "#f7eaee", sortOrder: 1 },
  { id: "cat-keepsakes", name: "Keepsakes", slug: "keepsakes", emoji: "📦", tint: "#eef5f0", sortOrder: 2 },
  { id: "cat-custom", name: "Custom Creations", slug: "custom-creations", emoji: "✨", tint: "#ede6f5", sortOrder: 3 },
];

let products = [
  ["Bouquets","cat-bouquets","Dried Flower Bouquet","Everlasting dried blooms, hand-arranged and tied with satin ribbon. Long-lasting & fully customizable colours.","best","bouquet",[{label:"Standard",price:1499},{label:"Large",price:1999}]],
  ["Bouquets","cat-bouquets","Pastel Paper Bouquet","Handcrafted crepe-paper flowers in dreamy pastel hues. Zero pollen, allergy-friendly, customizable colours.",null,"paper",[{label:"Pastel Mix",price:1199},{label:"Custom Colours",price:1399}]],
  ["Bouquets","cat-bouquets","Chocolate Bouquet","Assorted premium chocolates arranged into a gift bouquet, finished with a handwritten message card.","new","choco",[{label:"6 pcs",price:999},{label:"12 pcs",price:1499},{label:"20 pcs",price:1999}]],
  ["Keepsakes","cat-keepsakes","Memory Shadow Box","A curated, framed display of photos, tickets & mementos. Fully customizable — send your photos after ordering.",null,"shadowbox",[{label:"Classic",price:2299},{label:"Premium",price:2999}]],
  ["Keepsakes","cat-keepsakes","Explosion Gift Box","A pop-up box that unfolds into layers of photos and personalized messages — a surprise in every fold.","pop","explosion",[{label:"4 Layers",price:1799},{label:"6 Layers",price:2299}]],
  ["Custom Creations","cat-custom","Bespoke Memory Gift","Fully personalized around your story, theme & people. Consultation included — DM us your brief and we'll craft it.",null,"bespoke",[{label:"Standard",price:899},{label:"Premium",price:1999},{label:"Deluxe",price:3499}]],
].map((r, i) => ({
  id: `prod-${i + 1}`,
  name: r[2], desc: r[3], badge: r[4], categoryId: r[1],
  imageUrl: null, imagePublicId: null, artFallback: r[5],
  options: r[6], active: true, sortOrder: i,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}));

let setting = { code: "DAYDREAM10", percent: 10 };
const orders = [];

const withCategory = (p) => ({ ...p, category: categories.find((c) => c.id === p.categoryId) || null });

/* ---------- app ---------- */
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

let io; // set later
const emit = (reason) => io && io.emit("catalog:updated", { reason, at: Date.now() });

const auth = (req, res, next) => {
  const t = (req.headers.authorization || "").startsWith("Bearer ");
  if (!t) return res.status(401).json({ error: "Not authenticated" });
  next();
};

const parseOptions = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) { try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; } }
  return [];
};
const cleanOptions = (opts) =>
  opts.map((o) => ({ label: String(o.label || "").trim(), price: Math.round(Number(o.price)) }))
    .filter((o) => o.label && Number.isFinite(o.price) && o.price >= 0);
const toBool = (v) => v === true || v === "true";
const dataUrl = (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

/* ---------- auth ---------- */
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password)
    return res.json({ token: "demo-token-" + id("t"), admin: { id: "admin-1", email } });
  res.status(401).json({ error: "Invalid credentials (demo: admin@demo.com / demo1234)" });
});
app.get("/api/auth/me", auth, (req, res) => res.json({ admin: { id: "admin-1", email: DEMO_ADMIN.email } }));

/* ---------- categories ---------- */
app.get("/api/categories", (req, res) => res.json([...categories].sort((a, b) => a.sortOrder - b.sortOrder)));
app.post("/api/categories", auth, (req, res) => {
  const { name, emoji, tint, sortOrder } = req.body || {};
  if (!name) return res.status(400).json({ error: "Name required" });
  const slug = slugify(name);
  if (categories.some((c) => c.slug === slug)) return res.status(409).json({ error: "A category with this name already exists" });
  const cat = { id: id("cat"), name, slug, emoji: emoji || null, tint: tint || "#f7eaee", sortOrder: Number(sortOrder) || 0 };
  categories.push(cat); emit("category:create"); res.status(201).json(cat);
});
app.put("/api/categories/:id", auth, (req, res) => {
  const c = categories.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Category not found" });
  const { name, emoji, tint, sortOrder } = req.body || {};
  if (name !== undefined) { c.name = name; c.slug = slugify(name); }
  if (emoji !== undefined) c.emoji = emoji || null;
  if (tint !== undefined) c.tint = tint;
  if (sortOrder !== undefined) c.sortOrder = Number(sortOrder) || 0;
  emit("category:update"); res.json(c);
});
app.delete("/api/categories/:id", auth, (req, res) => {
  const n = products.filter((p) => p.categoryId === req.params.id).length;
  if (n > 0) return res.status(409).json({ error: `Cannot delete: ${n} product(s) still use this category` });
  const i = categories.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Category not found" });
  categories.splice(i, 1); emit("category:delete"); res.json({ ok: true });
});

/* ---------- products ---------- */
app.get("/api/products", (req, res) => {
  let list = products;
  if (req.query.active === "true") list = list.filter((p) => p.active);
  list = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  res.json(list.map(withCategory));
});
app.post("/api/products", auth, upload.single("image"), (req, res) => {
  const { name, desc, badge, categoryId, artFallback, active, sortOrder } = req.body;
  if (!name || !desc || !categoryId) return res.status(400).json({ error: "name, desc and categoryId are required" });
  const options = cleanOptions(parseOptions(req.body.options));
  if (!options.length) return res.status(400).json({ error: "At least one price option (label + price) is required" });
  if (!categories.some((c) => c.id === categoryId)) return res.status(400).json({ error: "Invalid categoryId" });
  const p = {
    id: id("prod"), name, desc, badge: badge && badge !== "none" ? badge : null, categoryId,
    artFallback: artFallback || "gift", active: active === undefined ? true : toBool(active),
    sortOrder: Number(sortOrder) || 0, options,
    imageUrl: req.file ? dataUrl(req.file) : null, imagePublicId: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  products.push(p); emit("product:create"); res.status(201).json(withCategory(p));
});
app.put("/api/products/:id", auth, upload.single("image"), (req, res) => {
  const p = products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });
  const { name, desc, badge, categoryId, artFallback, active, sortOrder } = req.body;
  if (name !== undefined) p.name = name;
  if (desc !== undefined) p.desc = desc;
  if (badge !== undefined) p.badge = badge && badge !== "none" ? badge : null;
  if (categoryId !== undefined) {
    if (!categories.some((c) => c.id === categoryId)) return res.status(400).json({ error: "Invalid categoryId" });
    p.categoryId = categoryId;
  }
  if (artFallback !== undefined) p.artFallback = artFallback || "gift";
  if (active !== undefined) p.active = toBool(active);
  if (sortOrder !== undefined) p.sortOrder = Number(sortOrder) || 0;
  if (req.body.options !== undefined) {
    const options = cleanOptions(parseOptions(req.body.options));
    if (!options.length) return res.status(400).json({ error: "At least one price option required" });
    p.options = options;
  }
  if (req.file) p.imageUrl = dataUrl(req.file);
  p.updatedAt = new Date().toISOString();
  emit("product:update"); res.json(withCategory(p));
});
app.delete("/api/products/:id", auth, (req, res) => {
  const i = products.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Product not found" });
  products.splice(i, 1); emit("product:delete"); res.json({ ok: true });
});

/* ---------- settings / orders / analytics ---------- */
app.get("/api/settings", (req, res) => res.json(setting));
app.put("/api/settings", auth, (req, res) => {
  const { code, percent } = req.body || {};
  if (code !== undefined) setting.code = String(code).trim().toUpperCase();
  if (percent !== undefined) {
    const pn = Math.round(Number(percent));
    if (!Number.isFinite(pn) || pn < 0 || pn > 100) return res.status(400).json({ error: "percent must be between 0 and 100" });
    setting.percent = pn;
  }
  emit("settings:update"); res.json(setting);
});
app.get("/api/orders", auth, (req, res) => res.json(orders));
app.get("/api/analytics", auth, (req, res) =>
  res.json({
    productCount: products.length,
    activeProductCount: products.filter((p) => p.active).length,
    categoryCount: categories.length,
    orderCount: orders.length,
    revenue: 0,
  })
);

/* ---------- serve the real frontend at / ---------- */
app.use(express.static(FRONTEND_DIR));

const server = http.createServer(app);
io = new Server(server, { cors: { origin: "*" } });
server.listen(PORT, () => {
  console.log(`\n💌  DEMO running (in-memory, no DB)`);
  console.log(`    Storefront : http://localhost:${PORT}/`);
  console.log(`    API        : http://localhost:${PORT}/api`);
  console.log(`    Admin login: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}\n`);
});
