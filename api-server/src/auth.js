import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

// Express middleware: requires Admin or Manager role (matches canEdit in the app)
export function requireEditor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.role !== "Admin" && req.user.role !== "Manager") {
    return res.status(403).json({ error: "You don't have permission to make changes" });
  }
  next();
}

// Express middleware: requires Admin role only
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
