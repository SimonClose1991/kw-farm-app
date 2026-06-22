import { Router } from "express";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../db/index.js";
import { accounts, passwordTokens } from "../db/schema.js";
import { hashPassword, verifyPassword, signToken, requireAuth, requireAdmin } from "../auth.js";

const router = Router();

function sanitize(account) {
  const { passwordHash, ...rest } = account;
  return rest;
}

async function sendInviteEmail(name, email, setupUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[No RESEND_API_KEY] Invite URL for ${email}: ${setupUrl}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Kurra-Wirra Farm App <onboarding@resend.dev>",
        to: [email],
        subject: "You've been invited to Kurra-Wirra Farm Management",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#450a0a">Welcome to Kurra-Wirra Farm Management, ${name}</h2>
            <p>You've been invited to the Kurra-Wirra Farm Management app.</p>
            <p>Click the button below to set your password and get started:</p>
            <a href="${setupUrl}" style="display:inline-block;background:#450a0a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
              Set My Password
            </a>
            <p style="color:#64748b;font-size:13px">This link expires in 48 hours. If you didn't expect this invite, you can ignore it.</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("Resend error:", err);
    }
  } catch (err) {
    console.error("Failed to send invite email:", err);
  }
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  const [account] = await db.select().from(accounts).where(eq(accounts.email, email.trim().toLowerCase()));
  if (!account) return res.status(401).json({ error: "This email hasn't been invited. Ask an Admin to invite you." });
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

// POST /api/accounts — invite a new account (Admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
  const existing = await db.select().from(accounts).where(eq(accounts.email, email.trim().toLowerCase()));
  if (existing.length > 0) return res.status(409).json({ error: "An account with that email already exists" });

  // Create account with a random placeholder password (they'll set their own via the invite link)
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
  const [created] = await db
    .insert(accounts)
    .values({ name, email: email.trim().toLowerCase(), role: role || "Worker", passwordHash })
    .returning();

  // Generate a setup token valid for 48 hours
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await db.insert(passwordTokens).values({ accountId: created.id, token, expiresAt });

  // Build the setup URL — use FRONTEND_ORIGIN env var
  const frontendUrl = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const setupUrl = `${frontendUrl}?setup=${token}`;

  // Send invite email
  await sendInviteEmail(name, email.trim().toLowerCase(), setupUrl);

  res.status(201).json({ ...sanitize(created), setupUrl });
});

// GET /api/accounts/setup/:token — verify a setup token (used by frontend)
router.get("/setup/:token", async (req, res) => {
  const [row] = await db.select().from(passwordTokens).where(eq(passwordTokens.token, req.params.token));
  if (!row) return res.status(404).json({ error: "Invalid or expired link" });
  if (row.used) return res.status(410).json({ error: "This link has already been used" });
  if (new Date() > new Date(row.expiresAt)) return res.status(410).json({ error: "This link has expired — ask an Admin to re-invite you" });
  const [account] = await db.select().from(accounts).where(eq(accounts.id, row.accountId));
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json({ name: account.name, email: account.email });
});

// POST /api/accounts/setup/:token — set password via invite link
router.post("/setup/:token", async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const [row] = await db.select().from(passwordTokens).where(eq(passwordTokens.token, req.params.token));
  if (!row || row.used || new Date() > new Date(row.expiresAt)) {
    return res.status(410).json({ error: "This link is invalid or has expired" });
  }
  const passwordHash = await hashPassword(password);
  await db.update(accounts).set({ passwordHash }).where(eq(accounts.id, row.accountId));
  await db.update(passwordTokens).set({ used: true }).where(eq(passwordTokens.id, row.id));
  const [account] = await db.select().from(accounts).where(eq(accounts.id, row.accountId));
  const token = signToken(account);
  res.json({ token, account: sanitize(account) });
});

// PUT /api/accounts/:id
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  const [updated] = await db.update(accounts).set({ ...(name && { name }), ...(role && { role }) }).where(eq(accounts.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Account not found" });
  res.json(sanitize(updated));
});

// PUT /api/accounts/:id/password
router.put("/:id/password", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (req.user.id !== targetId && req.user.role !== "Admin") return res.status(403).json({ error: "You can only change your own password" });
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
