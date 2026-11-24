// Carries out a CONFIRMED assistant card. Each branch makes the same changes, with the same history
// wording, as the matching button in the app (submitAction / onSplit / onMoveAll in App.jsx), so a
// record made by the assistant looks and behaves exactly like one made by hand — plus " · via assistant".
// The server already refused to build a card that doesn't fit the data; here we re-read the mob first
// so a card that went stale (someone else changed the count meanwhile) is refused instead of applied.
import { treatmentPatch, parseDays } from "./withholding.js";

const VIA = " · via assistant";
const hist = (action, detail, date) => ({ action, detail: detail + VIA, date });

async function freshMob(api, card) {
  const list = await api.listMobs(card.farm);
  const mob = list.find((m) => Number(m.id) === Number(card.data.mobId));
  if (!mob) throw new Error("That mob has changed or been archived — ask me again.");
  return { mob, list };
}
const stale = (what, mob) => new Error(`${mob.name} now has ${mob.count} head, so ${what} no longer fits — ask me again.`);

export async function executeProposal(card, { api }) {
  const d = card.data;
  switch (card.type) {
    case "death": {
      const { mob } = await freshMob(api, card);
      if (d.count > mob.count) throw stale(`${d.count} deaths`, mob);
      const left = Math.max(0, mob.count - d.count);
      await api.updateMob(mob.id, { count: left });
      await api.addMobHistory(mob.id, hist("Death", `Number of deaths: ${d.count}${d.cause ? `, Cause: ${d.cause}` : ""}, Date: ${d.date}`, d.date));
      return `Recorded ${d.count} death${d.count > 1 ? "s" : ""} — ${mob.name} now ${left} head.`;
    }
    case "recount": {
      const { mob } = await freshMob(api, card);
      if (d.newCount === 0) {
        await api.addMobHistory(mob.id, hist("Recount", "Recounted to 0 — mob archived", d.date));
        await api.archiveMob(mob.id);
        return `${mob.name} recounted to 0 and archived (Menu → Archived mobs to restore).`;
      }
      await api.updateMob(mob.id, { count: d.newCount });
      await api.addMobHistory(mob.id, hist("Recount", `New head count: ${d.newCount}`, d.date));
      return `${mob.name} recounted: ${mob.count} → ${d.newCount} head.`;
    }
    case "move": {
      const { mob } = await freshMob(api, card);
      await api.updateMob(mob.id, { paddock: d.toPaddock, daysInPaddock: 0 });
      await api.addMobHistory(mob.id, hist("Move", `Moved from ${mob.paddock} to ${d.toPaddock}`, d.date));
      return `${mob.name} moved to ${d.toPaddock}.`;
    }
    case "split": {
      const { mob, list } = await freshMob(api, card);
      if (d.count >= mob.count) throw stale(`splitting off ${d.count}`, mob);
      const remaining = mob.count - d.count;
      await api.updateMob(mob.id, { count: remaining });
      await api.addMobHistory(mob.id, hist("Move", `Split: ${d.count} head moved to ${d.toPaddock}, ${remaining} remain in ${mob.paddock}`, d.date));
      // Same mob already holds a portion in the target paddock? Merge the numbers (as the paddock sheet does)
      const existing = list.find((m) => m.id !== mob.id && m.paddock === d.toPaddock && m.name === mob.name && m.species === mob.species);
      if (existing) {
        await api.updateMob(existing.id, { count: Number(existing.count) + d.count, daysInPaddock: 0 });
        await api.addMobHistory(existing.id, hist("Move", `Received ${d.count} head split from ${mob.paddock}`, d.date));
      } else {
        // Identical mob — same name and details, a portion in another paddock, with the full history copied
        const { id: _id, farmId: _f, createdAt: _c, updatedAt: _u, ...rest } = mob;
        const created = await api.createMob(card.farm, { ...rest, count: d.count, paddock: d.toPaddock, daysInPaddock: 0 });
        try { await api.copyMobHistory(created.id, mob.id); } catch { /* history copy is best-effort, as in the app */ }
        await api.addMobHistory(created.id, hist("Move", `Split ${d.count} head from ${mob.paddock}`, d.date));
      }
      return `${d.count} head split off ${mob.name} to ${d.toPaddock}; ${remaining} remain in ${mob.paddock}.`;
    }
    case "sale": {
      const { mob } = await freshMob(api, card);
      if (d.count > mob.count) throw stale(`selling ${d.count}`, mob);
      const left = Math.max(0, mob.count - d.count);
      await api.updateMob(mob.id, { count: left });
      await api.addMobHistory(mob.id, hist("Sale", `Number sold: ${d.count}${d.price != null ? `, Sale price ($/hd): ${d.price}` : ""}`, d.date));
      return `Sale recorded — ${d.count} sold, ${mob.name} now ${left} head.`;
    }
    case "weigh": {
      const { mob } = await freshMob(api, card);
      await api.updateMob(mob.id, { lastWeight: d.avgKg, lastWeightDate: d.date });
      await api.addMobHistory(mob.id, hist("Weigh", `Average weight (kg): ${d.avgKg}, Date: ${d.date}`, d.date));
      return `${mob.name} weigh recorded: ${d.avgKg} kg average.`;
    }
    case "treat": {
      const { mob } = await freshMob(api, card);
      const inv = await api.listTreatments(card.farm);
      const items = d.inventoryIds.map((id) => inv.find((i) => Number(i.id) === Number(id))).filter(Boolean);
      if (items.length !== d.inventoryIds.length) throw new Error("A product on that card is no longer in the inventory — ask me again.");
      // Longest withholding wins when several products are given together
      const meatDays = Math.max(0, ...items.map((i) => parseDays(i.withholdingMeat)));
      const esiDays = Math.max(0, ...items.map((i) => parseDays(i.withholdingESI)));
      const woolDays = Math.max(0, ...items.map((i) => parseDays(i.withholdingWool)));
      const names = items.map((i) => i.title).join(", ");
      const patch = {
        lastTreatDate: d.date, whpDays: meatDays, esiDays,
        ...treatmentPatch(mob, { date: d.date, meatDays, esiDays, woolDays, productNames: names }),
      };
      await api.updateMob(mob.id, patch);
      const doseLines = [];
      if (d.totalUsed != null && items.length === 1) {
        const it = items[0];
        const parts = [`${d.totalUsed} ${d.unit} used`];
        if (it.batchNumber) parts.push(`Batch ${it.batchNumber}`);
        if (it.expiryDate) parts.push(`Exp ${it.expiryDate}`);
        doseLines.push(`↳ ${it.title} — ${parts.join(" · ")}`);
        // Deduct from stock, converting between mL/L and g/kg as the app does
        let used = Number(d.totalUsed);
        const entry = String(d.unit || it.containerUnit || "mL").toLowerCase();
        const stockUnit = String(it.containerUnit || "mL").toLowerCase();
        if (entry !== stockUnit) {
          if ((entry === "ml" && stockUnit === "l") || (entry === "g" && stockUnit === "kg")) used /= 1000;
          else if ((entry === "l" && stockUnit === "ml") || (entry === "kg" && stockUnit === "g")) used *= 1000;
        }
        await api.updateTreatment(it.id, { quantityUsed: String((Number(it.quantityUsed) || 0) + used) });
      }
      const summary = `Treated: ${names}${meatDays ? ` · WHP ${meatDays}d` : ""}${esiDays ? ` · ESI ${esiDays}d` : ""}${woolDays ? ` · Wool WHP ${woolDays}d` : ""}${d.notes ? ` · ${d.notes}` : ""}${doseLines.length ? "\n" + doseLines.join("\n") : ""}`;
      await api.addMobHistory(mob.id, hist("Treat", summary, d.date));
      return `${mob.name} treated with ${names}${meatDays ? ` — meat WHP ${meatDays} days` : ""}.`;
    }
    case "rainfall": {
      await api.addRainfall(d.farm, d.date, d.mm);
      return `Logged ${d.mm} mm of rain at ${d.farm}.`;
    }
    default:
      throw new Error("I don't know how to do that one yet.");
  }
}
