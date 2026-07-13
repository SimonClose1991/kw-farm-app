import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { accounts } from "./db/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-in-production";
const TOKEN_EXPIRY = "30d"; // long-lived so "stay logged in" works without re-auth

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(account) {
  return jwt.sign(
    { id: account.id, email: account.email, role: account.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Express middleware: requires a valid Bearer token, attaches req.user
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired session" });
  req.user = payload;
  next();
}

// Look up the account's CURRENT role from the database. Tokens embed the role
// at login and live for 30 days — without this, a promoted user keeps getting
// rejected (and a demoted user keeps editing) until they log out and back in.
async function currentRole(req) {
  try {
    const [account] = await db.select({ role: accounts.role }).from(accounts).where(eq(accounts.id, req.user.id));
    return account ? account.role : null; // null = account deleted
  } catch {
    return req.user.role; // DB hiccup — fall back to the token claim
  }
}

// Express middleware: requires Admin or Manager role (matches canEdit in the app)
export function requireEditor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  currentRole(req).then((role) => {
    if (role === null) return res.status(401).json({ error: "Account no longer exists" });
    req.user.role = role; // keep downstream handlers accurate
    if (role !== "Admin" && role !== "Manager") {
      return res.status(403).json({ error: "You don't have permission to make changes" });
    }
    next();
  });
}

// Express middleware: requires Admin role only
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  currentRole(req).then((role) => {
    if (role === null) return res.status(401).json({ error: "Account no longer exists" });
    req.user.role = role;
    if (role !== "Admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}
