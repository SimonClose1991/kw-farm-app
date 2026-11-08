// Weekly workflow planner storage.
//
// The planner used to save by sending its WHOLE job list, which the server stored over the
// top of whatever was there — so any screen that was out of date (or had a failed save, or
// was left open) could wipe jobs added elsewhere. Now a screen sends only what it CHANGED
// (jobs added/edited, ids deleted, new order, publish) and the server applies that to its
// current list inside a row lock. Nothing a screen doesn't mention can be touched.
import { sql, eq } from "drizzle-orm";
import { workflowState } from "./db/schema.js";

export class WorkflowError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const bad = (m) => new WorkflowError(m, 400);

const clone = (x) => JSON.parse(JSON.stringify(x));
const arr = (v) => (Array.isArray(v) ? v : []);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const key = (id) => String(id);

export const emptyState = () => ({ tasks: [], published: [], staff: [], prefs: {}, recurTemplates: [], colors: null, staffDetails: {} });

// ── validate what a screen sends ─────────────────────────────────────────────
const MAX_ITEMS = 5000;
function listOps(raw, label, allowOrder) {
  if (raw === undefined || raw === null) return { upsert: [], delete: [], order: null };
  if (!isObj(raw)) throw bad(`${label} changes must be an object`);
  const upsert = arr(raw.upsert), del = arr(raw.delete);
  if (upsert.length > MAX_ITEMS || del.length > MAX_ITEMS) throw bad(`Too many ${label} changes at once`);
  for (const t of upsert) {
    if (!isObj(t) || t.id === undefined || t.id === null || t.id === "") throw bad(`Every ${label} needs an id`);
  }
  let order = null;
  if (allowOrder && raw.order !== undefined && raw.order !== null) {
    if (!Array.isArray(raw.order) || raw.order.length > 4 * MAX_ITEMS) throw bad("Invalid job order");
    order = raw.order;
  }
  return { upsert, delete: del, order };
}
export function sanitizeOps(ops) {
  if (!isObj(ops)) throw bad("Nothing to save");
  const staff = isObj(ops.staff) ? ops.staff : {};
  const details = isObj(ops.staffDetails) ? ops.staffDetails : {};
  const names = (v) => arr(v).map((n) => String(n).trim().slice(0, 100)).filter(Boolean);
  if (ops.colors !== undefined && ops.colors !== null && (!Array.isArray(ops.colors) || ops.colors.length > 100)) throw bad("Invalid categories");
  if (ops.prefs !== undefined && ops.prefs !== null && !isObj(ops.prefs)) throw bad("Invalid preferences");
  return {
    tasks: listOps(ops.tasks, "job", true),
    recurTemplates: listOps(ops.recurTemplates, "weekly template", false),
    publish: ops.publish === true,
    staffAdd: names(staff.add), staffRemove: names(staff.remove),
    detailsSet: isObj(details.set) ? details.set : {}, detailsRemove: names(details.remove),
    colors: Array.isArray(ops.colors) ? ops.colors : null,
    prefs: isObj(ops.prefs) ? ops.prefs : null,
  };
}

// ── apply them to the current state (pure) ───────────────────────────────────
function applyList(list, ops) {
  const out = arr(list).slice();
  const del = new Set(ops.delete.map(key));
  let result = out.filter((t) => !del.has(key(t.id)));
  const pos = new Map(result.map((t, i) => [key(t.id), i]));
  for (const item of ops.upsert) {
    const i = pos.get(key(item.id));
    if (i !== undefined) result[i] = item;
    else { pos.set(key(item.id), result.length); result.push(item); }
  }
  if (ops.order) {
    const byId = new Map(result.map((t) => [key(t.id), t]));
    const wanted = [];
    const seen = new Set();
    for (const id of ops.order) { const k = key(id); if (byId.has(k) && !seen.has(k)) { wanted.push(byId.get(k)); seen.add(k); } }
    // jobs somebody else added that this screen didn't know about keep their place at the end
    result = [...wanted, ...result.filter((t) => !seen.has(key(t.id)))];
  }
  return result;
}

export function applySync(state, rawOps) {
  const ops = sanitizeOps(rawOps);
  const s = clone({ ...emptyState(), ...state });
  s.tasks = applyList(s.tasks, ops.tasks);
  s.recurTemplates = applyList(s.recurTemplates, ops.recurTemplates);
  const removed = new Set(ops.staffRemove);
  s.staff = [...arr(s.staff).filter((n) => !removed.has(n)), ...ops.staffAdd.filter((n) => !arr(s.staff).includes(n) && !removed.has(n))];
  s.staffDetails = { ...(isObj(s.staffDetails) ? s.staffDetails : {}), ...ops.detailsSet };
  for (const n of ops.detailsRemove) delete s.staffDetails[n];
  if (ops.colors) s.colors = ops.colors;
  if (ops.prefs) s.prefs = { ...(isObj(s.prefs) ? s.prefs : {}), ...ops.prefs };
  // Publishing snapshots the server's own, merged list — never the sender's copy
  if (ops.publish) s.published = clone(s.tasks);
  return s;
}

// ── database (every function takes `db` so it can be tested on a throwaway Postgres) ──
const rowsOf = (res) => (Array.isArray(res) ? res : res?.rows || []);

function fromRow(r) {
  return {
    tasks: arr(r?.tasks), published: arr(r?.published), staff: arr(r?.staff),
    prefs: isObj(r?.prefs) ? r.prefs : {}, recurTemplates: arr(r?.recurTemplates),
    colors: Array.isArray(r?.colors) ? r.colors : null,
    staffDetails: isObj(r?.staffDetails) ? r.staffDetails : {},
    updatedAt: r?.updatedAt || null,
  };
}

export async function loadState(db) {
  const [row] = await db.select().from(workflowState).where(eq(workflowState.id, "singleton"));
  return fromRow(row);
}

// Runs `fn(state) -> newState | null` with the planner row locked, so two screens saving at the
// same moment queue up instead of overwriting each other.
async function withLockedState(db, fn) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`INSERT INTO workflow_state (id) VALUES ('singleton') ON CONFLICT (id) DO NOTHING`);
    rowsOf(await tx.execute(sql`SELECT id FROM workflow_state WHERE id = 'singleton' FOR UPDATE`));
    const [row] = await tx.select().from(workflowState).where(eq(workflowState.id, "singleton"));
    const next = fn(fromRow(row));
    if (!next) return fromRow(row);
    await tx.update(workflowState).set({
      tasks: next.tasks, published: next.published, staff: next.staff, prefs: next.prefs,
      recurTemplates: next.recurTemplates, colors: next.colors, staffDetails: next.staffDetails, updatedAt: new Date(),
    }).where(eq(workflowState.id, "singleton"));
    return { ...next, updatedAt: new Date() };
  });
}

export function syncState(db, ops) {
  sanitizeOps(ops); // bad input is refused before any database work
  return withLockedState(db, (s) => applySync(s, ops));
}

// Ticking a job done — anyone can do this, and it touches nothing but that one flag
export function setDone(db, id, completed) {
  return withLockedState(db, (s) => {
    let found = false;
    const mark = (list) => list.map((t) => (key(t.id) === key(id) ? (found = true, { ...t, completed: !!completed }) : t));
    const next = { ...s, tasks: mark(s.tasks), published: mark(s.published) };
    if (!found) throw new WorkflowError("That job no longer exists", 404);
    return next;
  });
}

// Add one job without disturbing the rest (used when a field note is turned into a task)
export function appendTask(db, task) {
  if (!isObj(task) || task.id === undefined || task.id === null || !task.content) throw bad("Task must have id and content");
  return withLockedState(db, (s) => applySync(s, { tasks: { upsert: [task] } }));
}
