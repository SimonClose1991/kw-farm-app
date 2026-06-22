import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// --- Accounts / Auth ---
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("Worker"), // Admin | Manager | Worker
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Farms ---
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  centerLat: numeric("center_lat"),
  centerLng: numeric("center_lng"),
});

// --- Mobs ---
export const mobs = pgTable("mobs", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  desc: text("desc"),
  count: integer("count").notNull().default(0),
  paddock: text("paddock"),
  dse: numeric("dse"),
  species: text("species"),
  type: text("type"),
  breed: text("breed"),
  ageClass: text("age_class"),
  mgmtGroup: text("mgmt_group"),
  tag: text("tag"),
  whp: integer("whp").default(0),
  lastWeight: numeric("last_weight"),
  lastWeightDate: text("last_weight_date"),
  assumedADG: numeric("assumed_adg"),
  daysInPaddock: integer("days_in_paddock").default(0),
  wec: jsonb("wec"), // last WEC reading {count, date, notes}
  extra: jsonb("extra"), // catch-all for any additional fields added later
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Mob history (treat, weigh, move, scan, transfer, etc.) ---
export const mobHistory = pgTable("mob_history", {
  id: serial("id").primaryKey(),
  mobId: integer("mob_id").notNull().references(() => mobs.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  action: text("action").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Mob notes ---
export const mobNotes = pgTable("mob_notes", {
  id: serial("id").primaryKey(),
  mobId: integer("mob_id").notNull().references(() => mobs.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  authorName: text("author_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Paddocks ---
export const paddocks = pgTable("paddocks", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ha: numeric("ha"),
  landUse: text("land_use"),
  pasture: text("pasture"),
  colour: text("colour"),
  geojson: jsonb("geojson"), // real polygon geometry if imported/drawn
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Landmarks ---
export const landmarks = pgTable("landmarks", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  name: text("name"),
  paddock: text("paddock"),
  paddockA: text("paddock_a"),  // for Gate: first connected paddock
  paddockB: text("paddock_b"),  // for Gate: second connected paddock
  colour: text("colour"),
  notes: text("notes"),
  lat: numeric("lat"),
  lng: numeric("lng"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Inventory: Animal treatments ---
export const treatmentInventory = pgTable("treatment_inventory", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  withholdingMeat: text("withholding_meat"),
  withholdingESI: text("withholding_esi"),
  dosage: text("dosage"),
  containerUnit: text("container_unit"),
  numContainers: text("num_containers"),
  batchNumber: text("batch_number"),
  manufactureDate: text("manufacture_date"),
  expiryDate: text("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Inventory: Spray chemicals ---
export const sprayInventory = pgTable("spray_inventory", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  treatmentDate: text("treatment_date"),
  location: text("location"),
  areaTreated: text("area_treated"),
  quantity: text("quantity"),
  applicationRate: text("application_rate"),
  applicationMethod: text("application_method"),
  whp: text("whp"),
  esi: text("esi"),
  batchNumber: text("batch_number"),
  containerUnit: text("container_unit"),
  numContainers: text("num_containers"),
  expiryDate: text("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Feed on Offer history ---
export const fooHistory = pgTable("foo_history", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  paddock: text("paddock").notNull(),
  date: text("date").notNull(),
  kgDm: numeric("kg_dm"),
  height: numeric("height"),
  cover: numeric("cover"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Rainfall records ---
export const rainfallRecords = pgTable("rainfall_records", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  mm: numeric("mm").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Custom breeds remembered per species ---
export const customBreeds = pgTable("custom_breeds", {
  id: serial("id").primaryKey(),
  species: text("species").notNull(),
  breed: text("breed").notNull(),
});

// ── Workflow planner ─────────────────────────────────────────────────────────
// Stores the full workflow state as a single JSON blob (tasks + published snapshot + prefs).
// Simple and matches the existing workflow.html save/load pattern exactly.
export const workflowState = pgTable("workflow_state", {
  id: text("id").primaryKey().default("singleton"),
  tasks: jsonb("tasks").default([]),
  published: jsonb("published").default([]),
  staff: jsonb("staff").default([]),
  prefs: jsonb("prefs").default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Sheep feeding ────────────────────────────────────────────────────────────
export const sheepPens = pgTable("sheep_pens", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ration: text("ration").notNull(),
  headCount: integer("head_count").notNull().default(0),
  kgPerHead: numeric("kg_per_head").notNull().default("0"),
  rationPercent: integer("ration_percent").default(100),
  active: boolean("active").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  notes: text("notes"),
});

export const sheepFeedHistory = pgTable("sheep_feed_history", {
  id: text("id").primaryKey(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  feeder: text("feeder"),
  period: text("period").notNull(),
  splitFraction: numeric("split_fraction").notNull(),
  events: jsonb("events").notNull().default([]),
});

export const sheepSettings = pgTable("sheep_settings", {
  id: text("id").primaryKey().default("singleton"),
  adminPin: text("admin_pin"),
  defaultFeeder: text("default_feeder"),
  splitAm: numeric("split_am").default("0.6"),
  splitPm: numeric("split_pm").default("0.4"),
  ingredients: jsonb("ingredients"),
  bufferPercent: numeric("buffer_percent").default("0"),
});

// ── Cattle feedlot ───────────────────────────────────────────────────────────
export const cattleElements = pgTable("cattle_elements", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull().default("kg/head"),
  defaultRate: numeric("default_rate").notNull().default("0"),
  isGradual: boolean("is_gradual").notNull().default(false),
  costPerUnit: numeric("cost_per_unit").notNull().default("0"),
  costUnit: text("cost_unit").notNull().default("$/tonne"),
});

export const cattleAnimalClasses = pgTable("cattle_animal_classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const cattleRecipes = pgTable("cattle_recipes", {
  id: text("id").primaryKey(),
  className: text("class_name").notNull(),
  elementName: text("element_name").notNull(),
  rate: numeric("rate").notNull(),
});

export const cattleMobs = pgTable("cattle_mobs", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  className: text("class_name").notNull(),
  paddock: text("paddock").notNull(),
  headCount: integer("head_count").notNull(),
  feedMultiplier: numeric("feed_multiplier").notNull().default("1"),
  gradualPercentages: jsonb("gradual_percentages").default({}),
});

export const cattleLoads = pgTable("cattle_loads", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const cattleLoadAssignments = pgTable("cattle_load_assignments", {
  id: text("id").primaryKey(),
  loadName: text("load_name").notNull(),
  mobName: text("mob_name").notNull(),
  multiplier: numeric("multiplier").notNull().default("1"),
});

export const cattleFeedHistory = pgTable("cattle_feed_history", {
  id: text("id").primaryKey(),
  loadName: text("load_name").notNull(),
  feeder: text("feeder"),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  totalKg: numeric("total_kg"),
  events: jsonb("events").default([]),
});
