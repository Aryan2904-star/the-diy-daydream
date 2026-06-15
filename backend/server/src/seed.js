import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// The 3 categories that existed in the original settings.js
const CATEGORIES = [
  { name: "Bouquets", emoji: "🌸", tint: "#f7eaee", sortOrder: 1 },
  { name: "Keepsakes", emoji: "📦", tint: "#eef5f0", sortOrder: 2 },
  { name: "Custom Creations", emoji: "✨", tint: "#ede6f5", sortOrder: 3 },
];

// The 6 products, carried over so the live site looks identical on day one.
// `art` maps to the inline-SVG fallback used until a real image is uploaded.
const PRODUCTS = [
  {
    category: "Bouquets",
    name: "Dried Flower Bouquet",
    desc: "Everlasting dried blooms, hand-arranged and tied with satin ribbon. Long-lasting & fully customizable colours.",
    badge: "best",
    art: "bouquet",
    options: [
      { label: "Standard", price: 1499 },
      { label: "Large", price: 1999 },
    ],
  },
  {
    category: "Bouquets",
    name: "Pastel Paper Bouquet",
    desc: "Handcrafted crepe-paper flowers in dreamy pastel hues. Zero pollen, allergy-friendly, customizable colours.",
    badge: null,
    art: "paper",
    options: [
      { label: "Pastel Mix", price: 1199 },
      { label: "Custom Colours", price: 1399 },
    ],
  },
  {
    category: "Bouquets",
    name: "Chocolate Bouquet",
    desc: "Assorted premium chocolates arranged into a gift bouquet, finished with a handwritten message card.",
    badge: "new",
    art: "choco",
    options: [
      { label: "6 pcs", price: 999 },
      { label: "12 pcs", price: 1499 },
      { label: "20 pcs", price: 1999 },
    ],
  },
  {
    category: "Keepsakes",
    name: "Memory Shadow Box",
    desc: "A curated, framed display of photos, tickets & mementos. Fully customizable — send your photos after ordering.",
    badge: null,
    art: "shadowbox",
    options: [
      { label: "Classic", price: 2299 },
      { label: "Premium", price: 2999 },
    ],
  },
  {
    category: "Keepsakes",
    name: "Explosion Gift Box",
    desc: "A pop-up box that unfolds into layers of photos and personalized messages — a surprise in every fold.",
    badge: "pop",
    art: "explosion",
    options: [
      { label: "4 Layers", price: 1799 },
      { label: "6 Layers", price: 2299 },
    ],
  },
  {
    category: "Custom Creations",
    name: "Bespoke Memory Gift",
    desc: "Fully personalized around your story, theme & people. Consultation included — DM us your brief and we'll craft it.",
    badge: null,
    art: "bespoke",
    options: [
      { label: "Standard", price: 899 },
      { label: "Premium", price: 1999 },
      { label: "Deluxe", price: 3499 },
    ],
  },
];

async function main() {
  // 1) Admin user (from env)
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    console.log("✓ admin ready:", email);
  } else {
    console.warn("! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed");
  }

  // 2) Discount setting (single row)
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, code: "DAYDREAM10", percent: 10 },
  });
  console.log("✓ settings ready");

  // 3) Categories
  const idByName = {};
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name: c.name, emoji: c.emoji, tint: c.tint, sortOrder: c.sortOrder },
      create: { ...c, slug },
    });
    idByName[c.name] = cat.id;
  }
  console.log(`✓ ${CATEGORIES.length} categories ready`);

  // 4) Products — only when none exist, so re-running seed won't duplicate
  const existing = await prisma.product.count();
  if (existing === 0) {
    let order = 0;
    for (const p of PRODUCTS) {
      await prisma.product.create({
        data: {
          name: p.name,
          desc: p.desc,
          badge: p.badge,
          categoryId: idByName[p.category],
          artFallback: p.art,
          options: p.options,
          sortOrder: order++,
          active: true,
        },
      });
    }
    console.log(`✓ seeded ${PRODUCTS.length} products`);
  } else {
    console.log(`• ${existing} products already exist — skipping product seed`);
  }

  console.log("✅ seed complete");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
