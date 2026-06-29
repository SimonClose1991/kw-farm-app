import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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
import workflowRoutes from "./routes/workflow.js";
import sheepRoutes from "./routes/sheep.js";
import cattleRoutes from "./routes/cattle.js";
import fieldNotesRoutes from "./routes/fieldNotes.js";

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: "10mb" }));

// ── Serve the workflow HTML file at /workflow.html ───────────────────────────
const workflowPath = path.resolve(__dirname, "../workflow/workflow.html");
app.get("/workflow.html", (req, res) => {
  res.sendFile(workflowPath, (err) => {
    if (err) {
      console.error("workflow.html not found at:", workflowPath, err.message);
      res.status(404).json({ error: "Workflow HTML not found", path: workflowPath });
    }
  });
});

// ── API routes ───────────────────────────────────────────────────────────────
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
app.use("/api/workflow", workflowRoutes);
app.use("/api/sheep", sheepRoutes);
app.use("/api/cattle", cattleRoutes);
app.use("/api/field-notes", fieldNotesRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`Kurra-Wirra API listening on port ${PORT}`);
});
