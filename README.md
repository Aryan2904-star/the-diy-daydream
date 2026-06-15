# The DIY Daydream 💌

Handmade artisan gifting store, split into two independently-deployed parts:

```
the-diy-daydream/
├─ frontend/          # The customer-facing website (vanilla HTML/CSS/JS)
└─ backend/
   ├─ server/         # Express API · Neon Postgres (Prisma) · Cloudinary · Socket.IO
   └─ admin/          # Admin dashboard (React + Vite)
```

- **Frontend** loads products, categories and the discount **live from the API**, and updates
  in real time over Socket.IO — no redeploy when you change the catalogue.
- **Admin panel** is where you log in, create categories, list products (with image uploads),
  and edit the discount. Every change is pushed to the storefront instantly.
- Each part has **its own env file** and deploys separately.

---

## What you need (free tiers)

1. **Neon** — Postgres database → <https://neon.tech> (500 MB free)
2. **Cloudinary** — image upload/processing/CDN → <https://cloudinary.com> (free tier)
3. **Node.js 18+** installed locally

---

## 1) Backend server — `backend/server`

```bash
cd backend/server
npm install
cp .env.example .env        # then fill in the values (see below)
npx prisma migrate dev      # creates the database tables
npm run seed                # creates your admin user + the 6 starter products
npm run dev                 # API on http://localhost:4000
```

Fill `backend/server/.env`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → **pooled** connection string (has `-pooler`) |
| `DIRECT_URL` | Neon dashboard → **direct** connection string (no `-pooler`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary dashboard → API credentials |
| `JWT_SECRET` | any long random string |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | the login you'll use for the admin panel |
| `CORS_ORIGIN` | comma-separated list of your frontend + admin URLs |

> **Preview database:** in Neon, create a **branch** (e.g. `preview`) and keep its two
> connection strings in a separate `.env.preview` for staging. Your `main` branch is production.

---

## 2) Admin panel — `backend/admin`

```bash
cd backend/admin
npm install
cp .env.example .env        # set VITE_API_URL=http://localhost:4000
npm run dev                 # dashboard on http://localhost:5173
```

Log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you seeded. From here you can:
- **Categories** → create/edit/delete (these become the filters on the website)
- **Products** → add/edit with an image upload + multiple price options
- **Dashboard / Analytics** → live counts and charts
- **Orders** → ready for the checkout phase (empty for now)

---

## 3) Frontend website — `frontend`

It's a static site (no build step). Point it at your backend:

```bash
cd frontend
cp config.example.js config.js     # set API_URL + SOCKET_URL (both http://localhost:4000 for local)
```

Then serve the folder with any static server, e.g. VS Code **Live Server**, or:

```bash
npx serve .        # or: python -m http.server 5500
```

Open it — the shop now loads products from the API. Edit something in the admin panel and watch
the storefront update **without a refresh**. ✦

> The URL you serve the frontend from (e.g. `http://localhost:5500`) must be listed in the
> backend's `CORS_ORIGIN`.

---

## How it fits together

```
 Admin (React)  ──POST/PUT/DELETE──▶  Backend API ──▶ Neon Postgres
       ▲                                  │  └────────▶ Cloudinary (images)
       │                                  │
       └────────── reads ◀────────────────┤
                                          │ emits "catalog:updated"
 Frontend (site) ──GET /api/*────────────▶│
       ▲                                  │
       └────────── Socket.IO ◀────────────┘  (live refresh)
```

---

## Deployment (each part separately)

- **Neon** — production branch + a preview branch (two `DATABASE_URL`s).
- **Backend (`backend/server`)** → Render / Railway / Fly:
  - Build: `npm install` · Start: `npm start`
  - Set all `.env` vars. Run `npm run migrate:deploy` then `npm run seed` once.
- **Admin (`backend/admin`)** → Vercel / Netlify:
  - Build: `npm run build` · Output: `dist` · Set `VITE_API_URL` to the backend's public URL.
- **Frontend (`frontend`)** → Netlify / Vercel / any static host:
  - Set `config.js` `API_URL` + `SOCKET_URL` to the backend's public URL.
- Add the live **admin** and **frontend** URLs to the backend's `CORS_ORIGIN`.

---

## Next phase (deferred)

Checkout flow + payment gateway (Razorpay). The `Order` table and the admin **Orders /
Analytics** pages are already scaffolded — they light up once checkout ships.
