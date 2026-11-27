// A copy of the feed mix (ingredients + buffer) as it is at the moment a feed run is saved, stored
// with that run. Commodity usage is worked out from it later, so changing the mix in Settings never
// rewrites the totals of runs that were already fed.
export const mixSnapshot = (settingsRow) => ({
  ingredients: (Array.isArray(settingsRow?.ingredients) ? settingsRow.ingredients : [])
    .map((i) => ({ name: String(i?.name ?? "").trim(), kgPerHead: Number(i?.kgPerHead) || 0 }))
    .filter((i) => i.name),
  bufferPercent: Number(settingsRow?.bufferPercent ?? 0) || 0,
});
