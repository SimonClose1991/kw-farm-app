import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireAdmin } from "../auth.js";
import * as store from "../lambFeedlotStore.js";

// Admin-only, every route including reads: this is profit data, so a Worker or
// Manager must not be able to fetch it by calling the API directly.
const router = Router();
router.use(requireAuth, requireAdmin);

// Express 4 doesn't catch async errors; also turns the store's validation errors
// into proper 400/404 responses instead of a generic 500
const handle = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    if (err instanceof store.StoreError) return res.status(err.status).json({ error: err.message });
    console.error("Lamb feedlot error:", err);
    res.status(500).json({ error: "Something went wrong on the server" });
  });

router.get("/", handle(async (req, res) => res.json(await store.loadAll(db))));

router.put("/settings", handle(async (req, res) => res.json(await store.saveSettings(db, req.body))));

router.post("/mobs", handle(async (req, res) => res.status(201).json(await store.createMob(db, req.body))));
router.put("/mobs/:id", handle(async (req, res) => res.json(await store.updateMob(db, req.params.id, req.body))));
router.delete("/mobs/:id", handle(async (req, res) => res.json(await store.deleteMob(db, req.params.id))));

router.post("/induct", handle(async (req, res) => res.status(201).json(await store.induct(db, req.body))));
router.post("/sales", handle(async (req, res) => res.json(await store.recordSales(db, req.body))));
router.post("/import", handle(async (req, res) => res.json(await store.importBackup(db, req.body))));

export default router;
