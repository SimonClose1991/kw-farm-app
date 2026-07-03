import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { workflowState, accounts } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

// GET /api/workflow — returns the full workflow state (tasks, published, staff, prefs)
// Staff list is merged with real account names so they stay in sync automatically.
router.get("/", requireAuth, async (req, res) => {
  try {
    // Get workflow state
    const [state] = await db.select().from(workflowState).where(eq(workflowState.id, "singleton"));

    // Get real account names from the accounts table
    const allAccounts = await db.select({ name: accounts.name }).from(accounts);
    const accountNames = allAccounts.map((a) => a.name).filter(Boolean);

    // Merge: start with workflow's saved staff list, add any account names not already in it
    const savedStaff = Array.isArray(state?.staff) ? state.staff : [];
    const mergedStaff = [...new Set([...savedStaff, ...accountNames])];

    res.json({
      tasks: state?.tasks || [],
      published: state?.published || [],
      staff: mergedStaff,
      prefs: state?.prefs || {},
    });
  } catch (err) {
    console.error("Workflow GET error:", err);
    res.status(500).json({ error: "Couldn't load workflow state" });
  }
});

// PUT /api/workflow — saves the full workflow state
router.put("/", requireAuth, async (req, res) => {
  try {
    const { tasks, published, staff, prefs } = req.body;
    const existing = await db.select().from(workflowState).where(eq(workflowState.id, "singleton"));
    if (existing.length > 0) {
      await db.update(workflowState)
        .set({ tasks, published, staff, prefs, updatedAt: new Date() })
        .where(eq(workflowState.id, "singleton"));
    } else {
      await db.insert(workflowState).values({ id: "singleton", tasks, published, staff, prefs });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Workflow PUT error:", err);
    res.status(500).json({ error: "Couldn't save workflow state" });
  }
});

// GET /api/workflow/staff — just the merged staff list (used by the farm app for task filters)
router.get("/staff", requireAuth, async (req, res) => {
  try {
    const [state] = await db.select().from(workflowState).where(eq(workflowState.id, "singleton"));
    const allAccounts = await db.select({ name: accounts.name }).from(accounts);
    const accountNames = allAccounts.map((a) => a.name).filter(Boolean);
    const savedStaff = Array.isArray(state?.staff) ? state.staff : [];
    const merged = [...new Set([...savedStaff, ...accountNames])];
    res.json(merged);
  } catch (err) {
    res.status(500).json({ error: "Couldn't load staff list" });
  }
});

// POST /api/workflow/tasks — append a single task (used by field notes "Convert to Task")
router.post("/tasks", requireAuth, async (req, res) => {
  try {
    const newTask = req.body;
    if (!newTask?.id || !newTask?.content) return res.status(400).json({ error: "Task must have id and content" });
    const [existing] = await db.select().from(workflowState).where(eq(workflowState.id, "singleton"));
    const tasks = [...(existing?.tasks || []), newTask];
    if (existing) {
      await db.update(workflowState).set({ tasks, updatedAt: new Date() }).where(eq(workflowState.id, "singleton"));
    } else {
      await db.insert(workflowState).values({ id: "singleton", tasks, published: [], staff: [], prefs: {} });
    }
    res.status(201).json({ ok: true, taskId: newTask.id });
  } catch (err) {
    console.error("Workflow task append error:", err);
    res.status(500).json({ error: "Couldn't add task" });
  }
});

// GET /api/workflow/published — returns only the published snapshot
// Used by the personal dashboard to show a staff member their tasks
router.get("/published", requireAuth, async (req, res) => {
  try {
    const [state] = await db.select().from(workflowState).where(eq(workflowState.id, "singleton"));
    res.json(state?.published || []);
  } catch (err) {
    res.status(500).json({ error: "Couldn't load published tasks" });
  }
});

export default router;
