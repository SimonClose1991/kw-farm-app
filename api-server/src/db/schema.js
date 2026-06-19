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
