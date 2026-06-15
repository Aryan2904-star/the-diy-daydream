/* ============================================================
   The DIY Daydream — storefront logic (API-driven)
   ------------------------------------------------------------
   Products, categories and the discount now come LIVE from the
   backend API and update in real time over Socket.IO. There is
   no settings.js any more — manage everything from the admin panel.
   ============================================================ */

/* ---------- Config (from config.js → window.DDD_CONFIG) ---------- */
const CFG = window.DDD_CONFIG || {};
const API_URL = (CFG.API_URL || "http://localhost:4000").replace(/\/$/, "");
const SOCKET_URL = CFG.SOCKET_URL || API_URL;

/* ---------- Inline SVG art (fallback when a product has no image) ---------- */
const ART = {
  bouquet: `<svg viewBox="0 0 120 120"><g stroke="#7a3a55" stroke-width="2" fill="none"><path d="M60 110 L48 64M60 110 L60 60M60 110 L72 64"/></g>
    <g><circle cx="42" cy="50" r="13" fill="#d4889a"/><circle cx="60" cy="42" r="14" fill="#e8a8b8"/><circle cx="78" cy="50" r="13" fill="#c4b0d8"/><circle cx="50" cy="62" r="11" fill="#f3d56b"/><circle cx="70" cy="62" r="11" fill="#d4889a"/>
    <circle cx="42" cy="50" r="4" fill="#fff"/><circle cx="60" cy="42" r="4" fill="#fff"/><circle cx="78" cy="50" r="4" fill="#fff"/><circle cx="50" cy="62" r="3" fill="#fff"/><circle cx="70" cy="62" r="3" fill="#fff"/></g>
    <path d="M60 88 q-16 4 -20 18 q14 -2 20 -10 q6 8 20 10 q-4 -14 -20 -18z" fill="#c8a84b"/></svg>`,
  paper: `<svg viewBox="0 0 120 120"><g stroke="#6a4878" stroke-width="2"><path d="M60 108 L50 66M62 106 L66 64M58 106 L42 70"/></g>
    <g><path d="M44 54 l8-14 8 14 -8 6z" fill="#c4b0d8"/><path d="M60 44 l9-12 9 12 -9 6z" fill="#e8a8b8"/><path d="M74 56 l8-13 8 13 -8 6z" fill="#a9c8e8"/><path d="M52 66 l7-11 7 11 -7 5z" fill="#f3d56b"/>
    <circle cx="52" cy="54" r="3" fill="#fff"/><circle cx="69" cy="46" r="3" fill="#fff"/><circle cx="82" cy="56" r="3" fill="#fff"/></g>
    <rect x="44" y="86" width="34" height="12" rx="6" fill="#d4889a" transform="rotate(-4 60 92)"/></svg>`,
  choco: `<svg viewBox="0 0 120 120"><g stroke="#6a4878" stroke-width="2"><path d="M60 110 L52 70M60 110 L68 70M60 110 L60 68"/></g>
    <g><rect x="38" y="44" width="20" height="20" rx="4" fill="#7a4a2a" transform="rotate(-8 48 54)"/><rect x="62" y="40" width="20" height="20" rx="4" fill="#9c6336" transform="rotate(6 72 50)"/><rect x="50" y="58" width="20" height="20" rx="4" fill="#5c3520" transform="rotate(-4 60 68)"/>
    <path d="M40 46 h16M64 42 h16" stroke="#fdf4e0" stroke-width="2"/></g>
    <path d="M60 92 q-12 2 -16 14 q12 0 16 -8 q4 8 16 8 q-4 -12 -16 -14z" fill="#d4889a"/></svg>`,
  shadowbox: `<svg viewBox="0 0 120 120"><rect x="24" y="24" width="72" height="72" rx="6" fill="#fff" stroke="#c8a84b" stroke-width="4"/>
    <rect x="34" y="34" width="24" height="20" rx="2" fill="#c4b0d8"/><rect x="62" y="34" width="24" height="28" rx="2" fill="#e8a8b8"/>
    <rect x="34" y="58" width="24" height="28" rx="2" fill="#f3d56b"/><rect x="62" y="66" width="24" height="20" rx="2" fill="#a9c8e8"/>
    <path d="M44 70 l4 6 8 -10" stroke="#fff" stroke-width="2" fill="none"/><circle cx="74" cy="46" r="5" fill="#fff"/></svg>`,
  explosion: `<svg viewBox="0 0 120 120"><path d="M60 30 L92 50 L60 70 L28 50 Z" fill="#d4889a"/><path d="M28 50 L60 70 L60 100 L28 80 Z" fill="#b3697c"/><path d="M92 50 L60 70 L60 100 L92 80 Z" fill="#e8a8b8"/>
    <rect x="44" y="22" width="14" height="11" rx="2" fill="#c4b0d8" transform="rotate(-14 51 27)"/><rect x="64" y="20" width="14" height="11" rx="2" fill="#f3d56b" transform="rotate(12 71 25)"/><rect x="54" y="14" width="13" height="10" rx="2" fill="#a9c8e8"/>
    <circle cx="60" cy="50" r="7" fill="#fff"/><path d="M57 50 l2 3 4 -5" stroke="#d4889a" stroke-width="2" fill="none"/></svg>`,
  bespoke: `<svg viewBox="0 0 120 120"><rect x="30" y="40" width="60" height="48" rx="8" fill="#c4b0d8"/><rect x="30" y="40" width="60" height="16" rx="8" fill="#d4889a"/>
    <path d="M60 40 V88 M30 56 H90" stroke="#fff" stroke-width="3"/><path d="M60 40 c-10 -16 -28 -6 0 8 c28 -14 10 -24 0 -8z" fill="#f3d56b"/>
    <g fill="#c8a84b"><path d="M40 26 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z"/><path d="M84 28 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6-4 -4-1.6 4-1.6z"/></g></svg>`,
  // Generic gift — default fallback for any new product
  gift: `<svg viewBox="0 0 120 120"><rect x="30" y="48" width="60" height="42" rx="6" fill="#c4b0d8"/><rect x="26" y="38" width="68" height="16" rx="6" fill="#d4889a"/>
    <path d="M60 38 V90" stroke="#fff" stroke-width="4"/>
    <path d="M60 38 c-12 -18 -30 -4 0 6 c30 -10 12 -24 0 -6z" fill="#f3d56b"/></svg>`,
};

/* ---------- Small helpers ---------- */
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
const mediaFor = (item) =>
  item.imageUrl
    ? `<img class="thumb-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name || "")}" loading="lazy" />`
    : ART[item.art] || ART.gift;

/* ---------- State ---------- */
const STORE_KEY = "ddd_cart_v1";
let cart = loadCart();
let PRODUCTS = [];
let CATEGORIES = [];
let SETTINGS = { code: "DAYDREAM10", percent: 10 };
let currentFilter = "all";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveCart() {
  localStorage.setItem(STORE_KEY, JSON.stringify(cart));
}

/* ---------- Data loading ---------- */
async function fetchJSON(path) {
  const res = await fetch(API_URL + path);
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return res.json();
}

async function loadCatalog() {
  try {
    const [products, categories, settings] = await Promise.all([
      fetchJSON("/api/products?active=true"),
      fetchJSON("/api/categories"),
      fetchJSON("/api/settings"),
    ]);

    CATEGORIES = categories || [];
    if (settings && settings.code) SETTINGS = settings;

    PRODUCTS = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      badge: p.badge || null,
      catLabel: p.category?.name || "",
      catSlug: p.category?.slug || "",
      tint: p.category?.tint || "#f7eaee",
      imageUrl: p.imageUrl || null,
      art: p.artFallback || "gift",
      variants: Array.isArray(p.options) ? p.options : [],
    }));

    applyDiscountText();
    renderFilters();
    renderProducts(currentFilter);
    renderCart(); // refresh totals in case the discount changed
  } catch (e) {
    console.error("Failed to load catalogue:", e);
    const grid = document.getElementById("product-grid");
    if (grid)
      grid.innerHTML = `<div class="catalog-error">We couldn't load the shop right now. Please make sure the store is online and refresh. ✦</div>`;
  }
}

/* ---------- Discount text in hero / newsletter ---------- */
function applyDiscountText() {
  document
    .querySelectorAll(".js-discount-code")
    .forEach((el) => (el.textContent = SETTINGS.code));
  document
    .querySelectorAll(".js-discount-percent")
    .forEach((el) => (el.textContent = SETTINGS.percent));
}

/* ---------- Filters (built from categories) ---------- */
function renderFilters() {
  const wrap = document.querySelector(".filters");
  if (!wrap) return;
  const chips = [
    `<button class="chip ${currentFilter === "all" ? "is-active" : ""}" data-filter="all">All</button>`,
  ];
  for (const c of CATEGORIES) {
    chips.push(
      `<button class="chip ${currentFilter === c.slug ? "is-active" : ""}" data-filter="${escapeHtml(c.slug)}">${c.emoji ? escapeHtml(c.emoji) + " " : ""}${escapeHtml(c.name)}</button>`
    );
  }
  wrap.innerHTML = chips.join("");
  wrap.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => applyFilter(chip.dataset.filter));
  });
}

function applyFilter(filter) {
  currentFilter = filter;
  document
    .querySelectorAll(".filters .chip")
    .forEach((c) => c.classList.toggle("is-active", c.dataset.filter === filter));
  renderProducts(filter);
}

/* ---------- Render products ---------- */
function badgeMarkup(b) {
  if (!b) return "";
  const map = { best: ["badge--best", "Bestseller"], new: ["badge--new", "New"], pop: ["badge--pop", "Popular"] };
  const entry = map[b];
  if (!entry) return "";
  const [cls, txt] = entry;
  return `<span class="badge ${cls}">${txt}</span>`;
}

function renderProducts(filter = "all") {
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  const list = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.catSlug === filter);

  if (!list.length) {
    grid.innerHTML = `<div class="catalog-empty">No items here yet — check back soon ✦</div>`;
    return;
  }

  grid.innerHTML = list
    .map((p) => {
      const v = p.variants;
      const minPrice = v.length ? Math.min(...v.map((x) => x.price)) : 0;
      return `
    <article class="card product-card reveal" data-id="${p.id}" data-cat="${escapeHtml(p.catSlug)}">
      <div class="thumb" style="background:linear-gradient(160deg, #fff, ${p.tint})">
        ${badgeMarkup(p.badge)}
        <button class="fav" aria-label="Save to favourites" data-fav>
          <svg viewBox="0 0 24 24" stroke-width="2"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>
        </button>
        ${mediaFor(p)}
      </div>
      <div class="card-body">
        <span class="cat">${escapeHtml(p.catLabel)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="desc">${escapeHtml(p.desc)}</p>
        <div class="variants" role="group" aria-label="Choose option">
          ${v.map((x, i) => `<button data-v="${i}" class="${i === 0 ? "sel" : ""}">${escapeHtml(x.label)} · ${inr(x.price)}</button>`).join("")}
        </div>
        <div class="card-foot">
          <div class="price" data-price>${inr(minPrice)}<small>${v.length > 1 ? "from" : "incl. message card"}</small></div>
          <button class="btn btn--sm" data-add>Add to cart</button>
        </div>
      </div>
    </article>`;
    })
    .join("");

  // wire variant + add + fav
  grid.querySelectorAll(".product-card").forEach((card) => {
    const id = card.dataset.id;
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    let selected = 0;
    const priceEl = card.querySelector("[data-price]");

    card.querySelectorAll("[data-v]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selected = +btn.dataset.v;
        card.querySelectorAll("[data-v]").forEach((b) => b.classList.remove("sel"));
        btn.classList.add("sel");
        priceEl.firstChild.textContent = inr(product.variants[selected].price);
      });
    });
    card.querySelector("[data-add]").addEventListener("click", () => {
      addToCart(product, selected);
    });
    card.querySelector("[data-fav]").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("is-on");
    });
  });

  observeReveals();
}

/* ---------- Cart ops ---------- */
function addToCart(product, variantIdx) {
  const v = product.variants[variantIdx];
  if (!v) return;
  const key = product.id + "::" + v.label;
  const existing = cart.find((c) => c.key === key);
  if (existing) existing.qty += 1;
  else
    cart.push({
      key,
      id: product.id,
      name: product.name,
      variant: v.label,
      price: v.price,
      art: product.art,
      imageUrl: product.imageUrl || null,
      tint: product.tint,
      qty: 1,
    });
  saveCart();
  renderCart();
  updateCount(true);
  toast(`Added ${product.name} (${v.label}) 💌`);
}
function changeQty(key, delta) {
  const item = cart.find((c) => c.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((c) => c.key !== key);
  saveCart();
  renderCart();
  updateCount();
}
function removeItem(key) {
  cart = cart.filter((c) => c.key !== key);
  saveCart();
  renderCart();
  updateCount();
}

function cartSubtotal() {
  return cart.reduce((s, c) => s + c.price * c.qty, 0);
}

function renderCart() {
  const wrap = document.getElementById("drawer-items");
  const foot = document.getElementById("drawer-foot");
  if (!wrap || !foot) return;
  if (!cart.length) {
    wrap.innerHTML = `<div class="drawer-empty"><span class="em">🧺</span>Your basket is empty.<br>Let's find a gift worth keeping.</div>`;
    foot.style.display = "none";
    return;
  }
  foot.style.display = "block";
  wrap.innerHTML = cart
    .map(
      (c) => `
    <div class="citem">
      <div class="ci-thumb" style="background:linear-gradient(160deg,#fff,${c.tint})">${mediaFor(c)}</div>
      <div>
        <b>${escapeHtml(c.name)}</b>
        <span class="ci-var">${escapeHtml(c.variant)}</span>
        <div class="qty">
          <button data-dec="${c.key}" aria-label="Decrease">−</button>
          <span>${c.qty}</span>
          <button data-inc="${c.key}" aria-label="Increase">+</button>
        </div>
        <button class="ci-remove" data-rm="${c.key}">Remove</button>
      </div>
      <div class="ci-price">${inr(c.price * c.qty)}</div>
    </div>`
    )
    .join("");

  const sub = cartSubtotal();
  const pct = SETTINGS.percent || 0;
  const disc = Math.round(sub * (pct / 100));
  foot.innerHTML = `
    <div class="promo">🎁 Code <b>${escapeHtml(SETTINGS.code)}</b> applied — ${pct}% off your first order!</div>
    <div class="summ"><span>Subtotal</span><span>${inr(sub)}</span></div>
    <div class="summ"><span>${escapeHtml(SETTINGS.code)} (−${pct}%)</span><span>−${inr(disc)}</span></div>
    <div class="summ"><span>Shipping</span><span>Calculated at checkout</span></div>
    <div class="summ total"><span>Total</span><span>${inr(sub - disc)}</span></div>
    <button class="btn btn--block" id="checkout-btn">Checkout · ${inr(sub - disc)}</button>`;

  wrap.querySelectorAll("[data-inc]").forEach((b) => (b.onclick = () => changeQty(b.dataset.inc, 1)));
  wrap.querySelectorAll("[data-dec]").forEach((b) => (b.onclick = () => changeQty(b.dataset.dec, -1)));
  wrap.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => removeItem(b.dataset.rm)));
  document.getElementById("checkout-btn").onclick = () =>
    toast("Demo store — checkout goes live soon ✦");
}

function updateCount(bump = false) {
  const n = cart.reduce((s, c) => s + c.qty, 0);
  const el = document.getElementById("cart-count");
  if (!el) return;
  el.textContent = n;
  el.style.display = n ? "grid" : "none";
  if (bump) {
    el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }],
      { duration: 300 }
    );
  }
}

/* ---------- Drawer ---------- */
function openDrawer() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}
function closeDrawer() {
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = `<span>✦</span> ${msg}`;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Scroll reveal ---------- */
let revealObserver;
function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
  }
  document.querySelectorAll(".reveal:not(.in)").forEach((el) => revealObserver.observe(el));
}

/* ---------- Live updates (Socket.IO) ---------- */
function initSocket() {
  const ioClient = window.io;
  if (typeof ioClient !== "function") return; // CDN failed to load — site still works
  try {
    const socket = ioClient(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("catalog:updated", () => loadCatalog());
  } catch (e) {
    console.warn("Live updates unavailable:", e.message);
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCount();
  loadCatalog();
  initSocket();

  // nav links + category tiles that carry data-filter (static elements)
  document.querySelectorAll("[data-filter]").forEach((el) => {
    if (el.classList.contains("chip")) return; // chips are wired dynamically
    el.addEventListener("click", () => {
      applyFilter(el.dataset.filter);
      const shop = document.getElementById("shop");
      if (shop) shop.scrollIntoView({ behavior: "smooth" });
    });
  });

  // cart open/close
  document.getElementById("cart-btn").onclick = openDrawer;
  document.getElementById("drawer-close").onclick = closeDrawer;
  document.getElementById("overlay").onclick = closeDrawer;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // mobile nav
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  toggle.onclick = () => links.classList.toggle("mobile-open");
  links.querySelectorAll("a").forEach((a) => (a.onclick = () => links.classList.remove("mobile-open")));

  // search
  document.getElementById("search-btn").onclick = () => {
    const q = (prompt("Search for a gift ✦ (try: bouquet, box, custom)") || "").toLowerCase().trim();
    if (!q) return;
    const match = PRODUCTS.find((p) =>
      (p.name + p.desc + p.catLabel).toLowerCase().includes(q)
    );
    if (match) {
      document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const card = document.querySelector(`[data-id="${match.id}"]`);
        if (card) {
          card.animate(
            [
              { boxShadow: "0 0 0 0 #d4889a" },
              { boxShadow: "0 0 0 6px #d4889a55" },
              { boxShadow: "0 0 0 0 #d4889a00" },
            ],
            { duration: 1400 }
          );
        }
      }, 600);
      toast(`Found: ${match.name}`);
    } else toast("No match — try 'bouquet', 'box' or 'custom'");
  };

  // newsletter
  document.getElementById("news-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    toast(`Welcome to the daydream! Use ${SETTINGS.code} for ${SETTINGS.percent}% off 💌`);
    input.value = "";
  });

  // back to top
  const totop = document.getElementById("totop");
  totop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  window.addEventListener(
    "scroll",
    () => {
      totop.classList.toggle("show", window.scrollY > 600);
    },
    { passive: true }
  );

  // year
  document.getElementById("year").textContent = new Date().getFullYear();

  observeReveals();
});
