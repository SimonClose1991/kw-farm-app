/* Weekly planner — change tracking (loaded by workflow.html as window.WFSync).
 *
 * The planner keeps `base` (what the server last told it) next to `local` (what's on screen).
 * Saving sends only the DIFFERENCE, and refreshing merges the server's copy into the screen
 * without touching anything that's been changed here and not saved yet. No browser or DOM code in
 * here, so it can be tested on its own.
 *
 * A "state" is { tasks, recurTemplates, staff, staffDetails, colors, prefs }.
 */
(function (root) {
  "use strict";

  var clone = function (x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var key = function (id) { return String(id); };
  var arr = function (v) { return Array.isArray(v) ? v : []; };
  var isObj = function (v) { return v && typeof v === "object" && !Array.isArray(v); };

  function toMap(list) {
    var m = new Map();
    arr(list).forEach(function (t) { m.set(key(t.id), t); });
    return m;
  }

  // ── what changed in a list of jobs (or weekly templates) ──
  function listOps(baseList, localList, withOrder) {
    var bm = toMap(baseList), lm = toMap(localList);
    var upsert = arr(localList).filter(function (t) {
      var b = bm.get(key(t.id));
      return b === undefined || !same(b, t);
    });
    var del = [];
    bm.forEach(function (b, k) { if (!lm.has(k)) del.push(b.id); });
    var order = null;
    if (withOrder) {
      var bOrder = arr(baseList).map(function (t) { return key(t.id); }).filter(function (k) { return lm.has(k); });
      var lOrder = arr(localList).map(function (t) { return key(t.id); }).filter(function (k) { return bm.has(k); });
      if (bOrder.join("|") !== lOrder.join("|")) order = arr(localList).map(function (t) { return t.id; });
    }
    return { upsert: upsert, delete: del, order: order };
  }

  function computeOps(base, local) {
    base = base || {}; local = local || {};
    var ops = {};
    var t = listOps(base.tasks, local.tasks, true);
    if (t.upsert.length || t.delete.length || t.order) ops.tasks = t;
    var r = listOps(base.recurTemplates, local.recurTemplates, false);
    if (r.upsert.length || r.delete.length) ops.recurTemplates = { upsert: r.upsert, delete: r.delete };

    var bs = arr(base.staff), ls = arr(local.staff);
    var add = ls.filter(function (n) { return bs.indexOf(n) < 0; });
    var rem = bs.filter(function (n) { return ls.indexOf(n) < 0; });
    if (add.length || rem.length) ops.staff = { add: add, remove: rem };

    var bd = isObj(base.staffDetails) ? base.staffDetails : {}, ld = isObj(local.staffDetails) ? local.staffDetails : {};
    var set = {}, anySet = false, removeD = [];
    Object.keys(ld).forEach(function (n) { if (!same(bd[n], ld[n])) { set[n] = ld[n]; anySet = true; } });
    Object.keys(bd).forEach(function (n) { if (!(n in ld)) removeD.push(n); });
    if (anySet || removeD.length) ops.staffDetails = { set: set, remove: removeD };

    if (local.colors && !same(base.colors, local.colors)) ops.colors = local.colors;
    if (isObj(local.prefs) && !same(base.prefs, local.prefs)) ops.prefs = local.prefs;
    return ops;
  }

  function hasChanges(ops) {
    return !!(ops && (ops.publish || ops.tasks || ops.recurTemplates || ops.staff || ops.staffDetails || ops.colors || ops.prefs));
  }

  // ── pretend the server has just accepted `ops`: move `base` forward by exactly those changes ──
  function applyList(list, ops) {
    var out = arr(list).slice();
    var del = new Set(arr(ops.delete).map(key));
    out = out.filter(function (t) { return !del.has(key(t.id)); });
    var pos = new Map(); out.forEach(function (t, i) { pos.set(key(t.id), i); });
    arr(ops.upsert).forEach(function (item) {
      var i = pos.get(key(item.id));
      if (i !== undefined) out[i] = clone(item);
      else { pos.set(key(item.id), out.length); out.push(clone(item)); }
    });
    if (ops.order) {
      var byId = toMap(out), wanted = [], seen = new Set();
      ops.order.forEach(function (id) { var k = key(id); if (byId.has(k) && !seen.has(k)) { wanted.push(byId.get(k)); seen.add(k); } });
      out = wanted.concat(out.filter(function (t) { return !seen.has(key(t.id)); }));
    }
    return out;
  }

  function applyOpsToBase(base, ops) {
    var b = clone(base) || {};
    b.tasks = applyList(b.tasks, ops.tasks || {});
    b.recurTemplates = applyList(b.recurTemplates, ops.recurTemplates || {});
    if (ops.staff) {
      var rm = new Set(ops.staff.remove || []);
      b.staff = arr(b.staff).filter(function (n) { return !rm.has(n); });
      (ops.staff.add || []).forEach(function (n) { if (b.staff.indexOf(n) < 0) b.staff.push(n); });
    }
    if (ops.staffDetails) {
      b.staffDetails = Object.assign({}, b.staffDetails, clone(ops.staffDetails.set || {}));
      (ops.staffDetails.remove || []).forEach(function (n) { delete b.staffDetails[n]; });
    }
    if (ops.colors) b.colors = clone(ops.colors);
    if (ops.prefs) b.prefs = clone(ops.prefs);
    return b;
  }

  // ── bring the server's copy onto the screen WITHOUT losing anything changed here ──
  // Three-way: for each job, if this screen hasn't touched it, take the server's version (or its
  // deletion); if this screen HAS touched it, keep ours — it goes out on the next save.
  function mergeList(base, local, server, withOrder) {
    var bm = toMap(base), lm = toMap(local), sm = toMap(server);
    var nb = new Map(bm);
    var result = new Map();
    var ids = new Set();
    bm.forEach(function (_, k) { ids.add(k); }); lm.forEach(function (_, k) { ids.add(k); }); sm.forEach(function (_, k) { ids.add(k); });

    ids.forEach(function (k) {
      var b = bm.get(k), l = lm.get(k), s = sm.get(k);
      var localTouched = !(b === undefined && l === undefined) && !(b !== undefined && l !== undefined && same(b, l));
      if (!localTouched) {
        // nothing changed here: follow the server
        if (s === undefined) { nb.delete(k); } else { result.set(k, s); nb.set(k, s); }
      } else if (l !== undefined) {
        result.set(k, l);               // we changed or added it: ours wins, still to be sent
      } // we deleted it: stays deleted, the delete is still to be sent
    });

    var localOrder = arr(local).map(function (t) { return key(t.id); }).filter(function (k) { return result.has(k); });
    var ordered;
    var baseRel = arr(base).map(function (t) { return key(t.id); }).filter(function (k) { return lm.has(k); });
    var localRel = arr(local).map(function (t) { return key(t.id); }).filter(function (k) { return bm.has(k); });
    var orderChanged = withOrder && baseRel.join("|") !== localRel.join("|");
    if (orderChanged) {
      // we re-ordered: keep our order, anything new from the server goes at the end
      ordered = localOrder.concat(arr(server).map(function (t) { return key(t.id); }).filter(function (k) { return result.has(k) && localOrder.indexOf(k) < 0; }));
    } else {
      // follow the server's order, with jobs only we have (not yet saved) at the end
      var serverOrder = arr(server).map(function (t) { return key(t.id); }).filter(function (k) { return result.has(k); });
      ordered = serverOrder.concat(localOrder.filter(function (k) { return serverOrder.indexOf(k) < 0; }));
    }
    var seen = new Set();
    var out = [];
    ordered.forEach(function (k) { if (!seen.has(k)) { seen.add(k); out.push(result.get(k)); } });
    result.forEach(function (v, k) { if (!seen.has(k)) out.push(v); });
    // base keeps the server's order for the jobs it knows
    var nbOrdered = arr(server).map(function (t) { return key(t.id); }).filter(function (k) { return nb.has(k); });
    nb.forEach(function (_, k) { if (nbOrdered.indexOf(k) < 0) nbOrdered.push(k); });
    return { list: out, base: nbOrdered.map(function (k) { return nb.get(k); }) };
  }

  function mergeValue(base, local, server) {
    // untouched here -> take the server's; changed here -> keep ours (it will be sent)
    if (same(base, local)) return { value: server === undefined ? local : server, base: server === undefined ? base : server };
    return { value: local, base: base };
  }

  function mergeRemote(base, local, server) {
    base = base || {}; local = local || {}; server = server || {};
    var t = mergeList(base.tasks, local.tasks, server.tasks, true);
    var r = mergeList(base.recurTemplates, local.recurTemplates, server.recurTemplates, false);
    var out = clone(local) || {}, nb = clone(base) || {};
    out.tasks = clone(t.list); nb.tasks = clone(t.base);
    out.recurTemplates = clone(r.list); nb.recurTemplates = clone(r.base);

    // staff: take the server's roster unless we've added/removed someone here
    var s = mergeValue(arr(base.staff), arr(local.staff), server.staff === undefined ? undefined : arr(server.staff));
    out.staff = clone(s.value); nb.staff = clone(s.base);

    // staff names: per person
    var bd = isObj(base.staffDetails) ? base.staffDetails : {}, ld = isObj(local.staffDetails) ? local.staffDetails : {}, sd = isObj(server.staffDetails) ? server.staffDetails : {};
    var od = {}, nd = {};
    var people = new Set(Object.keys(bd).concat(Object.keys(ld), Object.keys(sd)));
    people.forEach(function (n) {
      if (same(bd[n], ld[n])) { if (sd[n] !== undefined) { od[n] = sd[n]; nd[n] = sd[n]; } }
      else { if (ld[n] !== undefined) od[n] = ld[n]; if (bd[n] !== undefined) nd[n] = bd[n]; }
    });
    out.staffDetails = clone(od); nb.staffDetails = clone(nd);

    var c = mergeValue(base.colors, local.colors, server.colors === null ? undefined : server.colors);
    out.colors = clone(c.value); nb.colors = clone(c.base);
    var p = mergeValue(base.prefs, local.prefs, server.prefs === undefined ? undefined : Object.assign({}, local.prefs, server.prefs));
    out.prefs = clone(p.value); nb.prefs = clone(p.base);
    return { local: out, base: nb };
  }

  // seconds to wait before retrying a failed save: 2, 5, 10, 20, then every 30
  function retryDelay(attempt) {
    var steps = [2, 5, 10, 20];
    return (attempt < steps.length ? steps[attempt] : 30) * 1000;
  }

  var api = { computeOps: computeOps, hasChanges: hasChanges, applyOpsToBase: applyOpsToBase, mergeRemote: mergeRemote, retryDelay: retryDelay };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WFSync = api;
})(typeof window !== "undefined" ? window : globalThis);
