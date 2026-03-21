# 🛍️ ProjectZyra

### *AI-powered price comparison across Amazon, Flipkart, Nykaa and more*

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License"/>
</p>

---

## 🎬 Live Demo

> 🔗 **[https://your-ngrok-url.ngrok-free.app](https://your-ngrok-url.ngrok-free.app)**

Search any product and compare prices instantly across platforms — results appear in seconds, powered by real-time scraping and intelligent product matching.

<!-- Replace this line with an animated GIF of the app in action -->
> 📸 *Demo GIF coming soon*

---

## ✨ Features

- 🔍 **Real-time scraping** from Amazon, Flipkart, Nykaa, Myntra and more
- 🤖 **NLP-powered product matching** using `sentence-transformers` for semantic deduplication
- ⚡ **Redis caching** for sub-second repeated searches
- 📊 **Price history tracking** and interactive charts
- 🔔 **Price drop email alerts** to never miss a deal
- 👤 **User authentication** with Google OAuth
- 📱 **Admin dashboard** with analytics and platform health stats
- 🌙 **Dark mode cinematic UI** built with React

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts, Axios |
| **Backend** | FastAPI, SQLAlchemy, Alembic |
| **AI / NLP** | sentence-transformers, Google Gemini API |
| **Scraping** | Playwright, BeautifulSoup, HTTPX |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Auth** | Google OAuth 2.0, JWT |
| **Infrastructure** | Docker, Docker Compose, Nginx |

---

## 🏗️ Architecture

```
                        ┌─────────┐
                        │  User   │
                        └────┬────┘
                             │ HTTPS
                        ┌────▼────┐
                        │  Nginx  │
                        └────┬────┘
               ┌─────────────┴─────────────┐
               │                           │
        ┌──────▼──────┐            ┌───────▼───────┐
        │  React      │            │  FastAPI      │
        │  Frontend   │            │  Backend      │
        └─────────────┘            └───┬───────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                   │
             ┌──────▼──────┐  ┌───────▼──────┐  ┌────────▼────────┐
             │ PostgreSQL  │  │   Redis      │  │  Playwright     │
             │ (products,  │  │   (cache)    │  │  Scrapers       │
             │  history,   │  └──────────────┘  │ (Amazon,        │
             │  users)     │                     │  Flipkart,      │
             └─────────────┘                     │  Nykaa, ...)    │
                                                 └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/install/) ≥ 2.20

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SachuJames/ProjectZyra.git
cd ProjectZyra

# 2. Set up environment variables
cp .env.example .env

# 3. Fill in the required keys in .env
#    - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
#    - GEMINI_API_KEY
#    - SECRET_KEY (JWT)
#    - SMTP credentials (for email alerts)

# 4. Start all services
docker compose up --build
```

The app will be available at **http://localhost:3000** and the API at **http://localhost:8000**.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search?q={query}` | Search and compare prices across all platforms |
| `GET` | `/products/{id}` | Get product details and price history |
| `POST` | `/alerts` | Create a price drop alert for a product |
| `DELETE`| `/alerts/{id}` | Remove a price drop alert |
| `GET` | `/auth/google` | Initiate Google OAuth login |
| `GET` | `/auth/callback` | Google OAuth callback handler |
| `GET` | `/auth/me` | Get current authenticated user profile |
| `POST` | `/auth/logout` | Log out and invalidate session |
| `GET` | `/admin/stats` | Admin: platform-wide analytics (admin only) |
| `GET` | `/admin/logs` | Admin: recent search and scrape logs (admin only) |

---

## 📸 Screenshots

> *Screenshots will be added after the first stable release.*

---

## 👤 Author

**Sachu James**
CSE Student · APJ Abdul Kalam Technological University

<p>
  <a href="https://github.com/SachuJames">
    <img src="https://img.shields.io/badge/GitHub-SachuJames-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
