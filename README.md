# Kurra-Wirra Farm Management App

A full-stack farm management app: React + Tailwind frontend, Express + Drizzle + PostgreSQL backend.
All data (mobs, paddocks, landmarks, inventory, accounts) is saved to a real database, so every
device and every person sees the same live data.

## Project structure

```
kw-app/
├── src/              ← React frontend (Vite)
│   ├── App.jsx        the whole app UI
│   └── api.js          talks to the backend API
├── api-server/        ← Express + Drizzle backend
│   └── src/
│       ├── index.js    server entrypoint
│       ├── auth.js     password hashing + login tokens
│       ├── db/         database schema, connection, seed script
│       └── routes/     one file per API resource
└── render.yaml         deploys BOTH the frontend and backend (+ database) together
```

## Deploying to GitHub + Render (full stack)

### 1. Push to GitHub
1. Create a new repository on GitHub (e.g. `kw-farm-app`)
2. Upload **everything** in this folder — both the root files (`src/`, `package.json`, etc.) and
   the entire `api-server/` folder — to that repo.

### 2. Deploy as a Blueprint
This project includes a `render.yaml` that sets up the database, the API, and the frontend all in
one go.

1. Go to https://dashboard.render.com
2. Click **New +** → **Blueprint**
3. Connect your GitHub account and select the `kw-farm-app` repo
4. Render will read `render.yaml` and show you three things it's about to create:
   - `kw-farm-db` — a managed PostgreSQL database
   - `kw-farm-api` — the backend API (Node web service)
   - `kw-farm-app` — the frontend (static site)
5. Click **Apply** — Render builds and deploys all three.

### 3. Connect the two web services together
Once both services have URLs (e.g. `kw-farm-api.onrender.com` and `kw-farm-app.onrender.com`),
go back into each service's **Environment** tab and fill in the two variables that couldn't be
known ahead of time:

- On **kw-farm-api** → Environment → set `FRONTEND_ORIGIN` to your frontend's URL,
  e.g. `https://kw-farm-app.onrender.com`
- On **kw-farm-app** → Environment → set `VITE_API_URL` to your API's URL **with `/api` on the end**,
  e.g. `https://kw-farm-api.onrender.com/api`
- Also on **kw-farm-app** → Environment → set `VITE_GOOGLE_MAPS_KEY` to your Google Maps key
  (see the API key guide from earlier in this project)

Each change triggers an automatic redeploy of that service.

### 4. Set up the database tables
The database starts empty — it needs its tables created and the starter accounts/data seeded.

1. On the **kw-farm-api** service in Render, click **Shell** (top right)
2. Run:
   ```
   npm run db:push
   npm run db:seed
   ```
   This creates all the tables, then adds the four farms, the primary Admin account
   (`simon@kurrawirra.com.au` / `Sc731991`), two demo accounts, and some starter paddocks/mobs
   for Arundale so the app isn't empty on first run.

### 5. Sign in
Open your frontend URL and sign in with `simon@kurrawirra.com.au` / `Sc731991`. From there, use
Menu → Accounts to invite real team members (they get a default password of `password`, which
they should change via Menu → Accounts → "Change my password" once they're in).

## Local development

**Backend:**
```bash
cd api-server
npm install
cp .env.example .env   # then fill in a real DATABASE_URL (can point at the Render database)
npm run db:push
npm run db:seed
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev
```

## Notes
- Passwords are hashed with bcrypt — never stored in plain text, never visible in the app code.
- Login sessions last 30 days (so "stay logged in" genuinely keeps people logged in across visits)
  and are restored automatically when the app reloads.
- The Google Maps key is never stored in the database or the app code — only as a Render
  environment variable on the frontend service, injected at build time.
