import express from "express";
import cors from "cors";

import authRoutes from "./routes/accounts.js";
import accountsRoutes from "./routes/accounts.js";
import farmsRoutes from "./routes/farms.js";
import mobsRoutes from "./routes/mobs.js";
import paddocksRoutes from "./routes/paddocks.js";
import landmarksRoutes from "./routes/landmarks.js";
import inventoryRoutes from "./routes/inventory.js";
import fooRoutes from "./routes/foo.js";
import rainfallRoutes from "./routes/rainfall.js";
import breedsRoutes from "./routes/breeds.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the frontend (any origin by default; tighten with FRONTEND_ORIGIN if desired)
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/farms", farmsRoutes);
app.use("/api/mobs", mobsRoutes);
app.use("/api/paddocks", paddocksRoutes);
app.use("/api/landmarks", landmarksRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/foo", fooRoutes);
app.use("/api/rainfall", rainfallRoutes);
app.use("/api/breeds", breedsRoutes);

// Fallback error handler so unexpected errors return JSON, not an HTML crash page
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Kurra-Wirra API listening on port ${PORT}`);
});
