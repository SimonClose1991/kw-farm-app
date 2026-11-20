import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireEditor } from "../auth.js";
import { listJobs, getJob, appendEvents, deleteJob, JobError } from "../gpsJobsStore.js";

const router = Router();
const handle = (fn) => async (req, res) => {
  try { res.json(await fn(req)); }
  catch (err) {
    if (err instanceof JobError) return res.status(err.status).json({ error: err.message });
    console.error("gps-jobs error:", err);
    res.status(500).json({ error: "Couldn't complete that" });
  }
};
const pid = (req) => { const n = Number(req.params.paddockId); if (!Number.isInteger(n)) throw new JobError(400, "Bad paddock"); return n; };
const who = (req) => req.user?.name || req.user?.email || "Someone";

// GET /api/gps-jobs?farm=Arundale — jobs in progress (summaries, no GPS points)
router.get("/", requireAuth, handle((req) => listJobs(db, String(req.query.farm || ""))));
// GET /api/gps-jobs/:paddockId — the full job, or { job: null } when there isn't one
router.get("/:paddockId", requireAuth, handle(async (req) => (await getJob(db, pid(req))) || { job: null }));
// POST /api/gps-jobs/:paddockId/append { product, widthM, events: [...] }
router.post("/:paddockId/append", requireAuth, requireEditor, handle((req) => appendEvents(db, pid(req), req.body, who(req))));
// DELETE /api/gps-jobs/:paddockId — job finished (recorded) or thrown away
router.delete("/:paddockId", requireAuth, requireEditor, handle((req) => deleteJob(db, pid(req))));

export default router;
