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
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const [account] = await db.select().from(accounts).where(eq(accounts.email, email.trim().toLowerCase()));
  if (!account) return res.status(401).json({ error: "No account found for that email. Ask an Admin to add you." });
  const ok = await verifyPassword(password, account.passwordHash);
  if (!ok) return res.status(401).json({ error: "Incorrect password." });
  const token = signToken(account);
  res.json({ token, account: sanitize(account) });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, req.user.id));
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json({ account: sanitize(account) });
});

// GET /api/accounts
router.get("/", requireAuth, async (req, res) => {
  const all = await db.select().from(accounts);
  res.json(all.map(sanitize));
});

// POST /api/accounts — create account with default password "password" (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
  const existing = await db.select().from(accounts).where(eq(accounts.email, email.trim().toLowerCase()));
  if (existing.length > 0) return res.status(409).json({ error: "An account with that email already exists" });
  const passwordHash = await hashPassword("password");
  const [created] = await db
    .insert(accounts)
    .values({ name, email: email.trim().toLowerCase(), role: role || "Worker", passwordHash })
    .returning();
  res.status(201).json(sanitize(created));
});

// PUT /api/accounts/:id
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  const [updated] = await db.update(accounts)
    .set({ ...(name && { name }), ...(role && { role }) })
    .where(eq(accounts.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Account not found" });
  res.json(sanitize(updated));
});

// PUT /api/accounts/:id/password — change own password
router.put("/:id/password", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id !== targetId && req.user.role !== "Admin") {
    return res.status(403).json({ error: "You can only change your own password" });
  }
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const passwordHash = await hashPassword(password);
  await db.update(accounts).set({ passwordHash }).where(eq(accounts.id, targetId));
  res.json({ ok: true });
});

// DELETE /api/accounts/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await db.delete(accounts).where(eq(accounts.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
