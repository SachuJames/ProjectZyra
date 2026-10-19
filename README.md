# ProjectZyra

Price comparison across Indian online stores. Search once and Zyra checks
Amazon, Flipkart, Nykaa, Myntra, Meesho, Tata CLiQ, Ajio and Snapdeal in
parallel, groups the listings that are actually the same product, and shows
the prices side by side with the lowest one marked.

![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688.svg)
![React 18](https://img.shields.io/badge/react-18-61DAFB.svg)
![PostgreSQL 15](https://img.shields.io/badge/postgresql-15-4169E1.svg)
![Redis 7](https://img.shields.io/badge/redis-7-DC382D.svg)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## What it does

- **One search, eight stores.** Each store has its own scraper (Playwright
  and HTTPX, depending on the site). They run concurrently under a global
  timeout, and a store that fails or times out is skipped rather than
  failing the whole search.
- **Matching that is more than string equality.** Listings from different
  stores rarely share a title word for word, so results are grouped by
  embedding similarity (sentence-transformers, all-MiniLM-L6-v2) over the
  product titles. Each group gets one entry per store and a lowest price
  flag.
- **Price history.** Every search stores what it found, so a product page
  can show how its price has moved over time, per store.
- **Price drop alerts.** Track a product with a target price and a
  scheduler checks active alerts every hour. When a store hits the target,
  the alert goes out by email through Resend.
- **Accounts and an admin view.** Register and login with email and
  password, or sign in with Google. Logged-in users get a dashboard with
  their alerts, tracked products and search history. The admin dashboard
  shows platform stats, top searches, a per-store breakdown and recent
  activity.
- **An AI summary, if you wire up a key.** With `GEMINI_API_KEY` set, a
  product page can ask Gemini (gemini-2.0-flash) for a short summary of
  whether the current price is worth acting on. Without the key, that one
  endpoint returns an error and everything else works.

Search results are cached in Redis for 15 minutes, so a repeated search is
served from cache instead of scraping eight stores again.

## Running it

You need Docker with Compose. Copy the example env file and fill in what
you have:

```
cp .env.example .env
docker compose up --build
```

Then open http://localhost. Nginx serves the app on port 80 and forwards
`/api/` to the backend. The pieces are also reachable directly: frontend
(Vite) on :5173, API on :8000, Postgres on :5433, Redis on :6379.

The env keys, from `.env.example`:

| Key | Needed for |
|---|---|
| `DATABASE_URL`, `REDIS_URL` | The compose defaults already point at the bundled services |
| `JWT_SECRET` | Signing login tokens |
| `GOOGLE_CLIENT_ID` | Google sign-in |
| `RESEND_API_KEY` | Price drop alert emails |
| `GEMINI_API_KEY` | The product summary endpoint (optional) |
| `SERPAPI_KEY` | An extra results pass through SerpApi / Google Shopping (optional) |

Note that `docker-compose.yml` currently carries a shared Google client ID
and database password as defaults so the stack runs out of the box. Fine for
local use; override them in `.env` before putting this anywhere public.

## How a search flows

```
GET /search?q=...
  -> Redis cache (15 min) 
  -> scrape_all: eight store scrapers in parallel, failures skipped
  -> normalize_results: embedding similarity groups duplicates,
     lowest price per group flagged
  -> products and price history written to Postgres
  -> response grouped by product, one price per store
```

There is also `POST /search/by-url` if you already have a product link from
one of the supported stores, and `POST /scrape` to refresh the catalogue
for a query without going through the cache.

## API

All routes are on the backend (:8000), and under `/api/` when going
through Nginx.

| Route | What it does |
|---|---|
| `GET /health` | Liveness check |
| `GET /search?q=` | Search all stores, grouped and cached |
| `POST /search/by-url` | Look up one product by its store URL |
| `POST /scrape` | Scrape and store results for a query |
| `GET /product/{id}` | Product details |
| `GET /product/{id}/history` | Recorded price history |
| `GET /product/{id}/summary` | Gemini summary (needs `GEMINI_API_KEY`) |
| `POST /auth/register`, `POST /auth/login` | Email and password accounts |
| `POST /auth/google` | Google sign-in |
| `GET /auth/me` | Current user |
| `POST /track` | Create a price alert (login required) |
| `GET /dashboard/alerts` | Your alerts |
| `GET /dashboard/history`, `GET /dashboard/searches` | Your tracked products and searches |
| `GET /admin/stats` | Platform totals (admin) |
| `GET /admin/top-searches`, `GET /admin/platform-breakdown` | Search and store breakdowns (admin) |
| `GET /admin/recent-alerts`, `GET /admin/search-history` | Recent activity (admin) |

## Layout

```
backend/app/
  main.py        routes, search flow, alert scheduler, summary endpoint
  scrapers.py    one scraper per store, plus the SerpApi pass and URL lookup
  normalizer.py  embedding based grouping of duplicate listings
  auth.py        password hashing, JWT, Google credential checks
  models.py      User, Product, PriceHistory, PriceAlert, SearchLog
  database.py    SQLAlchemy setup
frontend/src/
  pages/         Home, SearchResults, ProductDetail, Dashboard,
                 AdminDashboard, Login, Register
nginx/           reverse proxy: / to the frontend, /api/ to the backend
```

## Honest limitations

Scraping is the fragile part, by nature. Stores change their markup and
block automated traffic, so a scraper can quietly start returning nothing;
the search still succeeds with whichever stores answered. Prices are
whatever the store showed at scrape time, including whatever offers or
pin codes were baked into that page, so treat them as a guide rather than a
quote. The grouping is similarity based, which means a variant (different
size, different pack) can occasionally land in the same group as the base
product. And the alert emails currently send from Resend's shared
onboarding address, which is fine for trying it out and not what you would
ship.

## License

MIT. See [LICENSE](LICENSE).
