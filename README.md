# Kurra-Wirra Farm Management App

A React + Tailwind farm management app (mobs, paddocks, inventory, Google Maps paddock mapping).

## Local development

```bash
npm install
npm run dev
```

## Deploying to GitHub + Render

### 1. Push to GitHub
1. Create a new repository on GitHub (e.g. `kw-farm-app`)
2. Upload all the files in this folder to that repo (drag-and-drop via the GitHub web UI works fine — upload everything except the `node_modules` and `dist` folders, which don't exist yet anyway)

### 2. Connect to Render
1. Go to https://dashboard.render.com
2. Click **New +** → **Static Site**
3. Connect your GitHub account and select the `kw-farm-app` repo
4. Render should auto-detect the settings from `render.yaml`. If asked manually, use:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Click **Create Static Site**

Render will build and deploy automatically. You'll get a live URL like `https://kw-farm-app.onrender.com`.

### 3. Add your Google Maps API key (as a Render environment variable)
The Google Maps key is **not** stored in the app or the GitHub repo — it's injected at build time via Render so it never lives in your source code:

1. In the Render dashboard, open your `kw-farm-app` static site
2. Go to **Environment** (left sidebar)
3. Click **Add Environment Variable**
   - Key: `VITE_GOOGLE_MAPS_KEY`
   - Value: your Google Maps JavaScript API key
4. Save — Render will automatically trigger a redeploy using that key
5. Once redeployed, open the app and check **Menu → Settings**, which will show a green dot confirming the key was detected

If no key is set, the app automatically falls back to its built-in offline paddock map — nothing breaks either way.

## Notes
- All app data (mobs, paddocks, accounts, inventory) currently lives in React state only — it resets on every page refresh. This is fine for testing/demo purposes. For real day-to-day farm use, a database (e.g. Supabase) should be connected so data persists.
- Default admin login: `simon@kurrawirra.com.au` / `Sc731991`
