// HTTP side of the assistant: auth, who-can-see-what, limits, then hands over to engine.js.
// Built as a factory so tests can supply a throwaway database and a fake Claude client.
import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { accounts, farms, mobs } from "../db/schema.js";
import { requireAuth } from "../auth.js";
import { runAssistant } from "./engine.js";

const MAX_MESSAGES = 14;
const MAX_CHARS = 2000;

export const melbourneToday = (now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });

export function assistantRouter({ db, getClient, env = process.env, now = () => new Date() }) {
  const router = Router();
  const usageByDay = new Map();   // "userId:yyyy-mm-dd" -> requests so far (resets on restart — a cost guard, not a ledger)

  // Who is asking: role and the farms they may see (empty list on the account = all farms)
  async function whoIs(req) {
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, req.user.id));
    if (!acc) return null;
    let allowed = [];
    try { allowed = JSON.parse(acc.allowedFarms || "[]"); } catch { allowed = []; }
    const all = await db.select().from(farms);
    const visible = Array.isArray(allowed) && allowed.length ? all.filter((f) => allowed.includes(f.name)) : all;
    return { account: acc, farms: visible.map((f) => ({ id: f.id, name: f.name })), canAct: acc.role === "Admin" || acc.role === "Manager" };
  }

  router.get("/status", requireAuth, async (req, res) => {
    const who = await whoIs(req).catch(() => null);
    if (!who) return res.status(401).json({ error: "Account no longer exists" });
    res.json({ enabled: !!env.ANTHROPIC_API_KEY, canAct: who.canAct });
  });

  router.post("/chat", requireAuth, async (req, res) => {
    try {
      if (!env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "The assistant isn't set up yet — the API key hasn't been added on the server." });
      const who = await whoIs(req);
      if (!who) return res.status(401).json({ error: "Account no longer exists" });

      // Messages: text only, last few turns, must start and end with the user
      const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
      let messages = raw
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
        .slice(-MAX_MESSAGES);
      while (messages.length && messages[0].role !== "user") messages.shift();
      if (!messages.length || messages[messages.length - 1].role !== "user") return res.status(400).json({ error: "Say something first" });

      // Per-person daily cap
      const today = melbourneToday(now());
      const key = `${req.user.id}:${today}`;
      const used = usageByDay.get(key) || 0;
      const limit = Number(env.ASSISTANT_DAILY_LIMIT) || 200;
      if (used >= limit) return res.status(429).json({ error: "That's the daily limit for the assistant — it resets tomorrow." });
      usageByDay.set(key, used + 1);
      for (const k of usageByDay.keys()) if (!k.endsWith(`:${today}`)) usageByDay.delete(k);

      // What the user has open (only trusted if it's inside a farm they can see)
      const c = req.body?.context || {};
      const context = {};
      if (typeof c.farm === "string" && who.farms.some((f) => f.name === c.farm)) context.farm = c.farm;
      if (typeof c.paddockName === "string") context.paddockName = c.paddockName.slice(0, 80);
      if (Number.isInteger(Number(c.mobId)) && who.farms.length) {
        const [m] = await db.select().from(mobs).where(and(eq(mobs.id, Number(c.mobId)), inArray(mobs.farmId, who.farms.map((f) => f.id))));
        if (m) context.mob = { id: m.id, name: m.name, count: m.count, paddock: m.paddock, farm: who.farms.find((f) => f.id === m.farmId)?.name };
      }

      const out = await runAssistant({
        client: getClient(), model: env.ASSISTANT_MODEL || "claude-opus-5-5", effort: env.ASSISTANT_EFFORT || "medium",
        messages, ctx: { db, farms: who.farms, today }, canAct: who.canAct,
        user: { name: who.account.name, role: who.account.role }, context,
      });
      res.json({ reply: out.reply, proposals: who.canAct ? out.proposals : [], usage: out.usage });
    } catch (err) {
      const status = Number(err?.status) || 0;
      console.error("assistant chat error:", status || "", err?.message || err);
      if (status === 401 || status === 403) return res.status(503).json({ error: "The assistant's API key was rejected — check it on the server." });
      if (status === 429) return res.status(429).json({ error: "The assistant is busy right now — try again in a minute." });
      res.status(502).json({ error: "The assistant couldn't answer just now — try again." });
    }
  });

  return router;
}
