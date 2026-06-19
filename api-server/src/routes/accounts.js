import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { accounts } from "../db/schema.js";
import { hashPassword, verifyPassword, signToken, requireAuth, requireAdmin } from "../auth.js";

const router = Router();

function sanitize(account) {
  const { passwordHash, ...rest } = account;
  return rest;
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.email, email.trim().toLowerCase()));

  if (!account) {
    return res.status(401).json({ error: "This email hasn't been invited. Ask an Admin to invite you." });
  }
  const ok = await verifyPassword(password, account.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  const token = signToken(account);
  res.json({ token, account: sanitize(account) });
});

// GET /api/auth/me — used to restore a session from a stored token
router.get("/me", requireAuth, async (req, res) => {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, req.user.id));
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json({ account: sanitize(account) });
});

// GET /api/accounts — list all accounts (any logged-in user can see the team list)
router.get("/", requireAuth, async (req, res) => {
  const all = await db.select().from(accounts);
  res.json(all.map(sanitize));
});

// POST /api/accounts — invite a new account (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
  const existing = await db.select().from(accounts).where(eq(accounts.email, email.trim().toLowerCase()));
  if (existing.length > 0) return res.status(409).json({ error: "An account with that email already exists" });
  const passwordHash = await hashPassword("password"); // default password for new invites, same as before
  const [created] = await db
    .insert(accounts)
    .values({ name, email: email.trim().toLowerCase(), role: role || "Worker", passwordHash })
    .returning();
  res.status(201).json(sanitize(created));
});

// PUT /api/accounts/:id — update role/name (Admin only)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  const [updated] = await db
    .update(accounts)
    .set({ ...(name && { name }), ...(role && { role }) })
    .where(eq(accounts.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Account not found" });
  res.json(sanitize(updated));
});

// PUT /api/accounts/:id/password — change own password (any logged-in user, own account only, unless Admin)
router.put("/:id/password", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id !== targetId && req.user.role !== "Admin") {
    return res.status(403).json({ error: "You can only change your own password" });
  }
  const { password } = req.body;
  if (!password || password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  const passwordHash = await hashPassword(password);
  await db.update(accounts).set({ passwordHash }).where(eq(accounts.id, targetId));
  res.json({ ok: true });
});

// DELETE /api/accounts/:id — remove an account (Admin only)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await db.delete(accounts).where(eq(accounts.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
