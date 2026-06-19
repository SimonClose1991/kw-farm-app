import { Router } from "express";
import { db } from "../db/index.js";
import { farms } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

// GET /api/farms
router.get("/", requireAuth, async (req, res) => {
  const all = await db.select().from(farms);
  res.json(all);
});

export default router;
