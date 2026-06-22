// Thin fetch wrapper for talking to the Kurra-Wirra API.
// All farm data (mobs, paddocks, accounts, inventory, etc.) lives in Postgres via this API
// instead of local React state, so every device sees the same live data.

const API_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:3001/api";

let authToken = null;
const hasLocalStorage = typeof localStorage !== "undefined";
export function setAuthToken(token) {
  authToken = token;
  if (!hasLocalStorage) return;
  if (token) localStorage.setItem("kw_token", token);
  else localStorage.removeItem("kw_token");
}
export function getStoredToken() {
  if (!hasLocalStorage) return null;
  return localStorage.getItem("kw_token");
}
// Restore token from storage on module load (page refresh / new tab)
authToken = getStoredToken();

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error("Couldn't reach the server — check your connection.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. empty response) — fine for some endpoints
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // --- Auth ---
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),

  // --- Accounts ---
  listAccounts: () => request("/accounts"),
  inviteAccount: (account) => request("/accounts", { method: "POST", body: JSON.stringify(account) }),
  updateAccount: (id, fields) => request(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
  changePassword: (id, password) => request(`/accounts/${id}/password`, { method: "PUT", body: JSON.stringify({ password }) }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: "DELETE" }),

  // --- Farms ---
  listFarms: () => request("/farms"),

  // --- Mobs ---
  listMobs: (farm) => request(`/mobs?farm=${encodeURIComponent(farm)}`),
  createMob: (farm, fields) => request("/mobs", { method: "POST", body: JSON.stringify({ farm, ...fields }) }),
  updateMob: (id, fields) => request(`/mobs/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
  deleteMob: (id) => request(`/mobs/${id}`, { method: "DELETE" }),
  transferMob: (id, toFarm, count, date) => request(`/mobs/${id}/transfer`, { method: "POST", body: JSON.stringify({ toFarm, count, date }) }),
  listMobHistory: (id) => request(`/mobs/${id}/history`),
  addMobHistory: (id, entry) => request(`/mobs/${id}/history`, { method: "POST", body: JSON.stringify(entry) }),
  listMobNotes: (id) => request(`/mobs/${id}/notes`),
  addMobNote: (id, text, authorName) => request(`/mobs/${id}/notes`, { method: "POST", body: JSON.stringify({ text, authorName }) }),
  deleteMobNote: (id, noteId) => request(`/mobs/${id}/notes/${noteId}`, { method: "DELETE" }),

  // --- Paddocks ---
  listPaddocks: (farm) => request(`/paddocks?farm=${encodeURIComponent(farm)}`),
  createPaddock: (farm, fields) => request("/paddocks", { method: "POST", body: JSON.stringify({ farm, ...fields }) }),
  updatePaddock: (id, fields) => request(`/paddocks/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
  deletePaddock: (id) => request(`/paddocks/${id}`, { method: "DELETE" }),

  // --- Landmarks ---
  listLandmarks: (farm) => request(`/landmarks?farm=${encodeURIComponent(farm)}`),
  createLandmark: (farm, fields) => request("/landmarks", { method: "POST", body: JSON.stringify({ farm, ...fields }) }),
  updateLandmark: (id, fields) => request(`/landmarks/${id}`, { method: "PUT", body: JSON.stringify(fields) }),
  deleteLandmark: (id) => request(`/landmarks/${id}`, { method: "DELETE" }),

  // --- Inventory ---
  listTreatments: (farm) => request(`/inventory/treatments?farm=${encodeURIComponent(farm)}`),
  addTreatment: (farm, fields) => request("/inventory/treatments", { method: "POST", body: JSON.stringify({ farm, ...fields }) }),
  deleteTreatment: (id) => request(`/inventory/treatments/${id}`, { method: "DELETE" }),
  listSprayInventory: (farm) => request(`/inventory/spray?farm=${encodeURIComponent(farm)}`),
  addSprayInventory: (farm, fields) => request("/inventory/spray", { method: "POST", body: JSON.stringify({ farm, ...fields }) }),
  deleteSprayInventory: (id) => request(`/inventory/spray/${id}`, { method: "DELETE" }),

  // --- Feed on Offer ---
  listFoo: (farm) => request(`/foo?farm=${encodeURIComponent(farm)}`),
  addFoo: (farm, fields) => request("/foo", { method: "POST", body: JSON.stringify({ farm, ...fields }) }),

  // --- Rainfall ---
  listRainfall: (farm) => request(`/rainfall?farm=${encodeURIComponent(farm)}`),
  addRainfall: (farm, date, mm) => request("/rainfall", { method: "POST", body: JSON.stringify({ farm, date, mm }) }),

  // --- Breeds ---
  listBreeds: () => request("/breeds"),
  addBreed: (species, breed) => request("/breeds", { method: "POST", body: JSON.stringify({ species, breed }) }),

  // --- Account setup (invite link) ---
  verifySetupToken: (token) => request(`/accounts/setup/${token}`),
  completeSetup: (token, password) => request(`/accounts/setup/${token}`, { method: "POST", body: JSON.stringify({ password }) }),

  // --- Records ---
  listAllMobHistory: (farm) => request(`/mobs/history?farm=${encodeURIComponent(farm)}`),

  // --- Workflow ---
  getWorkflow: () => request("/workflow"),
  saveWorkflow: (state) => request("/workflow", { method: "PUT", body: JSON.stringify(state) }),
  getPublishedTasks: () => request("/workflow/published"),
  getWorkflowStaff: () => request("/workflow/staff"),

  // --- Sheep Feeding ---
  getSheepPens: () => request("/sheep/pens"),
  saveSheepPens: (pens) => request("/sheep/pens", { method: "POST", body: JSON.stringify(pens) }),
  getSheepSettings: () => request("/sheep/settings"),
  saveSheepSettings: (s) => request("/sheep/settings", { method: "PUT", body: JSON.stringify(s) }),
  getSheepHistory: () => request("/sheep/history"),
  addSheepHistory: (entry) => request("/sheep/history", { method: "POST", body: JSON.stringify(entry) }),

  // --- Cattle Feedlot ---
  getCattleElements: () => request("/cattle/elements"),
  createCattleElement: (e) => request("/cattle/elements", { method: "POST", body: JSON.stringify(e) }),
  updateCattleElement: (id, e) => request(`/cattle/elements/${id}`, { method: "PATCH", body: JSON.stringify(e) }),
  deleteCattleElement: (id) => request(`/cattle/elements/${id}`, { method: "DELETE" }),
  getCattleClasses: () => request("/cattle/animal-classes"),
  createCattleClass: (c) => request("/cattle/animal-classes", { method: "POST", body: JSON.stringify(c) }),
  deleteCattleClass: (id) => request(`/cattle/animal-classes/${id}`, { method: "DELETE" }),
  getCattleRecipes: () => request("/cattle/recipes"),
  saveCattleRecipes: (className, recipes) => request("/cattle/recipes", { method: "PUT", body: JSON.stringify({ className, recipes }) }),
  getCattleMobs: () => request("/cattle/cattle-mobs"),
  createCattleMob: (m) => request("/cattle/cattle-mobs", { method: "POST", body: JSON.stringify(m) }),
  updateCattleMob: (id, m) => request(`/cattle/cattle-mobs/${id}`, { method: "PATCH", body: JSON.stringify(m) }),
  deleteCattleMob: (id) => request(`/cattle/cattle-mobs/${id}`, { method: "DELETE" }),
  getCattleLoads: () => request("/cattle/loads"),
  createCattleLoad: (l) => request("/cattle/loads", { method: "POST", body: JSON.stringify(l) }),
  deleteCattleLoad: (id) => request(`/cattle/loads/${id}`, { method: "DELETE" }),
  getCattleAssignments: () => request("/cattle/load-assignments"),
  createCattleAssignment: (a) => request("/cattle/load-assignments", { method: "POST", body: JSON.stringify(a) }),
  deleteCattleAssignment: (id) => request(`/cattle/load-assignments/${id}`, { method: "DELETE" }),
  getCattleHistory: () => request("/cattle/cattle-history"),
  addCattleHistory: (entry) => request("/cattle/cattle-history", { method: "POST", body: JSON.stringify(entry) })
};
