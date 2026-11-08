import { Router } from "express";
import { db } from "../db/index.js";
import { accounts } from "../db/schema.js";
import { requireAuth } from "../auth.js";
import * as store from "../workflowStore.js";

const router = Router();

// Validation problems become proper 400/404 answers instead of a generic 500
const fail = (res, err, fallback) => {
  if (err instanceof store.WorkflowError) return res.status(err.status).json({ error: err.message });
  console.error("Workflow error:", err);
  res.status(500).json({ error: fallback });
};

// The saved staff list plus every account name, so people with a login are always on the roster
async function withStaff(state) {
  const allAccounts = await db.select({ name: accounts.name }).from(accounts);
  const accountNames = allAccounts.map((a) => a.name).filter(Boolean);
  return { ...state, staff: [...new Set([...(state.staff || []), ...accountNames])] };
}

const publicShape = (s) => ({
  tasks: s.tasks, published: s.published, staff: s.staff, prefs: s.prefs,
  recurTemplates: s.recurTemplates, colors: s.colors, staffDetails: s.staffDetails, updatedAt: s.updatedAt,
});

// GET /api/workflow — the full planner state
router.get("/", requireAuth, async (req, res) => {
  try {
    res.json(publicShape(await withStaff(await store.loadState(db))));
  } catch (err) { fail(res, err, "Couldn't load workflow state"); }
});

// POST /api/workflow/sync — apply the CHANGES a screen made (jobs added/edited/deleted, order,
// publish, staff, categories). Anything the screen doesn't mention is left exactly as it is, so a
// stale screen can no longer wipe other people's jobs. Replies with the full, merged state.
router.post("/sync", requireAuth, async (req, res) => {
  try {
    res.json(publicShape(await withStaff(await store.syncState(db, req.body))));
  } catch (err) { fail(res, err, "Couldn't save workflow changes"); }
});

// POST /api/workflow/tasks/:id/done  body: { completed }
router.post("/tasks/:id/done", requireAuth, async (req, res) => {
  try {
    await store.setDone(db, req.params.id, req.body?.completed);
    res.json({ ok: true });
  } catch (err) { fail(res, err, "Couldn't tick that job"); }
});

// PUT /api/workflow — the old "send the whole list" save. It is what let an out-of-date screen
// wipe other people's jobs, so it no longer saves anything. An old planner page that is still open
// gets told to reload (the new page uses /sync).
router.put("/", requireAuth, (req, res) => {
  res.status(409).json({ error: "The planner has been updated — close it and open it again, then redo that change." });
});

// GET /api/workflow/staff — just the merged staff list (used by the farm app for task filters)
router.get("/staff", requireAuth, async (req, res) => {
  try {
    res.json((await withStaff(await store.loadState(db))).staff);
  } catch (err) { fail(res, err, "Couldn't load staff list"); }
});

// POST /api/workflow/tasks — append a single task (used by field notes "Convert to Task")
router.post("/tasks", requireAuth, async (req, res) => {
  try {
    await store.appendTask(db, req.body);
    res.status(201).json({ ok: true, taskId: req.body.id });
  } catch (err) { fail(res, err, "Couldn't add task"); }
});

// GET /api/workflow/published — only the published snapshot (the personal dashboard uses this)
router.get("/published", requireAuth, async (req, res) => {
  try {
    res.json((await store.loadState(db)).published);
  } catch (err) { fail(res, err, "Couldn't load published tasks"); }
});

export default router;
