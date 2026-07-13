import React, { useState, useRef } from "react";
import { Home, MapPin, Tag, Menu, ChevronRight, X, HelpCircle, Search, ArrowLeftRight, RefreshCw, Droplet, Settings, LifeBuoy, Sparkles, Check } from "lucide-react";
import { api, setAuthToken, getStoredToken } from "./api.js";

// Module-level API URL — available at build time via Vite's env injection
const VITE_API_URL = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : null) || "http://localhost:3001/api";
const API_BASE_URL = VITE_API_URL.replace(/\/api$/, ""); // e.g. https://kw-farm-api.onrender.com

const LOGO_DATA_URI = "data:image/jpeg;base64,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EBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH//2Q==";

const FARM_DATE = "Thursday 11th June 2026";

const initialMobs = [
  { id: 1, name: "Fenton steer calves", desc: "Angus steer calves · 10 months old", count: 142, paddock: "North", dse: 6, species: "Cattle", type: "Steers", breed: "Angus", ageClass: "Calves", mgmtGroup: "Breeders", tag: "Blue", whp: 0 },
  { id: 2, name: "Coleraine cows", desc: "Angus cows · 4 years old", count: 295, paddock: "River", dse: 8, species: "Cattle", type: "Cows", breed: "Angus", ageClass: "Adult", mgmtGroup: "Breeders", tag: "Yellow", whp: 21 },
  { id: 3, name: "Steer weaners", desc: "Mixed breed · 8 months old", count: 95, paddock: "East", dse: 5, species: "Cattle", type: "Steers", breed: "Mixed", ageClass: "Weaners", mgmtGroup: "Trade", tag: "Green", whp: 0 },
  { id: 4, name: "Merino ewes", desc: "Merino ewes · 3 years old", count: 1829, paddock: "South", dse: 1.5, species: "Sheep", type: "Ewes", breed: "Merino", ageClass: "Adult", mgmtGroup: "Breeders", tag: "Pink", whp: 0 },
  { id: 5, name: "5 Ways", desc: "Ram lambs · Bull", count: 1123, paddock: "West", dse: 3, species: "Sheep", type: "Rams", breed: "Merino", ageClass: "Lambs", mgmtGroup: "Breeders", tag: "Orange", whp: 1 },
];

const FARMS_DATA = {
  Arundale: initialMobs,
  Hamilton: [
    { id: 101, name: "Hamilton heifers", desc: "Hereford heifers · 18 months old", count: 180, paddock: "North", dse: 6.5, species: "Cattle", type: "Heifers", breed: "Hereford", ageClass: "Yearlings", mgmtGroup: "Breeders", tag: "Blue", whp: 0 },
    { id: 102, name: "Hamilton ewes", desc: "Dorper ewes · 2 years old", count: 980, paddock: "South", dse: 1.4, species: "Sheep", type: "Ewes", breed: "Dorper", ageClass: "Adult", mgmtGroup: "Breeders", tag: "Pink", whp: 0 },
  ],
  "Kurra-Wirra": [
    { id: 201, name: "Kurra-Wirra cows", desc: "Charolais cows · 5 years old", count: 210, paddock: "River", dse: 8.2, species: "Cattle", type: "Cows", breed: "Charolais", ageClass: "Adult", mgmtGroup: "Breeders", tag: "Yellow", whp: 0 },
    { id: 202, name: "Kurra-Wirra lambs", desc: "Suffolk lambs · 5 months old", count: 1450, paddock: "East", dse: 0.9, species: "Sheep", type: "Lambs", breed: "Suffolk", ageClass: "Lambs", mgmtGroup: "Trade", tag: "Green", whp: 0 },
  ],
  Mooralla: [
    { id: 301, name: "Mooralla bullocks", desc: "Mixed breed bullocks · 2 years old", count: 320, paddock: "West", dse: 7, species: "Cattle", type: "Steers", breed: "Mixed", ageClass: "Adult", mgmtGroup: "Trade", tag: "Orange", whp: 0 },
    { id: 302, name: "Mooralla wethers", desc: "Merino wethers · 1 year old", count: 1620, paddock: "Yards", dse: 1.2, species: "Sheep", type: "Wethers", breed: "Merino", ageClass: "Hoggets", mgmtGroup: "Wool", tag: "White", whp: 0 },
  ],
};

const QUICK_ACTIONS = [
  ["Recount", "🔢"], ["WEC", "🔬"],
  ["Score", "⭐"],
  ["Ent/mgmt group", "🗂️"],
  ["Move", "↕️"], ["Draft/Split", "🔀"],
];
const MORE_ACTIONS = [
  ["Treat", "💉"], ["Weigh", "⚖️"],
  ["Death", "💀"], ["Sale", "🚚"],
  ["Transfer", "🚛"], ["DSE", "🌿"],
  ["Scan", "🔍"],
];
const MOB_ACTIONS = [
  ["Edit", "✏️"], ["Copy", "📋"], ["Delete", "🗑️"],
  ["Merge", "🔗"],
];
// Actions a "Worker" role is allowed to perform day-to-day
const WORKER_ACTIONS = ["Treat", "Weigh", "Recount", "WEC", "Score", "Death", "Sale"];
const ROLE_OPTIONS = ["Admin", "Manager", "Worker"];

const BREEDS_DEFAULT = {
  Cattle: ["Angus", "Hereford", "Charolais", "Simmental", "Murray Grey", "Mixed"],
  Sheep:  ["Merino", "Dorper", "Suffolk", "Poll Dorset", "Border Leicester", "Mixed"],
  Bulls:  ["Angus", "Hereford", "Charolais", "Simmental", "Murray Grey", "Mixed"],
  Rams:   ["Merino", "Dorper", "Suffolk", "Poll Dorset", "Border Leicester", "Mixed"],
  Other:  [],
};
const AGE_CLASSES = {
  Cattle: ["Calves", "Weaners", "Yearlings", "Adult"],
  Sheep:  ["Lambs", "Hoggets", "Adult"],
  Bulls:  ["Yearling", "Adult"],
  Rams:   ["Lambs", "Hoggets", "Adult"],
};
const TAG_COLOURS = ["Red", "Blue", "Green", "Yellow", "Orange", "Pink", "White", "Black", "Mixed"];
const TAG_COLOUR_HEX = { Red: "#ef4444", Blue: "#3b82f6", Green: "#22c55e", Yellow: "#eab308", Orange: "#f97316", Pink: "#ec4899", White: "#f8fafc", Black: "#1e293b", Mixed: "#a78bfa" };
const SPECIES_ICON = { Cattle: "🐄", Sheep: "🐑" };
const PADDOCKS = ["North", "South", "East", "West", "River", "Yards"];
const PADDOCK_COLOURS = ["Sky Blue", "Forest Green", "Sunset Orange", "Ruby Red", "Lavender", "Mustard"];
const COLOUR_HEX = { "Sky Blue": "#38bdf8", "Forest Green": "#22c55e", "Sunset Orange": "#f97316", "Ruby Red": "#ef4444", "Lavender": "#a78bfa", "Mustard": "#eab308" };
const LAND_USES = ["Grazing", "Cropping", "Fallow", "Yards/Infrastructure", "Vegetation", "Conservation Zone"];

// Land uses excluded from DSE/ha stocking rate calculation
const NON_GRAZING_LAND_USES = new Set(["Cropping", "Fallow", "Yards/Infrastructure", "Vegetation", "Conservation Zone"]);
const PASTURE_TYPES = ["Native grass", "Improved pasture", "Cereal crop", "Wheat", "Canola", "Summer Crop", "N/A"];

// Landmark categories/types, modelled on the AgriWebb Farm Map Editor feature set
const NOTE_CATEGORIES = [
  { id: "Fencing",                 colour: "#f97316", icon: "🔧" },
  { id: "Water",                   colour: "#38bdf8", icon: "💧" },
  { id: "Weeds",                   colour: "#22c55e", icon: "🌿" },
  { id: "Livestock Infrastructure",colour: "#a78bfa", icon: "🐄" },
  { id: "Cropping",                colour: "#eab308", icon: "🌾" },
  { id: "Machinery",               colour: "#94a3b8", icon: "🚜" },
  { id: "General",                 colour: "#64748b", icon: "📋" },
];

const LANDMARK_CATEGORIES = {
  Buildings: [
    { type: "Building", icon: "🏠" },
    { type: "Chemical shed", icon: "🧪" },
    { type: "Hay shed", icon: "🌾" },
    { type: "Silo", icon: "🏭" },
  ],
  Water: [
    { type: "Bore", icon: "🚰" },
    { type: "Dam", icon: "💧" },
    { type: "Drain", icon: "🌊" },
    { type: "Pipeline", icon: "➖" },
    { type: "Pump", icon: "⚙️" },
    { type: "Rain gauge", icon: "🌧️" },
    { type: "Solar pump", icon: "☀️" },
    { type: "Tap", icon: "🚿" },
    { type: "Trough", icon: "🪣" },
    { type: "Water channel", icon: "🌊" },
    { type: "Water tank", icon: "🛢️" },
    { type: "Body of water", icon: "🏞️" },
    { type: "Windmill", icon: "🎐" },
  ],
  Infrastructure: [
    { type: "Electric fence", icon: "⚡" },
    { type: "Feeder", icon: "🍽️" },
    { type: "Feed trough", icon: "🥣" },
    { type: "Lick block", icon: "🧂" },
    { type: "First aid", icon: "⛑️" },
    { type: "Gate", icon: "🚧" },
    { type: "Generator", icon: "🔌" },
    { type: "Power lines", icon: "⚡" },
    { type: "Road", icon: "🛣️" },
    { type: "Solar panel", icon: "🔆" },
  ],
  Hazards: [
    { type: "Bait", icon: "☠️" },
    { type: "Death pit", icon: "⚠️" },
    { type: "Weed", icon: "🌿" },
    { type: "Hazard", icon: "❗" },
    { type: "Hazard area", icon: "🚫" },
  ],
};
const LANDMARK_COLOURS = ["Sky Blue", "Forest Green", "Sunset Orange", "Ruby Red", "Lavender", "Mustard", "Slate"];
const LANDMARK_COLOUR_HEX = { "Sky Blue": "#38bdf8", "Forest Green": "#22c55e", "Sunset Orange": "#f97316", "Ruby Red": "#ef4444", "Lavender": "#a78bfa", "Mustard": "#eab308", "Slate": "#64748b" };

// Paddock map insight overlay modes
const INSIGHT_MODES = [
  { key: "outline", label: "Outline only" },
  { key: "usage", label: "Paddock usage" },
  { key: "crop", label: "Crop type" },
  { key: "stocking", label: "Stocking rate" },
  { key: "feed", label: "Feed on offer" },
  { key: "grazed", label: "Days since grazed" },
];
const USAGE_COLOURS = { Grazing: "#22c55e", Cropping: "#eab308", Fallow: "#94a3b8", "Yards/Infrastructure": "#64748b", Vegetation: "#16a34a", "Conservation Zone": "#0369a1" };

const DEFAULT_PADDOCKS_DATA = {
  Arundale: [
    { id: 1, name: "North", ha: 45, landUse: "Grazing", pasture: "Native grass", colour: "Sky Blue" },
    { id: 2, name: "South", ha: 37, landUse: "Grazing", pasture: "Improved pasture", colour: "Forest Green" },
    { id: 3, name: "East", ha: 21, landUse: "Grazing", pasture: "Native grass", colour: "Sunset Orange" },
    { id: 4, name: "West", ha: 28, landUse: "Grazing", pasture: "Improved pasture", colour: "Ruby Red" },
    { id: 5, name: "River", ha: 18, landUse: "Grazing", pasture: "Native grass", colour: "Lavender" },
    { id: 6, name: "Yards", ha: 5, landUse: "Yards/Infrastructure", pasture: "N/A", colour: "Mustard" },
  ],
  Hamilton: [
    { id: 7, name: "North", ha: 52, landUse: "Grazing", pasture: "Improved pasture", colour: "Sky Blue" },
    { id: 8, name: "South", ha: 40, landUse: "Grazing", pasture: "Native grass", colour: "Forest Green" },
  ],
  "Kurra-Wirra": [
    { id: 9, name: "River", ha: 33, landUse: "Grazing", pasture: "Native grass", colour: "Lavender" },
    { id: 10, name: "East", ha: 47, landUse: "Grazing", pasture: "Improved pasture", colour: "Sunset Orange" },
  ],
  Mooralla: [
    { id: 11, name: "West", ha: 60, landUse: "Grazing", pasture: "Native grass", colour: "Ruby Red" },
    { id: 12, name: "Yards", ha: 8, landUse: "Yards/Infrastructure", pasture: "N/A", colour: "Mustard" },
  ],
};

// Approximate polygon area in hectares from a GeoJSON-style ring of [lng, lat] points
// Returns today's date as YYYY-MM-DD, used to auto-default date fields throughout the app
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Accurate geodesic polygon area in hectares using the spherical excess formula.
// Input: array of [lon, lat] pairs in DEGREES (GeoJSON order).
// Uses the WGS84 mean Earth radius for accuracy at Australian latitudes.
function ringAreaHa(ring) {
  if (!ring || ring.length < 3) return 0;
  const R = 6378137; // WGS84 equatorial radius in metres
  const toRad = d => d * Math.PI / 180;
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[(i + 1) % n];
    area += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs(area * R * R / 2) / 10000; // m² → hectares
}

// ringAreaHaFromLatLng: same but takes [lat, lng] pairs (as drawn on the map)
function ringAreaHaFromLatLng(points) {
  // Convert [lat,lng] → [lng,lat] for the standard geodesic formula
  return ringAreaHa(points.map(([lat, lng]) => [lng, lat]));
}

// Approximate farm locations (lat, lng) — used to centre the interactive map
const FARM_CENTERS = {
  Arundale: [-37.21, 141.62],
  Hamilton: [-37.745, 142.02],
  "Kurra-Wirra": [-36.95, 141.85],
  Mooralla: [-37.36, 141.65],
  Carramar: [-37.10, 141.75],
};

// Convert a GeoJSON Polygon/MultiPolygon geometry into [lat,lng] pairs for Leaflet
function geometryToLatLngs(geom) {
  if (!geom) return null;
  let ring = null;
  if (geom.type === "Polygon") ring = geom.coordinates[0];
  else if (geom.type === "MultiPolygon") ring = geom.coordinates[0]?.[0];
  if (!ring) return null;
  return ring.map(([lng, lat]) => [lat, lng]);
}

// Generate a placeholder square for paddocks without real geometry, arranged in a grid
function fallbackPolygon(center, index, ha) {
  const side = Math.sqrt((ha || 10) * 10000); // metres
  const degLat = side / 111000;
  const degLng = side / (111000 * Math.cos((center[0] * Math.PI) / 180));
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const spacingLat = degLat * 1.4;
  const spacingLng = degLng * 1.4;
  const cLat = center[0] + (row - 1) * spacingLat;
  const cLng = center[1] + (col - 1.5) * spacingLng;
  return [
    [cLat - degLat / 2, cLng - degLng / 2],
    [cLat - degLat / 2, cLng + degLng / 2],
    [cLat + degLat / 2, cLng + degLng / 2],
    [cLat + degLat / 2, cLng - degLng / 2],
  ];
}

// Interactive map of paddocks, drawn as an SVG so it always renders offline / without external map tiles
function PaddockMap({ paddocks, center, onSelect, landmarks = [], onSelectLandmark, insightMode = "usage", paddockStats = {}, drawMode = false, drawPoints = [], onDrawPoint, projectRef, userLocation = null, openGateIds = [] }) {
  // Gather all points (real geometry or generated fallback shapes) so we can fit a viewBox
  const shapes = paddocks.map((p, i) => {
    const latlngs = geometryToLatLngs(p.geojson) || fallbackPolygon(center, i, Number(p.ha) || 10);
    return { paddock: p, latlngs };
  });

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  shapes.forEach(({ latlngs }) => {
    latlngs.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  });
  landmarks.forEach((l) => {
    if (l.lat == null || l.lng == null) return;
    if (l.lat < minLat) minLat = l.lat;
    if (l.lat > maxLat) maxLat = l.lat;
    if (l.lng < minLng) minLng = l.lng;
    if (l.lng > maxLng) maxLng = l.lng;
  });
  if (!isFinite(minLat)) { minLat = center[0] - 0.01; maxLat = center[0] + 0.01; minLng = center[1] - 0.01; maxLng = center[1] + 0.01; }

  const W = 1000, H = 700, PAD = 40;
  const latRange = (maxLat - minLat) || 0.001;
  const lngRange = (maxLng - minLng) || 0.001;
  const project = ([lat, lng]) => {
    const x = PAD + ((lng - minLng) / lngRange) * (W - PAD * 2);
    const y = PAD + (1 - (lat - minLat) / latRange) * (H - PAD * 2); // flip Y (north up)
    return [x, y];
  };
  const unproject = (x, y) => {
    const lng = minLng + ((x - PAD) / (W - PAD * 2)) * lngRange;
    const lat = maxLat - ((y - PAD) / (H - PAD * 2)) * latRange;
    return [lat, lng];
  };
  if (projectRef) projectRef.current = { project, unproject, W, H };

  const colourForPaddock = (p) => {
    const customColour = COLOUR_HEX[p.colour];
    if (insightMode === "outline") return "none";
    if (insightMode === "stocking") {
      const stats = paddockStats[p.name] || {};
      const rate = stats.dsePerHa || 0;
      if (rate === 0) return "#475569";
      if (rate < 5) return "#22c55e";
      if (rate < 10) return "#eab308";
      if (rate < 15) return "#f97316";
      return "#ef4444";
    }
    if (insightMode === "feed") {
      const stats = paddockStats[p.name] || {};
      const kg = stats.lastFoo || 0;
      if (kg === 0) return "#475569";
      if (kg < 1000) return "#ef4444";
      if (kg < 2000) return "#eab308";
      return "#22c55e";
    }
    if (insightMode === "grazed") {
      const stats = paddockStats[p.name] || {};
      const days = stats.daysSinceGrazed;
      if (days == null) return "#475569";
      if (days === 0) return "#22c55e";
      if (days < 14) return "#84cc16";
      if (days < 30) return "#eab308";
      return "#ef4444";
    }
    // Custom colour wins over land-use colour
    return customColour || USAGE_COLOURS[p.landUse] || "#999";
  };

  return (
    <div className="w-full h-full bg-stone-700 overflow-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full h-full ${drawMode ? "cursor-crosshair" : ""}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={(e) => {
          if (!drawMode || !onDrawPoint) return;
          const svg = e.currentTarget;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          const ctm = svg.getScreenCTM();
          if (!ctm) return;
          const loc = pt.matrixTransform(ctm.inverse());
          const [lat, lng] = unproject(loc.x, loc.y);
          onDrawPoint(lat, lng, loc.x, loc.y);
        }}
      >
        <defs>
          <pattern id="paddockGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#paddockGrid)" />
        {shapes.map(({ paddock: p, latlngs }) => {
          const points = latlngs.map(project);
          const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");
          const cx = points.reduce((s, pt) => s + pt[0], 0) / points.length;
          const cy = points.reduce((s, pt) => s + pt[1], 0) / points.length;
          const fill = colourForPaddock(p);
          const stats = paddockStats[p.name] || {};
          let badge = `${Number(p.ha||0).toFixed(1)} ha`;
          if (insightMode === "stocking") badge = `${(stats.dsePerHa || 0).toFixed(1)} DSE/ha`;
          else if (insightMode === "feed") badge = stats.lastFoo ? `${stats.lastFoo} kgDM/ha` : "No data";
          else if (insightMode === "grazed") badge = stats.daysSinceGrazed != null ? `${stats.daysSinceGrazed}d since grazed` : "No data";
          const openGate = landmarks.find(l =>
            l.type === "Gate" && openGateIds.includes(String(l.id)) &&
            (l.paddockA === p.name || l.paddockB === p.name)
          );
          return (
            <g key={p.id} onClick={() => !drawMode && onSelect(p)} className={drawMode ? "" : "cursor-pointer"}>
              <polygon points={pointsStr} fill={fill === "none" ? "none" : fill} fillOpacity={fill === "none" ? 0 : 0.55} stroke={openGate ? "#eab308" : "#fff"} strokeWidth={openGate ? 4 : 2} />
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff" style={{ paintOrder: "stroke", stroke: "#00000099", strokeWidth: 4 }}>
                {p.name}
              </text>
              <text x={cx} y={cy + 16} textAnchor="middle" fontSize="14" fill="#fff" style={{ paintOrder: "stroke", stroke: "#00000099", strokeWidth: 3 }}>
                {badge}
              </text>
            </g>
          );
        })}
        {landmarks.map((l) => {
          if (l.lat == null || l.lng == null) return null;
          const [x, y] = project([l.lat, l.lng]);
          const cat = Object.values(LANDMARK_CATEGORIES).flat().find((c) => c.type === l.type);
          return (
            <g key={l.id} onClick={(e) => { e.stopPropagation(); if (!drawMode) onSelectLandmark?.(l); }} className={drawMode ? "" : "cursor-pointer"}>
              <circle cx={x} cy={y} r="14" fill={LANDMARK_COLOUR_HEX[l.colour] || "#64748b"} stroke="#fff" strokeWidth="2" />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="14">{cat?.icon || "📍"}</text>
            </g>
          );
        })}
        {userLocation && userLocation.lat != null && (() => {
          const [x, y] = project([userLocation.lat, userLocation.lng]);
          return (
            <g>
              <circle cx={x} cy={y} r="22" fill="#4285F4" fillOpacity="0.15" />
              <circle cx={x} cy={y} r="7" fill="#4285F4" stroke="#fff" strokeWidth="2" />
            </g>
          );
        })()}
        {drawMode && drawPoints.length > 0 && (
          <>
            <polyline
              points={drawPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={drawPoints.length > 2 ? "#22c55e" : "none"}
              fillOpacity="0.3"
              stroke="#22c55e"
              strokeWidth="3"
            />
            {drawPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="6" fill="#22c55e" stroke="#fff" strokeWidth="2" />
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

// Real Google Maps satellite view with paddock polygon overlays (requires user-supplied API key)
// ── Google Maps component ────────────────────────────────────────────────────
// Handles both "paddocks" mode (polygons + zoom-aware labels + landmarks + pin placer)
// and "livestock" mode (paddock outlines + per-species mob tiles + tag colour rings).
// Last user viewport per farm+mode — module-level so it survives component
// remounts (tab switches, parent re-renders). Restoring it means zoom/position
// never snaps back to the default after the user has zoomed or panned.
const SAVED_MAP_VIEWPORTS = {};

// Collapse paddock records sitting on (virtually) the same centroid — duplicate
// rows (e.g. a re-imported "Paddock 46" alongside its renamed "Airstrip") would
// otherwise draw two name labels on top of each other. Prefers the custom name
// over a default "Paddock N" name.
const isDefaultPaddockName = (n) => /^paddock\s*\d+$/i.test(String(n || "").trim());
// Stable fingerprint of a paddock's geometry — used to detect duplicate records
const paddockGeomKey = (gj) => {
  try {
    const ring = gj?.type === "MultiPolygon" ? gj.coordinates[0][0] : gj?.coordinates?.[0];
    if (!ring?.length) return null;
    return ring.slice(0, 5).map(([x, y]) => `${Number(x).toFixed(5)},${Number(y).toFixed(5)}`).join("|");
  } catch { return null; }
};
const dedupePaddocksForLabels = (list, getCentroid) => {
  const kept = [];
  (list || []).forEach((p) => {
    const cen = getCentroid(p);
    if (!cen) return;
    const i = kept.findIndex((q) => {
      const qc = getCentroid(q);
      return qc && Math.abs(qc.lat - cen.lat) < 5e-5 && Math.abs(qc.lng - cen.lng) < 5e-5;
    });
    if (i === -1) kept.push(p);
    else if (isDefaultPaddockName(kept[i].name) && !isDefaultPaddockName(p.name)) kept[i] = p;
  });
  return kept;
};

function GooglePaddockMap({
  paddocks, center, onSelect, apiKey, onError,
  mode = "paddocks",
  mobs = [], onSelectPin,
  landmarks = [], onSelectLandmark,
  insightMode = "usage", paddockStats = {},
  drawMode = false, drawPoints = [], onDrawPoint,
  userLocation = null,
  openGateIds = [],
  initialZoom = null,
  landmarkPinMode = false, landmarkPinPos = null, onLandmarkPinMoved,
  onMapCentreChange = null,
  instanceRef = null,
  fieldNotes = [], showNotesOnMap = false, onSelectNote,
  onPickPin = null, // callback(lat, lng, paddockName) when user places a pin
  editShapePaddockId = null, // paddock id currently being reshaped (editable polygon)
  onShapeEditHa = null,      // callback(ha) with live recalculated area while reshaping
  shapeEditRef = null,       // ref that receives { getLatLngs, restore } while reshaping
}) {
  // Single persistent Set for ALL active label markers — survives closure differences between effects
  const labelMarkersSet = useRef(new Set());
  // Clear every known label marker off the map
  const clearAllLabels = React.useCallback(() => {
    labelMarkersSet.current.forEach(lm => { try { lm?.setMap(null); } catch {} });
    labelMarkersSet.current.clear();
  }, []);
  // Add a label marker and track it
  const trackLabel = React.useCallback((lm) => {
    if (lm) labelMarkersSet.current.add(lm);
  }, []);
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fittedBoundsRef = useRef(false);
  const fittedBoundsCenterRef = useRef(null);
  const lastZoomTierRef = useRef(null); // track zoom tier to skip unnecessary label redraws
  // Bumped after each map (re)build. The mob/note/location effects depend on it so
  // they re-run once the async Google Maps build completes — otherwise on first
  // load they run before the map exists and nothing appears until data changes.
  const [mapReadyTick, setMapReadyTick] = React.useState(0);
  const editingShapeIdRef = useRef(null); // paddock id being reshaped — suppress selection clicks
  // Sync internal ref to external ref so parent can access map/polygons/centroids
  React.useEffect(() => {
    if (instanceRef) instanceRef.current = mapInstanceRef.current;
  });
  React.useEffect(() => () => { if (instanceRef) instanceRef.current = null; }, []);
  // Store callbacks on refs so effects always use current values without stale closures
  const onSelectPinRef = useRef(onSelectPin);
  React.useEffect(() => { onSelectPinRef.current = onSelectPin; }, [onSelectPin]);
  const onPickPinRef = useRef(onPickPin);
  React.useEffect(() => { onPickPinRef.current = onPickPin; }, [onPickPin]);

  const colourForPaddock = (p) => {
    // Custom paddock colour always takes priority if set
    const customColour = COLOUR_HEX[p.colour];
    if (insightMode === "outline") return null;
    if (insightMode === "stocking") {
      const rate = (paddockStats[p.name] || {}).dsePerHa || 0;
      if (rate === 0) return "#475569";
      if (rate < 5) return "#22c55e";
      if (rate < 10) return "#eab308";
      if (rate < 15) return "#f97316";
      return "#ef4444";
    }
    if (insightMode === "feed") {
      const kg = (paddockStats[p.name] || {}).lastFoo || 0;
      if (kg === 0) return "#475569";
      if (kg < 1000) return "#ef4444";
      if (kg < 2000) return "#eab308";
      return "#22c55e";
    }
    if (insightMode === "grazed") {
      const days = (paddockStats[p.name] || {}).daysSinceGrazed;
      if (days == null) return "#475569";
      if (days === 0) return "#22c55e";
      if (days < 14) return "#84cc16";
      if (days < 30) return "#eab308";
      return "#ef4444";
    }
    // Default / usage / crop: custom colour wins, then land-use colour
    return customColour || USAGE_COLOURS[p.landUse] || "#999999";
  };

  // Abbreviate a paddock name for mid-zoom labels: "Squashy Island" → "SI"
  const abbrev = (name) => name.split(/[\s\-_]+/).map(w => w[0]).join("").toUpperCase().slice(0,3);

  // Helper: build paddock label — single canvas-rendered marker with name + ha on separate lines
  // This guarantees pixel-perfect stacking regardless of zoom or screen size
  // Accept currentInsightMode and currentPaddockStats as params to avoid stale closures
  const updateLabelForZoom = (g, map, centroid, p, labelMarkerRef, zoom, currentInsightMode, currentPaddockStats) => {
    if (labelMarkerRef.setMap) labelMarkerRef.setMap(null);
    // No labels when too zoomed out — too crowded
    if (zoom < 12) return null;

    const mode_ = currentInsightMode || insightMode;
    const stats_ = (currentPaddockStats || paddockStats)[p.name] || {};
    let badge = "";
    if (zoom >= 15) {
      badge = `${Number(p.ha||0).toFixed(1)} ha`;
      if (mode_ === "stocking") badge = `${(stats_.dsePerHa||0).toFixed(1)} DSE/ha`;
      else if (mode_ === "feed") badge = stats_.lastFoo ? `${stats_.lastFoo} kgDM/ha` : "";
      else if (mode_ === "grazed") badge = stats_.daysSinceGrazed != null ? `${stats_.daysSinceGrazed}d ago` : "";
    }

    // zoom 12-14: abbreviated initials only, no badge (full names get cluttered)
    // zoom 15+: full name + badge
    const nameLine = zoom >= 15 ? p.name : abbrev(p.name);
    const lines = [nameLine, ...(zoom >= 15 && badge ? [badge] : [])];
    const fontSize = zoom >= 15 ? 13 : 10;
    const lineH = fontSize + 4;
    const dpr = window.devicePixelRatio || 1;

    // Measure text width
    const tmpCanvas = document.createElement("canvas");
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
    const maxW = Math.max(...lines.map(l => tmpCtx.measureText(l).width)) + 14;
    const totalH = lines.length * lineH + 8;

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(maxW * dpr);
    canvas.height = Math.ceil(totalH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    lines.forEach((line, i) => {
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = 4;
      ctx.font = i === 0
        ? `bold ${fontSize}px Inter, Arial, sans-serif`
        : `600 ${fontSize - 1}px Inter, Arial, sans-serif`;
      ctx.fillStyle = i === 0 ? "#ffffff" : "rgba(255,255,255,0.80)";
      ctx.fillText(line, maxW / 2, 4 + (i + 1) * lineH - 2);
    });

    const marker = new g.Marker({
      position: centroid, map,
      clickable: false, // let taps pass through to the paddock polygon below
      icon: {
        url: canvas.toDataURL(),
        scaledSize: new g.Size(maxW, totalH),
        anchor: new g.Point(maxW / 2, totalH / 2),
      },
      zIndex: 2,
    });

    return { setMap: (m) => marker.setMap(m) };
  };

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId;
    const render = () => {
      if (cancelled || !mapDivRef.current || !window.google?.maps) return;
      const g = window.google.maps;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.overlays?.forEach((o) => { try { o.setMap(null); } catch {} });
        clearAllLabels();
        if (mapInstanceRef.current.noteMarkers) {
          mapInstanceRef.current.noteMarkers.forEach(m => { try { m.setMap(null); } catch {} });
        }
        // Properly destroy the old map so the new one gets a clean div
        // Without this, new g.Map() on the same div may inherit the old viewport
        try { g.event.clearInstanceListeners(mapInstanceRef.current.map); } catch {}
        mapInstanceRef.current = null;
        // Clear the div so Google Maps doesn't see an existing map in it
        if (mapDivRef.current) mapDivRef.current.innerHTML = "";
      }
      const viewportKey = `${center[0]},${center[1]}|${mode}`;
      const savedVp = SAVED_MAP_VIEWPORTS[viewportKey];
      const map = new g.Map(mapDivRef.current, {
        center: savedVp ? { lat: savedVp.lat, lng: savedVp.lng } : { lat: center[0], lng: center[1] },
        zoom: (savedVp && savedVp.zoom) || initialZoom || 14,
        mapTypeId: "satellite",
        streetViewControl: false, fullscreenControl: false, mapTypeControl: false,
        gestureHandling: "greedy",
        zoomControl: true,
      });
      // Persist the user's viewport (zoom + centre) once the initial fit is done,
      // so any rebuild/remount restores exactly where they were looking.
      let vpReady = !!savedVp;
      map.addListener("idle", () => {
        if (!vpReady) return;
        const c = map.getCenter();
        const z = map.getZoom();
        if (!c || !z) return;
        SAVED_MAP_VIEWPORTS[viewportKey] = { lat: c.lat(), lng: c.lng(), zoom: z };
      });
      // Report centre changes via ref to avoid triggering re-renders
      if (onMapCentreChange) {
        let centreTimer = null;
        map.addListener("dragend", () => {
          const c = map.getCenter();
          onMapCentreChange(c.lat(), c.lng());
        });
      }
      const bounds = new g.LatLngBounds();
      const overlays = [];
      const centroids = {};
      const labelMarkers = {}; // paddock id → label marker (for lookup)
      const polygons = {};

      // ── Draw paddock polygons (both modes) ──
      paddocks.forEach((p, i) => {
        const latlngs = geometryToLatLngs(p.geojson) || fallbackPolygon(center, i, Number(p.ha) || 10);
        const path = latlngs.map(([lat, lng]) => ({ lat, lng }));
        path.forEach((pt) => bounds.extend(pt));
        const centroid = path.reduce((acc, pt) => ({ lat: acc.lat + pt.lat / path.length, lng: acc.lng + pt.lng / path.length }), { lat: 0, lng: 0 });
        centroids[p.id] = centroid;  // keyed by ID so renames don't create stale entries
        centroids[p.name] = centroid; // also keyed by name for mob marker paddock lookups

        const isGateOpen = landmarks.some(l => l.type === "Gate" && openGateIds.includes(String(l.id)) && (l.paddockA === p.name || l.paddockB === p.name));
        const fillColour = mode === "paddocks" ? (colourForPaddock(p) || "#999999") : "transparent";
        const poly = new g.Polygon({
          paths: path,
          strokeColor: mode === "notes" ? "#94a3b8" : (isGateOpen ? "#eab308" : "#ffffff"),
          strokeWeight: mode === "notes" ? 1 : (isGateOpen ? 3 : (mode === "paddocks" ? 2 : 1.5)),
          fillColor: mode === "paddocks" ? fillColour : (mode === "notes" ? "#e2e8f0" : "#38bdf8"),
          fillOpacity: mode === "paddocks" ? 0.45 : (mode === "notes" ? 0.2 : 0.15),
          map,
        });
        // Individual polygon click — routes to pin-picking if active, otherwise normal select
        if (!drawMode) {
          poly.addListener("click", (e) => {
            if (editingShapeIdRef.current) return; // reshaping — clicks are vertex edits
            // Resolve the CURRENT paddock record at click time — the closure copy
            // goes stale after renames/edits and would show the old details
            const fresh = (mapInstanceRef.current?.paddockList || paddocks).find(x => String(x.id) === String(p.id)) || p;
            if (onPickPinRef.current) {
              // Pin-picking mode: place pin at click location, detect paddock
              const lat = e.latLng.lat(), lng = e.latLng.lng();
              onPickPinRef.current(lat, lng, fresh.name);
            } else {
              onSelect(fresh);
            }
          });
        }
        polygons[p.id] = poly;  // keyed by ID
        overlays.push(poly);

      });

      // Initial labels at current zoom — deduped so duplicate paddock records
      // don't draw two names on top of each other
      dedupePaddocksForLabels(paddocks, (p) => centroids[p.id]).forEach((p) => {
        const lm = updateLabelForZoom(g, map, centroids[p.id], p, { setMap: () => {} }, map.getZoom(), insightMode, paddockStats);
        labelMarkers[p.id] = lm || null;
        trackLabel(lm); // register in persistent Set
      });

      // Zoom-aware label update — debounced 500ms so pinch zoom fully settles before any redraw
      let zoomDebounceTimer = null;
      map.addListener("zoom_changed", () => {
        if (zoomDebounceTimer) clearTimeout(zoomDebounceTimer);
        zoomDebounceTimer = setTimeout(() => {
          const z = map.getZoom();
          if (!z) return;
          // Skip if map container is hidden (display:none) — avoids iOS viewport reset
          if (mapDivRef.current && mapDivRef.current.closest('[style*="display: none"]')) return;
          // Determine zoom tier — only redraw labels when crossing a tier boundary
          const tier = z < 12 ? 0 : z < 15 ? 1 : 2;
          if (tier === lastZoomTierRef.current) return; // same tier — labels correct, skip redraw
          lastZoomTierRef.current = tier;
          const ref = mapInstanceRef.current;
          if (!ref?.map) return;
          // Double-check zoom hasn't changed again while we were waiting
          if (ref.map.getZoom() !== z) return;
          const freshInsightMode = ref?.currentInsightMode || insightMode;
          const freshPaddockStats = ref?.currentPaddockStats || paddockStats;
          const freshCentroids = ref?.centroids || centroids;
          // Use the CURRENT paddock list, not the closure — renames/additions since
          // the map was built would otherwise redraw stale names on zoom
          const freshPaddocks = ref?.paddockList || paddocks;
          // Clear ALL labels via persistent Set — no closure staleness possible
          clearAllLabels();
          const newLabels = {};
          if (ref) ref.labelMarkers = newLabels;
          dedupePaddocksForLabels(freshPaddocks, (p) => freshCentroids[p.id]).forEach((p) => {
            const cen = freshCentroids[p.id];
            if (!cen) return;
            const newLm = updateLabelForZoom(g, map, cen, p, { setMap: () => {} }, z, freshInsightMode, freshPaddockStats);
            newLabels[p.id] = newLm || null;
            labelMarkers[p.id] = newLm || null;
            trackLabel(newLm);
          });
        }, 150);
      });

      // ── Map-level tap handler (mobile-reliable) ──────────────────────────────
      if (!drawMode) {
        map.addListener("click", (e) => {
          if (editingShapeIdRef.current) return; // reshaping — don't select paddocks
          const latLng = e.latLng;
          const ref = mapInstanceRef.current;
          if (!ref) return;

          // Pin-picking mode: place pin here (outside all polygons)
          if (onPickPinRef.current) {
            onPickPinRef.current(latLng.lat(), latLng.lng(), null);
            return;
          }

          if (!window.google?.maps?.geometry?.poly) return;
          // Check exact containment first
          for (const [pid, poly] of Object.entries(ref.polygons || {})) {
            if (window.google.maps.geometry.poly.containsLocation(latLng, poly)) {
              // Current record, not the render-time closure — stale after renames
              const p = (ref.paddockList || paddocks).find(x => String(x.id) === String(pid));
              if (p) { onSelect(p); return; }
            }
          }
          // Near-miss tolerance: find nearest paddock centroid within ~80m
          const tol = 0.0008;
          let nearest = null, nearestDist = Infinity;
          for (const [pid, cen] of Object.entries(ref.centroids || {})) {
            if (typeof pid !== "string" || isNaN(Number(pid))) continue;
            const dist = Math.hypot(latLng.lat() - cen.lat, latLng.lng() - cen.lng);
            if (dist < nearestDist) { nearestDist = dist; nearest = pid; }
          }
          if (nearest && nearestDist < tol) {
            const p = (ref.paddockList || paddocks).find(x => String(x.id) === String(nearest));
            if (p) onSelect(p);
          }
        });
      }
      // ── Landmarks (paddocks mode) ──
      // Render gates on BOTH modes; other landmarks only in paddocks mode
      // Use a separate tracked array so cleanup doesn't interfere with other overlays
      const landmarkMarkers = [];
      const renderAllLandmarks = (zoom, freshOpenGateIds) => {
        const gateIds = freshOpenGateIds || openGateIds;
        landmarkMarkers.forEach(m => { try { m.setMap(null); } catch {} });
        landmarkMarkers.length = 0;
        // Use the current landmark list from the ref (kept fresh by effects) — the
        // closure copy goes stale after landmark edits
        (mapInstanceRef.current?.landmarks || landmarks).forEach((l) => {
          if (l.lat == null || l.lng == null) return;
          const pos = { lat: Number(l.lat), lng: Number(l.lng) };
          const cat = Object.values(LANDMARK_CATEGORIES).flat().find((c) => c.type === l.type);
          const isGate = l.type === "Gate";
          if (isGate) {
            if (zoom < 13) return;
            const isOpen = gateIds.includes(String(l.id));
            const gateSymbol = isOpen ? "◯" : "⊗";
            const gateColor = isOpen ? "#eab308" : "#dc2626";
            const fontSize = zoom >= 15 ? "20px" : "14px";
            const m = new g.Marker({
              position: pos, map,
              label: { text: gateSymbol, fontSize, color: gateColor, fontWeight: "bold" },
              icon: { path: g.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
              zIndex: 20,
            });
            m.addListener("click", () => onSelectLandmark?.(l));
            landmarkMarkers.push(m);
          } else if (mode === "paddocks") {
            if (zoom < 12) return;
            const m = new g.Marker({
              position: pos, map,
              label: { text: cat?.icon || "📍", fontSize: zoom >= 14 ? "16px" : "12px" },
              icon: { path: g.SymbolPath.CIRCLE, scale: zoom >= 14 ? 14 : 10, fillColor: LANDMARK_COLOUR_HEX[l.colour] || "#64748b", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
              zIndex: 10,
            });
            m.addListener("click", () => onSelectLandmark?.(l));
            landmarkMarkers.push(m);
          }
        });
      };
      renderAllLandmarks(map.getZoom());
      map.addListener("zoom_changed", () => {
        const currentGateIds = mapInstanceRef.current?.currentOpenGateIds || openGateIds;
        renderAllLandmarks(map.getZoom(), currentGateIds);
      });
      overlays.push({ setMap: (m) => landmarkMarkers.forEach(lm => { try { lm.setMap(m); } catch {} }) });

      // ── Draggable landmark placement pin ──
      if (landmarkPinMode) {
        const startPos = landmarkPinPos
          ? { lat: landmarkPinPos.lat, lng: landmarkPinPos.lng }
          : { lat: center[0], lng: center[1] };
        const pinMarker = new g.Marker({
          position: startPos,
          map,
          draggable: true,
          title: "Drag to place landmark",
          zIndex: 9999,
          // Use the default red Google Maps pin — always visible and touch-friendly
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new g.Size(40, 40),
            anchor: new g.Point(20, 40),
          },
          animation: g.Animation.DROP,
        });
        pinMarker._isLandmarkPin = true;
        pinMarker.addListener("dragend", (e) => {
          onLandmarkPinMoved?.(e.latLng.lat(), e.latLng.lng());
        });
        // Also allow tapping the map to move the pin
        map.addListener("click", (e) => {
          pinMarker.setPosition(e.latLng);
          onLandmarkPinMoved?.(e.latLng.lat(), e.latLng.lng());
        });
        overlays.push(pinMarker);
        if (!landmarkPinPos) onLandmarkPinMoved?.(startPos.lat, startPos.lng);
      }

      // ── Draw mode ──
      if (drawMode) {
        map.addListener("click", (e) => onDrawPoint?.(e.latLng.lat(), e.latLng.lng()));
        if (drawPoints.length > 0) {
          const path = drawPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
          const poly = new g.Polygon({ paths: path, strokeColor: "#22c55e", strokeWeight: 3, fillColor: "#22c55e", fillOpacity: drawPoints.length > 2 ? 0.3 : 0, map });
          overlays.push(poly);
          path.forEach((pt) => {
            const m = new g.Marker({ position: pt, map, icon: { path: g.SymbolPath.CIRCLE, scale: 6, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 } });
            overlays.push(m);
          });
        }
      }

      // Note: we always rebuild when paddocks change so polygons stay in sync.
      // setCenter is only called when the farm center changes (new farm).
      // Always center on the known farm coordinates — never rely on fitBounds
      // which can be thrown off by bad coordinates or stale state.
      const centerKey = `${center[0]},${center[1]}`;
      const sameCenter = fittedBoundsCenterRef.current === centerKey;
      const [cLat, cLng] = center;
      // Only fit bounds on first load for this farm, or when switching farms.
      // Paddock renames/updates must NOT re-trigger fitBounds or the map jumps back.
      if (!sameCenter) {
        // Farm changed — reset so we fit the new farm
        fittedBoundsRef.current = false;
        fittedBoundsCenterRef.current = centerKey;
      }
      if (savedVp) {
        // Restored the user's last viewport — never refit over the top of it
        fittedBoundsRef.current = true;
        fittedBoundsCenterRef.current = centerKey;
      }
      if (!fittedBoundsRef.current) {
        fittedBoundsRef.current = true;
        let userInteracted = false;
        const interactionListener = map.addListener("zoom_changed", () => { userInteracted = true; });
        setTimeout(() => {
          g.event.removeListener(interactionListener);
          if (userInteracted) { vpReady = true; return; }
          // Use current bounds from ref — may have been updated by polygon effect
          const currentBounds = mapInstanceRef.current?.bounds;
          if (currentBounds) {
            try {
              const ne = currentBounds.getNorthEast();
              const sw = currentBounds.getSouthWest();
              if (ne.lat() !== sw.lat()) {
                const midLat = (ne.lat() + sw.lat()) / 2;
                const midLng = (ne.lng() + sw.lng()) / 2;
                const dist = Math.hypot(midLat - cLat, midLng - cLng);
                // Sanity check — bounds midpoint must be within 0.5° of farm center
                if (dist < 0.5) {
                  map.fitBounds(currentBounds, 20);
                  // Nudge one zoom level in — the fitted view sits a touch too far out
                  g.event.addListenerOnce(map, "idle", () => {
                    const z = map.getZoom();
                    if (z) map.setZoom(z + 1);
                    vpReady = true;
                  });
                  return;
                }
              }
            } catch {}
          }
          // No valid bounds yet — just center on the farm, don't zoom out to world
          map.setCenter({ lat: cLat, lng: cLng });
          map.setZoom(15);
          vpReady = true;
        }, 500);
      }
      mapInstanceRef.current = {
        map, overlays, polygons, labelMarkers,
        fittedBounds: true,
        landmarks, renderLandmarks: renderAllLandmarks,
        centroids, center, bounds,
        paddockList: paddocks,
        renderMobs: null,
        _mode: mode, // stored so cleanup can detect true config changes vs paddock-only updates
        currentInsightMode: insightMode,
        currentPaddockStats: paddockStats,
        currentOpenGateIds: openGateIds,
      };
      lastZoomTierRef.current = null; // reset so labels redraw correctly on first zoom
      setMapReadyTick(t => t + 1); // re-run marker effects now that the map exists
    };

    if (window.google?.maps) {
      render();
    } else {
      // Only add script if not already loading/loaded
      const existing = document.getElementById("google-maps-js");
      if (!existing) {
        window.__gmapsCallback = render;
        const script = document.createElement("script");
        script.id = "google-maps-js";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&callback=__gmapsCallback`;
        script.async = true;
        script.onerror = () => { if (!cancelled) onError?.(); };
        document.body.appendChild(script);
        timeoutId = setTimeout(() => { if (!cancelled && !window.google?.maps) onError?.(); }, 8000);
      } else {
        // Script already loading — wait for callback or poll
        const poll = setInterval(() => {
          if (window.google?.maps) { clearInterval(poll); if (!cancelled) render(); }
        }, 100);
        timeoutId = setTimeout(() => { clearInterval(poll); if (!cancelled && !window.google?.maps) onError?.(); }, 8000);
      }
    }
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.overlays?.forEach((o) => { try { o.setMap(null); } catch {} });
        clearAllLabels();
        mapInstanceRef.current = null;
      }
    };
  }, [center, apiKey, mode, landmarkPinMode]); // drawMode/paddocks/mobs/landmarks handled by separate effects

  // Separate effect: update gate open/close without rebuilding map
  // Just updates polygon stroke colour and gate marker symbols
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.polygons || !window.google?.maps) return;
    // Update polygon strokes for open/closed gates (polygons are keyed by id)
    ref.currentOpenGateIds = openGateIds;
    paddocks.forEach((p) => {
      const poly = ref.polygons[p.id];
      if (!poly) return;
      const isGateOpen = (landmarks.length ? landmarks : (ref.landmarks || [])).some(l =>
        l.type === "Gate" && openGateIds.includes(String(l.id)) &&
        (l.paddockA === p.name || l.paddockB === p.name)
      );
      poly.setOptions({
        strokeColor: isGateOpen ? "#eab308" : "#ffffff",
        strokeWeight: isGateOpen ? 3 : (mode === "paddocks" ? 2 : 1.5),
      });
    });
  }, [openGateIds, paddocks, landmarks, mapReadyTick]);

  // Separate effect: update mob markers when mobs change — no map rebuild, no fitBounds
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.map || !window.google?.maps || mode !== "livestock") return;
    const g = window.google.maps;
    const { map, centroids, center } = ref;
    // Remove existing mob markers
    if (ref.mobOverlays) ref.mobOverlays.forEach(m => { try { m.setMap(null); } catch {} });
    ref.mobOverlays = [];
    // Re-render mob pins in-place
    const groups = {};
    mobs.forEach(m => {
      const key = `${m.paddock || "_nopad"}::${m.species || "Other"}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    let gi = 0;
    Object.entries(groups).forEach(([key, groupMobs]) => {
      const [paddockName, species] = key.split("::");
      let base = centroids?.[paddockName];
      if (!base) {
        const angle = (gi / Math.max(Object.keys(groups).length, 1)) * 2 * Math.PI;
        base = { lat: center[0] + Math.cos(angle) * 0.012, lng: center[1] + Math.sin(angle) * 0.012 };
      }
      gi++;
      // Spread multiple species tiles around the centroid so they don't overlap
      const speciesInPaddock = Object.keys(groups)
        .filter(k => k.startsWith(paddockName + "::"))
        .map(k => k.split("::")[1])
        .sort(); // consistent order
      const speciesCount = speciesInPaddock.length;
      const speciesIndex = speciesInPaddock.indexOf(species);
      let latOff = 0, lngOff = 0;
      if (speciesCount > 1) {
        // Spread in an arc — 0.0018° ≈ 180m, clearly visible at farm zoom
        const angle = (speciesIndex / speciesCount) * 2 * Math.PI - Math.PI / 2;
        const radius = 0.0018;
        latOff = Math.cos(angle) * radius;
        lngOff = Math.sin(angle) * radius * 0.7;
      }
      const pos = { lat: base.lat + latOff, lng: base.lng + lngOff };
      const totalCount = groupMobs.reduce((s, m) => s + m.count, 0);
      const tagColour = TAG_COLOUR_HEX[groupMobs[0]?.tag] || "#cbd5e1";
      const emoji = species === "Cattle" ? "🐄" : species === "Sheep" ? "🐑" : species === "Rams" ? "🐏" : species === "Bulls" ? "🐂" : "🐾";
      // WHP/ESI check
      const today2 = new Date(); today2.setHours(0,0,0,0);
      let inWhp2 = false, inEsi2 = false;
      groupMobs.forEach(m => {
        if (!m.lastTreatDate || !m.whpDays) return;
        const td = new Date(m.lastTreatDate); td.setHours(0,0,0,0);
        const d = Math.floor((today2 - td) / 86400000);
        if (d < (m.whpDays || 0)) inWhp2 = true;
        if (d < (m.esiDays || 0)) inEsi2 = true;
      });
      const badges2 = [inWhp2 && "W", inEsi2 && "E"].filter(Boolean).join("/");
      // Teardrop canvas marker
      const cvs = document.createElement("canvas");
      const dpr = window.devicePixelRatio || 1;
      const W = 48, H = 58;
      cvs.width = W * dpr; cvs.height = H * dpr;
      const ctx = cvs.getContext("2d");
      ctx.scale(dpr, dpr);
      ctx.beginPath();
      ctx.arc(W/2, W/2 - 4, W/2 - 3, Math.PI, 0, false);
      ctx.bezierCurveTo(W - 3, W/2 + 6, W/2 + 8, H - 4, W/2, H - 2);
      ctx.bezierCurveTo(W/2 - 8, H - 4, 3, W/2 + 6, 3, W/2 - 4);
      ctx.closePath();
      ctx.fillStyle = "#ffffff"; ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 4; ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = tagColour; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = "18px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#000"; ctx.fillText(emoji, W/2, W/2 - 6);
      ctx.font = "bold 10px Arial"; ctx.fillStyle = "#1e293b"; ctx.fillText(String(totalCount), W/2, W/2 + 9);
      if (badges2) { ctx.fillStyle = inWhp2 ? "#ef4444" : "#f97316"; ctx.font = "bold 8px Arial"; ctx.fillText(badges2, W/2, W/2 + 20); }
      const marker = new g.Marker({
        position: { lat: pos.lat + 0.0006, lng: pos.lng }, map,
        icon: { url: cvs.toDataURL(), scaledSize: new g.Size(W, H), anchor: new g.Point(W/2, H - 2) },
        zIndex: 50,
      });
      // Click — open mob detail sheet
      marker.addListener("click", () => onSelectPinRef.current?.({ l: totalCount, mob: groupMobs[0], mobs: groupMobs }));
      ref.mobOverlays.push(marker);
    });
  }, [mobs, mode, mapReadyTick]);

  // Separate effect: re-render landmarks when they change (without full map rebuild)
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.map || !window.google?.maps) return;
    ref.landmarks = landmarks;
    ref.currentOpenGateIds = openGateIds; // always keep ref up to date
    // Pass current openGateIds directly so renderLandmarks doesn't use stale closure
    if (ref.renderLandmarks) ref.renderLandmarks(ref.map.getZoom(), openGateIds);
  }, [landmarks, openGateIds]);

  // ── User location blue dot — separate effect so GPS updates don't rebuild the map ──
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.map || !window.google?.maps) return;
    const g = window.google.maps;
    // Remove old dot
    if (ref.userLocationDot) { try { ref.userLocationDot.setMap(null); } catch {} ref.userLocationDot = null; }
    if (!userLocation) return;
    ref.userLocationDot = new g.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: ref.map,
      icon: { path: g.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
      zIndex: 999,
    });
  }, [userLocation, mapReadyTick]);

  // ── Field note pins effect ─────────────────────────────────────────────────
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.map || !window.google?.maps) return;
    const g = window.google.maps;
    const map = ref.map;
    (ref.noteMarkers || []).forEach(m => { try { m.setMap(null); } catch {} });
    ref.noteMarkers = [];
    // In Notes mode: show all open notes + faded resolved ones
    // In other modes: only show when showNotesOnMap toggle is on
    const isNotesMode = mode === "notes";
    if (!isNotesMode && !showNotesOnMap) return;
    const notesToShow = isNotesMode
      ? fieldNotes.filter(n => n.lat && n.lng) // all notes including resolved
      : fieldNotes.filter(n => !n.resolvedAt && n.lat && n.lng); // overlay: open only
    notesToShow.forEach(note => {
      const cat = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
      const isUrgent = note.priority === "urgent";
      const isResolved = !!note.resolvedAt;
      const hasTask = !!note.taskCreated;
      const m = new g.Marker({
        position: { lat: Number(note.lat), lng: Number(note.lng) },
        map,
        label: { text: hasTask ? "📋" : cat.icon, fontSize: isNotesMode ? "16px" : "13px" },
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: isUrgent ? (isNotesMode ? 18 : 14) : (isNotesMode ? 14 : 11),
          fillColor: isResolved ? "#94a3b8" : (isUrgent ? "#ef4444" : cat.colour),
          fillOpacity: isResolved ? 0.4 : 0.95,
          strokeColor: isResolved ? "#cbd5e1" : "#ffffff",
          strokeWeight: 2,
        },
        zIndex: isUrgent ? 35 : (isResolved ? 20 : 30),
        title: note.body?.slice(0, 60),
      });
      m.addListener("click", () => onSelectNote?.(note));
      ref.noteMarkers.push(m);
    });
  }, [fieldNotes, showNotesOnMap, mode, mapReadyTick]);


  // Effect: update polygons when paddocks change — in-place updates, never destroy/recreate
  // Destroying polygons causes Google Maps to reset viewport — so we only setOptions() on existing ones
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.map || !window.google?.maps) return;
    const g = window.google.maps;
    const map = ref.map;
    ref.centroids = ref.centroids || {};
    ref.polygons = ref.polygons || {};
    const newBounds = new g.LatLngBounds();
    const seenIds = new Set();

    paddocks.forEach((p, i) => {
      seenIds.add(p.id);
      const latlngs = geometryToLatLngs(p.geojson) || fallbackPolygon(ref.center, i, Number(p.ha) || 10);
      const path = latlngs.map(([lat, lng]) => ({ lat, lng }));
      path.forEach(pt => newBounds.extend(pt));
      const centroid = path.reduce((acc, pt) => ({ lat: acc.lat + pt.lat / path.length, lng: acc.lng + pt.lng / path.length }), { lat: 0, lng: 0 });
      ref.centroids[p.id] = centroid;
      ref.centroids[p.name] = centroid;
      const isGateOpen = (ref.landmarks || []).some(l => l.type === "Gate" && (ref.currentOpenGateIds || []).includes(String(l.id)) && (l.paddockA === p.name || l.paddockB === p.name));
      const fillColour = mode === "paddocks" ? (colourForPaddock(p) || "#999999") : (mode === "notes" ? "#e2e8f0" : "#38bdf8");
      const fillOpacity = mode === "paddocks" ? 0.45 : (mode === "notes" ? 0.2 : 0.15);
      const strokeColor = mode === "notes" ? "#94a3b8" : (isGateOpen ? "#eab308" : "#ffffff");
      const strokeWeight = mode === "notes" ? 1 : (isGateOpen ? 3 : (mode === "paddocks" ? 2 : 1.5));

      if (ref.polygons[p.id]) {
        // Polygon exists — just update its visual properties, never touch geometry or recreate
        // This is the key: setOptions() does NOT affect the map viewport at all
        ref.polygons[p.id].setOptions({ fillColor: fillColour, fillOpacity, strokeColor, strokeWeight });
      } else {
        // New paddock — create polygon for the first time
        const poly = new g.Polygon({ paths: path, strokeColor, strokeWeight, fillColor: fillColour, fillOpacity, map });
        if (!drawMode) {
          poly.addListener("click", (e) => {
            if (editingShapeIdRef.current) return; // reshaping — clicks are vertex edits
            // Resolve the CURRENT paddock record at click time (closure copy goes stale)
            const fresh = (mapInstanceRef.current?.paddockList || [p]).find(x => String(x.id) === String(p.id)) || p;
            if (onPickPinRef.current) { onPickPinRef.current(e.latLng.lat(), e.latLng.lng(), fresh.name); }
            else { onSelect(fresh); }
          });
        }
        ref.polygons[p.id] = poly;
      }
    });

    // Remove polygons for deleted paddocks only
    Object.keys(ref.polygons).forEach(pid => {
      if (!seenIds.has(Number(pid))) {
        try { ref.polygons[pid].setMap(null); } catch {}
        delete ref.polygons[pid];
      }
    });

    ref.bounds = newBounds;
    ref.paddockList = paddocks;
  }, [paddocks, mode]);
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.polygons || !window.google?.maps) return;
    ref.currentInsightMode = insightMode;
    ref.currentPaddockStats = paddockStats;
    ref.paddockList = paddocks; // keep current for mob overlay centroid lookups
    // Clear ALL existing label markers first (prevents stale name labels when paddocks rename)
    if (ref.labelMarkers) {
      Object.values(ref.labelMarkers).forEach(lm => { try { lm?.setMap?.(null); } catch {} });
      ref.labelMarkers = {};
    }
    // Refresh name-keyed centroids so mob markers find renamed paddocks correctly
    if (ref.centroids) {
      paddocks.forEach((p) => {
        const cen = ref.centroids[p.id];
        if (cen) ref.centroids[p.name] = cen; // keep name alias up to date
      });
    }
    // Update polygon colours — keyed by ID so renames are transparent
    // In livestock mode keep the blue outline style; only update colours in paddocks mode
    paddocks.forEach((p) => {
      const poly = ref.polygons[p.id];
      if (!poly) return;
      if (mode === "livestock") {
        poly.setOptions({ fillColor: "#38bdf8", fillOpacity: 0.15 });
      } else if (mode === "notes") {
        poly.setOptions({ fillColor: "#e2e8f0", fillOpacity: 0.2, strokeColor: "#94a3b8", strokeWeight: 1 });
      } else {
        const fill = colourForPaddock(p);
        if (fill) poly.setOptions({ fillColor: fill, fillOpacity: 0.45 });
      }
    });
    // Redraw all labels via persistent Set — guaranteed no ghosts regardless of which effect drew them
    if (ref.map) {
      const z = ref.map.getZoom();
      const g = window.google.maps;
      clearAllLabels(); // clears every marker ever registered
      if (ref.labelMarkers) ref.labelMarkers = {};
      dedupePaddocksForLabels(paddocks, (p) => ref.centroids?.[p.id]).forEach((p) => {
        const cen = ref.centroids?.[p.id];
        if (!cen) return;
        const newLm = updateLabelForZoom(g, ref.map, cen, p, { setMap: () => {} }, z, insightMode, paddockStats);
        if (ref.labelMarkers) ref.labelMarkers[p.id] = newLm || null;
        trackLabel(newLm);
      });
    }
  }, [insightMode, paddockStats, paddocks]);

  // ── Shape editing: make the selected paddock's polygon editable ─────────────
  // Google Maps editing shows draggable corner handles plus a faint midpoint
  // handle between every pair of corners — dragging a midpoint creates a new
  // corner, so any shape can be formed. Tapping a corner removes it. The area
  // (ha) is recomputed live on every change.
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    const g = window.google?.maps;
    editingShapeIdRef.current = editShapePaddockId || null;
    if (!editShapePaddockId || !ref?.map || !g) return;
    const poly = ref.polygons?.[editShapePaddockId];
    if (!poly) return;

    const originalPath = poly.getPath().getArray().map(pt => ({ lat: pt.lat(), lng: pt.lng() }));
    poly.setOptions({ editable: true, zIndex: 999, strokeColor: "#22c55e", strokeWeight: 3, fillOpacity: 0.08 });

    const reportHa = () => {
      let ha = 0;
      try { ha = g.geometry.spherical.computeArea(poly.getPath()) / 10000; } catch {}
      onShapeEditHa?.(Math.round(ha * 10) / 10);
    };
    if (shapeEditRef) shapeEditRef.current = {
      getLatLngs: () => poly.getPath().getArray().map(pt => [pt.lat(), pt.lng()]),
      restore: () => { try { poly.setPath(originalPath); } catch {} },
    };
    const path = poly.getPath();
    const l1 = path.addListener("insert_at", reportHa);
    const l2 = path.addListener("set_at", reportHa);
    const l3 = path.addListener("remove_at", reportHa);
    // Tap a corner to remove it (a triangle is the minimum shape)
    const l4 = poly.addListener("click", (e) => {
      if (e.vertex !== undefined && poly.getPath().getLength() > 3) {
        poly.getPath().removeAt(e.vertex);
      }
    });
    reportHa();
    return () => {
      try { g.event.removeListener(l1); g.event.removeListener(l2); g.event.removeListener(l3); g.event.removeListener(l4); } catch {}
      poly.setOptions({ editable: false, zIndex: 0, strokeColor: "#ffffff", strokeWeight: 2, fillOpacity: 0.45 });
      if (shapeEditRef) shapeEditRef.current = null;
      editingShapeIdRef.current = null;
    };
  }, [editShapePaddockId, mapReadyTick]);

  // Separate effect: update draw polygon without rebuilding map
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref?.map || !window.google?.maps || !drawPoints.length) return;
    // Remove old draw overlays
    if (ref.drawOverlays) ref.drawOverlays.forEach(o => { try { o.setMap(null); } catch {} });
    const g = window.google.maps;
    const path = drawPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    const poly = new g.Polygon({
      paths: path, strokeColor: "#22c55e", strokeWeight: 3,
      fillColor: "#22c55e", fillOpacity: drawPoints.length > 2 ? 0.3 : 0,
      map: ref.map, clickable: false,
    });
    const dots = drawPoints.map((p, i) => new g.Marker({
      position: { lat: p.lat, lng: p.lng }, map: ref.map,
      label: { text: String(i+1), fontSize: "11px", fontWeight: "bold", color: "#fff" },
      icon: { path: g.SymbolPath.CIRCLE, scale: 10, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      zIndex: 200, clickable: false,
    }));
    ref.drawOverlays = [poly, ...dots];
  }, [drawPoints]);

  // Separate effect: update draggable pin position without rebuilding map
  React.useEffect(() => {
    const ref = mapInstanceRef.current;
    if (!ref || !landmarkPinMode) return;
    // Find and update the pin marker position directly
    const pinM = ref.overlays?.find?.(o => o._isLandmarkPin);
    if (pinM && landmarkPinPos) {
      try { pinM.setPosition?.({ lat: landmarkPinPos.lat, lng: landmarkPinPos.lng }); } catch {}
    }
  }, [landmarkPinPos, landmarkPinMode]);

  return <div ref={mapDivRef} className="w-full h-full" />;
}


function geojsonToPaddocks(geojson) {
  const features = geojson?.features || (geojson?.type === "Feature" ? [geojson] : []);
  return features.map((f, i) => {
    const props = f.properties || {};
    const name = props.name || props.Name || props.NAME || props.paddock || `Paddock ${i + 1}`;
    // Always calculate ha from geometry — GeoJSON property values are often wrong
    // (AgriWebb exports in acres, or uses rounded values)
    let ha = 0;
    if (f.geometry) {
      const geom = f.geometry;
      let ring = null;
      if (geom.type === "Polygon") ring = geom.coordinates[0];
      else if (geom.type === "MultiPolygon") ring = geom.coordinates[0][0];
      if (ring) ha = ringAreaHa(ring);
    }
    // Fall back to stored property only if geometry is missing
    if (!ha) {
      ha = Number(props.ha || props.area_ha || props.Area || props.area || 0);
    }
    return {
      id: Date.now() + i,
      name: String(name),
      ha: ha ? Math.round(Number(ha) * 10) / 10 : 0,
      landUse: "Grazing",
      pasture: "Native grass",
      colour: PADDOCK_COLOURS[i % PADDOCK_COLOURS.length],
      geojson: f.geometry || null,
    };
  });
}

const ACTION_FIELDS = {
  Recount: [{ label: "New head count", type: "number", placeholder: "e.g. 140" }],
  WEC: [{ label: "WEC count (epg)", type: "number", placeholder: "e.g. 350" }, { label: "Date", type: "date" }, { label: "Notes", type: "text", placeholder: "e.g. Pre-drench" }],
  "Ent/mgmt group": [{ label: "Management group", type: "text", placeholder: "e.g. Breeders" }],
  Move: [{ label: "Move to paddock", type: "select", options: [] }, { label: "Date", type: "date" }],
  "Draft/Split": [{ label: "Number to split off", type: "number" }, { label: "New mob name", type: "text" }],
  Treat: [{ label: "_treatment_picker", type: "treatment_picker" }, { label: "Date", type: "date" }, { label: "Notes", type: "text", placeholder: "e.g. Pre-joining" }],
  Weigh: [{ label: "Average weight (kg)", type: "number" }, { label: "Date", type: "date" }],
  ADG: [{ label: "Assumed ADG (kg/day)", type: "number", placeholder: "e.g. 0.2" }],
  Death: [{ label: "Number of deaths", type: "number" }, { label: "Cause", type: "text" }],
  Sale: [{ label: "Number sold", type: "number" }, { label: "Sale price ($/hd)", type: "number" }],
  Transfer: [{ label: "Transfer to property", type: "select", options: [] }, { label: "Number transferred", type: "number" }, { label: "Date moved", type: "date" }],
  DSE: [{ label: "DSE rating per head", type: "number", placeholder: "e.g. 1.5" }],
  Scan: [
    { label: "Date scanned", type: "date" },
    { label: "Empty (head)", type: "number", placeholder: "e.g. 12" },
    { label: "Singles (head)", type: "number", placeholder: "e.g. 180" },
    { label: "Twins (head)", type: "number", placeholder: "e.g. 24" },
    { label: "Triplets (head)", type: "number", placeholder: "e.g. 0" },
    { label: "Late scans / uncertain (head)", type: "number", placeholder: "e.g. 5" },
    { label: "Notes", type: "text", placeholder: "e.g. Scanned by Elders" },
  ],
  Score: [{ label: "_score_counter", type: "score_counter" }, { label: "Date", type: "date" }, { label: "Notes", type: "text", placeholder: "e.g. Pre-joining assessment" }],
  Merge: [{ label: "Merge into mob", type: "select", options: [] }],
  Copy: [
    { label: "New mob name", type: "text", placeholder: "e.g. Coleraine cows 2" },
    { label: "Copy to paddock", type: "select", options: [] },
    { label: "Number of stock", type: "number", placeholder: "e.g. 150" },
  ],
  Delete: [],
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end z-[250]">
      <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 flex-shrink-0"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
        <div className="flex justify-between items-center px-5 pt-2 pb-3 flex-shrink-0 border-b border-slate-100">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X size={16} /></button>
          <h2 className="font-bold text-lg text-slate-800">{title}</h2>
          <div className="w-8" />
        </div>
        <div className="overflow-y-auto px-5 pt-4 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function ListModal({ title, items, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
          <span className="font-medium text-slate-700">{it.label}</span>
          {it.value && <span className="text-slate-400 text-sm">{it.value}</span>}
        </div>
      ))}
    </Modal>
  );
}

const TREATMENT_FIELDS = [
  { key: "title", label: "Product name", type: "text", placeholder: "e.g. Cydectin Pour-On" },
  { key: "withholdingMeat", label: "WHP - Meat", type: "text", placeholder: "e.g. 21 days" },
  { key: "withholdingESI", label: "WHP - ESI", type: "text", placeholder: "e.g. 7 days" },
  { key: "dosage", label: "Dosage", type: "text", placeholder: "e.g. 1mL per 10kg" },
  { key: "containerUnit", label: "Container unit", type: "select", options: ["L", "mL", "kg", "g", "Doses", "Units"] },
  { key: "containerSize", label: "Container size", type: "number", placeholder: "e.g. 5 (per container)" },
  { key: "numContainers", label: "Number of containers", type: "number", placeholder: "e.g. 4" },
  { key: "batchNumber", label: "Batch number", type: "text", placeholder: "e.g. B12345" },
  { key: "manufactureDate", label: "Manufacture date", type: "date" },
  { key: "expiryDate", label: "Expiry date", type: "date" },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Any additional notes..." },
];

const SPRAY_FIELDS = [
  { key: "title", label: "Chemical name", type: "text", placeholder: "e.g. RoundUp" },
  { key: "treatmentDate", label: "Treatment date", type: "date" },
  { key: "location", label: "Location / paddock", type: "text", placeholder: "e.g. North paddock" },
  { key: "areaTreated", label: "Area treated (ha)", type: "number", placeholder: "e.g. 25" },
  { key: "quantity", label: "Quantity used", type: "text", placeholder: "e.g. 5L in 100L water" },
  { key: "applicationRate", label: "Application rate", type: "text", placeholder: "e.g. 2L/ha" },
  { key: "applicationMethod", label: "Application method", type: "select", options: ["Boom spray", "Spot spray", "Aerial", "Drench", "Granules", "Other"] },
  { key: "whp", label: "WHP (days)", type: "text", placeholder: "e.g. 14 days" },
  { key: "esi", label: "ESI (days)", type: "text", placeholder: "e.g. 7 days" },
  { key: "batchNumber", label: "Batch number", type: "text", placeholder: "e.g. B12345" },
  { key: "containerUnit", label: "Container unit", type: "select", options: ["L", "mL", "kg", "g", "Units"] },
  { key: "containerSize", label: "Container size", type: "number", placeholder: "e.g. 5 (per container)" },
  { key: "numContainers", label: "Number of containers", type: "number", placeholder: "e.g. 2" },
  { key: "expiryDate", label: "Expiry date", type: "date" },
  { key: "notes", label: "Notes", type: "textarea", placeholder: "Any additional notes..." },
];

// Legacy alias so existing InventoryForm references still work
const INVENTORY_FIELDS = TREATMENT_FIELDS;

function InventoryForm({ values, onChange, fields = TREATMENT_FIELDS }) {
  return (
    <div className="space-y-3 mb-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>
          {f.type === "select" ? (
            <select value={values[f.key] || ""} onChange={(e) => onChange(f.key, e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
              <option value="">Select...</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === "textarea" ? (
            <textarea value={values[f.key] || ""} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
          ) : (
            <input type={f.type} value={values[f.key] || ""} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
          )}
        </div>
      ))}
    </div>
  );
}


// ── My Schedule Widget ────────────────────────────────────────────────────────
// Shows today's (or tomorrow's if after 5pm) workflow tasks for the logged-in user.
// Expands to a 7-day week view on tap. Pulls from the published workflow snapshot.
function MyScheduleWidget({ currentUser, api, setTab }) {
  const [schedule, setSchedule] = React.useState(null); // { tasks, staffName, week }
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  // After 5pm show tomorrow's tasks, otherwise today's
  const now = new Date();
  const showTomorrow = now.getHours() >= 17;
  const targetDate = new Date(now);
  if (showTomorrow) targetDate.setDate(targetDate.getDate() + 1);

  // Get Monday of the week containing targetDate
  function getMonday(d) {
    const r = new Date(d); r.setHours(0,0,0,0);
    const dy = r.getDay(); r.setDate(r.getDate() + (dy === 0 ? -6 : 1 - dy));
    return r;
  }
  function toISO(d) {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  }
  function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
  function fmtShort(d) { return new Date(d).toLocaleDateString("en-AU", {day:"numeric", month:"short"}); }

  // Match user's account name against workflow task assignedStaff
  // Handles: "Simon Close" account → "Simon" workflow staff, or vice versa
  function matchesUser(assignedStaff, userName) {
    if (!assignedStaff?.length || !userName) return false;
    const lname = userName.toLowerCase().trim();
    const firstName = lname.split(" ")[0];
    const lastName = lname.split(" ").slice(1).join(" ");
    return assignedStaff.some(s => {
      const ls = s.toLowerCase().trim();
      const sFirst = ls.split(" ")[0];
      // Exact match
      if (ls === lname) return true;
      // First name matches (e.g. "Simon" matches "Simon Close")
      if (sFirst === firstName) return true;
      // Account first name matches staff full name
      if (firstName === ls) return true;
      // Partial: staff name is a substring of account name
      if (lname.includes(ls) || ls.includes(firstName)) return true;
      return false;
    });
  }

  React.useEffect(() => {
    setLoading(true);
    api.getWorkflow()
      .then(data => {
        const published = data?.published || data?.tasks || [];
        const weekStart = getMonday(targetDate);
        const weekEnd = addDays(weekStart, 6);

        // Build 7-day schedule for this user
        const weekTasks = published.filter(t => {
          const td = new Date(t.date);
          return td >= weekStart && td <= weekEnd && matchesUser(t.assignedStaff, currentUser?.name);
        });

        // Group by day
        const byDay = {};
        DAYS.forEach((d, i) => {
          const dayDate = toISO(addDays(weekStart, i));
          byDay[d] = { tasks: weekTasks.filter(t => t.day === d), date: dayDate, idx: i };
        });

        const targetDay = DAYS[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1];

        setSchedule({ byDay, weekStart, targetDay, userName: currentUser?.name || "You" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentUser?.name]);

  const COLOUR_MAP = {
    default: { bg: "#f5f5f4", bd: "#a8a29e", tx: "#44403c" },
    blue:    { bg: "#dbeafe", bd: "#3b82f6", tx: "#1e40af" },
    green:   { bg: "#dcfce7", bd: "#16a34a", tx: "#15803d" },
    red:     { bg: "#fee2e2", bd: "#ef4444", tx: "#b91c1c" },
    amber:   { bg: "#fef3c7", bd: "#d97706", tx: "#92400e" },
    yellow:  { bg: "#fef3c7", bd: "#d97706", tx: "#92400e" },
    purple:  { bg: "#f3e8ff", bd: "#a855f7", tx: "#6b21a8" },
  };
  const colFor = (v) => COLOUR_MAP[v] || COLOUR_MAP.default;

  if (loading) return (
    <div className="bg-white border border-stone-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 text-stone-400 text-sm">
      <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin flex-shrink-0" />
      Loading schedule…
    </div>
  );

  if (!schedule) return null;

  const { byDay, weekStart, targetDay, userName } = schedule;
  const todayTasks = byDay[targetDay]?.tasks || [];
  const firstName = userName?.split(" ")[0] || "You";
  const dayLabel = showTomorrow ? "Tomorrow" : "Today";

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden">
      {/* Header row — compact, always visible */}
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              {firstName}'s Schedule
            </span>
          </div>
          <span className="text-xs text-stone-400">{expanded ? "▲ Less" : "This week ▾"}</span>
        </div>

        {/* Today's tasks preview */}
        {todayTasks.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
            <span>Nothing assigned {dayLabel.toLowerCase()} · {fmtShort(byDay[targetDay]?.date)}</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {todayTasks.slice(0, 3).map(t => {
              const c = colFor(t.color);
              return (
                <div key={t.id} className={`flex items-start gap-2 ${t.completed ? "opacity-50" : ""}`}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: c.bd }} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium text-stone-700 ${t.completed ? "line-through" : ""}`}>{t.content}</span>
                    <span className="text-xs text-stone-400 ml-1.5">{t.farm}</span>
                  </div>
                  {t.completed && <span className="text-xs text-green-600 font-semibold flex-shrink-0">✓</span>}
                </div>
              );
            })}
            {todayTasks.length > 3 && (
              <div className="text-xs text-stone-400 pl-3.5">+{todayTasks.length - 3} more</div>
            )}
          </div>
        )}

        {/* Day label badge */}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${showTomorrow ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
            {dayLabel} · {fmtShort(byDay[targetDay]?.date)}
          </span>
          {todayTasks.length > 0 && (
            <span className="text-xs text-stone-400">{todayTasks.filter(t => t.completed).length}/{todayTasks.length} done</span>
          )}
        </div>
      </button>

      {/* 7-day expanded view — only shows today onwards, not past days */}
      {expanded && (
        <div className="border-t border-stone-100">
          {DAYS.map((day, i) => {
            const dayData = byDay[day];
            const dayTasks = dayData?.tasks || [];
            const isTarget = day === targetDay;
            const isPast = new Date(dayData?.date) < new Date(new Date().toDateString());
            const allDone = dayTasks.length > 0 && dayTasks.every(t => t.completed);

            // Skip past days entirely — only show today onwards
            if (isPast && !isTarget) return null;

            return (
              <div key={day} className={`border-b border-stone-50 last:border-0 ${isTarget ? "bg-amber-50/40" : ""} ${isPast && !isTarget ? "opacity-50" : ""}`}>
                <div className="px-4 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isTarget ? "text-amber-700" : "text-stone-600"}`}>
                        {i === (now.getDay() === 0 ? 6 : now.getDay() - 1) && !showTomorrow ? "Today" :
                         i === (targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1) && showTomorrow ? "Tomorrow" :
                         day}
                      </span>
                      <span className="text-xs text-stone-400">{fmtShort(dayData?.date)}</span>
                    </div>
                    {dayTasks.length > 0 && (
                      <span className={`text-xs font-semibold ${allDone ? "text-green-600" : "text-stone-400"}`}>
                        {allDone ? "✓ All done" : `${dayTasks.filter(t=>t.completed).length}/${dayTasks.length}`}
                      </span>
                    )}
                  </div>
                  {dayTasks.length === 0 ? (
                    <span className="text-xs text-stone-300 italic">Nothing assigned</span>
                  ) : (
                    <div className="space-y-1">
                      {dayTasks.map(t => {
                        const c = colFor(t.color);
                        return (
                          <div key={t.id} className={`flex items-start gap-2 ${t.completed ? "opacity-50" : ""}`}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: c.bd }} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium text-stone-700 ${t.completed ? "line-through" : ""}`}>{t.content}</span>
                              <span className="text-xs text-stone-400 ml-1.5 text-[10px]">{t.farm}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <button
            onClick={() => { setExpanded(false); setTab("workflow"); }}
            className="w-full text-center py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Open full workflow →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Weather Widget ────────────────────────────────────────────────────────────
// Uses Open-Meteo (free, no API key, BOM-quality data for Australia)
// Fetches once on mount, caches for 30 min in sessionStorage
function WeatherWidget({ farmName, farmCenters }) {
  const [weather, setWeather] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const centre = farmCenters[farmName] || farmCenters["Arundale"];
    if (!centre) return;
    const [lat, lng] = centre;
    const cacheKey = `kw_weather_${farmName}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 30 * 60 * 1000) { setWeather(data); setLoading(false); return; }
      } catch {}
    }
    setLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,windspeed_10m_max,winddirection_10m_dominant,weathercode&hourly=windspeed_10m,windgusts_10m,precipitation_probability,relativehumidity_2m&timezone=Australia%2FSydney&forecast_days=7`)
      .then(r => r.json())
      .then(d => {
        const data = processWeather(d);
        setWeather(data);
        setLoading(false);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}
      })
      .catch(() => setLoading(false));
  }, [farmName]);

  function processWeather(d) {
    const daily = d.daily;
    const hourly = d.hourly;
    return daily.time.map((date, i) => {
      const rain = daily.precipitation_sum[i] || 0;
      const maxTemp = daily.temperature_2m_max[i];
      const minTemp = daily.temperature_2m_min[i];
      const windMax = daily.windspeed_10m_max[i];
      const windDir = daily.winddirection_10m_dominant[i];
      const rainProb = daily.precipitation_probability_max[i];
      const wCode = daily.weathercode[i];
      const frostRisk = minTemp <= 2 ? "HIGH" : minTemp <= 5 ? "MOD" : null;

      // Spray window: calculate for ALL 7 days from hourly data
      const sprayHours = [];
      if (hourly) {
        hourly.time.forEach((t, hi) => {
          if (!t.startsWith(date)) return;
          const hour = parseInt(t.split("T")[1]);
          const wind = hourly.windspeed_10m[hi];
          const precip = hourly.precipitation_probability[hi];
          const rh = hourly.relativehumidity_2m[hi];
          if (wind < 20 && precip < 20 && rh < 90 && hour >= 7 && hour <= 18) {
            sprayHours.push(hour);
          }
        });
      }

      // Need at least 2 contiguous hours for a viable spray window
      let sprayOk = false;
      let sprayWindow = null;
      if (sprayHours.length >= 2) {
        sprayOk = true;
        // Show actual time window for every day in the forecast
        const start = Math.min(...sprayHours);
        const end = Math.max(...sprayHours) + 1;
        sprayWindow = `${start}:00–${end}:00`;
      }

      const dirLabels = ["N","NE","E","SE","S","SW","W","NW"];
      const windDirLabel = dirLabels[Math.round(windDir / 45) % 8] || "";
      return { date, rain, maxTemp, minTemp, windMax, windDirLabel, rainProb, frostRisk, sprayWindow, sprayOk, wCode };
    });
  }

  function weatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 2) return "⛅";
    if (code <= 3) return "☁️";
    if (code <= 49) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "🌤️";
  }

  function dayLabel(dateStr, i) {
    if (i === 0) return "Today";
    if (i === 1) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-AU", { weekday: "short" });
  }

  if (loading) return (
    <div className="bg-white border border-stone-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 text-stone-400 text-sm">
      <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin flex-shrink-0" />
      Loading weather for {farmName}…
    </div>
  );

  if (!weather || weather.length === 0) return null;

  const today = weather[0];
  const sprayDaysAhead = weather.filter(d => d.sprayOk).length;

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{weatherIcon(today.wCode)}</span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">{farmName} Weather</span>
          </div>
          <div className="flex items-center gap-2">
            {!expanded && sprayDaysAhead > 0 && (
              <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                🌿 {sprayDaysAhead} spray day{sprayDaysAhead > 1 ? "s" : ""} ahead
              </span>
            )}
            <span className="text-xs text-stone-400">{expanded ? "▲ Less" : "7 days ▾"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold text-stone-800">{Math.round(today.maxTemp)}°</span>
            <span className="text-sm text-stone-400">/{Math.round(today.minTemp)}°</span>
          </div>
          {today.rain > 0 && <span className="text-sm text-blue-600 font-semibold">💧{today.rain.toFixed(1)}mm</span>}
          {today.rain === 0 && today.rainProb > 20 && <span className="text-sm text-blue-400">{today.rainProb}% rain</span>}
          <span className="text-sm text-stone-500">{today.windMax}km/h {today.windDirLabel}</span>
          {today.frostRisk && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${today.frostRisk === "HIGH" ? "bg-blue-100 text-blue-700" : "bg-blue-50 text-blue-500"}`}>
              ❄️ Frost {today.frostRisk}
            </span>
          )}
          {today.sprayWindow && (
            <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              🌿 Spray {today.sprayWindow}
            </span>
          )}
          {!today.sprayOk && <span className="text-xs text-stone-300">No spray window</span>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100">
          {weather.map((day, i) => (
            <div key={day.date}
              className={`px-4 py-2.5 border-b border-stone-50 last:border-0 ${i === 0 ? "bg-stone-50/60" : ""} ${day.sprayOk && i > 0 ? "bg-green-50/40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-14 text-xs font-bold text-stone-600 flex-shrink-0">{dayLabel(day.date, i)}</div>
                <span className="flex-shrink-0">{weatherIcon(day.wCode)}</span>
                <div className="flex items-baseline gap-0.5 flex-shrink-0">
                  <span className="text-sm font-bold text-stone-700">{Math.round(day.maxTemp)}°</span>
                  <span className="text-xs text-stone-400">/{Math.round(day.minTemp)}°</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 text-xs flex-wrap">
                  {day.rain > 0
                    ? <span className="text-blue-600 font-semibold">💧{day.rain.toFixed(1)}mm</span>
                    : day.rainProb > 20
                      ? <span className="text-blue-400">{day.rainProb}%</span>
                      : null}
                  <span className="text-stone-400">{day.windMax}km/h</span>
                  {day.frostRisk && <span className="text-blue-600 font-semibold">❄️</span>}
                </div>
                {/* Spray status — right edge, colour-coded */}
                <div className="flex-shrink-0">
                  {day.sprayOk ? (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                      🌿 {day.sprayWindow || "Spray OK"}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-300 px-2 py-1 rounded-full border border-stone-100 whitespace-nowrap">
                      ✕ No spray
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 text-center">
            <span className="text-[10px] text-stone-300">BOM via Open-Meteo · Spray: wind &lt;20km/h, rain &lt;20%, RH &lt;90%, 7am–6pm</span>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Stock breakdown — horizontal bar charts of head counts ──────────────────
const STOCK_BAR_COLOURS = ["#2ea8c9", "#5cb85c", "#f5a623", "#e8c917", "#9b6dd7", "#f78fb3", "#e05252", "#8a97a5"];

function StockBars({ rows }) {
  if (rows.length === 0) return <div className="text-xs text-slate-400 italic py-2">No stock recorded</div>;
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => {
        const pct = Math.max(6, Math.round((r.value / max) * 100));
        return (
          <div key={r.label} className="flex items-center gap-2">
            <div className="w-24 text-xs text-slate-500 font-medium flex-shrink-0 leading-tight">{r.label}</div>
            <div className="flex-1 flex items-center bg-slate-100 rounded-lg h-7 overflow-hidden">
              <div className="h-full rounded-lg flex items-center justify-end flex-shrink-0"
                style={{ width: `${pct}%`, backgroundColor: STOCK_BAR_COLOURS[i % STOCK_BAR_COLOURS.length] }}>
                {pct >= 40 && <span className="text-white text-xs font-bold px-2">{r.value.toLocaleString()}</span>}
              </div>
              {pct < 40 && <span className="text-slate-600 text-xs font-semibold px-2">{r.value.toLocaleString()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function groupStockRows(list, key) {
  const counts = {};
  list.forEach(m => {
    const k = (m[key] && m[key] !== "Unassigned") ? m[key] : "Unassigned";
    counts[k] = (counts[k] || 0) + (Number(m.count) || 0);
  });
  const rows = Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  if (rows.length > 7) {
    const extra = rows.splice(7);
    rows.push({ label: `Other (${extra.length})`, value: extra.reduce((s, r) => s + r.value, 0) });
  }
  return rows;
}

function SpeciesBreakdownCard({ title, list }) {
  const [dim, setDim] = React.useState("type");
  const DIMS = [["type", "Type"], ["ageClass", "Age"], ["mgmtGroup", "Mgmt tag"], ["breed", "Breed"]];
  return (
    <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="font-semibold text-stone-700 text-sm">{title}</div>
        <div className="flex gap-1">
          {DIMS.map(([k, label]) => (
            <button key={k} onClick={() => setDim(k)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${dim === k ? "bg-stone-700 text-white" : "bg-white border border-stone-200 text-stone-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <StockBars rows={groupStockRows(list, dim)} />
    </div>
  );
}

function StockBreakdown({ mobs }) {
  const cattle = mobs.filter(m => m.species === "Cattle" || m.species === "Bulls");
  const sheep = mobs.filter(m => m.species === "Sheep" || m.species === "Rams");
  const other = mobs.filter(m => !(m.species === "Cattle" || m.species === "Bulls" || m.species === "Sheep" || m.species === "Rams"));
  const dse = (list) => Math.round(list.reduce((s, m) => s + (Number(m.count) || 0) * (Number(m.dse) || 0), 0));
  const heads = (list) => list.reduce((s, m) => s + (Number(m.count) || 0), 0);
  const dseRows = [
    { label: "Cattle", value: dse(cattle) },
    { label: "Sheep", value: dse(sheep) },
    ...(other.length ? [{ label: "Other", value: dse(other) }] : []),
  ].filter(r => r.value > 0);
  if (mobs.length === 0) return <div className="text-sm text-stone-400 italic p-3">No livestock data loaded yet.</div>;
  return (
    <div className="space-y-3">
      {cattle.length > 0 && <SpeciesBreakdownCard title={`🐄 Cattle · ${heads(cattle).toLocaleString()} hd`} list={cattle} />}
      {sheep.length > 0 && <SpeciesBreakdownCard title={`🐑 Sheep · ${heads(sheep).toLocaleString()} hd`} list={sheep} />}
      {dseRows.length > 0 && (
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
          <div className="font-semibold text-stone-700 text-sm mb-2">🌿 Livestock by DSE</div>
          <StockBars rows={dseRows} />
        </div>
      )}
    </div>
  );
}

function HomeScreen({ setTab, setFarmName, setFarmsMobs, setFarmsPaddocks, setFarmsLandmarks, farmsMobs, farmsPaddocks, farmName, totalCattle, totalSheep, totalDSE, farmSummaries, rainfall, setShowRainfall, isOnline, pendingChanges, syncCount, syncing, handleSync, setShowPaddockList, paddocks, LOGO_DATA_URI, api, farmCenters, currentUser, homeFarm, setHomeFarm }) {
  const [dashLoading, setDashLoading] = React.useState(false);
  const [showStock, setShowStock] = React.useState(false); // stock breakdown collapse

  const enterFarm = async (name) => {
    setFarmName(name);
    setHomeFarm(name);
    // Load fresh data for this farm if not already loaded
    if (!farmsMobs[name]?.length && !farmsPaddocks[name]?.length) {
      setDashLoading(true);
      try {
        const [mobsRes, paddocksRes] = await Promise.all([
          api.listMobs(name),
          api.listPaddocks(name),
        ]);
        setFarmsMobs((prev) => ({ ...prev, [name]: mobsRes }));
        setFarmsPaddocks((prev) => ({ ...prev, [name]: paddocksRes }));
      } catch { /* silent */ }
      setDashLoading(false);
    }
  };

  // Farm-specific dashboard (matches AgriWebb screenshot)
  if (homeFarm) {
    const fMobs = farmsMobs[homeFarm] || [];
    const fPaddocks = farmsPaddocks[homeFarm] || [];
    const fCattle = fMobs.filter(m => m.species === "Cattle" || m.species === "Bulls").reduce((s, m) => s + m.count, 0);
    const fSheep = fMobs.filter(m => m.species === "Sheep" || m.species === "Rams").reduce((s, m) => s + m.count, 0);
    const fDSE = fMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
    const totalHa = fPaddocks.reduce((s, p) => s + (Number(p.ha) || 0), 0);
    const grazedHa = fPaddocks.filter(p => !NON_GRAZING_LAND_USES.has(p.landUse) || !p.landUse || p.landUse === "").reduce((s, p) => s + (Number(p.ha) || 0), 0);
    const nonGrazingHa = fPaddocks.filter(p => NON_GRAZING_LAND_USES.has(p.landUse)).reduce((s, p) => s + (Number(p.ha) || 0), 0);
    // AVG DSE/ha only counts grazing land — veg/conservation zones excluded
    const avgDseHa = grazedHa > 0 ? (fDSE / grazedHa).toFixed(2) : "0.00";

    if (dashLoading) return (
      <div className="pb-24 bg-stone-50 min-h-screen">
        <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setHomeFarm(null)} className="flex items-center gap-1.5 text-sm font-medium text-stone-500">
              <span className="text-stone-400">←</span> All Farms
            </button>
            <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="h-8 rounded-lg" />
          </div>
          <div className="font-bold text-2xl tracking-tight text-stone-900">{homeFarm}</div>
        </div>
        <div className="flex items-center justify-center h-48 text-stone-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          Loading {homeFarm} data…
        </div>
      </div>
    );

    return (
      <div className="pb-24 bg-stone-50 min-h-screen">
        {/* Clean white header with maroon accent */}
        <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setHomeFarm(null)} className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700">
              <span className="text-stone-400">←</span> All Farms
            </button>
            <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="h-8 rounded-lg" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-bold text-2xl tracking-tight text-stone-900">{homeFarm}</div>
              <div className="text-xs text-stone-400 mt-0.5 font-medium">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
            <div className="w-1 h-10 rounded-full bg-amber-500 opacity-60" />
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3">
          {/* Paddocks summary */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <span className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Paddocks</span>
              <button onClick={() => setShowPaddockList(true)} className="text-xs text-amber-700 font-semibold hover:text-amber-900">View all →</button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-stone-100">
              {[
                { label: "PADDOCKS",    value: fPaddocks.length,          accent: "border-l-blue-400" },
                { label: "TOTAL HA",    value: totalHa.toFixed(0),        accent: "border-l-amber-400" },
                { label: "GRAZING HA",  value: grazedHa.toFixed(0),       accent: "border-l-green-400" },
                { label: "OTHER HA",    value: nonGrazingHa.toFixed(0),   accent: "border-l-stone-300" },
              ].map(({ label, value, accent }) => (
                <div key={label} className={`p-4 border-l-4 ${accent}`}>
                  <div className="text-2xl font-bold text-stone-800 tracking-tight">{value}</div>
                  <div className="text-[10px] text-stone-400 font-semibold tracking-widest mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobs summary */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <span className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Livestock</span>
              <button onClick={() => setTab("livestock")} className="text-xs text-amber-700 font-semibold hover:text-amber-900">View all mobs →</button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-stone-100">
              {[
                { label: "CATTLE",    value: fCattle.toLocaleString(), accent: "border-l-red-800" },
                { label: "SHEEP",     value: fSheep.toLocaleString(), accent: "border-l-amber-500" },
                { label: "TOTAL DSE", value: fDSE.toLocaleString(undefined, { maximumFractionDigits: 0 }), accent: "border-l-green-500" },
                { label: "AVG DSE/HA", value: avgDseHa, accent: "border-l-stone-400" },
              ].map(({ label, value, accent }) => (
                <div key={label} className={`p-4 border-l-4 ${accent}`}>
                  <div className="text-2xl font-bold text-stone-800 tracking-tight">{value}</div>
                  <div className="text-[10px] text-stone-400 font-semibold tracking-widest mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock breakdown — this farm's numbers, tap the arrow to expand */}
          <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
            <button onClick={() => setShowStock(v => !v)} className="w-full flex items-center justify-between px-4 py-3">
              <span className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Stock Breakdown</span>
              <span className={`text-stone-400 text-xs transition-transform duration-200 inline-block ${showStock ? "rotate-180" : ""}`}>▼</span>
            </button>
            {showStock && <div className="px-3 pb-3"><StockBreakdown mobs={fMobs} /></div>}
          </div>

          {/* Weather & Schedule — always visible regardless of which farm is open */}
          <WeatherWidget farmName={homeFarm} farmCenters={farmCenters} />
          <MyScheduleWidget currentUser={currentUser} api={api} setTab={setTab} />

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTab("map")} className="bg-white rounded-2xl p-4 border border-stone-200/80 text-left hover:border-amber-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg mb-2">🗺️</div>
              <div className="font-semibold text-stone-700 text-sm">Map</div>
              <div className="text-xs text-stone-400 mt-0.5">Paddocks & livestock</div>
            </button>
            <button onClick={() => setTab("livestock")} className="bg-white rounded-2xl p-4 border border-stone-200/80 text-left hover:border-amber-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-lg mb-2">🐄</div>
              <div className="font-semibold text-stone-700 text-sm">Livestock</div>
              <div className="text-xs text-stone-400 mt-0.5">Mobs & actions</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All-farms overview (default home screen)
  return (
  <div className="pb-24 bg-stone-50 min-h-screen">

    {/* ── Clean white header ── */}
    <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-4">
      <div className="flex items-center justify-between">
        <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="h-10 rounded-xl" />
        <div className="flex items-center gap-2">
          {isOnline && syncCount === 0 && pendingChanges === 0 && (
            <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-2.5 py-1 rounded-full font-semibold">✓ Live</span>
          )}
          {(syncCount > 0 || pendingChanges > 0) && (
            <button onClick={handleSync} disabled={syncing} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-semibold">
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          )}
          {!isOnline && (
            <span className="text-xs bg-stone-100 text-stone-500 border border-stone-200 px-2.5 py-1 rounded-full font-semibold">📡 Offline</span>
          )}
        </div>
      </div>
      <div className="text-xs text-stone-400 font-medium mt-2">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>

      {/* All-farms totals — clean inline strip */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: "CATTLE", value: totalCattle.toLocaleString(), accent: "border-l-red-800" },
          { label: "SHEEP",  value: totalSheep.toLocaleString(),  accent: "border-l-amber-500" },
          { label: "DSE",    value: totalDSE.toLocaleString(undefined, { maximumFractionDigits: 0 }), accent: "border-l-green-600" },
        ].map(({ label, value, accent }) => (
          <div key={label} className={`bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5 border-l-4 ${accent}`}>
            <div className="text-lg font-bold text-stone-800 tracking-tight leading-none">{value}</div>
            <div className="text-[10px] text-stone-400 font-semibold tracking-widest mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="px-4 pt-4 space-y-3">

      {/* Stock breakdown — all farms combined, tap the arrow to expand */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
        <button onClick={() => setShowStock(v => !v)} className="w-full flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Stock Breakdown — All Farms</span>
          <span className={`text-stone-400 text-xs transition-transform duration-200 inline-block ${showStock ? "rotate-180" : ""}`}>▼</span>
        </button>
        {showStock && <div className="px-3 pb-3"><StockBreakdown mobs={Object.values(farmsMobs).flat()} /></div>}
      </div>

      {/* ── Weather ── */}
      <WeatherWidget farmName={farmName} farmCenters={farmCenters} />

      {/* ── My Schedule ── */}
      <MyScheduleWidget currentUser={currentUser} api={api} setTab={setTab} />

      {/* ── Workflow — clean card, amber accent ── */}
      <button
        onClick={() => setTab("workflow")}
        className="w-full bg-white border border-stone-200/80 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-amber-300 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl flex-shrink-0">📋</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-stone-800">Weekly Workflow</div>
          <div className="text-xs text-stone-400 mt-0.5">Tasks, staff & machinery planning</div>
        </div>
        <div className="w-1.5 h-8 rounded-full bg-amber-400 flex-shrink-0" />
      </button>

      {/* ── Farm tiles ── */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Properties</span>
        <span className="text-xs text-stone-400">Tap for dashboard</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {farmSummaries.map(({ name, cattle, sheep, dse }) => (
          <button
            key={name}
            onClick={() => enterFarm(name)}
            className="bg-white rounded-2xl p-4 border border-stone-200/80 text-left hover:border-amber-300 transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-stone-800 text-sm leading-tight">{name}</div>
              <div className="w-1 h-5 rounded-full bg-amber-400 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
            </div>
            <div className="space-y-0.5">
              {cattle > 0 && <div className="text-xs text-stone-500">🐄 {cattle.toLocaleString()}</div>}
              {sheep > 0 && <div className="text-xs text-stone-500">🐑 {sheep.toLocaleString()}</div>}
              {cattle === 0 && sheep === 0 && <div className="text-xs text-stone-400 italic">No livestock</div>}
              {dse > 0 && <div className="text-xs font-semibold text-stone-600 mt-1">{dse.toLocaleString(undefined, { maximumFractionDigits: 0 })} DSE</div>}
            </div>
          </button>
        ))}
      </div>

      {/* ── Feeding Systems — clean 2-col ── */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Feeding Systems</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setTab("cattle_feeding")} className="bg-white border border-stone-200/80 rounded-2xl p-4 text-left hover:border-red-200 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-xl mb-2.5">🐄</div>
          <div className="font-semibold text-stone-700 text-sm">Cattle Feeding</div>
          <div className="text-xs text-stone-400 mt-0.5">Pens · rations</div>
        </button>
        <button onClick={() => setTab("sheep_feeding")} className="bg-white border border-stone-200/80 rounded-2xl p-4 text-left hover:border-amber-200 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl mb-2.5">🐑</div>
          <div className="font-semibold text-stone-700 text-sm">Sheep Feeding</div>
          <div className="text-xs text-stone-400 mt-0.5">Pens · rations</div>
        </button>
      </div>

      {/* ── Rainfall ── */}
      <div className="flex items-center justify-between pt-1 px-0.5">
        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Rainfall · {farmName}</span>
        <button className="text-xs text-amber-700 font-semibold" onClick={() => setShowRainfall(true)}>Records →</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80">
          <div className="text-[10px] text-stone-400 font-semibold tracking-widest mb-1">YTD</div>
          <div className="text-2xl font-bold text-stone-800 tracking-tight">
            {Math.round(rainfall.filter((r) => r.date?.slice(0, 4) === String(new Date().getFullYear())).reduce((s, r) => s + Number(r.mm || 0), 0))}<span className="text-sm font-medium text-stone-400 ml-0.5">mm</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80">
          <div className="text-[10px] text-stone-400 font-semibold tracking-widest mb-1">365 DAYS</div>
          <div className="text-2xl font-bold text-stone-800 tracking-tight">
            {(() => {
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - 365);
              const cutoffStr = cutoff.toISOString().slice(0, 10);
              return Math.round(rainfall.filter((r) => r.date >= cutoffStr).reduce((s, r) => s + Number(r.mm || 0), 0));
            })()}<span className="text-sm font-medium text-stone-400 ml-0.5">mm</span>
          </div>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-stone-100 border border-stone-200 text-stone-600 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium">
          📡 Offline — changes will sync when you reconnect
        </div>
      )}
    </div>
  </div>
  ); // end all-farms return

}

function WorkflowScreen({ setTab, currentAccount }) {
  const iframeRef = React.useRef(null);
  const isAdminOrManager = currentAccount?.role === "Admin" || currentAccount?.role === "Manager";

  // Workers see the published/read-only workflow — full edit only for Admin/Manager
  // The iframe handles this via the role passed in postMessage

  const sendCreds = React.useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      iframe.contentWindow?.postMessage({
        type: "KW_INIT",
        apiBase: API_BASE_URL,
        token: getStoredToken() || "",
        role: currentAccount?.role || "Worker",
        userName: currentAccount?.name || "",
        userEmail: currentAccount?.email || "",
      }, "*");
    } catch (e) { /* cross-origin */ }
  }, []);

  React.useEffect(() => {
    // Listen for the iframe signalling it's ready
    const onMsg = (e) => { if (e.data?.type === "KW_WORKFLOW_READY") sendCreds(); };
    window.addEventListener("message", onMsg);
    // Also try sending after short delays as a fallback in case the ready
    // event fired before our listener was attached
    const t1 = setTimeout(sendCreds, 500);
    const t2 = setTimeout(sendCreds, 1500);
    const t3 = setTimeout(sendCreds, 3000);
    return () => {
      window.removeEventListener("message", onMsg);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [sendCreds]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-amber-600 text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setTab("home")} className="text-white/80 text-sm flex items-center gap-1 font-medium">← Home</button>
        <span className="font-semibold tracking-tight">Weekly Workflow</span>
        <div className="w-16" />
      </div>
      <iframe
        ref={iframeRef}
        src={`${API_BASE_URL}/workflow.html`}
        title="Weekly Workflow Planner"
        className="flex-1 w-full border-0"
        onLoad={sendCreds}
        style={{ height: "calc(100vh - 52px)", minHeight: 600 }}
      />
    </div>
  );

}

function CattleFeedingScreen({ setTab, showToast, api }) {
  const [cattleTab, setCattleTab] = React.useState("loads"); // loads | details | manage
  const [loads, setLoads] = React.useState([]);
  const [mobs, setMobs] = React.useState([]);
  const [assignments, setAssignments] = React.useState([]);
  const [elements, setElements] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [recipes, setRecipes] = React.useState([]);
  const [selectedLoad, setSelectedLoad] = React.useState(null);
  const [feederName, setFeederName] = React.useState(() => localStorage.getItem("kw_feeder") || "");
  const [loading, setLoading] = React.useState(true);
  const [showAddLoad, setShowAddLoad] = React.useState(false);
  const [showAddMobForm, setShowAddMobForm] = React.useState(false);
  const [newLoadName, setNewLoadName] = React.useState("");
  const [newMobForm, setNewMobForm] = React.useState({});
  const [manageTab, setManageTab] = React.useState("elements");

  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getCattleLoads(), api.getCattleMobs(), api.getCattleAssignments(),
      api.getCattleElements(), api.getCattleClasses(), api.getCattleRecipes(),
    ]).then(([l, m, a, e, c, r]) => {
      setLoads(l); setMobs(m); setAssignments(a);
      setElements(e); setClasses(c); setRecipes(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalOnFeed = mobs.filter(m => assignments.some(a => a.mobName === m.name))
    .reduce((s, m) => s + m.headCount, 0);

  const getMobsForLoad = (loadName) => {
    const assigned = assignments.filter(a => a.loadName === loadName);
    return assigned.map(a => ({ ...a, mob: mobs.find(m => m.name === a.mobName) })).filter(a => a.mob);
  };

  const getLoadIngredients = (loadName) => {
    const loadMobs = getMobsForLoad(loadName);
    const totals = {};
    loadMobs.forEach(({ mob, multiplier }) => {
      const classRecipes = recipes.filter(r => r.className === mob.className);
      classRecipes.forEach(r => {
        const kg = mob.headCount * Number(r.rate) * Number(mob.feedMultiplier) * Number(multiplier || 1);
        totals[r.elementName] = (totals[r.elementName] || 0) + kg;
      });
    });
    return Object.entries(totals).map(([name, kg]) => ({ name, kg }));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400">Loading Cattle Feeding System...</div>
    </div>
  );

  // Load detail view
  if (selectedLoad) {
    const ingredients = getLoadIngredients(selectedLoad.name);
    const loadMobs = getMobsForLoad(selectedLoad.name);
    const totalKg = ingredients.reduce((s, i) => s + i.kg, 0);
    return (
      <div className="pb-24 bg-stone-50 min-h-screen">
        <div className="bg-white border-b border-stone-200 px-5 py-4 flex items-center gap-3">
          <button onClick={() => setSelectedLoad(null)} className="text-white/70">← Back</button>
          <h1 className="text-lg font-bold flex-1">{selectedLoad.name}</h1>
        </div>
        <div className="p-4 space-y-3">
          {feederName === "" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
              <label className="text-xs font-bold text-amber-700 block mb-1">YOUR NAME (for records)</label>
              <input value={feederName} onChange={e => { setFeederName(e.target.value); localStorage.setItem("kw_feeder", e.target.value); }}
                placeholder="Enter your name" className="w-full border border-amber-200 rounded-xl px-3 py-2 bg-white text-sm" />
            </div>
          )}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase mb-3">Mixer Wagon Load — {feederName || "Set your name above"}</div>
            {ingredients.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-4">No recipes configured for the mobs in this load.</div>
            ) : ingredients.map(({ name, kg }) => (
              <div key={name} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                <span className="font-semibold text-slate-700">{name}</span>
                <span className="font-extrabold text-red-950 text-lg">{kg.toFixed(0)} kg</span>
              </div>
            ))}
            {ingredients.length > 0 && (
              <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-slate-200">
                <span className="font-bold text-slate-600">TOTAL</span>
                <span className="font-extrabold text-2xl text-red-950">{totalKg.toFixed(0)} kg</span>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Mobs in this load</div>
            {loadMobs.map(({ mob, id }) => (
              <div key={id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="font-semibold text-slate-700 text-sm">{mob.name}</div>
                  <div className="text-xs text-slate-400">{mob.className} · {mob.paddock}</div>
                </div>
                <div className="font-bold text-slate-600">{mob.headCount} head</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Management view
  if (cattleTab === "manage") {
    return (
      <div className="pb-24 bg-stone-50 min-h-screen">
        <div className="bg-white border-b border-stone-200 px-5 py-4 flex items-center gap-3">
          <button onClick={() => setCattleTab("loads")} className="text-white/70">← Back</button>
          <h1 className="text-lg font-bold flex-1">Cattle Management</h1>
        </div>
        <div className="flex gap-1 px-4 pt-4 pb-2 overflow-x-auto">
          {["elements","classes","mobs","loads"].map(t => (
            <button key={t} onClick={() => setManageTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 border ${manageTab===t ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4 space-y-3">
          {manageTab === "elements" && (
            <>
              {elements.map(e => (
                <div key={e.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-700">{e.name}</div>
                    <div className="text-xs text-slate-400">{e.unit} · Default: {e.defaultRate} · {e.costPerUnit} {e.costUnit}</div>
                  </div>
                  <button onClick={async () => { await api.deleteCattleElement(e.id); setElements(prev => prev.filter(x => x.id !== e.id)); }} className="text-rose-400 text-xs font-bold px-3 py-1 bg-rose-50 rounded-full">Remove</button>
                </div>
              ))}
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <div className="text-xs font-bold text-slate-500 mb-2">Add Element</div>
                {[["Name","name","text"],["Unit (kg/head or L/head)","unit","text"],["Default rate","defaultRate","number"],["Cost per unit","costPerUnit","number"]].map(([label,key,type]) => (
                  <div key={key} className="mb-2">
                    <label className="text-xs text-slate-400 font-semibold block mb-1">{label}</label>
                    <input type={type} value={newMobForm[key]||""} onChange={e => setNewMobForm(p=>({...p,[key]:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
                  </div>
                ))}
                <button onClick={async () => {
                  const created = await api.createCattleElement({ name: newMobForm.name||"New Element", unit: newMobForm.unit||"kg/head", defaultRate: Number(newMobForm.defaultRate)||0, costPerUnit: Number(newMobForm.costPerUnit)||0, costUnit: "$/tonne" });
                  setElements(prev => [...prev, created]); setNewMobForm({});
                }} className="w-full bg-red-900 text-white rounded-2xl py-2.5 font-bold text-sm mt-2">Add Element</button>
              </div>
            </>
          )}
          {manageTab === "classes" && (
            <>
              {classes.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-slate-700">{c.name}</span>
                  <button onClick={async () => { await api.deleteCattleClass(c.id); setClasses(prev => prev.filter(x => x.id !== c.id)); }} className="text-rose-400 text-xs font-bold px-3 py-1 bg-rose-50 rounded-full">Remove</button>
                </div>
              ))}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-2">
                <input value={newMobForm.className||""} onChange={e => setNewMobForm(p=>({...p,className:e.target.value}))} placeholder="Class name e.g. Spring U Bulls" className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
                <button onClick={async () => {
                  const created = await api.createCattleClass({ name: newMobForm.className });
                  setClasses(prev => [...prev, created]); setNewMobForm({});
                }} className="bg-red-900 text-white rounded-xl px-4 font-bold text-sm">Add</button>
              </div>
            </>
          )}
          {manageTab === "mobs" && (
            <>
              {mobs.map(m => (
                <div key={m.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between">
                    <div className="font-bold text-slate-700">{m.name}</div>
                    <button onClick={async () => { await api.deleteCattleMob(m.id); setMobs(prev => prev.filter(x => x.id !== m.id)); }} className="text-rose-400 text-xs font-bold">Remove</button>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{m.className} · {m.paddock} · {m.headCount} head</div>
                </div>
              ))}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-500 mb-1">Add Mob</div>
                {[["Mob name","mobName"],["Paddock","mobPaddock"],["Head count","mobHead"]].map(([label,key]) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">{label}</label>
                    <input value={newMobForm[key]||""} onChange={e => setNewMobForm(p=>({...p,[key]:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Class</label>
                  <select value={newMobForm.mobClass||""} onChange={e => setNewMobForm(p=>({...p,mobClass:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <button onClick={async () => {
                  const created = await api.createCattleMob({ name: newMobForm.mobName, className: newMobForm.mobClass||"", paddock: newMobForm.mobPaddock||"", headCount: Number(newMobForm.mobHead)||0 });
                  setMobs(prev => [...prev, created]); setNewMobForm({});
                }} className="w-full bg-red-900 text-white rounded-2xl py-2.5 font-bold text-sm">Add Mob</button>
              </div>
            </>
          )}
          {manageTab === "loads" && (
            <>
              {loads.map(l => {
                const loadMobNames = assignments.filter(a => a.loadName === l.name);
                return (
                  <div key={l.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-700">{l.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{loadMobNames.length} mob{loadMobNames.length!==1?"s":""} assigned</div>
                      </div>
                      <button onClick={async () => { await api.deleteCattleLoad(l.id); setLoads(prev=>prev.filter(x=>x.id!==l.id)); }} className="text-rose-400 text-xs font-bold">Remove</button>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Assign a mob to this load</label>
                      <div className="flex gap-2">
                        <select value={newMobForm[`assign_${l.name}`]||""} onChange={e => setNewMobForm(p=>({...p,[`assign_${l.name}`]:e.target.value}))} className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white">
                          <option value="">Select mob...</option>
                          {mobs.map(m => <option key={m.id} value={m.name}>{m.name} ({m.headCount})</option>)}
                        </select>
                        <button onClick={async () => {
                          if (!newMobForm[`assign_${l.name}`]) return;
                          const created = await api.createCattleAssignment({ loadName: l.name, mobName: newMobForm[`assign_${l.name}`], multiplier: 1 });
                          setAssignments(prev => [...prev, created]); setNewMobForm(p=>({...p,[`assign_${l.name}`]:""}));
                        }} className="bg-red-900 text-white rounded-xl px-3 font-bold text-sm">Add</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-2">
                <input value={newLoadName} onChange={e => setNewLoadName(e.target.value)} placeholder="Load name e.g. Load 1" className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
                <button onClick={async () => {
                  if (!newLoadName.trim()) return;
                  const created = await api.createCattleLoad({ name: newLoadName.trim() });
                  setLoads(prev => [...prev, created]); setNewLoadName("");
                }} className="bg-red-900 text-white rounded-xl px-4 font-bold text-sm">Add</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main loads list
  return (
    <div className="pb-24 bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-5">
        <button onClick={() => setTab("home")} className="text-white/70 text-sm mb-3 flex items-center gap-1">← Home</button>
        <div className="text-3xl mb-1">🐄</div>
        <div className="text-2xl font-bold tracking-tight">Cattle Feeding System</div>
        <div className="text-white/70 text-sm mt-1">Mixer wagon loads & recipes</div>
      </div>
      <div className="px-4 -mt-4 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Feeder name</label>
          <input value={feederName} onChange={e => { setFeederName(e.target.value); localStorage.setItem("kw_feeder", e.target.value); }}
            placeholder="Enter your name" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-500">Total cattle on feed</div>
          <div className="text-3xl font-extrabold text-red-950">{totalOnFeed.toLocaleString()}</div>
        </div>
        {loads.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100">
            No loads yet. Tap Manage to set up elements, classes, mobs and loads.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase px-1">Select a load</div>
            {[...loads].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(l => {
              const count = assignments.filter(a => a.loadName === l.name && mobs.some(m => m.name === a.mobName)).length;
              return (
                <button key={l.id} onClick={() => setSelectedLoad(l)} className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between text-left">
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{l.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{count} mob{count!==1?"s":""}</div>
                  </div>
                  <span className="text-slate-300 text-xl">›</span>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={() => setCattleTab("manage")} className="w-full bg-slate-100 text-slate-700 rounded-2xl py-3 font-bold text-sm">⚙️ Manage Elements, Mobs & Loads</button>
      </div>
    </div>
  );

}

function SheepFeedingScreen({ setTab, showToast, api }) {
  const [sheepTab, setSheepTab] = React.useState("run");
  const [pens, setPens] = React.useState([]);
  const [settings, setSettings] = React.useState({ splitAm: 0.6, splitPm: 0.4 });
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [runPeriod, setRunPeriod] = React.useState("AM");
  const [feeder, setFeeder] = React.useState(() => localStorage.getItem("kw_feeder") || "");
  const [showAddPen, setShowAddPen] = React.useState(false);
  const [newPenForm, setNewPenForm] = React.useState({});

  React.useEffect(() => {
    setLoading(true);
    Promise.all([api.getSheepPens(), api.getSheepSettings(), api.getSheepHistory()])
      .then(([p, s, h]) => { setPens(p); setSettings(s || {}); setHistory(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalHead = pens.filter(p => p.active).reduce((s, p) => s + p.headCount, 0);
  const totalKg = pens.filter(p => p.active).reduce((s, p) => {
    const split = runPeriod === "AM" ? Number(settings.splitAm||0.6) : Number(settings.splitPm||0.4);
    return s + p.headCount * Number(p.kgPerHead||0) * (p.rationPercent||100)/100 * split;
  }, 0);

  const savePens = async (updated) => {
    setPens(updated);
    await api.saveSheepPens(updated);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400">Loading Sheep Feeding System...</div>
    </div>
  );

  return (
    <div className="pb-24 bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-5">
        <button onClick={() => setTab("home")} className="text-white/70 text-sm mb-3 flex items-center gap-1">← Home</button>
        <div className="text-3xl mb-1">🐑</div>
        <div className="text-2xl font-bold tracking-tight">Sheep Feeding System</div>
        <div className="text-white/70 text-sm mt-1">Pen feed runs & grain rosters</div>
      </div>
      <div className="flex gap-1 px-4 -mt-4 mb-3 overflow-x-auto">
        {[{id:"run",label:"🏃 Feed Run"},{id:"pens",label:"🐑 Pens"},{id:"history",label:"📋 History"}].map(t => (
          <button key={t.id} onClick={() => setSheepTab(t.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold flex-shrink-0 border ${sheepTab===t.id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-4 space-y-3">
        {sheepTab === "run" && (
          <>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-400 uppercase">Feeder</label>
                <div className="flex gap-1">
                  {["AM","PM"].map(p => (
                    <button key={p} onClick={() => setRunPeriod(p)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${runPeriod===p ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <input value={feeder} onChange={e => { setFeeder(e.target.value); localStorage.setItem("kw_feeder", e.target.value); }}
                placeholder="Your name" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 font-semibold">Total Head</div>
                  <div className="text-2xl font-extrabold text-slate-800">{totalHead.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="text-xs text-slate-400 font-semibold">Total kg ({runPeriod})</div>
                  <div className="text-2xl font-extrabold text-slate-800">{totalKg.toFixed(0)}</div>
                </div>
              </div>
            </div>
            {pens.filter(p => p.active).map((pen) => {
              const split = runPeriod === "AM" ? Number(settings.splitAm||0.6) : Number(settings.splitPm||0.4);
              const kg = pen.headCount * Number(pen.kgPerHead||0) * (pen.rationPercent||100)/100 * split;
              return (
                <div key={pen.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{pen.name}</div>
                      <div className="text-xs text-slate-400">{pen.ration} · {pen.headCount} head · {pen.kgPerHead} kg/head</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-slate-800">{kg.toFixed(0)}</div>
                      <div className="text-xs text-slate-400">kg</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {pens.filter(p=>p.active).length > 0 && (
              <button onClick={async () => {
                const entry = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), feeder, period: runPeriod, splitFraction: runPeriod==="AM" ? Number(settings.splitAm||0.6) : Number(settings.splitPm||0.4), events: pens.filter(p=>p.active).map(p=>({ penId: p.id, penName: p.name, kg: p.headCount * Number(p.kgPerHead||0) * (p.rationPercent||100)/100 })) };
                const created = await api.addSheepHistory(entry);
                setHistory(prev => [created, ...prev]);
                showToast("Feed run recorded ✓");
              }} className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold">
                ✓ Record Feed Run
              </button>
            )}
          </>
        )}
        {sheepTab === "pens" && (
          <>
            {pens.map((pen, i) => (
              <div key={pen.id} className={`bg-white rounded-2xl p-4 border shadow-sm ${pen.active ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-bold text-slate-800">{pen.name}</div>
                  <button onClick={() => { const updated = pens.map((p,j)=>j===i?{...p,active:!p.active}:p); savePens(updated); }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${pen.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {pen.active ? "Active" : "Inactive"}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["Head",pen.headCount,"headCount"],["kg/head",pen.kgPerHead,"kgPerHead"],["Ration %",pen.rationPercent,"rationPercent"]].map(([label,val,key]) => (
                    <div key={key}>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">{label}</label>
                      <input type="number" value={val} onChange={e => {
                        const updated = pens.map((p,j)=>j===i?{...p,[key]:Number(e.target.value)}:p);
                        savePens(updated);
                      }} className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white text-center font-bold" />
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Ration type</label>
                  <input value={pen.ration} onChange={e => { const updated = pens.map((p,j)=>j===i?{...p,ration:e.target.value}:p); savePens(updated); }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
                </div>
              </div>
            ))}
            {showAddPen ? (
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                {[["Pen name","penName","text"],["Head count","penHead","number"],["kg/head","penKg","number"]].map(([label,key,type]) => (
                  <div key={key}>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">{label}</label>
                    <input type={type} value={newPenForm[key]||""} onChange={e => setNewPenForm(p=>({...p,[key]:e.target.value}))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
                  </div>
                ))}
                <button onClick={async () => {
                  const newPen = { id: crypto.randomUUID(), name: newPenForm.penName||"New Pen", ration: "Grower", headCount: Number(newPenForm.penHead)||0, kgPerHead: Number(newPenForm.penKg)||0, rationPercent: 100, active: true };
                  await savePens([...pens, newPen]);
                  setNewPenForm({}); setShowAddPen(false);
                }} className="w-full bg-stone-800 text-white rounded-2xl py-2.5 font-semibold text-sm">Add Pen</button>
                <button onClick={() => setShowAddPen(false)} className="w-full text-slate-400 text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowAddPen(true)} className="w-full border-2 border-dashed border-slate-300 rounded-2xl py-3 text-slate-400 font-semibold text-sm">+ Add Pen</button>
            )}
          </>
        )}
        {sheepTab === "history" && (
          <>
            {history.length === 0 && <div className="text-center text-slate-400 py-6 text-sm">No feed runs recorded yet.</div>}
            {history.map((h) => (
              <div key={h.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-700">{new Date(h.startedAt).toLocaleDateString("en-AU", {weekday:"short",day:"numeric",month:"short"})}</div>
                    <div className="text-xs text-slate-400">{h.period} · {h.feeder}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-600">{Array.isArray(h.events) ? h.events.reduce((s,e)=>s+(Number(e.kg)||0),0).toFixed(0) : 0} kg</div>
                    <div className="text-xs text-slate-400">{Array.isArray(h.events) ? h.events.length : 0} pens</div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

}

export default function App() {
  // --- Splash screen ---
  const [showSplash, setShowSplash] = useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // --- Auth ---
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null); // full account object from the API
  const [authLoading, setAuthLoading] = useState(true); // true while we check for a stored session
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [locked, setLocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  // (invite via default password — no setup token needed)

  const [apiWaking, setApiWaking] = useState(false);

  // Ping the server health endpoint immediately on load to wake it up (Render free tier sleeps after 15min)
  React.useEffect(() => {
    fetch(`${VITE_API_URL.replace(/\/api$/, "")}/api/health`).catch(() => {});
  }, []); // true when API is slow to respond

  // On first load, try to restore a session from a stored token (so people stay logged in
  // across visits without re-entering credentials every time).
  React.useEffect(() => {
    const token = getStoredToken();
    if (!token) { setAuthLoading(false); return; }
    // Show "waking up" message after 2s if API is slow (Render free tier cold start)
    const wakingTimer = setTimeout(() => setApiWaking(true), 2000);
    // Hard timeout at 25s — enough for Render cold start, then fall through to login
    const timeout = setTimeout(() => {
      setAuthToken(null);
      setAuthLoading(false);
      setApiWaking(false);
    }, 25000);
    setAuthToken(token);
    api.me()
      .then(({ account }) => {
        if (account) {
          setCurrentAccount(account);
          setLoggedInEmail(account.email);
        } else {
          setAuthToken(null);
        }
      })
      .catch(() => {
        setAuthToken(null); // stored token was invalid/expired — force re-login
      })
      .finally(() => {
        clearTimeout(timeout);
        clearTimeout(wakingTimer);
        setAuthLoading(false);
        setApiWaking(false);
      });
    return () => { clearTimeout(timeout); clearTimeout(wakingTimer); };
  }, []);

  // --- Offline / sync ---
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingChanges, setPendingChanges] = useState(0);
  React.useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  const markChanged = () => { if (!isOnline) setPendingChanges((n) => n + 1); };

  const [tab, setTab] = useState("home");
  const [showMenu, setShowMenu] = useState(false);
  const pendingMenuAction = React.useRef(null); // kept for any legacy references
  const [showPaddockList, setShowPaddockList] = useState(false);
  const [homeFarm, setHomeFarm] = useState(null); // which farm dashboard is open on home screen
  const [dragMobId, setDragMobId] = useState(null);
  const [draggingMob, setDraggingMob] = useState(null);
  const livMapRef = React.useRef(null); // livestock map
  const padMapRef = React.useRef(null); // paddocks map
  const notesMapRef = React.useRef(null); // notes map
  const paddocksRef = React.useRef([]); // stable ref for use in effects declared before paddocks state
  const [dragOverPaddock, setDragOverPaddock] = useState(null);
  const [showPaddockPicker, setShowPaddockPicker] = useState(false); // bottom-sheet paddock picker in mob details
  const [showInsightPicker, setShowInsightPicker] = useState(false); // insight overlay picker on map
  const [farmsMobs, setFarmsMobs] = useState({ Arundale: [], Hamilton: [], "Kurra-Wirra": [], Mooralla: [], Carramar: [] });
  const [farmName, setFarmName] = useState("Arundale");
  const [farmsPaddocks, setFarmsPaddocks] = useState({ Arundale: [], Hamilton: [], "Kurra-Wirra": [], Mooralla: [], Carramar: [] });
  const paddocks = farmsPaddocks[farmName] || [];
  const setPaddocks = (updater) => {
    const targetFarm = farmName;
    setFarmsPaddocks((prev) => ({
      ...prev,
      [targetFarm]: typeof updater === "function" ? updater(prev[targetFarm] || []) : updater,
    }));
  };
  const [farmsLandmarks, setFarmsLandmarks] = useState({ Arundale: [], Hamilton: [], "Kurra-Wirra": [], Mooralla: [], Carramar: [] });
  const landmarks = farmsLandmarks[farmName] || [];
  const setLandmarks = (updater) => {
    const targetFarm = farmName;
    setFarmsLandmarks((prev) => ({
      ...prev,
      [targetFarm]: typeof updater === "function" ? updater(prev[targetFarm] || []) : updater,
    }));
  };
  const [showAddLandmark, setShowAddLandmark] = useState(false);
  const [landmarkPinPos, setLandmarkPinPos] = useState(null);
  const [landmarkPinStart, setLandmarkPinStart] = useState(null); // current map centre when pin placement opens
  const [currentMapCentre, setCurrentMapCentre] = useState(null); // tracks where user is on the map
  const [landmarkPinMode, setLandmarkPinMode] = useState(false);
  const [landmarkPinPlacing, setLandmarkPinPlacing] = useState(false);
  const [showPaddockAddMenu, setShowPaddockAddMenu] = useState(false);
  const [landmarkCategoryPick, setLandmarkCategoryPick] = useState(null);
  const [newLandmarkForm, setNewLandmarkForm] = useState({});
  const [landmarkDetail, setLandmarkDetail] = useState(null);
  const [landmarkEditMode, setLandmarkEditMode] = useState(false);
  const [confirmLmDel, setConfirmLmDel] = useState(false); // two-step landmark delete
  const [mapDrawMode, setMapDrawMode] = useState(false); // true while drawing a new paddock shape
  const [mapSpeciesFilter, setMapSpeciesFilter] = useState("All"); // livestock map pin filter
  const [shapeEditPaddock, setShapeEditPaddock] = useState(null); // paddock being reshaped on the map
  const [shapeEditHa, setShapeEditHa] = useState(null); // live ha readout while reshaping
  const shapeEditCtlRef = useRef(null); // { getLatLngs, restore } provided by the map
  const [drawPoints, setDrawPoints] = useState([]); // array of {x,y} in SVG space while drawing
  const [insightMode, setInsightMode] = useState("usage");
  const fileInputRef = useRef(null);
  const [showAddPaddock, setShowAddPaddock] = useState(false);
  const [newPaddockForm, setNewPaddockForm] = useState({});
  const [paddockDetail, setPaddockDetail] = useState(null);
  // Gate state is DERIVED from the landmark records (isOpen is stored on the
  // server), so open gates survive reloads and are shared between devices.
  const openGates = React.useMemo(
    () => landmarks.filter(l => l.type === "Gate" && l.isOpen).map(l => String(l.id)),
    [landmarks]
  );
  // ── Field Notes ──────────────────────────────────────────────────────────────
  const [fieldNotes, setFieldNotes] = useState([]);
  const [showFieldNotes, setShowFieldNotes] = useState(false);   // notes list screen
  const [fieldNoteForm, setFieldNoteForm] = useState(null);      // null = closed, {} = new, {id} = edit
  const [fieldNoteDetail, setFieldNoteDetail] = useState(null);  // viewing a note detail
  const [showNotesOnMap, setShowNotesOnMap] = useState(false);   // map pin layer toggle
  // Bulk spray state: which paddocks are selected for a multi-paddock spray record
  const [spraySelectedPaddocks, setSpraySelectedPaddocks] = useState([]);
  const [showBulkSpray, setShowBulkSpray] = useState(false);
  const [showFoo, setShowFoo] = useState(false);
  const [fooTargetPaddock, setFooTargetPaddock] = useState(null);
  const [fooForm, setFooForm] = useState({});
  const [fooHistory, setFooHistory] = useState([]);
  const [showSprayForm, setShowSprayForm] = useState(false);
  const [sprayFormPaddock, setSprayFormPaddock] = useState(null);
  const [sprayForm, setSprayForm] = useState({});
  // Google Maps API key is supplied at build/deploy time via Render's environment
  // variables (VITE_GOOGLE_MAPS_KEY) — never entered or stored in the app itself.
  const googleMapsKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_KEY) || "";
  const [mapLoadError, setMapLoadError] = useState(false);
  const [paddockEditMode, setPaddockEditMode] = useState(false);
  const paddockEditFormRef = React.useRef({}); // useRef not useState — keystrokes don't trigger App re-renders
  const [confirmPaddockDel, setConfirmPaddockDel] = useState(false); // two-step paddock delete
  const mobs = farmsMobs[farmName] || [];
  // setMobs captures farmName at the moment it's created — so async
  // callbacks resolving after a farm switch still write to the right farm
  const setMobs = (updater) => {
    const targetFarm = farmName;
    setFarmsMobs((prev) => ({
      ...prev,
      [targetFarm]: typeof updater === "function" ? updater(prev[targetFarm] || []) : updater,
    }));
  };
  const [editingMobId, setEditingMobId] = useState(null);
  const [customBreeds, setCustomBreeds] = useState({ Cattle: [], Sheep: [], Rams: [], Other: [] });
  const [showAllFarms, setShowAllFarms] = useState(false);
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [accounts, setAccounts] = useState([]);
  const currentUserId = currentAccount?.id ?? null;
  const [showAccounts, setShowAccounts] = useState(false);
  const [changePasswordValue, setChangePasswordValue] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");
  const [newAccountRole, setNewAccountRole] = useState("Worker");
  const currentUser = currentAccount || accounts.find((a) => a.id === currentUserId) || { name: "", email: "", role: "Worker" };
  const userRole = currentUser.role;
  const isAdmin = userRole === "Admin";
  const canEdit = userRole === "Admin" || userRole === "Manager";
  const [selectedMobId, setSelectedMobId] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [mobTab, setMobTab] = useState("Summary");
  const [mapMode, setMapMode] = useState("Livestock");
  const [showSwitchFarm, setShowSwitchFarm] = useState(false);
  const [actionForm, setActionForm] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [formValues, setFormValues] = useState({});
  const [toast, setToast] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [showFilter, setShowFilter] = useState("All mobs");
  const [groupBy, setGroupBy] = useState("By Paddock");
  const [pickerOpen, setPickerOpen] = useState(null); // 'show' | 'group' | null
  const [showAddMob, setShowAddMob] = useState(false);
  const [newMobForm, setNewMobForm] = useState({});
  const [history, setHistory] = useState({});
  const [notes, setNotes] = useState({});

  // Lazily load history + notes for a mob the first time it's opened
  React.useEffect(() => {
    if (!selectedMobId || !loggedInEmail) return;
    if (history[selectedMobId] && notes[selectedMobId]) return; // already loaded
    Promise.all([api.listMobHistory(selectedMobId), api.listMobNotes(selectedMobId)])
      .then(([h, n]) => {
        setHistory((prev) => ({ ...prev, [selectedMobId]: h.map((row) => ({ id: row.id, action: row.action, detail: row.detail, date: row.date, authorName: row.authorName })).reverse() }));
        setNotes((prev) => ({ ...prev, [selectedMobId]: n.map((row) => ({ id: row.id, text: row.text, author: row.authorName, date: row.createdAt })) }));
      })
      .catch(() => {});
  }, [selectedMobId, loggedInEmail]);
  const [noteDraft, setNoteDraft] = useState("");
  const [showFarmSubmenu, setShowFarmSubmenu] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [sprayInventory, setSprayInventory] = useState([]);
  const [inventoryType, setInventoryType] = useState("treatment"); // "treatment" | "spray"
  const [inventoryView, setInventoryView] = useState(null); // 'add' | item id
  const [inventoryForm, setInventoryForm] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [recordsType, setRecordsType] = useState("deaths");
  const [recordsDateFrom, setRecordsDateFrom] = useState("");
  const [recordsFilters, setRecordsFilters] = useState({}); // column key → selected value
  const [recordsSort, setRecordsSort] = useState(null); // { key, dir } from tapping a column header
  const [recordsDateTo, setRecordsDateTo] = useState("");
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [allMobHistory, setAllMobHistory] = useState([]); // all mob history across all mobs
  const [showRainfall, setShowRainfall] = useState(false);
  const [rainfall, setRainfall] = useState([]);
  const [rainfallForm, setRainfallForm] = useState({});

  // NOTE: No auto-close-menu effect here. The modals (z-150/200/250) render above
  // the menu (z-100) so they appear correctly without closing the menu first.
  // Closing the menu simultaneously caused a race condition where the modal state
  // was set but the menu unmount interrupted the render before the modal painted.
  // Inventory works correctly with this same pattern — modal opens on top of menu.
  React.useEffect(() => {
    if (!loggedInEmail) return;
    api.listRainfall(farmName).then(setRainfall).catch(() => {});
    api.listFieldNotes(farmName).then(setFieldNotes).catch(() => {}); // silent fail if table not ready
  }, [farmName, loggedInEmail]);

  // Load inventory from ALL accessible farms — inventory is shared across farms
  React.useEffect(() => {
    if (!loggedInEmail) return;
    Promise.all(accessibleFarms.map(f => api.listTreatments(f).catch(() => [])))
      .then(results => {
        const merged = results.flat();
        const seen = new Set();
        const unique = merged.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
        setInventory(unique.sort((a, b) => (a.title || "").localeCompare(b.title || "")));
      });
    Promise.all(accessibleFarms.map(f => api.listSprayInventory(f).catch(() => [])))
      .then(results => {
        const merged = results.flat();
        const seen = new Set();
        const unique = merged.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
        setSprayInventory(unique.sort((a, b) => (a.title || "").localeCompare(b.title || "")));
      });
  }, [loggedInEmail]); // eslint-disable-line
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  // Load all farm-scoped data from the API whenever we're logged in and/or the
  // selected farm changes, so every device sees the same live data.
  React.useEffect(() => {
    if (!loggedInEmail) return;
    let cancelled = false;
    const loadingFarm = farmName; // capture at effect start — won't change during this async run
    setDataLoading(true);
    setDataError("");
    Promise.all([
      api.listMobs(loadingFarm),
      api.listPaddocks(loadingFarm),
      api.listLandmarks(loadingFarm),
      api.listFoo(loadingFarm),
    ])
      .then(([mobsRes, paddocksRes, landmarksRes, fooRes]) => {
        if (cancelled) return;
        setFarmsMobs((prev) => ({ ...prev, [loadingFarm]: mobsRes }));
        setFarmsPaddocks((prev) => ({ ...prev, [loadingFarm]: paddocksRes }));
        setFarmsLandmarks((prev) => ({ ...prev, [loadingFarm]: landmarksRes }));
        setFooHistory((prev) => [...prev.filter((r) => r._farm !== loadingFarm), ...fooRes.map((r) => ({ ...r, _farm: loadingFarm }))]);
      })
      .catch((err) => {
        if (!cancelled) setDataError(err.message || "Couldn't load farm data");
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => { cancelled = true; };
  }, [loggedInEmail, farmName]);

  // ── Farm access control — must be declared before any effect that uses it ────
  const ALL_FARM_NAMES = ["Arundale", "Hamilton", "Kurra-Wirra", "Mooralla", "Carramar"];
  const accessibleFarms = React.useMemo(() => {
    if (!currentUser || currentUser.role === "Admin") return ALL_FARM_NAMES;
    const allowed = currentUser.allowedFarms || [];
    if (!Array.isArray(allowed) || allowed.length === 0) return ALL_FARM_NAMES;
    return ALL_FARM_NAMES.filter(f => allowed.includes(f));
  }, [currentUser]);

  // If current farmName is not accessible (e.g. after role change), reset to first accessible farm
  React.useEffect(() => {
    if (accessibleFarms.length > 0 && !accessibleFarms.includes(farmName)) {
      setFarmName(accessibleFarms[0]);
    }
  }, [accessibleFarms, farmName]);
  React.useEffect(() => {
    if (!loggedInEmail) return;
    const farmsToLoad = accessibleFarms;
    farmsToLoad.forEach((farm) => {
      setTimeout(() => {
        api.listMobs(farm)
          .then((res) => setFarmsMobs((prev) => {
            if (prev[farm] && prev[farm].length > 0) return prev;
            return { ...prev, [farm]: res };
          }))
          .catch(() => {});
      }, 1500);
    });
  }, [loggedInEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load accounts and remembered custom breeds once logged in (not farm-specific)
  React.useEffect(() => {
    if (!loggedInEmail) return;
    api.listAccounts().then(setAccounts).catch(() => {});
    api.listBreeds().then((grouped) => {
      setCustomBreeds({ Cattle: [], Sheep: [], Rams: [], Other: [], ...grouped });
    }).catch(() => {});
  }, [loggedInEmail]);
  const [showMobSummaryDetail, setShowMobSummaryDetail] = useState(false);
  const [pinSelected, setPinSelected] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng } once located
  const [locating, setLocating] = useState(false);
  const locateMe = () => {
    if (!navigator.geolocation) { showToast("Location isn't available on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        showToast("Couldn't get your location — check location permission for this app");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectedMob = mobs.find((m) => m.id === selectedMobId);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  // Keep paddocksRef in sync so effects declared early can use current paddocks
  paddocksRef.current = paddocks;

  // ── Field note pin-picking ────────────────────────────────────────────────
  // When _pickingPin is true, onPickPin is passed to GooglePaddockMap which wires it
  // into BOTH polygon clicks AND map clicks — so tapping inside a paddock works.
  const handlePickPin = React.useCallback((lat, lng, paddockName) => {
    const mapInstance = livMapRef.current?.map;
    if (mapInstance) mapInstance.setOptions({ draggableCursor: null });
    setFieldNoteForm(prev => ({
      ...prev,
      lat, lng, accuracyM: null, locationApprox: false,
      paddock: paddockName || prev?.paddock,
      _pickingPin: false,
    }));
  }, []);

  // Set crosshair cursor when pin-picking activates
  React.useEffect(() => {
    const mapInstance = livMapRef.current?.map;
    if (!mapInstance) return;
    if (fieldNoteForm?._pickingPin) {
      mapInstance.setOptions({ draggableCursor: "crosshair" });
    } else {
      mapInstance.setOptions({ draggableCursor: null });
    }
  }, [fieldNoteForm?._pickingPin]);

  const handleSync = async () => {
    if (!isOnline) { showToast("You're offline — changes will sync when you reconnect"); return; }
    if (syncing) return;
    setSyncing(true);
    try {
      const [mobsRes, paddocksRes, landmarksRes, fooRes, rainfallRes] = await Promise.all([
        api.listMobs(farmName),
        api.listPaddocks(farmName),
        api.listLandmarks(farmName),
        api.listFoo(farmName),
        api.listRainfall(farmName),
      ]);
      const loadingFarm = farmName;
      setFarmsMobs((prev) => ({ ...prev, [loadingFarm]: mobsRes }));
      setFarmsPaddocks((prev) => ({ ...prev, [loadingFarm]: paddocksRes }));
      setFarmsLandmarks((prev) => ({ ...prev, [loadingFarm]: landmarksRes }));
      setFooHistory((prev) => [...prev.filter((r) => r._farm !== loadingFarm), ...fooRes.map((r) => ({ ...r, _farm: loadingFarm }))]);
      setRainfall(rainfallRes);
      // Refresh inventory from all farms
      const [allTreatments, allSpray] = await Promise.all([
        Promise.all(accessibleFarms.map(f => api.listTreatments(f).catch(() => []))).then(r => r.flat()),
        Promise.all(accessibleFarms.map(f => api.listSprayInventory(f).catch(() => []))).then(r => r.flat()),
      ]);
      const dedup = (arr) => { const s = new Set(); return arr.filter(i => { if (s.has(i.id)) return false; s.add(i.id); return true; }).sort((a, b) => (a.title||"").localeCompare(b.title||"")); };
      setInventory(dedup(allTreatments));
      setSprayInventory(dedup(allSpray));
      setSyncCount(0);
      setPendingChanges(0);
      showToast("✓ All data refreshed from server");
    } catch (err) {
      showToast("Couldn't sync — check your connection");
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync when coming back online
  React.useEffect(() => {
    if (isOnline && loggedInEmail && pendingChanges > 0) {
      const t = setTimeout(() => handleSync(), 1500);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  // Periodic refresh every 60s while online — picks up changes from other devices/phones
  React.useEffect(() => {
    if (!loggedInEmail) return;
    const interval = setInterval(() => {
      if (!isOnline || syncing) return;
      const loadingFarm = farmName;
      Promise.all([api.listMobs(loadingFarm), api.listPaddocks(loadingFarm)])
        .then(([mobsRes, paddocksRes]) => {
          setFarmsMobs((prev) => ({ ...prev, [loadingFarm]: mobsRes }));
          setFarmsPaddocks((prev) => ({ ...prev, [loadingFarm]: paddocksRes }));
        })
        .catch(() => {}); // silent background refresh
    }, 60000); // every 60 seconds
    return () => clearInterval(interval);
  }, [loggedInEmail, farmName, isOnline, syncing]);

  const openAction = (name) => {
    if (name === "Edit") {
      const m = selectedMob;
      setNewMobForm({
        name: m.name,
        species: m.species,
        breed: m.breed,
        ageClass: m.ageClass,
        dobOption: "Do not track",
        mgmtGroup: m.mgmtGroup === "Unassigned" ? "" : m.mgmtGroup,
        tagColour: m.tag === "Unassigned" ? "" : m.tag,
        avgWeight: m.avgWeight || "",
        dse: m.dse,
        description: m.notes || "",
        paddock: m.paddock,
        size: m.count,
      });
      setEditingMobId(m.id);
      setShowMore(false);
      setShowAddMob(true);
      return;
    }
    const m = selectedMob;
    const prefill = {};
    (ACTION_FIELDS[name] || []).forEach((f) => {
      if (f.type === "date") prefill[f.label] = todayStr();
    });
    if (name === "Ent/mgmt group" && m.mgmtGroup && m.mgmtGroup !== "Unassigned") prefill["Management group"] = m.mgmtGroup;
    if (name === "Recount") prefill["New head count"] = m.count;
    if (name === "Copy") {
      prefill["New mob name"] = `${m.name} (copy)`;
      prefill["Copy to paddock"] = m.paddock;
      prefill["Number of stock"] = m.count;
    }
    if (name === "DSE") prefill["DSE rating per head"] = m.dse;
    if (name === "ADG" && m.assumedADG) prefill["Assumed ADG (kg/day)"] = m.assumedADG;
    if (name === "Score") prefill["_scores"] = []; // fresh counter each time
    setFormValues(prefill);
    setActionForm(name);
    if (name === "Delete") setDeleteConfirmText("");
  };

  const submitAction = async () => {
    const name = actionForm;
    const mobId = selectedMobId;
    const mob = mobs.find((m) => m.id === mobId);
    if (!mob) return;

    let patch = {};
    if (name === "Recount" && formValues["New head count"] !== undefined) {
      const newCount = Number(formValues["New head count"]);
      patch.count = newCount;
      // Recount to 0 — treat same as delete
      if (newCount === 0) {
        setMobs((prev) => prev.filter((m) => m.id !== mobId));
        setSelectedMobId(null);
        setActionForm(null);
        markChanged();
        try {
          await api.addMobHistory(mobId, { action: "Recount", detail: "Recounted to 0 — mob removed", date: formValues["Date"] || todayStr() });
          await api.deleteMob(mobId);
          showToast(`${mob.name} removed — recounted to 0`);
        } catch (err) {
          showToast(err.message || "Couldn't remove mob from server");
        }
        return;
      }
    }
    if (name === "Move" && formValues["Move to paddock"]) { patch.paddock = formValues["Move to paddock"]; patch.daysInPaddock = 0; }
    if (name === "Death" && formValues["Number of deaths"]) patch.count = Math.max(0, mob.count - Number(formValues["Number of deaths"]));
    if (name === "Sale" && formValues["Number sold"]) patch.count = Math.max(0, mob.count - Number(formValues["Number sold"]));
    if (name === "DSE" && formValues["DSE rating per head"]) patch.dse = Number(formValues["DSE rating per head"]);
    if (name === "Score" && formValues["Average condition score"]) {
      patch.lastScore = Number(formValues["Average condition score"]);
      patch.lastScoreDate = formValues["Date"] || todayStr();
    }
    if (name === "Treat") {
      const treatDate = formValues["Date"] || todayStr();
      patch.lastTreatDate = treatDate;
      patch.whpDays = Number(formValues["_whpDays"] || 0);
      patch.esiDays = Number(formValues["_esiDays"] || 0);
      // Deduct the CONFIRMED amounts from inventory (falls back to dose × head count)
      const selected = formValues["_selectedTreatments"] || [];
      const confirmedDoses = formValues["_doses"] || {};
      selected.forEach(async (t) => {
        const invItem = inventory.find(i => i.id === t.id);
        if (!invItem) return;
        let totalDose = Number(confirmedDoses[t.id]?.totalUsed) || 0;
        if (!totalDose) {
          const mobCount = mob?.count || 0;
          const doseMatch = String(invItem.dosage || "").match(/^([\d.]+)/);
          if (!doseMatch || !mobCount) return;
          totalDose = Number(doseMatch[1]) * mobCount;
        }
        const newUsed = (Number(invItem.quantityUsed) || 0) + totalDose;
        try {
          await api.updateTreatment(t.id, { quantityUsed: newUsed.toString() });
          setInventory(prev => prev.map(i => i.id === t.id ? { ...i, quantityUsed: newUsed.toString() } : i));
        } catch {}
      });
    }
    if (name === "Weigh" && formValues["Average weight (kg)"]) {
      patch.lastWeight = Number(formValues["Average weight (kg)"]);
      patch.lastWeightDate = formValues["Date"] || todayStr();
    }
    if (name === "ADG" && formValues["Assumed ADG (kg/day)"]) patch.assumedADG = Number(formValues["Assumed ADG (kg/day)"]);
    if (name === "Ent/mgmt group" && formValues["Management group"]) patch.mgmtGroup = formValues["Management group"];
    if (name === "WEC" && formValues["WEC count (epg)"]) {
      patch.wec = { count: formValues["WEC count (epg)"], date: formValues["Date"] || todayStr(), notes: formValues["Notes"] || "" };
    }

    // --- Delete ---
    if (name === "Delete") {
      setMobs((prev) => prev.filter((m) => m.id !== mobId));
      setSelectedMobId(null);
      setActionForm(null);
      markChanged();
      try {
        await api.deleteMob(mobId);
        showToast("Mob deleted");
      } catch (err) {
        showToast(err.message || "Couldn't delete mob on the server");
      }
      return;
    }

    // --- Copy ---
    if (name === "Copy" && formValues["New mob name"]) {
      // Copy keeps every attribute of the mob — only name, paddock and head
      // count change, so identical mobs can be set up once then duplicated
      const { id, farmId, createdAt, updatedAt, ...rest } = mob;
      const copyPaddock = formValues["Copy to paddock"] || rest.paddock;
      const copyCount = Number(formValues["Number of stock"]) > 0 ? Number(formValues["Number of stock"]) : rest.count;
      try {
        const created = await api.createMob(farmName, { ...rest, name: formValues["New mob name"], paddock: copyPaddock, count: copyCount, daysInPaddock: 0 });
        setMobs((prev) => [...prev, created]);
        showToast("Mob copied");
      } catch (err) {
        showToast(err.message || "Couldn't copy mob");
      }
      setActionForm(null);
      setShowMore(false);
      markChanged();
      return;
    }

    // --- Transfer (to another farm) ---
    if (name === "Transfer" && formValues["Transfer to property"] && formValues["Number transferred"]) {
      const destFarm = formValues["Transfer to property"];
      const transferCount = Number(formValues["Number transferred"]);
      const dateStr = formValues["Date moved"] || todayStr();
      try {
        const { source: updatedSource } = await api.transferMob(mobId, destFarm, transferCount, dateStr);
        setMobs((prev) => prev.map((m) => m.id === mobId ? updatedSource : m));
        showToast(`Transferred ${transferCount} head to ${destFarm}`);
      } catch (err) {
        showToast(err.message || "Couldn't complete transfer");
      }
      setActionForm(null);
      setShowMore(false);
      markChanged();
      return;
    }

    // --- Standard field update ---
    if (Object.keys(patch).length > 0) {
      setMobs((prev) => prev.map((m) => (m.id === mobId ? { ...m, ...patch } : m)));
      try {
        const updated = await api.updateMob(mobId, patch);
        setMobs((prev) => prev.map((m) => (m.id === mobId ? updated : m)));
      } catch (err) {
        showToast(err.message || "Couldn't save changes to the server");
      }
    }

    // --- History record ---
    let summary;
    if (name === "Score" && formValues["Average condition score"]) {
      const scores = formValues["_scores"] || [];
      summary = `Condition score: ${formValues["Average condition score"]}/5.0 (${scores.length} animal${scores.length !== 1 ? "s" : ""} scored${formValues["Notes"] ? " · " + formValues["Notes"] : ""})`;
    } else if (name === "Treat") {
      const selected = formValues["_selectedTreatments"] || [];
      const confirmedDoses = formValues["_doses"] || {};
      const names = selected.map(x => x.title).join(", ");
      const whp = formValues["_whpDays"];
      // One detail line per treatment: dose/head, total used, batch, expiry
      const doseLines = selected.map(t => {
        const inv = inventory.find(i => i.id === t.id) || t;
        const d = confirmedDoses[t.id] || {};
        const unit = d.unit || inv.containerUnit || "mL";
        const parts = [];
        if (d.dosePerHead) parts.push(`${d.dosePerHead} ${unit}/hd`);
        if (d.totalUsed) parts.push(`${d.totalUsed} ${unit} used`);
        if (inv.batchNumber) parts.push(`Batch ${inv.batchNumber}`);
        if (inv.expiryDate) parts.push(`Exp ${inv.expiryDate}`);
        return parts.length ? `↳ ${t.title} — ${parts.join(" · ")}` : null;
      }).filter(Boolean);
      summary = names
        ? `Treated: ${names}${whp ? ` · WHP ${whp}d` : ""}${formValues["_esiDays"] ? ` · ESI ${formValues["_esiDays"]}d` : ""}${formValues["Notes"] ? " · " + formValues["Notes"] : ""}${doseLines.length ? "\n" + doseLines.join("\n") : ""}`
        : "Treatment recorded";
    } else {
      summary = Object.entries(formValues)
        .filter(([k, v]) => v && !k.startsWith("_"))
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    const historyDate = formValues["Date"] || formValues["Date scanned"] || todayStr();
    setHistory((prev) => {
      const list = prev[mobId] || [];
      return {
        ...prev,
        [mobId]: [{ action: name, detail: summary || "Recorded", date: historyDate, authorName: currentUser?.name || null }, ...list],
      };
    });
    try {
      const created = await api.addMobHistory(mobId, { action: name, detail: summary || "Recorded", date: historyDate });
      // Update local entry with server-assigned id so it can be deleted later
      if (created?.id) {
        setHistory(prev => ({
          ...prev,
          [mobId]: (prev[mobId] || []).map((h, idx) => idx === 0 ? { ...h, id: created.id } : h),
        }));
      }
    } catch (err) {
      console.error("Couldn't save history entry:", err);
    }

    setActionForm(null);
    setShowMore(false);
    markChanged();
    showToast(`${name} recorded`);
  };

  // ── Menu pending action effect ──────────────────────────────────────────────

  const Header = ({ title, right }) => (
    <div className="bg-white/80 backdrop-blur-md flex items-center justify-between px-5 py-4 sticky top-0 z-10 border-b border-slate-100">
      <button onClick={() => setTab("home")} className="flex items-center gap-1 text-red-900">
        <span className="text-xs font-bold">🏠</span>
      </button>
      <div className="text-center">
        <h1 className="text-base font-bold text-slate-800 tracking-tight">{title}</h1>
        <div className="text-xs text-slate-400 font-medium">{farmName}</div>
      </div>
      <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
        {right || <HelpCircle size={16} />}
      </button>
    </div>
  );

  const BottomNav = () => (
    <div className="bg-white border-t border-stone-100 flex justify-around items-center py-2 fixed bottom-0 left-0 right-0 max-w-md mx-auto">
      {[
        { id: "home", icon: Home, label: "Home" },
        { id: "map", icon: MapPin, label: "Map" },
        { id: "livestock", icon: Tag, label: "Livestock" },
        { id: "menu", icon: Menu, label: "Menu" },
      ].map(({ id, icon: Icon, label }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => (id === "menu" ? setShowMenu(true) : setTab(id))}
            className="flex flex-col items-center text-[11px] gap-1 px-4 py-1 relative"
          >
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors ${active ? "bg-red-900 text-white" : "text-slate-400"}`}>
              <Icon size={18} />
            </div>
            <span className={active ? "text-red-950 font-semibold" : "text-slate-400"}>{label}</span>
            {id === "menu" && (syncCount > 0 || pendingChanges > 0) && (
              <span className="absolute top-0 right-2 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{syncCount + pendingChanges}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── All-farms aggregate totals ──
  const allMobs = accessibleFarms.flatMap(f => farmsMobs[f] || []);
  const totalCattle = allMobs.filter((m) => m.species === "Cattle" || /steer|cow|calf|calves|bull|heifer/i.test(m.type || "")).reduce((s, m) => s + m.count, 0);
  const totalSheep = allMobs.filter((m) => m.species === "Sheep" || /ewe|sheep|merino|lamb|wether|ram/i.test(m.type || "")).reduce((s, m) => s + m.count, 0);
  const totalDSE = allMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
  const farmSummaries = accessibleFarms.map((name) => {
    const farmMobs = farmsMobs[name] || [];
    const cattle = farmMobs.filter((m) => m.species === "Cattle").reduce((s, m) => s + m.count, 0);
    const sheep = farmMobs.filter((m) => m.species === "Sheep").reduce((s, m) => s + m.count, 0);
    const dse = farmMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
    return { name, cattle, sheep, dse };
  });

  // paddockStats MUST be memoised: it feeds GooglePaddockMap's insight effect,
  // and a fresh object reference every render made that effect clear and redraw
  // every paddock label (a canvas each) on every keystroke — e.g. while typing
  // in the New Mob form. useMemo keeps the reference stable until data changes.
  const paddockStats = React.useMemo(() => {
    const stats = {};
    // Adjacency of paddocks joined by OPEN gates — stocking rate is computed
    // over the whole connected group (combined DSE ÷ combined ha)
    const adj = {};
    landmarks.forEach((l) => {
      if (l.type !== "Gate" || !openGates.includes(String(l.id)) || !l.paddockA || !l.paddockB) return;
      (adj[l.paddockA] = adj[l.paddockA] || []).push(l.paddockB);
      (adj[l.paddockB] = adj[l.paddockB] || []).push(l.paddockA);
    });
    const componentOf = (start) => {
      const seen = new Set([start]);
      const stack = [start];
      while (stack.length) {
        const n = stack.pop();
        (adj[n] || []).forEach((x) => { if (!seen.has(x)) { seen.add(x); stack.push(x); } });
      }
      return seen;
    };
    paddocks.forEach((p) => {
      const group = adj[p.name] ? componentOf(p.name) : new Set([p.name]);
      const groupPaddocks = paddocks.filter(x => group.has(x.name));
      const groupHa = groupPaddocks.reduce((s, x) => s + (Number(x.ha) || 0), 0);
      const paddockMobs = mobs.filter((m) => m.paddock === p.name);
      const groupMobs = group.size > 1 ? mobs.filter((m) => group.has(m.paddock)) : paddockMobs;
      const dseTotal = groupMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
      const isGrazing = !NON_GRAZING_LAND_USES.has(p.landUse);
      const dsePerHa = (isGrazing && groupHa) ? dseTotal / groupHa : 0;
      const lastFooEntry = fooHistory.filter((r) => r.paddock === p.name).slice(-1)[0];
      const daysSinceGrazed = paddockMobs.length > 0 ? Math.min(...paddockMobs.map((m) => m.daysInPaddock ?? 999)) : null;
      stats[p.name] = { dsePerHa, lastFoo: lastFooEntry ? Number(lastFooEntry.kgDm) : null, daysSinceGrazed, isGrazing };
    });
    return stats;
  }, [paddocks, mobs, fooHistory, landmarks, openGates]);

  // [extracted to top-level component]
  const PIN_DATA = mobs.map((m, i) => {
    const seed = (m.id * 37) % 100;
    const row = Math.floor(i / 4);
    const col = i % 4;
    const t = `${18 + row * 16 + (seed % 7)}%`;
    const left = `${15 + col * 22 + ((seed * 3) % 9)}%`;
    return { l: String(m.count), t, left, mob: m };
  });

  const INSIGHT_OPTIONS = [
    { id: "usage",    label: "Paddock Usage",      icon: "🏷️" },
    { id: "crop",     label: "Crop / Pasture Type", icon: "🌿" },
    { id: "stocking", label: "Stocking Rate",       icon: "📊" },
    { id: "feed",     label: "Feed on Offer",       icon: "🌾" },
    { id: "grazed",   label: "Days Since Grazed",   icon: "📅" },
    { id: "outline",  label: "Outline Only",        icon: "⬜" },
  ];

  // Species/type filter for the livestock map pins ("All" shows everything)
  const MAP_MOB_FILTERS = {
    Cattle: (m) => m.species === "Cattle",
    Bulls:  (m) => m.type === "Bulls" || m.species === "Bulls",
    Sheep:  (m) => m.species === "Sheep",
    Rams:   (m) => m.type === "Rams" || m.species === "Rams",
  };
  const mapFilteredMobs = React.useMemo(() => (
    mapSpeciesFilter === "All"
      ? mobs
      : mobs.filter(MAP_MOB_FILTERS[mapSpeciesFilter] || (() => true))
  ), [mobs, mapSpeciesFilter]);  // stable reference — new array every render would redraw all pins

  // Plain render function, NOT a component: defining a component inside App gives
  // it a new identity on every render, so React unmounted and rebuilt the whole
  // map screen each time state changed — resetting the map's zoom and position.
  const MapScreen = () => (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-56px)] max-h-[calc(100dvh-56px)] md:h-[100dvh] md:max-h-[100dvh]">
      <div className="bg-white flex items-center px-4 py-3 gap-2 sticky top-0 z-10 border-b border-stone-100">
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <div className="flex-1 flex bg-slate-100 rounded-full p-1">
          {["Livestock", "Paddocks", "Notes"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMapMode(m);
                // After visibility change, tell Google Maps to recalculate its dimensions
                setTimeout(() => {
                  const g = window.google?.maps;
                  if (!g?.event) return;
                  [livMapRef, padMapRef, notesMapRef].forEach(ref => {
                    if (ref.current?.map) g.event.trigger(ref.current.map, "resize");
                  });
                }, 50);
              }}
              className={`flex-1 py-1.5 text-sm rounded-full font-semibold transition-colors ${mapMode === m ? "bg-amber-500 text-white shadow-sm" : "text-slate-400"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {/* In Notes mode: add note button always visible */}
          {mapMode === "Notes" && (
            <button
              onClick={() => {
                const gps = userLocation ? { lat: userLocation.lat, lng: userLocation.lng, accuracyM: userLocation.accuracy } : null;
                let detectedPaddock = null;
                if (gps && window.google?.maps?.geometry?.poly) {
                  const latlng = new window.google.maps.LatLng(gps.lat, gps.lng);
                  const polys = livMapRef.current?.polygons || {};
                  for (const [pid, poly] of Object.entries(polys)) {
                    if (window.google.maps.geometry.poly.containsLocation(latlng, poly)) {
                      const p = paddocks.find(x => String(x.id) === String(pid));
                      if (p) { detectedPaddock = p.name; break; }
                    }
                  }
                }
                setFieldNoteForm({ lat: gps?.lat || null, lng: gps?.lng || null, accuracyM: gps?.accuracyM || null, locationApprox: !gps, paddock: detectedPaddock, category: "General", body: "", priority: "normal" });
              }}
              className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg font-bold flex-shrink-0"
              title="Add field note"
            >+</button>
          )}
          {/* In Livestock/Paddocks: field notes overlay toggle */}
          {mapMode !== "Notes" && (
            <>
              <button
                onClick={() => setShowNotesOnMap(v => !v)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${showNotesOnMap ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500"}`}
                title="Field notes overlay"
              >📍</button>
              {showNotesOnMap && (
                <button
                  onClick={() => {
                    const gps = userLocation ? { lat: userLocation.lat, lng: userLocation.lng, accuracyM: userLocation.accuracy } : null;
                    let detectedPaddock = null;
                    if (gps && window.google?.maps?.geometry?.poly) {
                      const latlng = new window.google.maps.LatLng(gps.lat, gps.lng);
                      const polys = livMapRef.current?.polygons || {};
                      for (const [pid, poly] of Object.entries(polys)) {
                        if (window.google.maps.geometry.poly.containsLocation(latlng, poly)) {
                          const p = paddocks.find(x => String(x.id) === String(pid));
                          if (p) { detectedPaddock = p.name; break; }
                        }
                      }
                    }
                    setFieldNoteForm({ lat: gps?.lat || null, lng: gps?.lng || null, accuracyM: gps?.accuracyM || null, locationApprox: !gps, paddock: detectedPaddock, category: "General", body: "", priority: "normal" });
                  }}
                  className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg font-bold flex-shrink-0"
                  title="Add field note"
                >+</button>
              )}
            </>
          )}
          <button
            onClick={() => mapMode === "Paddocks" ? setShowInsightPicker(true) : setShowHelp(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${mapMode === "Paddocks" ? "bg-amber-100 text-amber-700 font-bold" : "bg-slate-100 text-slate-500"}`}
            title={mapMode === "Paddocks" ? "Map overlay" : "Help"}
          >
            {mapMode === "Paddocks" ? "🗺" : <HelpCircle size={16} />}
          </button>
        </div>
      </div>

      {/* ── Full-screen landmark pin placement overlay ── */}
      {/* ── Field note pin picking banner ── */}
      {fieldNoteForm?._pickingPin && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] bg-amber-500 text-white text-sm font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
          <span>📍</span> Click the map to place your note
          <button onClick={() => setFieldNoteForm(prev => ({ ...prev, _pickingPin: false }))}
            className="ml-2 bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
        </div>
      )}

      {landmarkPinPlacing && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="bg-amber-500 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button onClick={() => { setLandmarkPinPlacing(false); setShowAddLandmark(true); }} className="text-white/80 font-medium text-sm">← Back</button>
            <div className="flex-1 text-center font-semibold text-sm">Tap map to place · drag pin to move</div>
            <button
              onClick={() => { setLandmarkPinPlacing(false); setShowAddLandmark(true); }}
              className="bg-white text-amber-700 font-bold text-sm px-4 py-1.5 rounded-full"
            >
              Confirm
            </button>
          </div>
          <div className="flex-1 relative">
            {googleMapsKey ? (
              <GooglePaddockMap
                paddocks={paddocks}
                center={
                  // Start where user was looking, not the farm centre
                  landmarkPinPos ? [landmarkPinPos.lat, landmarkPinPos.lng]
                  : currentMapCentre ? [currentMapCentre.lat, currentMapCentre.lng]
                  : (FARM_CENTERS[farmName] || FARM_CENTERS.Arundale)
                }
                initialZoom={15}
                onSelect={() => {}}
                apiKey={googleMapsKey}
                onError={() => {}}
                mode="paddocks"
                insightMode="outline"
                paddockStats={{}}
                landmarks={[]}
                landmarkPinMode={true}
                landmarkPinPos={landmarkPinPos}
                onLandmarkPinMoved={(lat, lng) => {
                  setLandmarkPinPos({ lat, lng });
                  if (newLandmarkForm.type === "Gate" && paddocks.length > 0) {
                    // Find two paddocks whose boundaries are closest to the pin
                    // Uses minimum distance from pin to any polygon edge segment
                    const ptLng = lng, ptLat = lat;

                    function ptSegDist(px, py, ax, ay, bx, by) {
                      const dx = bx-ax, dy = by-ay;
                      const lenSq = dx*dx+dy*dy;
                      if (lenSq === 0) return Math.hypot(px-ax, py-ay);
                      const t = Math.max(0, Math.min(1, ((px-ax)*dx+(py-ay)*dy)/lenSq));
                      return Math.hypot(px-(ax+t*dx), py-(ay+t*dy));
                    }

                    const withDist = paddocks.map(p => {
                      if (!p.geojson) return { p, d: Infinity };
                      try {
                        const coords = p.geojson.coordinates?.[0] || [];
                        if (coords.length < 2) return { p, d: Infinity };
                        let minD = Infinity;
                        for (let i = 0; i < coords.length - 1; i++) {
                          const d = ptSegDist(ptLng, ptLat, coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
                          if (d < minD) minD = d;
                        }
                        return { p, d: minD };
                      } catch { return { p, d: Infinity }; }
                    }).filter(x => x.d < Infinity).sort((a,b) => a.d - b.d);

                    if (withDist.length >= 2) {
                      const a = withDist[0].p.name;
                      const b = withDist[1].p.name;
                      setNewLandmarkForm(prev => ({
                        ...prev, paddockA: a, paddockB: b,
                        name: prev.name || `Gate between ${a} and ${b}`
                      }));
                    }
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-slate-700 flex flex-col items-center justify-center text-white p-6 text-center gap-3">
                <div className="text-4xl">📍</div>
                <div className="font-bold">No Google Maps key</div>
                <div className="text-sm opacity-70">Add your Maps API key in Settings to use the pin placement map. The landmark will be placed at the farm centre for now.</div>
                <button onClick={() => { setLandmarkPinPos(FARM_CENTERS[farmName] ? { lat: FARM_CENTERS[farmName][0], lng: FARM_CENTERS[farmName][1] } : null); setLandmarkPinPlacing(false); setShowAddLandmark(true); }} className="bg-white text-slate-800 font-bold px-6 py-2.5 rounded-2xl mt-2">Use Farm Centre</button>
              </div>
            )}
            {landmarkPinPos && (
              <div className="absolute bottom-20 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 text-center shadow-lg">
                <div className="text-xs text-slate-400 font-semibold">PIN LOCATION</div>
                <div className="font-semibold text-slate-700 mt-0.5">{landmarkPinPos.lat.toFixed(5)}, {landmarkPinPos.lng.toFixed(5)}</div>
                {newLandmarkForm.type === "Gate" && newLandmarkForm.paddockA && newLandmarkForm.paddockB && (
                  <div className="text-xs text-amber-700 font-semibold mt-1">⊗ {newLandmarkForm.paddockA} ↔ {newLandmarkForm.paddockB}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All three map panels are stacked absolutely inside one flex-1 container,
          so the active map always fills the full remaining height (previously each
          panel took a third of the column, leaving white space below the map). */}
      <div className="flex-1 relative min-h-0">
      <div style={{ visibility: mapMode === "Livestock" ? "visible" : "hidden", pointerEvents: mapMode === "Livestock" ? "auto" : "none" }} className="absolute inset-0 overflow-hidden">

          {googleMapsKey && !mapLoadError ? (
            <>
              <GooglePaddockMap
                paddocks={paddocks}
                mobs={mapFilteredMobs}
                mode="livestock"
                center={FARM_CENTERS[farmName] || FARM_CENTERS.Arundale}
                onSelect={() => {}}
                onSelectPin={setPinSelected}
                apiKey={googleMapsKey}
                onError={() => setMapLoadError(true)}
                userLocation={userLocation}
                landmarks={landmarks}
                openGateIds={openGates}
                onSelectLandmark={(l) => { setLandmarkDetail(l); setLandmarkEditMode(false); }}
                instanceRef={livMapRef}
              />

              {/* ── Species filter chips — pins show only the selected kind ── */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-md max-w-[95%] overflow-x-auto">
                {[["All", ""], ["Cattle", "🐄"], ["Bulls", "🐂"], ["Sheep", "🐑"], ["Rams", "🐏"]].map(([label, icon]) => (
                  <button key={label} onClick={() => setMapSpeciesFilter(label)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${mapSpeciesFilter === label ? "bg-red-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {icon && <span>{icon}</span>}{label}
                  </button>
                ))}
              </div>

              {/* ── Drag overlay — covers Google Map during mob drag, intercepts all pointer events ── */}
              {draggingMob && (
                <div
                  className="absolute inset-0 z-[60]"
                  style={{ cursor: "grabbing", touchAction: "none" }}
                  onPointerMove={(e) => {
                    setDraggingMob(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    const mapRef = livMapRef.current?.map;
                    const mob = draggingMob.mob;
                    setDraggingMob(null);
                    // Restore Google Maps gesture handling
                    if (mapRef) mapRef.setOptions({ gestureHandling: "greedy" });

                    if (!mapRef || !window.google?.maps) return;

                    // Convert pointer position to LatLng
                    const mapDiv = mapRef.getDiv();
                    const rect = mapDiv.getBoundingClientRect();
                    const offsetX = e.clientX - rect.left;
                    const offsetY = e.clientY - rect.top;

                    const projection = mapRef.getProjection();
                    if (!projection) return;

                    const bounds = mapRef.getBounds();
                    if (!bounds) return;

                    const scale = Math.pow(2, mapRef.getZoom());
                    const nw = projection.fromLatLngToPoint(
                      new window.google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng())
                    );
                    const dropPoint = new window.google.maps.Point(
                      nw.x + offsetX / scale,
                      nw.y + offsetY / scale
                    );
                    const dropLatLng = projection.fromPointToLatLng(dropPoint);

                    // Check which polygon contains the drop point
                    const g = window.google.maps;
                    let targetPaddock = null;
                    const polygonsRef = livMapRef.current?.polygons || {};
                    for (const [pid, poly] of Object.entries(polygonsRef)) {
                      if (g.geometry?.poly?.containsLocation(dropLatLng, poly)) {
                        // Polygon keys are paddock IDs — resolve to the paddock NAME,
                        // otherwise the mob gets assigned to a paddock called "137"
                        const pd = (livMapRef.current?.paddockList || paddocks).find(x => String(x.id) === String(pid));
                        targetPaddock = pd ? pd.name : null;
                        break;
                      }
                    }

                    if (!targetPaddock) { showToast("Drop on a paddock to move"); return; }
                    if (targetPaddock === mob.paddock) { showToast("Already in that paddock"); return; }

                    const dateStr = todayStr();
                    const detail = `Moved from ${mob.paddock} to ${targetPaddock}`;
                    setMobs(prev => prev.map(m => m.id === mob.id ? { ...m, paddock: targetPaddock, daysInPaddock: 0 } : m));
                    showToast(`${mob.name} → ${targetPaddock}`);
                    markChanged();
                    api.updateMob(mob.id, { paddock: targetPaddock, daysInPaddock: 0 })
                      .then(() => api.addMobHistory(mob.id, { action: "Move", detail, date: dateStr }))
                      .catch(err => showToast(err.message || "Couldn't save move"));
                  }}
                  onPointerCancel={() => {
                    const mapRef = livMapRef.current?.map;
                    setDraggingMob(null);
                    if (mapRef) mapRef.setOptions({ gestureHandling: "greedy" });
                  }}
                >
                  {/* Ghost mob tile that follows the finger */}
                  {draggingMob && (
                    <div
                      className="fixed pointer-events-none z-[70] bg-white rounded-2xl shadow-2xl border-2 px-3 py-2 opacity-90"
                      style={{
                        left: draggingMob.currentX - 30,
                        top: draggingMob.currentY - 50,
                        borderColor: TAG_COLOUR_HEX[draggingMob.mob?.tag] || "#cbd5e1",
                        transform: "scale(1.08)",
                        transition: "transform 0.1s",
                      }}
                    >
                      <div className="text-xs font-bold text-slate-700 whitespace-nowrap">{draggingMob.mob.name}</div>
                      <div className="text-[10px] text-slate-400">{draggingMob.mob.count} hd · {draggingMob.mob.paddock}</div>
                    </div>
                  )}
                  {/* Instruction hint */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                    Drop on a paddock to move {draggingMob?.mob?.name}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=60')" }}
            >
              {PIN_DATA.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPinSelected(p)}
                  className="absolute bg-white rounded-2xl w-14 h-14 flex flex-col items-center justify-center shadow-lg"
                  style={{
                    top: p.t,
                    left: p.left,
                    transform: "translate(-50%,-50%)",
                    border: `3px solid ${TAG_COLOUR_HEX[p.mob?.tag] || "#e2e8f0"}`,
                  }}
                >
                  <span className="text-sm leading-none">{SPECIES_ICON[p.mob?.species] || "📍"}</span>
                  <span className="text-[11px] font-bold leading-tight">{p.l}</span>
                </button>
              ))}
              {userLocation && (() => {
                const center = FARM_CENTERS[farmName] || FARM_CENTERS.Arundale;
                // Rough projection: same ~0.04deg span heuristic used elsewhere on this fallback map
                const spanDeg = 0.06;
                const leftPct = 50 + ((userLocation.lng - center[1]) / spanDeg) * 50;
                const topPct = 50 - ((userLocation.lat - center[0]) / spanDeg) * 50;
                const clampedLeft = Math.min(96, Math.max(4, leftPct));
                const clampedTop = Math.min(96, Math.max(4, topPct));
                return (
                  <div className="absolute" style={{ top: `${clampedTop}%`, left: `${clampedLeft}%`, transform: "translate(-50%,-50%)" }}>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                    <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-400 animate-ping opacity-75" />
                  </div>
                );
              })()}
            </div>
          )}
          {!googleMapsKey && isAdmin && (
            <button onClick={() => setShowSettings(true)} className="absolute top-2 right-2 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10">
              Maps key status
            </button>
          )}
          {mapLoadError && (
            <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-xs font-medium px-3 py-2 rounded-xl z-10">
              Google Maps failed to load — showing offline map. Check your API key in Settings.
            </div>
          )}
          <div className="absolute right-4 bottom-6 flex flex-col gap-3 z-10">
            <button onClick={() => showToast("Recentering map...")} className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg">⌖</button>
            <button onClick={() => { setNewMobForm({ species: "Cattle", dobOption: "Year" }); setEditingMobId(null); setShowAddMob(true); }} className="bg-red-900 text-white rounded-2xl w-12 h-12 flex items-center justify-center text-2xl shadow-lg">+</button>
            <button onClick={locateMe} disabled={locating} className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg disabled:opacity-50">
              {locating ? "…" : "◎"}
            </button>
          </div>
      </div>

      {/* Paddocks map — always mounted, structure mirrors livestock map */}
      <div style={{ visibility: mapMode === "Paddocks" ? "visible" : "hidden", pointerEvents: mapMode === "Paddocks" ? "auto" : "none" }} className="absolute inset-0 overflow-hidden">
        {dataLoading && mapMode === "Paddocks" && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm z-10 bg-white">Loading paddocks...</div>}
        {dataError && mapMode === "Paddocks" && <div className="absolute inset-0 flex items-center justify-center text-rose-500 text-sm p-4 text-center z-10 bg-white">{dataError}</div>}
        <GooglePaddockMap
          paddocks={paddocks}
          center={FARM_CENTERS[farmName] || FARM_CENTERS.Arundale}
          onSelect={setPaddockDetail}
          apiKey={googleMapsKey}
          onError={() => setMapLoadError(true)}
          landmarks={landmarks}
          onSelectLandmark={(l) => { setLandmarkDetail(l); setLandmarkEditMode(false); }}
          insightMode={insightMode}
          paddockStats={paddockStats}
          drawMode={mapDrawMode}
          drawPoints={drawPoints}
          onDrawPoint={(lat, lng) => setDrawPoints((prev) => [...prev, { lat, lng }])}
          userLocation={userLocation}
          openGateIds={openGates}
          onMapCentreChange={(lat, lng) => setCurrentMapCentre({ lat, lng })}
          editShapePaddockId={shapeEditPaddock?.id || null}
          onShapeEditHa={setShapeEditHa}
          shapeEditRef={shapeEditCtlRef}
          fieldNotes={fieldNotes}
          showNotesOnMap={showNotesOnMap}
          onSelectNote={(note) => setFieldNoteDetail(note)}
          onPickPin={fieldNoteForm?._pickingPin ? handlePickPin : null}
          instanceRef={padMapRef}
        />
        {/* Floating action buttons */}
        {!mapDrawMode && !shapeEditPaddock && (
          <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-10">
            <button onClick={locateMe} disabled={locating} className="bg-white w-11 h-11 rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 text-lg border border-slate-100">
              {locating ? "…" : "◎"}
            </button>
            {canEdit && (
              <button
                onClick={() => setShowPaddockAddMenu((v) => !v)}
                className="bg-red-900 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold"
              >
                +
              </button>
            )}
          </div>
        )}
        {showPaddockAddMenu && !mapDrawMode && (
          <div className="absolute right-16 bottom-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 w-52">
            {[
              { label: "➕ Add Paddock", action: () => { setNewPaddockForm({ landUse: "Grazing", pasture: "Native grass", colour: "Sky Blue" }); setShowAddPaddock(true); setShowPaddockAddMenu(false); } },
              { label: "✏️ Draw Paddock", action: () => { setDrawPoints([]); setMapDrawMode(true); setShowPaddockAddMenu(false); } },
              { label: "⬆ Import GeoJSON", action: () => { fileInputRef.current?.click(); setShowPaddockAddMenu(false); } },
              { label: "📍 Add Landmark", action: () => { setLandmarkCategoryPick(null); setNewLandmarkForm({}); setLandmarkPinPos(null); setShowAddLandmark(true); setShowPaddockAddMenu(false); } },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                {label}
              </button>
            ))}
            <button onClick={() => setShowPaddockAddMenu(false)} className="w-full text-center px-4 py-2 text-xs text-slate-400">Cancel</button>
          </div>
        )}
        {!googleMapsKey && isAdmin && !mapDrawMode && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full">
            No Maps key — <button onClick={() => setShowSettings(true)} className="underline">Settings</button>
          </div>
        )}
        {mapLoadError && (
          <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-xs font-medium px-3 py-2 rounded-xl">
            Google Maps failed to load — showing offline map.
          </div>
        )}
        {mapDrawMode && (
          <div className="absolute top-2 left-2 right-2 bg-green-700/90 text-white text-xs font-medium px-3 py-2 rounded-xl">
            ✏️ Drawing mode — tap to drop boundary points. At least 3 points, then Save below.
          </div>
        )}
        {mapDrawMode && drawPoints.length >= 3 && (
          <div className="absolute bottom-16 left-4 right-4 flex gap-2 z-10">
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full font-semibold">
                ≈ {ringAreaHaFromLatLng(drawPoints.map(p => [p.lat, p.lng])).toFixed(1)} ha · {drawPoints.length} points
              </span>
            </div>
            <button onClick={() => { setDrawPoints([]); setMapDrawMode(false); }} className="flex-1 bg-white text-slate-600 rounded-2xl py-3 font-bold text-sm border border-slate-200">Cancel</button>
            <button onClick={() => {
              const latlngs = drawPoints.map(p => [p.lat, p.lng]);
              const ha = Math.round(ringAreaHaFromLatLng(latlngs) * 10) / 10;
              const geojson = { type: "Polygon", coordinates: [[...latlngs.map(([lat,lng])=>[lng,lat]), [latlngs[0][1],latlngs[0][0]]]] };
              setNewPaddockForm({ landUse: "Grazing", pasture: "Native grass", colour: PADDOCK_COLOURS[paddocks.length % PADDOCK_COLOURS.length], ha: String(ha), geojson });
              setMapDrawMode(false);
              setDrawPoints([]);
              setShowAddPaddock(true);
            }} className="flex-1 bg-green-600 text-white rounded-2xl py-3 font-bold text-sm">Save Shape</button>
          </div>
        )}
        {shapeEditPaddock && (
          <div className="absolute top-2 left-2 right-2 bg-green-700/90 text-white text-xs font-medium px-3 py-2 rounded-xl z-10">
            ✏️ Reshaping {shapeEditPaddock.name} — drag a corner to move it · drag a faint midpoint to add a corner · tap a corner to delete it
          </div>
        )}
        {shapeEditPaddock && (
          <div className="absolute bottom-16 left-4 right-4 flex gap-2 z-10">
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full font-semibold">
                ≈ {Number(shapeEditHa ?? shapeEditPaddock.ha ?? 0).toFixed(1)} ha
              </span>
            </div>
            <button onClick={() => {
              shapeEditCtlRef.current?.restore?.();
              setShapeEditPaddock(null); setShapeEditHa(null);
              setPaddocks(prev => [...prev]); // re-apply normal colours/labels
            }} className="flex-1 bg-white text-slate-600 rounded-2xl py-3 font-bold text-sm border border-slate-200">Cancel</button>
            <button onClick={async () => {
              const ctl = shapeEditCtlRef.current;
              const pad = shapeEditPaddock;
              if (!ctl || !pad) { setShapeEditPaddock(null); setShapeEditHa(null); return; }
              const latlngs = ctl.getLatLngs();
              if (latlngs.length < 3) { showToast("Shape needs at least 3 corners"); return; }
              // Closed GeoJSON ring, [lng, lat] order
              const geojson = { type: "Polygon", coordinates: [[...latlngs.map(([lat, lng]) => [lng, lat]), [latlngs[0][1], latlngs[0][0]]]] };
              setShapeEditPaddock(null); setShapeEditHa(null);
              try {
                const updated = await api.updatePaddock(pad.id, { geojson });
                setPaddocks(prev => prev.map(p => p.id === updated.id ? updated : p));
                markChanged();
                showToast(`${updated.name} reshaped — now ${updated.ha} ha`);
              } catch (err) {
                showToast(err.message || "Couldn't save the new shape");
              }
            }} className="flex-1 bg-green-600 text-white rounded-2xl py-3 font-bold text-sm">Save Shape</button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept=".json,.geojson,application/geo+json,application/json" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              const imported = geojsonToPaddocks(data);
              if (imported.length === 0) { showToast("No paddock features found"); return; }
              // Skip features whose geometry already exists — re-importing the same
              // file used to create duplicate paddocks (old default name alongside
              // the renamed one, drawing overlapping labels on the map)
              const existingGeoms = new Set(paddocks.map((p) => paddockGeomKey(p.geojson)).filter(Boolean));
              const fresh = imported.filter((p) => { const k = paddockGeomKey(p.geojson); return !k || !existingGeoms.has(k); });
              const skippedCount = imported.length - fresh.length;
              if (fresh.length === 0) { showToast("All paddocks in that file are already mapped — nothing imported"); return; }
              showToast(`Saving ${fresh.length} paddock${fresh.length > 1 ? "s" : ""}${skippedCount ? ` (${skippedCount} already mapped, skipped)` : ""}...`);
              const created = [];
              for (const p of fresh) {
                const { id, ...fields } = p;
                try {
                  const saved = await api.createPaddock(farmName, fields);
                  created.push(saved);
                } catch (err) {
                  console.error("Failed to save imported paddock:", p.name, err);
                }
              }
              if (created.length === 0) { showToast("Couldn't save imported paddocks to the server"); return; }
              setPaddocks((prev) => [...prev, ...created]);
              markChanged();
              showToast(`Imported & mapped ${created.length} paddock${created.length > 1 ? "s" : ""}`);
            } catch (err) {
              showToast("Couldn't read that file — expected GeoJSON");
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }} />
      </div>

      {/* Notes map — always mounted so refs never reset */}
      <div style={{ visibility: mapMode === "Notes" ? "visible" : "hidden", pointerEvents: mapMode === "Notes" ? "auto" : "none" }} className="absolute inset-0 overflow-hidden">
        {(() => {
          const openNotes = fieldNotes.filter(n => !n.resolvedAt && n.lat && n.lng);
          const urgentCount = openNotes.filter(n => n.priority === "urgent").length;
          return (<>
            {urgentCount > 0 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                🚨 {urgentCount} urgent
              </div>
            )}
            {openNotes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <div className="bg-white/90 rounded-2xl px-6 py-5 text-center shadow-sm">
                  <div className="text-3xl mb-2">📍</div>
                  <div className="font-semibold text-slate-700">No open field notes</div>
                  <div className="text-sm text-slate-400 mt-1">Tap + to record an observation</div>
                </div>
              </div>
            )}
            {googleMapsKey && !mapLoadError ? (
              <GooglePaddockMap
                paddocks={paddocks}
                mobs={[]}
                mode="notes"
                center={FARM_CENTERS[farmName] || FARM_CENTERS.Arundale}
                onSelect={() => {}}
                apiKey={googleMapsKey}
                onError={() => setMapLoadError(true)}
                userLocation={userLocation}
                instanceRef={livMapRef}
                fieldNotes={fieldNotes}
                showNotesOnMap={true}
                onSelectNote={(note) => setFieldNoteDetail(note)}
                onPickPin={fieldNoteForm?._pickingPin ? handlePickPin : null}
                instanceRef={notesMapRef}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Map unavailable</div>
            )}
          </>);
        })()}
      </div>
      </div>


      {pinSelected && (
        <Modal title={pinSelected.mobs?.length > 1 ? `${pinSelected.mobs.length} mobs · ${pinSelected.l} head` : (pinSelected.mob ? pinSelected.mob.name : `Group of ${pinSelected.l}`)} onClose={() => setPinSelected(null)}>
          <p className="text-sm text-slate-500 mb-3">{pinSelected.mobs?.length > 1 ? "Multiple mobs share this paddock — tap one for details" : (pinSelected.mob ? pinSelected.mob.desc : "Unidentified group on map")}</p>
          {pinSelected.mobs?.length > 1 && (
            <div className="space-y-2 mb-3">
              {pinSelected.mobs.map(m => (
                <button key={m.id}
                  onClick={() => { setSelectedMobId(m.id); setMobTab("Summary"); setPinSelected(null); }}
                  className="w-full flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 text-left hover:bg-slate-100">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{m.name}</div>
                    <div className="text-xs text-slate-400">{m.count} hd · {m.type || m.species}{m.mgmtGroup && m.mgmtGroup !== "Unassigned" ? ` · ${m.mgmtGroup}` : ""}</div>
                  </div>
                  <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" style={{ backgroundColor: TAG_COLOUR_HEX[m.tag] || "#e2e8f0" }} />
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-semibold">HEAD COUNT</div>
              <div className="text-2xl font-extrabold text-slate-800">{pinSelected.l}</div>
            </div>
            {pinSelected.mob && (
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="text-xs text-slate-400 font-semibold">TYPE</div>
                <div className="text-base font-bold text-slate-800 mt-1">{SPECIES_ICON[pinSelected.mob.species] || ""} {pinSelected.mob.type || pinSelected.mob.species}</div>
              </div>
            )}
          </div>
          {!(pinSelected.mobs?.length > 1) && pinSelected.mob?.tag && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 mb-3">
              <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: TAG_COLOUR_HEX[pinSelected.mob.tag] || "#e2e8f0" }} />
              <div>
                <div className="text-xs text-slate-400 font-semibold">TAG COLOUR</div>
                <div className="text-sm font-bold text-slate-800">{pinSelected.mob.tag}</div>
              </div>
            </div>
          )}
          {!(pinSelected.mobs?.length > 1) && pinSelected.mob && (
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedMobId(pinSelected.mob.id); setMobTab("Summary"); setPinSelected(null); }}
                className="flex-1 bg-red-900 text-white rounded-2xl py-3 font-bold"
              >
                View Details
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    const mob = pinSelected.mob;
                    setPinSelected(null);
                    // Slight delay so modal closes before overlay appears
                    setTimeout(() => {
                      const mapRef = livMapRef.current?.map;
                      if (mapRef) mapRef.setOptions({ gestureHandling: "none" });
                      const mapDiv = mapRef?.getDiv();
                      const rect = mapDiv?.getBoundingClientRect() || { left: 0, top: 0, width: 200, height: 200 };
                      setDraggingMob({
                        mob,
                        currentX: rect.left + rect.width / 2,
                        currentY: rect.top + rect.height / 2,
                      });
                    }, 150);
                  }}
                  className="bg-amber-500 text-white rounded-2xl py-3 px-4 font-bold"
                  title="Drag to move paddock"
                >
                  ↕ Move
                </button>
              )}
            </div>
          )}
        </Modal>
      )}

      {showAddPaddock && (
        <Modal title="Add Paddock" onClose={() => setShowAddPaddock(false)}>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Name</label>
              <input value={newPaddockForm.name || ""} onChange={(e) => setNewPaddockForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Paddock 104" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Land use</label>
              <select value={newPaddockForm.landUse || "Grazing"} onChange={(e) => setNewPaddockForm((p) => ({ ...p, landUse: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                {LAND_USES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Pasture/crop type</label>
              <select value={newPaddockForm.pasture || "Native grass"} onChange={(e) => setNewPaddockForm((p) => ({ ...p, pasture: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                {PASTURE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Total area (ha)</label>
              <input type="number" value={newPaddockForm.ha || ""} onChange={(e) => setNewPaddockForm((p) => ({ ...p, ha: e.target.value }))} placeholder="e.g. 35" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Paddock colour</label>
              <select value={newPaddockForm.colour || "Sky Blue"} onChange={(e) => setNewPaddockForm((p) => ({ ...p, colour: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                {PADDOCK_COLOURS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={async () => {
              if (!newPaddockForm.name || !newPaddockForm.ha) { showToast("Please enter a name and area"); return; }
              const fields = {
                name: newPaddockForm.name,
                ha: Number(newPaddockForm.ha),
                landUse: newPaddockForm.landUse || "Grazing",
                pasture: newPaddockForm.pasture || "Native grass",
                colour: newPaddockForm.colour || "Sky Blue",
                geojson: newPaddockForm.geojson || null,
              };
              try {
                const created = await api.createPaddock(farmName, fields);
                setPaddocks((prev) => [...prev, created]);
                setShowAddPaddock(false);
                setNewPaddockForm({});
                markChanged();
                showToast("Paddock added");
              } catch (err) {
                showToast(err.message || "Couldn't save paddock to the server");
              }
            }}
            className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold"
          >
            Save Paddock
          </button>
        </Modal>
      )}

      {showAddLandmark && (
        <Modal title={landmarkCategoryPick ? `Add ${landmarkCategoryPick} Landmark` : "Add Landmark"} onClose={() => { setShowAddLandmark(false); setLandmarkCategoryPick(null); setNewLandmarkForm({}); }}>
          {!landmarkCategoryPick ? (
            <div className="space-y-5">
              {Object.entries(LANDMARK_CATEGORIES).map(([cat, items]) => (
                <div key={cat}>
                  <div className="text-sm font-bold text-slate-700 mb-2">{cat}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((it) => (
                      <button
                        key={it.type}
                        onClick={() => { setLandmarkCategoryPick(cat); setNewLandmarkForm({ type: it.type, colour: "Sky Blue" }); }}
                        className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col items-center gap-1.5"
                      >
                        <span className="text-2xl">{it.icon}</span>
                        <span className="text-xs font-semibold text-slate-600 text-center leading-tight">{it.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{Object.values(LANDMARK_CATEGORIES).flat().find((c) => c.type === newLandmarkForm.type)?.icon}</span>
                <div className="font-bold text-slate-800">{newLandmarkForm.type}</div>
                <button onClick={() => setLandmarkCategoryPick(null)} className="ml-auto text-xs text-red-900 font-bold">Change type</button>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Name</label>
                  <input
                    value={newLandmarkForm.name || ""}
                    onChange={(e) => setNewLandmarkForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={newLandmarkForm.type === "Gate" && newLandmarkForm.paddockA && newLandmarkForm.paddockB
                      ? `Gate between ${newLandmarkForm.paddockA} and ${newLandmarkForm.paddockB}`
                      : `e.g. ${newLandmarkForm.type}`}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
                  />
                </div>

                {newLandmarkForm.type === "Gate" ? (
                  <div className="bg-amber-50 rounded-2xl p-3 space-y-2">
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Gate connects two paddocks</div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Paddock A</label>
                        <select value={newLandmarkForm.paddockA || ""} onChange={(e) => {
                          const val = e.target.value;
                          const auto = val && newLandmarkForm.paddockB ? `Gate between ${val} and ${newLandmarkForm.paddockB}` : "";
                          setNewLandmarkForm((p) => ({ ...p, paddockA: val, paddock: val, name: p.name || auto }));
                        }} className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white text-sm">
                          <option value="">Select...</option>
                          {[...paddocks].sort((a,b)=>a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Paddock B</label>
                        <select value={newLandmarkForm.paddockB || ""} onChange={(e) => {
                          const val = e.target.value;
                          const auto = newLandmarkForm.paddockA && val ? `Gate between ${newLandmarkForm.paddockA} and ${val}` : "";
                          setNewLandmarkForm((p) => ({ ...p, paddockB: val, name: p.name || auto }));
                        }} className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white text-sm">
                          <option value="">Select...</option>
                          {[...paddocks].sort((a,b)=>a.name.localeCompare(b.name)).filter(p=>p.name!==newLandmarkForm.paddockA).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">When you open this gate in its detail view, the two paddocks merge visually with a yellow border and their DSE/ha is combined.</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-slate-600 block mb-1">Paddock / location</label>
                    <select value={newLandmarkForm.paddock || ""} onChange={(e) => setNewLandmarkForm((p) => ({ ...p, paddock: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                      <option value="">Not paddock-specific</option>
                      {paddocks.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Placed at the centre of the selected paddock on the map.</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Colour</label>
                  <select value={newLandmarkForm.colour || "Sky Blue"} onChange={(e) => setNewLandmarkForm((p) => ({ ...p, colour: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {LANDMARK_COLOURS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Notes</label>
                  <textarea value={newLandmarkForm.notes || ""} onChange={(e) => setNewLandmarkForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional details..." rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
                </div>
              </div>

              {/* Pin placement — full screen button */}
              <button
                onClick={() => {
                  // Try to get the current map centre so pin appears where user is looking
                  let startPos = null;
                  try {
                    const mapRef = document.querySelector('[data-map-instance]');
                    const g = window.google?.maps;
                    // Use the current paddocks map instance centre if available
                    const centre = FARM_CENTERS[farmName] || FARM_CENTERS.Arundale;
                    startPos = { lat: centre[0], lng: centre[1] };
                  } catch {}
                  setLandmarkPinStart(startPos);
                  setLandmarkPinPos(null); // reset so pin starts fresh at current view
                  setLandmarkPinPlacing(true);
                  setShowAddLandmark(false);
                }}
                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-3 border-2 ${landmarkPinPos ? "border-amber-400 bg-amber-50 text-amber-700" : "border-dashed border-slate-300 bg-slate-50 text-slate-500"}`}
              >
                <span className="text-2xl">📍</span>
                <div className="text-left">
                  <div className="font-semibold text-sm">{landmarkPinPos ? "Pin placed — tap to move" : "Place on map"}</div>
                  <div className="text-xs opacity-70">{landmarkPinPos ? `${landmarkPinPos.lat.toFixed(5)}, ${landmarkPinPos.lng.toFixed(5)}` : "Tap to drop a pin on the exact location"}</div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const farmCenter = FARM_CENTERS[farmName] || FARM_CENTERS.Arundale;
                  // Use dragged pin position if available, else paddock centroid or random offset
                  let lat = landmarkPinPos?.lat ?? farmCenter[0];
                  let lng = landmarkPinPos?.lng ?? farmCenter[1];
                  if (!landmarkPinPos) {
                    const targetPaddock = paddocks.find((p) => p.name === newLandmarkForm.paddock);
                    if (targetPaddock) {
                      const latlngs = geometryToLatLngs(targetPaddock.geojson) || fallbackPolygon(farmCenter, paddocks.indexOf(targetPaddock), Number(targetPaddock.ha) || 10);
                      lat = latlngs.reduce((s, p) => s + p[0], 0) / latlngs.length;
                      lng = latlngs.reduce((s, p) => s + p[1], 0) / latlngs.length;
                    } else {
                      lat += (Math.random() - 0.5) * 0.01;
                      lng += (Math.random() - 0.5) * 0.01;
                    }
                  }
                  try {
                    const created = await api.createLandmark(farmName, { ...newLandmarkForm, lat, lng });
                    setLandmarks((prev) => [...prev, created]);
                    setShowAddLandmark(false);
                    setLandmarkCategoryPick(null);
                    setNewLandmarkForm({});
                    setLandmarkPinPos(null);
                    setLandmarkPinMode(false);
                    markChanged();
                    showToast("Landmark added");
                  } catch (err) {
                    showToast(err.message || "Couldn't save landmark to the server");
                  }
                }}
                className="w-full bg-amber-500 text-white rounded-2xl py-3.5 font-bold"
              >
                Save Landmark
              </button>
            </div>
          )}
        </Modal>
      )}

      {landmarkDetail && (
        <Modal title={landmarkEditMode ? "Edit Landmark" : (landmarkDetail.name || landmarkDetail.type)} onClose={() => { setLandmarkDetail(null); setLandmarkEditMode(false); setConfirmLmDel(false); }}>
          {landmarkEditMode ? (
            <div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Name</label>
                  <input value={landmarkDetail.name || ""} onChange={(e) => setLandmarkDetail((p) => ({ ...p, name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Colour</label>
                  <select value={landmarkDetail.colour || "Sky Blue"} onChange={(e) => setLandmarkDetail((p) => ({ ...p, colour: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {LANDMARK_COLOURS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Notes</label>
                  <textarea value={landmarkDetail.notes || ""} onChange={(e) => setLandmarkDetail((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const updated = await api.updateLandmark(landmarkDetail.id, {
                      name: landmarkDetail.name,
                      colour: landmarkDetail.colour,
                      notes: landmarkDetail.notes,
                    });
                    setLandmarks((prev) => prev.map((l) => l.id === landmarkDetail.id ? updated : l));
                    setLandmarkEditMode(false);
                    markChanged();
                    showToast("Landmark updated");
                  } catch (err) {
                    showToast(err.message || "Couldn't save changes to the server");
                  }
                }}
                className="w-full bg-amber-500 text-white rounded-2xl py-3.5 font-bold"
              >
                Save Changes
              </button>
              {/* Delete only accessible from within edit — requires confirmation */}
              {canEdit && (confirmLmDel ? (
                <div className="mt-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <p className="text-sm font-bold text-rose-700 text-center mb-1">Delete "{landmarkDetail?.name || landmarkDetail?.type}"?</p>
                  <p className="text-xs text-rose-500 text-center mb-3">This landmark will be permanently removed.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmLmDel(false)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-500">Cancel</button>
                    <button onClick={() => {
                      const id = landmarkDetail.id;
                      setLandmarks(prev => prev.filter(l => l.id !== id));
                      setLandmarkDetail(null); setLandmarkEditMode(false); setConfirmLmDel(false);
                      markChanged();
                      api.deleteLandmark(id).then(() => showToast("Landmark deleted")).catch(err => showToast(err.message || "Couldn't delete"));
                    }} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-bold">Yes, delete</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmLmDel(true)} className="w-full mt-3 text-rose-400 text-xs font-semibold py-2 hover:text-rose-600">
                  🗑 Delete this landmark
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: LANDMARK_COLOUR_HEX[landmarkDetail.colour] || "#64748b" }}>
                  {Object.values(LANDMARK_CATEGORIES).flat().find((c) => c.type === landmarkDetail.type)?.icon || "📍"}
                </span>
                <div>
                  <div className="font-bold text-slate-800">{landmarkDetail.name || landmarkDetail.type}</div>
                  <div className="text-xs text-slate-400">{landmarkDetail.type}{landmarkDetail.paddock ? ` · ${landmarkDetail.paddock}` : ""}</div>
                </div>
              </div>
              {landmarkDetail.notes && <p className="text-sm text-slate-600 mb-4">{landmarkDetail.notes}</p>}

              {/* Gate open/close — shown to ALL users, not just admins */}
              {landmarkDetail.type === "Gate" && (() => {
                const gateKey = `${landmarkDetail.id}`;
                const isOpen = openGates.includes(gateKey);
                const paddockAData = paddocks.find(p => p.name === landmarkDetail.paddockA);
                const paddockBData = paddocks.find(p => p.name === landmarkDetail.paddockB);
                const aIsGrazing = !NON_GRAZING_LAND_USES.has(paddockAData?.landUse);
                const bIsGrazing = !NON_GRAZING_LAND_USES.has(paddockBData?.landUse);
                const combinedHa = (
                  (aIsGrazing ? Number(paddockAData?.ha||0) : 0) +
                  (bIsGrazing ? Number(paddockBData?.ha||0) : 0)
                ).toFixed(1);
                const mobsInA = mobs.filter(m => m.paddock === landmarkDetail.paddockA);
                const mobsInB = mobs.filter(m => m.paddock === landmarkDetail.paddockB);
                const combinedDSE = [...mobsInA, ...mobsInB].reduce((s,m) => s + m.count*(m.dse||0), 0);
                const combinedDsePerHa = Number(combinedHa) > 0 ? (combinedDSE / Number(combinedHa)).toFixed(2) : "0.00";
                return (
                  <div className="mb-3">
                    {landmarkDetail.paddockA && landmarkDetail.paddockB && (
                      <div className="text-xs text-slate-400 mb-2 text-center font-medium">
                        {landmarkDetail.paddockA} ↔ {landmarkDetail.paddockB}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const key = `${landmarkDetail.id}`;
                        const opening = !openGates.includes(key);
                        const nextGates = opening
                          ? [...openGates, key]
                          : openGates.filter(g => g !== key);
                        // Persist on the landmark record — gates stay open across
                        // app reloads and show the same on everyone's device
                        setFarmsLandmarks(prev => ({
                          ...prev,
                          [farmName]: (prev[farmName] || []).map(l =>
                            l.id === landmarkDetail.id ? { ...l, isOpen: opening } : l),
                        }));
                        api.updateLandmark(landmarkDetail.id, { isOpen: opening })
                          .catch(err => showToast(err.message || "Couldn't save gate state to the server"));
                        // Also update the map ref directly and re-render landmarks immediately
                        // This avoids the race condition where the inline-function MapScreen
                        // re-evaluates and remounts GooglePaddockMap before state propagates
                        const mapRef = livMapRef.current;
                        if (mapRef) {
                          mapRef.currentOpenGateIds = nextGates;
                          if (mapRef.renderLandmarks && mapRef.map) {
                            mapRef.renderLandmarks(mapRef.map.getZoom(), nextGates);
                          }
                          // Also update polygon strokes for gate-open visual
                          if (mapRef.polygons && mapRef.map) {
                            const g = window.google?.maps;
                            if (g) {
                              paddocks.forEach(p => {
                                const isGateOpen = landmarks.some(l =>
                                  l.type === "Gate" &&
                                  nextGates.includes(String(l.id)) &&
                                  (l.paddockA === p.name || l.paddockB === p.name)
                                );
                                const poly = mapRef.polygons[p.id];
                                if (poly) poly.setOptions({ strokeColor: isGateOpen ? "#eab308" : "#ffffff", strokeWeight: isGateOpen ? 3 : 2 });
                              });
                            }
                          }
                        }
                        showToast(opening
                          ? `Gate opened${landmarkDetail.paddockA ? ` — ${landmarkDetail.paddockA} ↔ ${landmarkDetail.paddockB}` : ""}`
                          : "Gate closed"
                        );
                      }}
                      className={`w-full rounded-2xl py-4 font-bold text-base mb-2 transition-colors ${isOpen
                        ? "bg-yellow-400 text-yellow-900 border-2 border-yellow-500"
                        : "bg-slate-100 text-slate-700 border-2 border-slate-200 active:bg-slate-200"}`}
                    >
                      {isOpen ? "○  Gate OPEN — tap to close" : "⊗  Gate CLOSED — tap to open"}
                    </button>
                    {isOpen && landmarkDetail.paddockA && landmarkDetail.paddockB && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-sm">
                        <div className="font-semibold text-yellow-800 mb-1">Combined grazing stats</div>
                        <div className="text-yellow-700">{landmarkDetail.paddockA} + {landmarkDetail.paddockB}</div>
                        <div className="text-yellow-700">{combinedHa} ha grazing · {combinedDSE.toFixed(0)} DSE</div>
                        <div className="font-bold text-yellow-900 text-lg mt-1">{combinedDsePerHa} DSE/ha</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {canEdit && (
                <div className="space-y-2">
                  <button onClick={() => setLandmarkEditMode(true)} className="w-full bg-slate-100 text-slate-700 rounded-2xl py-3 font-bold text-sm">Edit Details</button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {paddockDetail && (() => {
        // Open gates merge paddocks: walk the chain of open gates from this
        // paddock to find every connected paddock (A↔B open + B↔C open ⇒ A,B,C)
        const gateGroup = (() => {
          const group = new Set([paddockDetail.name]);
          const openGateLms = landmarks.filter(l => l.type === "Gate" && openGates.includes(String(l.id)) && l.paddockA && l.paddockB);
          let grew = true;
          while (grew) {
            grew = false;
            openGateLms.forEach(gt => {
              if (group.has(gt.paddockA) && !group.has(gt.paddockB)) { group.add(gt.paddockB); grew = true; }
              if (group.has(gt.paddockB) && !group.has(gt.paddockA)) { group.add(gt.paddockA); grew = true; }
            });
          }
          return [...group];
        })();
        const isCombined = gateGroup.length > 1;
        const groupPaddocks = paddocks.filter(p => gateGroup.includes(p.name));
        const combinedHa = isCombined
          ? groupPaddocks.reduce((s, p) => s + (Number(p.ha) || 0), 0)
          : (Number(paddockDetail.ha) || 0);
        const paddockMobs = mobs.filter((m) => gateGroup.includes(m.paddock));
        const headCount = paddockMobs.reduce((s, m) => s + m.count, 0);
        const dseTotal = paddockMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
        const isGrazingPaddock = !NON_GRAZING_LAND_USES.has(paddockDetail.landUse);
        const dsePerHa = (isGrazingPaddock && combinedHa) ? dseTotal / combinedHa : 0;
        return (
          <Modal title={paddockEditMode ? "Edit Paddock" : paddockDetail.name} onClose={() => { setPaddockDetail(null); setPaddockEditMode(false); setConfirmPaddockDel(false); }}>
            {paddockEditMode ? (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Name</label>
                  <input defaultValue={paddockEditFormRef.current.name ?? paddockDetail?.name} onChange={(e) => { paddockEditFormRef.current.name = e.target.value; }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Land use</label>
                  <select defaultValue={paddockEditFormRef.current.landUse ?? paddockDetail?.landUse} onChange={(e) => { paddockEditFormRef.current.landUse = e.target.value; }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {LAND_USES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Pasture/crop type</label>
                  <select defaultValue={paddockEditFormRef.current.pasture ?? paddockDetail?.pasture} onChange={(e) => { paddockEditFormRef.current.pasture = e.target.value; }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {PASTURE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Total area (ha)</label>
                  <input type="number" defaultValue={paddockEditFormRef.current.ha ?? paddockDetail?.ha} onChange={(e) => { paddockEditFormRef.current.ha = e.target.value; }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Paddock colour</label>
                  <select defaultValue={paddockEditFormRef.current.colour ?? paddockDetail?.colour} onChange={(e) => { paddockEditFormRef.current.colour = e.target.value; }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {PADDOCK_COLOURS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const p = paddockDetail;
                    setPaddockDetail(null); setPaddockEditMode(false); setConfirmPaddockDel(false);
                    setMapMode("Paddocks");
                    setShapeEditPaddock(p); setShapeEditHa(Number(p.ha) || null);
                    // Zoom the paddocks map to the shape being edited
                    setTimeout(() => {
                      const map = padMapRef.current?.map;
                      const g = window.google?.maps;
                      if (!map || !g) return;
                      let ring = null;
                      try { ring = p.geojson?.type === "MultiPolygon" ? p.geojson.coordinates[0][0] : p.geojson?.coordinates?.[0]; } catch {}
                      if (ring?.length) {
                        const b = new g.LatLngBounds();
                        ring.forEach(([lng, lat]) => b.extend({ lat, lng }));
                        map.fitBounds(b, 60);
                      }
                    }, 150);
                  }}
                  className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl py-3 font-bold text-sm"
                >
                  🔷 Edit Boundary on Map
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setPaddockEditMode(false)} className="flex-1 border border-slate-200 rounded-2xl py-3 font-bold text-slate-500">Cancel</button>
                  <button
                    onClick={async () => {
                      const fields = {
                        name: paddockEditFormRef.current.name ?? paddockDetail.name,
                        landUse: paddockEditFormRef.current.landUse ?? paddockDetail.landUse,
                        pasture: paddockEditFormRef.current.pasture ?? paddockDetail.pasture,
                        ha: paddockEditFormRef.current.ha !== undefined ? Number(paddockEditFormRef.current.ha) : paddockDetail.ha,
                        colour: paddockEditFormRef.current.colour ?? paddockDetail.colour,
                      };
                      try {
                        const updated = await api.updatePaddock(paddockDetail.id, fields);
                        setPaddocks((prev) => prev.map((p) => p.id === paddockDetail.id ? updated : p));
                        setPaddockDetail(updated);
                        setPaddockEditMode(false);
                        paddockEditFormRef.current = {};
                        markChanged();
                        showToast("Paddock updated");
                      } catch (err) {
                        showToast(err.message || "Couldn't save changes to the server");
                      }
                    }}
                    className="flex-1 bg-red-900 text-white rounded-2xl py-3 font-bold"
                  >
                    Save
                  </button>
                </div>
                {/* Delete is only accessible from within the edit form */}
                {canEdit && (confirmPaddockDel ? (
                  <div className="mt-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                    <p className="text-sm font-bold text-rose-700 text-center mb-1">Delete "{paddockDetail?.name}"?</p>
                    <p className="text-xs text-rose-500 text-center mb-3">All paddock data will be permanently removed.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmPaddockDel(false)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-500">Cancel</button>
                      <button onClick={() => {
                        const id = paddockDetail.id;
                        setPaddocks(prev => prev.filter(p => p.id !== id));
                        setPaddockDetail(null); setPaddockEditMode(false); setConfirmPaddockDel(false);
                        markChanged();
                        api.deletePaddock(id).then(() => showToast("Paddock deleted")).catch(err => showToast(err.message || "Couldn't delete"));
                      }} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-bold">Yes, delete</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmPaddockDel(true)} className="w-full mt-3 text-rose-400 text-xs font-semibold py-2 hover:text-rose-600">
                    🗑 Delete this paddock
                  </button>
                ))}
              </div>
            ) : (
            <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-400 font-medium uppercase">{paddockDetail.landUse} · {paddockDetail.pasture}</div>
              {canEdit && (
                <button onClick={() => { paddockEditFormRef.current = {}; setPaddockEditMode(true); }} className="text-xs font-bold text-red-950 bg-orange-50 px-3 py-1.5 rounded-full">Edit</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-xs text-slate-400 font-semibold">TOTAL AREA</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">{Number(paddockDetail.ha||0).toFixed(1)} ha</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-xs text-slate-400 font-semibold">HEAD COUNT{isCombined ? " (COMBINED)" : ""}</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">{headCount.toLocaleString()}</div>
              </div>
              <div className={`rounded-2xl p-4 col-span-2 ${isGrazingPaddock ? "bg-gradient-to-br from-red-950 to-red-900 text-white" : "bg-stone-100 text-stone-500 border border-stone-200"}`}>
                <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Stocking Rate</div>
                {isGrazingPaddock ? (
                  <>
                    <div className="text-2xl font-extrabold mt-1">{dsePerHa.toFixed(2)} DSE/ha</div>
                    <div className="text-xs opacity-80 mt-1">{dseTotal.toLocaleString(undefined,{maximumFractionDigits:1})} total DSE ÷ {combinedHa.toFixed(1)} ha{isCombined ? " (combined)" : ""}</div>
                    {isCombined && (
                      <div className="text-xs mt-1.5 bg-yellow-400/20 text-yellow-200 rounded-lg px-2 py-1 font-semibold">
                        ⊙ Gate open — combined with {gateGroup.filter(n => n !== paddockDetail.name).join(", ")}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-base font-semibold mt-1">Not calculated</div>
                    <div className="text-xs mt-1 opacity-70">{paddockDetail.landUse} — excluded from stocking rate</div>
                  </>
                )}
              </div>
            </div>
            {fooHistory.filter((r) => r.paddock === paddockDetail.name).length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-bold text-slate-700 mb-2">Feed on Offer history</div>
                {fooHistory.filter((r) => r.paddock === paddockDetail.name).slice(-4).reverse().map((r, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-100 py-2 text-sm">
                    <span className="text-slate-500">{r.date}</span>
                    <span className="font-bold text-green-700">{r.kgDm} kg DM/ha</span>
                    {r.height && <span className="text-slate-400 text-xs">{r.height}cm</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="text-sm font-bold text-slate-700 mb-2">Mobs in this paddock</div>
            {paddockMobs.length === 0 && <p className="text-slate-400 text-sm">No mobs currently assigned to this paddock.</p>}
            {paddockMobs.map((m) => (
              <button key={m.id} onClick={() => { setSelectedMobId(m.id); setMobTab("Summary"); setPaddockDetail(null); }} className="w-full flex justify-between border-b border-slate-100 py-2 text-sm text-left">
                <span className="font-medium text-slate-700">{m.name}</span>
                <span className="font-bold text-slate-800">{m.count.toLocaleString()}</span>
              </button>
            ))}
            <div className="mt-4">
              <div className="text-sm font-bold text-slate-700 mb-2">Paddock Record</div>
              <div className="space-y-2">
                <button
                  onClick={() => { setFooTargetPaddock(paddockDetail); setFooForm({ date: new Date().toISOString().split("T")[0] }); setShowFoo(true); }}
                  className="w-full flex items-center gap-3 bg-green-600 text-white rounded-2xl px-4 py-3 font-bold text-sm"
                >
                  <span className="text-lg">🌾</span>
                  <div className="text-left">
                    <div>Feed on Offer</div>
                    <div className="text-xs font-normal opacity-80">Record kg DM/ha, height, cover</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    // Pre-select this paddock but allow adding more
                    setSpraySelectedPaddocks([paddockDetail.name]);
                    setSprayFormPaddock(null);
                    setSprayForm({ treatmentDate: todayStr(), areaTreated: String(Number(paddockDetail.ha||0).toFixed(1)) });
                    setShowBulkSpray(true);
                  }}
                  className="w-full flex items-center gap-3 bg-amber-500 text-white rounded-2xl px-4 py-3 font-bold text-sm"
                >
                  <span className="text-lg">🌿</span>
                  <div className="text-left">
                    <div>Log Spray Treatment</div>
                    <div className="text-xs font-normal opacity-80">Chemical, rate, method, WHP/ESI, batch — single or multiple paddocks</div>
                  </div>
                </button>

                {/* Field note shortcut from paddock detail */}
                <button
                  onClick={() => {
                    const gps = userLocation;
                    setFieldNoteForm({
                      lat: gps?.lat || null, lng: gps?.lng || null,
                      accuracyM: gps?.accuracy || null,
                      locationApprox: !gps,
                      paddock: paddockDetail.name,
                      category: "General", body: "", priority: "normal",
                    });
                  }}
                  className="w-full flex items-center gap-3 bg-slate-100 text-slate-700 rounded-2xl px-4 py-3 font-bold text-sm"
                >
                  <span className="text-lg">📍</span>
                  <div className="text-left">
                    <div>Add Field Note</div>
                    <div className="text-xs font-normal text-slate-400">GPS-pinned observation for this paddock</div>
                  </div>
                </button>

              </div>
            </div>
            </>
            )}
          </Modal>
        );
      })()}

      {showFoo && (
        <Modal title="Feed on Offer" onClose={() => { setShowFoo(false); setFooForm({}); }}>
          <div className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-3">
            {fooTargetPaddock ? `📍 ${fooTargetPaddock.name} · ${fooTargetPaddock.ha} ha` : "All paddocks"}
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Date *</label>
              <input type="date" value={fooForm.date || new Date().toISOString().split("T")[0]}
                onChange={(e) => setFooForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Feed on offer *</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={fooForm.kgDm || ""}
                  onChange={(e) => setFooForm((p) => ({ ...p, kgDm: e.target.value }))}
                  placeholder="e.g. 1800"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">kg DM/ha</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Pasture height (optional)</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={fooForm.height || ""}
                  onChange={(e) => setFooForm((p) => ({ ...p, height: e.target.value }))}
                  placeholder="e.g. 8"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                <span className="text-sm font-semibold text-slate-500">cm</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Pasture cover (optional)</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={fooForm.cover || ""}
                  onChange={(e) => setFooForm((p) => ({ ...p, cover: e.target.value }))}
                  placeholder="e.g. 2200"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">kg DM/ha</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Quality / notes (optional)</label>
              <input type="text" value={fooForm.notes || ""}
                onChange={(e) => setFooForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Good quality ryegrass, no weeds"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
            </div>
          </div>

          {fooHistory.filter((r) => r.paddock === fooTargetPaddock?.name).length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Previous readings</div>
              {fooHistory.filter((r) => r.paddock === fooTargetPaddock?.name).slice(-3).reverse().map((r, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">{r.date}</span>
                  <span className="font-bold text-green-700">{r.kgDm} kg DM/ha</span>
                  {r.notes && <span className="text-slate-400 text-xs">{r.notes}</span>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={async () => {
              if (!fooForm.kgDm) { showToast("Please enter a feed on offer figure"); return; }
              const fields = {
                paddock: fooTargetPaddock?.name || "All",
                date: fooForm.date || todayStr(),
                kgDm: fooForm.kgDm,
                height: fooForm.height,
                cover: fooForm.cover,
                notes: fooForm.notes,
              };
              try {
                const created = await api.addFoo(farmName, fields);
                setFooHistory((prev) => [...prev, { ...created, _farm: farmName }]);
                setShowFoo(false);
                setFooForm({});
                markChanged();
                showToast("Feed on offer saved");
              } catch (err) {
                showToast(err.message || "Couldn't save to the server");
              }
            }}
            className="w-full bg-green-600 text-white rounded-2xl py-3.5 font-bold"
          >
            Save
          </button>
        </Modal>
      )}

      {showSprayForm && (
        <Modal title="Log Spray Treatment" onClose={() => { setShowSprayForm(false); setSprayForm({}); }}>
          {sprayFormPaddock && (
            <div className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-3">
              📍 {sprayFormPaddock.name} · {sprayFormPaddock.ha} ha
            </div>
          )}
          {/* Pick from spray inventory first */}
          {sprayInventory.length > 0 && (
            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-600 block mb-1">Select from inventory</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
                onChange={(e) => {
                  const item = sprayInventory.find(x => String(x.id) === e.target.value);
                  if (item) setSprayForm(p => ({
                    ...p,
                    title: item.title || p.title,
                    whp: item.whp || p.whp,
                    esi: item.esi || p.esi,
                    applicationRate: item.applicationRate || p.applicationRate,
                    applicationMethod: item.applicationMethod || p.applicationMethod,
                    batchNumber: item.batchNumber || p.batchNumber,
                  }));
                }}>
                <option value="">— Choose a chemical —</option>
                {sprayInventory.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-3 mb-4">
            {[
              { key: "treatmentDate", label: "Treatment date *", type: "date" },
              { key: "title", label: "Chemical name *", type: "text", placeholder: "e.g. RoundUp" },
              { key: "areaTreated", label: "Area treated (ha)", type: "number", placeholder: `e.g. ${sprayFormPaddock?.ha || "25"}` },
              { key: "quantity", label: "Quantity used", type: "text", placeholder: "e.g. 5L in 100L water" },
              { key: "applicationRate", label: "Application rate", type: "text", placeholder: "e.g. 2L/ha" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>
                <input type={f.type} value={sprayForm[f.key] || ""}
                  onChange={(e) => setSprayForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Application method</label>
              <select value={sprayForm.applicationMethod || ""}
                onChange={(e) => setSprayForm((p) => ({ ...p, applicationMethod: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                <option value="">Select...</option>
                {["Boom spray", "Spot spray", "Aerial", "Drench", "Granules", "Other"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            {[
              { key: "whp", label: "WHP (days)", placeholder: "e.g. 14" },
              { key: "esi", label: "ESI (days)", placeholder: "e.g. 7" },
              { key: "batchNumber", label: "Batch number", placeholder: "e.g. RU2026A" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>
                <input type="text" value={sprayForm[f.key] || ""}
                  onChange={(e) => setSprayForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Notes</label>
              <textarea value={sprayForm.notes || ""}
                onChange={(e) => setSprayForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5" />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!sprayForm.title || !sprayForm.treatmentDate) { showToast("Please enter a chemical name and date"); return; }
              const fields = { ...sprayForm, location: sprayFormPaddock?.name || sprayForm.location || "" };
              try {
                const created = await api.addSprayInventory(farmName, fields);
                setSprayInventory((prev) => [...prev, created].sort((a,b) => (a.title||'').localeCompare(b.title||'')));
                setShowSprayForm(false);
                setSprayForm({});
                markChanged();
                showToast("Spray treatment saved");
              } catch (err) {
                showToast(err.message || "Couldn't save to the server");
              }
            }}
            className="w-full bg-amber-500 text-white rounded-2xl py-3.5 font-bold"
          >
            Save Record
          </button>
        </Modal>
      )}

      {/* ── Bulk Spray Modal ── */}
      {showBulkSpray && (
        <Modal title="Log Spray Treatment" onClose={() => { setShowBulkSpray(false); setSprayForm({}); setSpraySelectedPaddocks([]); }}>
          <div className="mb-3">
            <div className="text-sm font-bold text-slate-700 mb-2">Paddocks to spray (alphabetical)</div>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
              {[...paddocks].sort((a,b) => a.name.localeCompare(b.name)).map((p) => {
                const selected = spraySelectedPaddocks.includes(p.name);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSpraySelectedPaddocks((prev) =>
                      selected ? prev.filter((n) => n !== p.name) : [...prev, p.name]
                    )}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left ${selected ? "bg-amber-50" : "bg-white"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs ${selected ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300"}`}>
                        {selected ? "✓" : ""}
                      </span>
                      <span className="font-medium text-slate-700">{p.name}</span>
                    </div>
                    <span className="text-slate-400 text-xs">{Number(p.ha||0).toFixed(1)} ha</span>
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-amber-600 font-semibold mt-1">
              {spraySelectedPaddocks.length} selected · {spraySelectedPaddocks.reduce((s,n) => {
                const p = paddocks.find(p=>p.name===n);
                return s + Number(p?.ha||0);
              }, 0).toFixed(1)} ha total
            </div>
          </div>
          <div className="space-y-3 mb-4">
            {[
              { key: "treatmentDate", label: "Treatment date *", type: "date" },
              { key: "title", label: "Chemical name *", type: "text", placeholder: "e.g. RoundUp" },
              { key: "quantity", label: "Quantity used", type: "text", placeholder: "e.g. 5L in 100L water" },
              { key: "applicationRate", label: "Application rate", type: "text", placeholder: "e.g. 2L/ha" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>
                <input type={f.type} value={sprayForm[f.key] || ""}
                  onChange={(e) => setSprayForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
              </div>
            ))}
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Application method</label>
              <select value={sprayForm.applicationMethod || ""} onChange={(e) => setSprayForm((p) => ({ ...p, applicationMethod: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                <option value="">Select...</option>
                {["Boom spray", "Spot spray", "Aerial", "Drench", "Granules", "Other"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {[
              { key: "whp", label: "WHP (days)", placeholder: "e.g. 14" },
              { key: "esi", label: "ESI (days)", placeholder: "e.g. 7" },
              { key: "batchNumber", label: "Batch number", placeholder: "e.g. RU2026A" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>
                <input type="text" value={sprayForm[f.key] || ""} onChange={(e) => setSprayForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              if (!sprayForm.title || !sprayForm.treatmentDate) { showToast("Please enter a chemical name and date"); return; }
              if (spraySelectedPaddocks.length === 0) { showToast("Select at least one paddock"); return; }
              const totalHa = spraySelectedPaddocks.reduce((s,n) => {
                const p = paddocks.find(p=>p.name===n);
                return s + Number(p?.ha||0);
              }, 0);
              const fields = {
                ...sprayForm,
                location: spraySelectedPaddocks.join(", "),
                areaTreated: String(totalHa.toFixed(1)),
              };
              try {
                const created = await api.addSprayInventory(farmName, fields);
                setSprayInventory((prev) => [...prev, created].sort((a,b) => (a.title||'').localeCompare(b.title||'')));
                setShowBulkSpray(false);
                setSprayForm({});
                setSpraySelectedPaddocks([]);
                setPaddockDetail(null);
                markChanged();
                showToast(`Spray recorded for ${spraySelectedPaddocks.length} paddock${spraySelectedPaddocks.length > 1 ? "s" : ""}`);
              } catch (err) {
                showToast(err.message || "Couldn't save to the server");
              }
            }}
            className="w-full bg-amber-500 text-white rounded-2xl py-3.5 font-bold"
          >
            Save Spray Record
          </button>
        </Modal>
      )}
    </div>
  );

  // ── Workflow Screen ─────────────────────────────────────────────────────────
  // Passes the JWT token to the iframe via postMessage so it can call our API
  // [extracted to top-level component]

  // ── Cattle Feeding Screen ─────────────────────────────────────────────────
  // [extracted to top-level component]

  // ── Sheep Feeding Screen ──────────────────────────────────────────────────
  // [extracted to top-level component]

  const LivestockScreen = () => (
    <div className="pb-24 bg-stone-50 min-h-screen">
      <Header title="Livestock" />
      <div className="p-4 space-y-3">
        {[
          { icon: "🔢", label: "Mob List", sub: `${mobs.length} mobs`, action: () => setTab("moblist") },
          { icon: "📊", label: "Mob activity", sub: "View recent actions", action: () => setTab("mobactivity") },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="w-full flex items-center justify-between px-4 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-xl">{item.icon}</div>
              <div className="text-left">
                <div className="font-bold text-slate-800">{item.label}</div>
                <div className="text-xs text-slate-400">{item.sub}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  );

  const MobActivityScreen = () => {
    const allHistory = Object.entries(history).flatMap(([mobId, entries]) =>
      entries.map((e) => ({ ...e, mob: mobs.find((m) => m.id === Number(mobId))?.name || "Unknown" }))
    );
    return (
      <div className="pb-24 bg-stone-50 min-h-screen">
        <div className="bg-white flex items-center px-4 py-4 sticky top-0 z-10 border-b border-stone-100">
          <button onClick={() => setTab("livestock")} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-2">‹</button>
          <h1 className="text-base font-bold flex-1 text-center text-slate-800">Mob Activity</h1>
          <div className="w-8" />
        </div>
        <div className="p-4 space-y-3">
          {allHistory.length === 0 && <p className="text-center text-slate-400 text-sm p-6">No activity recorded yet. Use mob actions to log activity.</p>}
          {allHistory.map((h, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between font-bold text-slate-800">
                <span>{h.action}</span>
                <span className="text-slate-400 text-xs font-medium">{h.date}</span>
              </div>
              <div className="text-sm text-red-950 font-medium">{h.mob}</div>
              {h.detail && <div className="text-sm text-slate-400 mt-1 whitespace-pre-line">{h.detail}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SHOW_OPTIONS = ["All mobs", "Sheep", "Rams", "Cattle", "Bulls", "Withholding"];
  const GROUP_OPTIONS = ["By Name", "By Paddock", "By Tag", "By Management Tag", "By Breed", "By Age Class", "By Ent/Mgmt Group"];

  const matchesShow = (m) => {
    switch (showFilter) {
      case "Sheep": return m.species === "Sheep";
      case "Cattle": return m.species === "Cattle";
      case "Rams": return m.type === "Rams" || m.species === "Rams";
      case "Bulls": return m.type === "Bulls" || m.species === "Bulls";
      case "Withholding": return m.whp > 0;
      default: return true;
    }
  };

  const groupKeyFor = (m) => {
    switch (groupBy) {
      case "By Paddock": return m.paddock;
      case "By Tag": return m.tag;
      case "By Management Tag":
      case "By Ent/Mgmt Group": return m.mgmtGroup;
      case "By Breed": return m.breed;
      case "By Age Class": return m.ageClass;
      default: return null; // By Name -> no grouping
    }
  };

  const filteredMobs = mobs.filter((m) => m.name.toLowerCase().includes(filterText.toLowerCase()) && matchesShow(m));

  const groupedMobs = (() => {
    if (groupBy === "By Name") return [{ key: null, items: [...filteredMobs].sort((a, b) => a.name.localeCompare(b.name)) }];
    const groups = {};
    filteredMobs.forEach((m) => {
      const k = groupKeyFor(m) || "Unassigned";
      if (!groups[k]) groups[k] = [];
      groups[k].push(m);
    });
    return Object.entries(groups).map(([key, items]) => ({ key, items }));
  })();

  const MobCard = (m) => (
    <div
      key={m.id}
      className="w-full flex items-center justify-between px-4 py-4 bg-white rounded-2xl border border-stone-200/80 text-left"
    >
      <button onClick={() => { setSelectedMobId(m.id); setMobTab("Summary"); }} className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-slate-800 truncate">{m.name}</div>
          {m.tag && m.tag !== "Unassigned" && (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TAG_COLOUR_HEX[m.tag] || "#cbd5e1" }} />
          )}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 truncate">{m.desc}</div>
        <div className="text-xs text-red-950 font-medium mt-1">{m.paddock} · {m.dse} DSE/hd</div>
        {m.whp > 0 && <div className="text-xs text-rose-500 font-medium mt-0.5">WHP {m.whp}d</div>}
      </button>
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <div className="text-xl font-bold text-slate-700">{m.count}</div>
        {/* Move button — opens a paddock picker to move this mob */}
        {canEdit && (
          <button
            onClick={() => setDragMobId(dragMobId === m.id ? null : m.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${dragMobId === m.id ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"}`}
            title="Move to paddock"
          >
            ↕
          </button>
        )}
      </div>
    </div>
  );

  const MobListScreen = () => (
    <div className="pb-24 bg-stone-50 min-h-screen">
      <div className="bg-white flex items-center px-4 py-4 sticky top-0 z-10 border-b border-stone-100">
        <button onClick={() => setTab("livestock")} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-2">‹</button>
        <h1 className="text-base font-bold flex-1 text-center text-slate-800">Mob List</h1>
        <div className="w-8" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
          <Search size={16} className="text-slate-400 mr-2" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search mobs"
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPickerOpen("show")} className="flex-1 flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <span className="font-semibold text-slate-700 text-sm">{showFilter}</span>
            <ChevronRight size={14} className="text-slate-300 rotate-90" />
          </button>
          <button onClick={() => setPickerOpen("group")} className="flex-1 flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <span className="font-semibold text-slate-700 text-sm">{groupBy}</span>
            <ChevronRight size={14} className="text-slate-300 rotate-90" />
          </button>
        </div>
      </div>
      {canEdit && (
        <div className="px-4 pb-2">
          <button onClick={() => { setNewMobForm({ species: "Cattle", dobOption: "Year" }); setEditingMobId(null); setShowAddMob(true); }} className="w-full flex items-center justify-center gap-2 bg-red-900 text-white rounded-2xl py-3 font-bold shadow-sm">
            <span className="text-lg leading-none">+</span> New mob
          </button>
        </div>
      )}

      <div className="px-4 space-y-4">
        {filteredMobs.length === 0 && <p className="text-center text-slate-400 text-sm p-6">No mobs match your filters.</p>}
        {dragMobId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
              Moving: {mobs.find(m => m.id === dragMobId)?.name} — tap a paddock below
            </div>
            <div className="flex flex-wrap gap-2">
              {paddocks.map(p => (
                <button
                  key={p.id}
                  onClick={async () => {
                    const mob = mobs.find(m => m.id === dragMobId);
                    if (!mob || mob.paddock === p.name) { setDragMobId(null); return; }
                    const dateStr = todayStr();
                    const detail = `Moved from ${mob.paddock} to ${p.name}`;
                    setMobs(prev => prev.map(m => m.id === dragMobId ? { ...m, paddock: p.name, daysInPaddock: 0 } : m));
                    setDragMobId(null);
                    showToast(`${mob.name} → ${p.name}`);
                    try {
                      await api.updateMob(dragMobId, { paddock: p.name, daysInPaddock: 0 });
                      await api.addMobHistory(dragMobId, { action: "Move", detail, date: dateStr });
                    } catch (err) { showToast(err.message || "Couldn't save move"); }
                  }}
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-full text-sm font-medium text-slate-700 hover:bg-amber-100 active:bg-amber-200"
                >
                  {p.name}
                </button>
              ))}
              <button onClick={() => setDragMobId(null)} className="px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-400">Cancel</button>
            </div>
          </div>
        )}
        {groupedMobs.map((g, gi) => (
          <div key={gi}>
            {g.key && (
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1 py-1">
                {g.key} ({g.items.reduce((s, m) => s + m.count, 0)})
              </div>
            )}
            <div className="space-y-3">
              {g.items.map(MobCard)}
            </div>
          </div>
        ))}
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end z-50 max-w-md mx-auto">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-3 flex-shrink-0"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
            <div className="text-center font-extrabold text-slate-800 py-3 flex-shrink-0 border-b border-slate-100">{pickerOpen === "show" ? "Show" : "Group Mobs"}</div>
            <div className="overflow-y-auto px-4 pt-2 pb-2">
              <div className="space-y-1">
                {(pickerOpen === "show" ? SHOW_OPTIONS : GROUP_OPTIONS).map((opt) => {
                  const active = pickerOpen === "show" ? showFilter === opt : groupBy === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => { pickerOpen === "show" ? setShowFilter(opt) : setGroupBy(opt); setPickerOpen(null); }}
                      className={`w-full text-center py-3.5 rounded-2xl font-semibold ${active ? "bg-amber-200 text-red-950" : "text-slate-700"}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setPickerOpen(null)} className="w-full text-center py-4 flex-shrink-0 font-bold text-rose-500 border-t border-slate-100">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderField = (field) => {
    const isDateField = field.type === "date";
    const value = formValues[field.label] ?? (isDateField ? todayStr() : "");
    const onChange = (v) => setFormValues((prev) => ({ ...prev, [field.label]: v }));

    // ── Treatment multi-picker ─────────────────────────────────────────────────
    if (field.type === "treatment_picker") {
      const selected = formValues["_selectedTreatments"] || [];
      const doses = formValues["_doses"] || {};
      const mobCount = selectedMob?.count || 0;
      // Days from either the picker shape (whp/esi) or inventory rows ("21 days" text)
      const daysOf = (v) => parseInt(v) || 0;
      const parseDose = (item) => { const m = String(item.dosage || "").match(/([\d.]+)/); return m ? Number(m[1]) : ""; };
      const toggle = (item) => {
        const already = selected.find(x => x.id === item.id);
        const next = already ? selected.filter(x => x.id !== item.id) : [...selected, item];
        const nextDoses = { ...doses };
        if (already) {
          delete nextDoses[item.id];
        } else {
          // Prefill dose/head from the inventory dosage; total = dose × head count
          const dose = parseDose(item);
          nextDoses[item.id] = {
            dosePerHead: dose === "" ? "" : dose,
            totalUsed: dose !== "" && mobCount ? Math.round(dose * mobCount * 100) / 100 : "",
            unit: item.containerUnit || "mL",
          };
        }
        setFormValues(prev => ({
          ...prev,
          "_selectedTreatments": next,
          "_doses": nextDoses,
          "Treatment": next.map(x => x.title).join(", "),
          "_whpDays": Math.max(0, 0, ...next.map(x => daysOf(x.whp ?? x.withholdingMeat))),
          "_esiDays": Math.max(0, 0, ...next.map(x => daysOf(x.esi ?? x.withholdingESI))),
        }));
      };
      const setDose = (id, key, val) => {
        setFormValues(prev => {
          const cur = { ...(prev["_doses"] || {}) };
          const entry = { ...(cur[id] || {}), [key]: val };
          // Editing the dose recalculates the total; editing the total stands alone
          if (key === "dosePerHead") {
            const n = Number(val);
            if (n > 0 && mobCount) entry.totalUsed = Math.round(n * mobCount * 100) / 100;
          }
          cur[id] = entry;
          return { ...prev, "_doses": cur };
        });
      };
      return (
        <div>
          <div className="text-xs text-slate-400 mb-2">Select one or more treatments from inventory — tap to toggle</div>
          {inventory.length === 0 && <div className="text-sm text-slate-400 italic">No treatments in inventory yet</div>}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {inventory.map(item => {
              const on = selected.find(x => x.id === item.id);
              const d = doses[item.id] || {};
              const unit = d.unit || item.containerUnit || "mL";
              const whpText = item.whp ?? item.withholdingMeat;
              const esiText = item.esi ?? item.withholdingESI;
              return (
                <div key={item.id} className={`rounded-xl border-2 transition-colors ${on ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
                  <button type="button" onClick={() => toggle(item)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                    <div>
                      <div className={`text-sm font-semibold ${on ? "text-amber-800" : "text-slate-700"}`}>{item.title}</div>
                      <div className="text-xs text-slate-400">{[daysOf(whpText) > 0 && `WHP ${daysOf(whpText)}d`, daysOf(esiText) > 0 && `ESI ${daysOf(esiText)}d`].filter(Boolean).join(" · ")}</div>
                    </div>
                    {on && <span className="text-amber-500 font-bold text-lg">✓</span>}
                  </button>
                  {on && (
                    <div className="px-3 pb-3 space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Dosage per head ({unit})</label>
                          <input type="number" inputMode="decimal" value={d.dosePerHead ?? ""}
                            onChange={(e) => setDose(item.id, "dosePerHead", e.target.value)}
                            className="w-full border border-amber-300 rounded-lg px-2 py-2 bg-white text-sm" placeholder="e.g. 4.5" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Total used ({unit})</label>
                          <input type="number" inputMode="decimal" value={d.totalUsed ?? ""}
                            onChange={(e) => setDose(item.id, "totalUsed", e.target.value)}
                            className="w-full border border-amber-300 rounded-lg px-2 py-2 bg-white text-sm" placeholder={mobCount ? `dose × ${mobCount} hd` : ""} />
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                        {item.batchNumber && <span>Batch: <b>{item.batchNumber}</b></span>}
                        {item.expiryDate && <span>Expiry: <b>{item.expiryDate}</b></span>}
                        {mobCount > 0 && <span>{mobCount} head</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="mt-3 bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
              <span className="font-semibold">Selected:</span> {selected.map(x => x.title).join(", ")}
              {formValues["_whpDays"] > 0 && <div className="mt-1 text-red-600 font-semibold">⚠ WHP: {formValues["_whpDays"]} days · ESI: {formValues["_esiDays"]} days</div>}
            </div>
          )}
        </div>
      );
    }
    if (field.type === "score_counter") {
      const scores = formValues["_scores"] || [];
      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      // Sheep & Rams: 2–4 in 0.25 increments. Cattle/Bulls: 1–5 in 0.5 increments
      const isSheepSpecies = selectedMob?.species === "Sheep" || selectedMob?.species === "Rams";
      const SCORE_VALUES = isSheepSpecies
        ? [2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]
        : [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
      const addScore = (s) => {
        const next = [...scores, s];
        setFormValues(prev => ({
          ...prev,
          "_scores": next,
          "Average condition score": (next.reduce((a, b) => a + b, 0) / next.length).toFixed(2),
        }));
      };
      const removeLastScore = () => {
        if (scores.length === 0) return;
        const next = scores.slice(0, -1);
        setFormValues(prev => ({
          ...prev,
          "_scores": next,
          "Average condition score": next.length > 0 ? (next.reduce((a, b) => a + b, 0) / next.length).toFixed(2) : "",
        }));
      };
      return (
        <div>
          <div className="text-xs text-slate-400 mb-2">Tap a score for each animal — average is calculated automatically</div>
          {/* Score buttons */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {SCORE_VALUES.map(s => (
              <button key={s} type="button"
                onClick={() => addScore(s)}
                className={`rounded-xl py-3 font-bold text-sm border-2 transition-colors ${
                  s <= 2 ? "border-red-200 bg-red-50 text-red-700 active:bg-red-100" :
                  s <= 3 ? "border-amber-200 bg-amber-50 text-amber-700 active:bg-amber-100" :
                  "border-green-200 bg-green-50 text-green-700 active:bg-green-100"
                }`}
              >{s}</button>
            ))}
          </div>
          {/* Running tally */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-500">{scores.length} animal{scores.length !== 1 ? "s" : ""} scored</div>
              {scores.length > 0 && (
                <button type="button" onClick={removeLastScore} className="text-xs text-slate-400 hover:text-red-500">← Undo last</button>
              )}
            </div>
            {scores.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1 mb-2">
                  {scores.map((s, i) => (
                    <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      s <= 2 ? "bg-red-100 text-red-700" : s <= 3 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}>{s}</span>
                  ))}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Average:</span>
                  <span className={`text-2xl font-bold ${avg <= 2 ? "text-red-600" : avg <= 3 ? "text-amber-600" : "text-green-600"}`}>
                    {avg?.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-300 italic text-center py-1">No scores entered yet</div>
            )}
          </div>
        </div>
      );
    }
    if (field.type === "select") {
      let options = field.options;
      if (field.label === "Merge into mob") {
        options = mobs.filter((m) => m.id !== selectedMobId).map((m) => m.name);
      } else if (field.label === "Treatment") {
        options = inventory.map((i) => i.title);
      } else if (field.label === "Transfer to property") {
        options = Object.keys(farmsMobs).filter((f) => f !== farmName);
      } else if (field.label === "Move to paddock" || field.label === "Copy to paddock") {
        options = paddocks.map((p) => p.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      }
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
          <option value="">Select...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return (
      <input
        type={field.type}
        step={field.type === "number" ? "any" : undefined}
        inputMode={field.type === "number" ? "decimal" : undefined}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
      />
    );
  };

  const MobDetails = () => {
    if (!selectedMob) return null;
    const mobHistory = history[selectedMob.id] || [];
    const mobNotes = notes[selectedMob.id] || [];
    return (
      <div className="fixed inset-0 bg-slate-50 z-30 flex flex-col max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-md flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <button className="text-slate-400 text-sm font-semibold" onClick={() => { setSelectedMobId(null); setDragMobId(null); }}>CLOSE</button>
          <h1 className="text-base font-bold text-slate-800">Mob Details</h1>
          <div className="w-12" />
        </div>
        <div className="flex bg-white border-b border-slate-100">
          {["Summary", "History", "Notes"].map((t) => (
            <button key={t} onClick={() => setMobTab(t)} className={`flex-1 py-3 font-semibold text-sm ${mobTab === t ? "text-red-950 border-b-2 border-red-900" : "text-slate-400"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {mobTab === "Summary" && (
            <>
              <div className="text-xl font-extrabold text-slate-800 mb-1">{selectedMob.name}</div>
              <div className="text-xs text-slate-400 font-medium mb-4 uppercase">{selectedMob.desc}</div>

              <button disabled={!canEdit} onClick={() => openAction("Ent/mgmt group")} className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3 text-left">
                <div>
                  <div className="text-xs text-slate-400 font-semibold tracking-wide">MANAGEMENT TAG</div>
                  <div className={`mt-1 ${selectedMob.mgmtGroup && selectedMob.mgmtGroup !== "Unassigned" ? "text-lg font-extrabold text-slate-800" : "text-slate-400"}`}>
                    {selectedMob.mgmtGroup && selectedMob.mgmtGroup !== "Unassigned" ? selectedMob.mgmtGroup : "Tap to add management tag"}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button disabled={!canEdit} onClick={() => openAction("Recount")} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-400 font-semibold">MOB SIZE</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.count.toLocaleString()}</div>
                </button>
                <button disabled={!canEdit} onClick={() => openAction("DSE")} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-400 font-semibold">DSE</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.dse}</div>
                </button>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-400 font-semibold">DAYS IN PADDOCK</div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.daysInPaddock ?? 13}</div>
                </div>
                <button
                  onClick={() => { if (canEdit) setShowPaddockPicker(true); }}
                  className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left ${canEdit ? "active:bg-slate-50" : "opacity-60"}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-400 font-semibold">PADDOCK</div>
                    {canEdit && <ChevronRight size={16} className="text-slate-300" />}
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{selectedMob.paddock || "Unassigned"}</div>
                </button>
              </div>

              <div className="text-sm font-bold text-slate-700 mt-6 mb-2">Weights</div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => openAction("Weigh")} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-400 font-semibold leading-tight">AVG LAST WEIGHT</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                  {selectedMob.lastWeight ? (
                    <>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.lastWeight} <span className="text-sm font-medium text-slate-400">kg</span></div>
                      <div className="text-xs text-slate-400 mt-1">{selectedMob.lastWeightDate}</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 mt-2">Tap to add weight</div>
                  )}
                </button>
                <button onClick={() => openAction("Score")} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-400 font-semibold leading-tight">COND. SCORE</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                  {selectedMob.lastScore ? (
                    <>
                      <div className={`text-2xl font-extrabold mt-1 ${selectedMob.lastScore <= 2 ? "text-red-600" : selectedMob.lastScore <= 3 ? "text-amber-600" : "text-green-600"}`}>
                        {selectedMob.lastScore} <span className="text-sm font-medium text-slate-400">/ 5</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{selectedMob.lastScoreDate}</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 mt-2">Tap to score</div>
                  )}
                </button>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-400 font-semibold leading-tight">AVG ESTIMATED WEIGHT</div>
                  {selectedMob.lastWeight ? (
                    <>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.lastWeight} <span className="text-sm font-medium text-slate-400">kg</span></div>
                      <div className="text-xs text-slate-400 mt-1">Based on latest live weight</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-400 mt-2">No weight recorded</div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-400 font-semibold leading-tight">ACTUAL ADG</div>
                  <div className="text-sm text-slate-400 mt-2">Based on the last 2 weights</div>
                </div>
                <button disabled={!canEdit} onClick={() => openAction("ADG")} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-slate-400 font-semibold leading-tight">ASSUMED ADG</div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                  {selectedMob.assumedADG ? (
                    <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.assumedADG} <span className="text-sm font-medium text-slate-400">kg/day</span></div>
                  ) : (
                    <div className="text-sm text-slate-400 mt-2">Tap to add assumed ADG</div>
                  )}
                </button>
              </div>
            </>
          )}
          {mobTab === "History" && (
            mobHistory.length === 0
              ? <p className="text-slate-400 text-sm">No history records yet. Actions you perform will appear here.</p>
              : mobHistory.map((h, i) => (
                <div key={h.id ?? i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between font-bold text-slate-800"><span>{h.action}</span><span className="text-slate-400 text-xs">{h.date}</span></div>
                      {h.detail && <div className="text-sm text-slate-500 mt-1 whitespace-pre-line">{h.detail}</div>}
                      {h.authorName && <div className="text-xs text-slate-400 mt-1">by {h.authorName}</div>}
                    </div>
                    {canEdit && h.id && (
                      <button onClick={async () => {
                        if (!window.confirm(`Delete this ${h.action} record?`)) return;
                        try {
                          await api.deleteMobHistory(selectedMob.id, h.id);
                          // Remove from local history
                          setHistory(prev => ({
                            ...prev,
                            [selectedMob.id]: (prev[selectedMob.id] || []).filter(r => r.id !== h.id),
                          }));
                          // If it was a Treat, reverse the inventory deduction
                          if (h.action === "Treat" && h.detail) {
                            const reversals = [];
                            // New-format records carry the exact amount: "↳ Title — 4.5 mL/hd · 738 mL used · ..."
                            h.detail.split("\n").forEach(line => {
                              const m = line.match(/^↳ (.+?) — .*?([\d.]+)\s*\S*\s+used/);
                              if (!m) return;
                              const invItem = inventory.find(it => it.title === m[1].trim());
                              const totalDose = Number(m[2]) || 0;
                              if (!invItem || !totalDose) return;
                              const newUsed = Math.max(0, (Number(invItem.quantityUsed) || 0) - totalDose);
                              reversals.push({ invItem, newUsed, totalDose });
                            });
                            const treatMatch = h.detail.match(/Treated: ([^·\n]+)/);
                            if (reversals.length === 0 && treatMatch) {
                              // Legacy records: approximate from inventory dosage × head count
                              const treatedNames = treatMatch[1].trim().split(", ");
                              treatedNames.forEach(tName => {
                                const invItem = inventory.find(it => it.title === tName.trim());
                                if (invItem) {
                                  const mobCount = selectedMob?.count || 0;
                                  const doseMatch = (invItem.dosage || "").match(/^([\d.]+)/);
                                  if (doseMatch && mobCount) {
                                    const totalDose = Number(doseMatch[1]) * mobCount;
                                    const currentUsed = Number(invItem.quantityUsed) || 0;
                                    const newUsed = Math.max(0, currentUsed - totalDose);
                                    reversals.push({ invItem, newUsed, totalDose });
                                  }
                                }
                              });
                            }
                            if (true) {
                              for (const { invItem, newUsed, totalDose } of reversals) {
                                try {
                                  await api.updateTreatment(invItem.id, { quantityUsed: newUsed.toString() });
                                  setInventory(prev => prev.map(it => it.id === invItem.id ? { ...it, quantityUsed: newUsed.toString() } : it));
                                } catch {}
                              }
                              if (reversals.length > 0) {
                                showToast(`History deleted — ${reversals.length} treatment${reversals.length > 1 ? "s" : ""} returned to inventory`);
                              } else {
                                showToast("History entry deleted");
                              }
                            } else {
                              showToast("History entry deleted");
                            }
                          } else {
                            showToast("History entry deleted");
                          }
                        } catch (err) {
                          showToast(err.message || "Couldn't delete history entry");
                        }
                      }} className="ml-2 mt-0.5 text-rose-400 hover:text-rose-600 flex-shrink-0" title="Delete this record">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
          {mobTab === "Notes" && (
            <>
              {mobNotes.length === 0 && <p className="text-slate-400 text-sm mb-3">No notes yet.</p>}
              {mobNotes.map((n, i) => (
                <div key={n.id ?? i} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 mb-2 text-sm">
                  <div>{n.text ?? n}</div>
                  {n.author && <div className="text-xs text-slate-400 mt-1">{n.author}</div>}
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note..." className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white" />
                <button
                  onClick={async () => {
                    if (!noteDraft.trim()) return;
                    const text = noteDraft.trim();
                    setNoteDraft("");
                    setNotes((prev) => ({ ...prev, [selectedMob.id]: [{ text, author: currentUser.name }, ...(prev[selectedMob.id] || [])] }));
                    try {
                      const created = await api.addMobNote(selectedMob.id, text, currentUser.name);
                      setNotes((prev) => ({
                        ...prev,
                        [selectedMob.id]: [{ id: created.id, text: created.text, author: created.authorName }, ...(prev[selectedMob.id] || []).filter((n) => n.text !== text)],
                      }));
                      markChanged();
                    } catch (err) {
                      showToast(err.message || "Couldn't save note to the server");
                    }
                  }}
                  className="bg-red-900 text-white rounded-xl px-4 font-semibold"
                >Add</button>
              </div>
            </>
          )}
        </div>

        <div className="flex border-t border-slate-100 bg-white px-2 py-2 flex-shrink-0">
          {[
            { label: "Treat", icon: "💉", action: () => openAction("Treat") },
            { label: "Weigh", icon: "⚖️", action: () => openAction("Weigh") },
            { label: "More", icon: "⋯", action: () => setShowMore(true) },
          ].map((b) => (
            <button key={b.label} onClick={b.action} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl active:bg-slate-50">
              <span className="text-xl">{b.icon}</span>
              <span className="text-xs font-semibold text-slate-600">{b.label}</span>
            </button>
          ))}
        </div>

        {showMore && (
          <Modal title="More Options" onClose={() => setShowMore(false)}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[...MORE_ACTIONS, ...QUICK_ACTIONS].filter(([label]) => canEdit || WORKER_ACTIONS.includes(label)).map(([label, icon], i) => (
                <button key={i} onClick={() => openAction(label)} className="border border-slate-100 bg-slate-50 rounded-2xl flex flex-col items-center justify-center py-4 gap-1 active:bg-slate-100">
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-semibold text-center text-slate-700">{label}</span>
                </button>
              ))}
            </div>
            {canEdit && (
              <>
                <div className="text-xs text-slate-400 font-bold mb-2 tracking-wide">MOB ACTIONS</div>
                <div className="grid grid-cols-3 gap-3">
                  {MOB_ACTIONS.map(([label, icon], i) => (
                    <button key={i} onClick={() => openAction(label)} className="border border-slate-100 bg-slate-50 rounded-2xl flex flex-col items-center justify-center py-4 gap-1 active:bg-slate-100">
                      <span className="text-xl">{icon}</span>
                      <span className="text-xs font-semibold text-center text-slate-700">{label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {!canEdit && (
              <p className="text-xs text-slate-400 text-center mt-2">Editing and mob management actions require Manager or Admin access.</p>
            )}
          </Modal>
        )}

        {actionForm && (
          <Modal title={actionForm} onClose={() => setActionForm(null)}>
            {actionForm === "Delete" ? (
              <div className="mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-2xl">🗑️</span></div>
                <p className="text-center font-bold text-slate-800 mb-1">Delete "{selectedMob?.name}"?</p>
                <p className="text-center text-sm text-slate-500 mb-4">This will permanently remove the mob and all its history. This cannot be undone.</p>
                <p className="text-center text-xs font-semibold text-rose-500 bg-rose-50 rounded-xl py-2 px-3">Type the mob name to confirm deletion</p>
                <input
                  className="w-full border-2 border-rose-200 rounded-xl px-3 py-2.5 mt-3 text-center font-semibold focus:border-rose-400 outline-none"
                  placeholder={selectedMob?.name}
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {ACTION_FIELDS[actionForm]?.map((f) => (
                  <div key={f.label}>
                    {f.type !== "score_counter" && <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>}
                    {renderField(f)}
                  </div>
                ))}
              </div>
            )}
            {actionForm === "Delete" ? (
              <button onClick={() => {
                const typed = deleteConfirmText.trim().toLowerCase();
                const expected = (selectedMob?.name || "").trim().toLowerCase();
                if (!typed || typed !== expected) { showToast("Name doesn't match — mob not deleted"); return; }
                submitAction();
              }} className="w-full rounded-2xl py-3.5 font-bold text-white bg-rose-500">
                Yes, permanently delete mob
              </button>
            ) : (
              <button onClick={submitAction} className="w-full rounded-2xl py-3.5 font-bold text-white bg-red-900">Save</button>
            )}
          </Modal>
        )}
      </div>
    );
  };

  const MenuScreen = () => (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => { setShowMenu(false); setInventoryView(null); }} />
      <div className="w-[82%] max-w-sm bg-white flex flex-col shadow-2xl">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="font-extrabold text-xl text-slate-800">{farmName}</div>
          <div className="text-xs text-slate-400 font-medium">Farm menu</div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button onClick={() => setShowSwitchFarm(true)} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-red-950"><ArrowLeftRight size={16} /></div>
            <span className="font-semibold text-slate-700">Switch farm</span>
          </button>
          <button onClick={() => { setShowAllFarms(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-500"><Sparkles size={16} /></div>
            <span className="font-semibold text-slate-700">All Farms</span>
          </button>
          <button onClick={handleSync} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-red-950"><RefreshCw size={16} className={syncing ? "animate-spin" : ""} /></div>
            <span className="font-semibold text-slate-700">Synchronise data</span>
          </button>
          <button onClick={() => setShowInventory(true)} className="w-full flex items-center justify-between px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <span className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-red-950">🛍️</div>
              <span className="font-semibold text-slate-700">Inventory</span>
            </span>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
          <button onClick={() => setShowRainfall(true)} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-sky-500"><Droplet size={16} /></div>
            <span className="font-semibold text-slate-700">Rainfall records</span>
          </button>
          <button onClick={() => setShowFieldNotes(true)} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-base">📍</div>
            <div className="text-left flex-1">
              <div className="font-semibold text-slate-700">Field Notes</div>
              <div className="text-xs text-slate-400">GPS-pinned paddock observations</div>
            </div>
            {fieldNotes.filter(n => !n.resolvedAt).length > 0 && (
              <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                {fieldNotes.filter(n => !n.resolvedAt).length}
              </span>
            )}
          </button>
          <button onClick={() => setShowPaddockList(true)} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600">▦</div>
            <div className="text-left">
              <div className="font-semibold text-slate-700">Paddock list</div>
              <div className="text-xs text-slate-400">{farmName} · {paddocks.length} paddocks</div>
            </div>
            <ChevronRight size={16} className="text-slate-300 ml-auto" />
          </button>
          <button onClick={() => {
            setShowRecords(true);
            // Always refetch on open — records entered by other users must show up
            {
              setRecordsLoading(true);
              api.listAllMobHistory(farmName)
                .then(h => { setAllMobHistory(h); setRecordsLoading(false); })
                .catch(() => setRecordsLoading(false));
            }
          }} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">📋</div>
            <div className="text-left">
              <div className="font-semibold text-slate-700">Records & Export</div>
              <div className="text-xs text-slate-400">Deaths, treatments, scans, spray, rainfall — CSV / Excel / Print</div>
            </div>
            <ChevronRight size={16} className="text-slate-300 ml-auto" />
          </button>
          <div className="h-px bg-slate-100 my-2" />
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Settings size={16} /></div>
            <span className="font-semibold text-slate-700">Settings</span>
          </button>
          <button onClick={() => setShowHelp(true)} className="w-full flex items-center justify-between px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <span className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><LifeBuoy size={16} /></div>
              <span className="font-semibold text-slate-700">Get help</span>
            </span>
            <ChevronRight size={16} className="text-slate-300" />
          </button>
          <button onClick={() => { setShowAccounts(true); setShowMenu(false); }} className="w-full flex items-center justify-between px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <span className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">👤</div>
              <span className="font-semibold text-slate-700">Accounts</span>
            </span>
            <span className="text-xs font-bold text-red-950 bg-orange-50 px-2 py-1 rounded-full">{userRole}</span>
          </button>
        </div>
        <div className="flex justify-between px-5 py-4 border-t border-slate-100 text-sm font-semibold">
          <button
            onClick={() => {
              setShowMenu(false);
              if (stayLoggedIn) {
                setLocked(true);
              } else {
                setAuthToken(null);
                setCurrentAccount(null);
                setLoggedInEmail(null);
                setLoginEmail("");
              }
            }}
            className="text-rose-500"
          >
            Log out
          </button>
          <button onClick={() => setShowMenu(false)} className="text-slate-400">Close</button>
        </div>
      </div>

      {showSwitchFarm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl w-full overflow-hidden shadow-2xl">
            <div className="text-center font-extrabold py-4 border-b border-slate-100 text-slate-800">Switch farm</div>
            {accessibleFarms.map((f) => (
              <button key={f} onClick={() => {
                setFarmName(f);
                setHomeFarm(null);
                setAllMobHistory([]);
                setShowSwitchFarm(false);
                setShowMenu(false);
                showToast(`Switched to ${f}`);
              }} className={`w-full text-center py-4 border-b border-slate-50 font-medium ${farmName === f ? "text-red-900 font-extrabold" : "text-slate-600"}`}>
                {f}{farmName === f ? " ✓" : ""}
              </button>
            ))}
            <button onClick={() => setShowSwitchFarm(false)} className="w-full text-center py-4 font-bold text-rose-500">Cancel</button>
          </div>
        </div>
      )}

      {showFarmSubmenu && (
        <ListModal title="Farm" onClose={() => setShowFarmSubmenu(false)} items={[
          { label: "Farm details", value: farmName },
          { label: "Total area", value: "1,832 ha" },
          { label: "Paddocks", value: "48" },
          { label: "Total DSE", value: totalDSE.toLocaleString() },
          { label: "Edit farm boundary", value: "" },
        ]} />
      )}

      {showInventory && !inventoryView && (() => {
        const isTreatment = inventoryType === "treatment";
        const activeList = isTreatment ? inventory : sprayInventory;
        return (
          <Modal title="Inventory" onClose={() => setShowInventory(false)}>
            <div className="flex bg-slate-100 rounded-full p-1 mb-4">
              {[["treatment","Animal Treatments"],["spray","Spray Chemicals"]].map(([t, label]) => (
                <button key={t} onClick={() => setInventoryType(t)}
                  className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${inventoryType === t ? "bg-red-900 text-white shadow" : "text-slate-400"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              {activeList.map((it) => {
                const starting = Number(it.startingStock) || 0;
                const used = Number(it.quantityUsed) || 0;
                const remaining = Math.max(0, starting - used);
                const pct = starting > 0 ? Math.round((remaining / starting) * 100) : null;
                const barColour = pct === null ? "bg-slate-200" : pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-400" : "bg-red-500";
                const unit = it.containerUnit || "";
                return (
                  <button key={it.id} onClick={() => setInventoryView(it.id)} className="w-full py-3 border-b border-slate-100 text-left">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-bold text-slate-800 text-sm">{it.title}</div>
                      <div className="text-xs text-slate-500 ml-2 flex-shrink-0">
                        {starting > 0
                          ? <span className={pct !== null && pct < 20 ? "text-red-500 font-bold" : ""}>{remaining.toFixed(1)}/{starting.toFixed(1)} {unit}</span>
                          : it.numContainers ? <span>{it.numContainers} × {it.containerSize || "?"} {unit}</span> : null
                        }
                      </div>
                    </div>
                    {starting > 0 && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                        <div className={`${barColour} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    <div className="flex gap-3 text-xs text-slate-400">
                      {it.expiryDate && <span>Exp {it.expiryDate}</span>}
                      {it.dosage && <span>{it.dosage}</span>}
                      {it.treatmentDate && <span>{it.treatmentDate} · {it.location}</span>}
                    </div>
                  </button>
                );
              })}
              {activeList.length === 0 && <p className="text-slate-400 text-sm py-4">No {isTreatment ? "animal treatments" : "spray chemical records"} yet.</p>}
            </div>
            {canEdit && (
              <button onClick={() => { setInventoryForm({}); setInventoryView("add"); }}
                className="w-full bg-red-900 text-white rounded-2xl py-3 font-bold">
                + Add {isTreatment ? "Treatment" : "Spray Chemical"}
              </button>
            )}
          </Modal>
        );
      })()}

      {showInventory && inventoryView === "add" && (() => {
        const isTreatment = inventoryType === "treatment";
        const fields = isTreatment ? TREATMENT_FIELDS : SPRAY_FIELDS;
        return (
          <Modal title={`Add ${isTreatment ? "Animal Treatment" : "Spray Chemical"}`} onClose={() => setInventoryView(null)}>
            <InventoryForm fields={fields} values={inventoryForm} onChange={(k, v) => setInventoryForm((prev) => ({ ...prev, [k]: v }))} />
            <button
              onClick={async () => {
                if (!inventoryForm.title) { showToast("Please enter a name"); return; }
                // Auto-calculate startingStock from containers × size
                const saveForm = { ...inventoryForm };
                if (saveForm.numContainers && saveForm.containerSize) {
                  saveForm.startingStock = (Number(saveForm.numContainers) * Number(saveForm.containerSize)).toString();
                  saveForm.quantityUsed = "0";
                }
                try {
                  if (isTreatment) {
                    const created = await api.addTreatment(farmName, saveForm);
                    setInventory((prev) => [...prev, created].sort((a,b) => (a.title||'').localeCompare(b.title||'')));
                  } else {
                    const created = await api.addSprayInventory(farmName, saveForm);
                    setSprayInventory((prev) => [...prev, created].sort((a,b) => (a.title||'').localeCompare(b.title||'')));
                  }
                  setInventoryView(null);
                  markChanged();
                  showToast(`${isTreatment ? "Treatment" : "Spray chemical"} added`);
                } catch (err) {
                  showToast(err.message || "Couldn't save to the server");
                }
              }}
              className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold"
            >
              Save Record
            </button>
          </Modal>
        );
      })()}

      {showInventory && typeof inventoryView === "number" && (() => {
        const isTreatment = inventoryType === "treatment";
        const item = (isTreatment ? inventory : sprayInventory).find((i) => i.id === inventoryView);
        const fields = isTreatment ? TREATMENT_FIELDS : SPRAY_FIELDS;
        if (!item) return null;
        return (
          <Modal title={item.title} onClose={() => setInventoryView(null)}>
            {/* Stock level bar */}
            {(() => {
              const starting = Number(item.startingStock) || 0;
              const used = Number(item.quantityUsed) || 0;
              const remaining = Math.max(0, starting - used);
              const pct = starting > 0 ? Math.round((remaining / starting) * 100) : null;
              const unit = item.containerUnit || "";
              const barColour = pct === null ? "bg-slate-200" : pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-400" : "bg-red-500";
              if (!starting) return null;
              return (
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-semibold text-slate-700">Stock level</span>
                    <span className={`text-sm font-bold ${pct < 20 ? "text-red-500" : "text-slate-700"}`}>{remaining.toFixed(1)} / {starting.toFixed(1)} {unit}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                    <div className={`${barColour} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{pct}% remaining</span>
                    <span>{used.toFixed(1)} {unit} used</span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={async () => {
                        const adj = window.prompt(`Adjust stock (${unit})\nEnter amount to add (+) or remove (−):\ne.g. 5 to add, -2 to remove`);
                        if (adj === null || adj === "") return;
                        const delta = Number(adj);
                        if (isNaN(delta)) { showToast("Enter a number"); return; }
                        const newUsed = Math.max(0, used - delta);
                        const newStarting = delta > 0 ? starting + delta : starting;
                        const fields = { quantityUsed: newUsed.toString(), startingStock: newStarting.toString() };
                        try {
                          let updated;
                          if (isTreatment) { updated = await api.updateTreatment(item.id, fields); setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...fields } : i)); }
                          else { updated = await api.updateSprayInventory(item.id, fields); setSprayInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...fields } : i)); }
                          showToast(`Stock adjusted: ${remaining.toFixed(1)} → ${Math.max(0, newStarting - newUsed).toFixed(1)} ${unit}`);
                          setInventoryView(null);
                        } catch (err) { showToast(err.message || "Couldn't update stock"); }
                      }} className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl py-2 text-sm font-semibold">
                        ± Adjust stock
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="space-y-2 mb-4">
              {fields.filter((f) => f.key !== "title" && item[f.key]).map((f) => (
                <div key={f.key} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">{item[f.key]}</span>
                </div>
              ))}
            </div>
            {canEdit && (
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => {
                    setInventoryForm({ ...item });
                    setInventoryView("edit-" + item.id);
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 rounded-2xl py-3 font-semibold"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={async () => {
                  const id = item.id;
                  if (isTreatment) setInventory((prev) => prev.filter((i) => i.id !== id));
                  else setSprayInventory((prev) => prev.filter((i) => i.id !== id));
                  setInventoryView(null);
                  markChanged();
                  try {
                    if (isTreatment) await api.deleteTreatment(id);
                    else await api.deleteSprayInventory(id);
                    showToast("Record removed");
                  } catch (err) {
                    showToast(err.message || "Couldn't remove record on the server");
                  }
                }}
                className="bg-rose-50 text-rose-500 rounded-2xl py-3 px-4 font-semibold"
              >
                Delete
              </button>
              </div>
            )}
          </Modal>
        );
      })()}

      {showInventory && typeof inventoryView === "string" && inventoryView.startsWith("edit-") && (() => {
        const isTreatment = inventoryType === "treatment";
        const itemId = Number(inventoryView.replace("edit-", ""));
        const item = (isTreatment ? inventory : sprayInventory).find(i => i.id === itemId);
        const fields = isTreatment ? TREATMENT_FIELDS : SPRAY_FIELDS;
        if (!item) return null;
        return (
          <Modal title={`Edit ${isTreatment ? "Treatment" : "Spray Chemical"}`} onClose={() => setInventoryView(itemId)}>
            <InventoryForm values={inventoryForm} onChange={(k, v) => setInventoryForm(prev => ({ ...prev, [k]: v }))} fields={fields} />
            <button onClick={async () => {
              if (!inventoryForm.title) { showToast("Please enter a name"); return; }
              // Strip fields that shouldn't be updated (server IDs, timestamps)
              const { id: _id, farmId: _fid, createdAt: _ca, ...saveForm } = inventoryForm;
              if (saveForm.numContainers && saveForm.containerSize) {
                const newStarting = Number(saveForm.numContainers) * Number(saveForm.containerSize);
                saveForm.startingStock = newStarting.toString();
              }
              try {
                if (isTreatment) {
                  await api.updateTreatment(itemId, saveForm);
                  setInventory(prev => prev.map(i => i.id === itemId ? { ...i, ...saveForm } : i).sort((a,b) => (a.title||"").localeCompare(b.title||"")));
                } else {
                  await api.updateSprayInventory(itemId, saveForm);
                  setSprayInventory(prev => prev.map(i => i.id === itemId ? { ...i, ...saveForm } : i).sort((a,b) => (a.title||"").localeCompare(b.title||"")));
                }
                setInventoryView(null);
                showToast("Record updated");
              } catch (err) { showToast(err.message || "Couldn't save changes"); }
            }} className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold mt-2">
              Save Changes
            </button>
          </Modal>
        );
      })()}

      {/* ── Insight overlay picker (gear icon on Paddocks map) ── */}
      {/* ── Paddock picker bottom sheet (from Mob Details paddock tile) ── */}
      {showPaddockPicker && selectedMob && (
        <PaddockMoveSheet
          mob={selectedMob}
          paddocks={paddocks}
          farmName={farmName}
          startAtAction={true}
          onClose={() => setShowPaddockPicker(false)}
          onMoveAll={async (target) => {
            const mobId = selectedMob.id;
            const detail = `Moved from ${selectedMob.paddock} to ${target.name}`;
            setMobs(prev => prev.map(m => m.id === mobId ? { ...m, paddock: target.name, daysInPaddock: 0 } : m));
            setShowPaddockPicker(false);
            showToast(`${selectedMob.name} → ${target.name}`);
            try {
              await api.updateMob(mobId, { paddock: target.name, daysInPaddock: 0 });
              await api.addMobHistory(mobId, { action: "Move", detail, date: todayStr() });
            } catch (err) { showToast(err.message || "Couldn't save move"); }
          }}
          onSplit={async (target, moveCount) => {
            const mobId = selectedMob.id;
            const remaining = selectedMob.count - moveCount;
            const detail = `Split: ${moveCount} head moved to ${target.name}, ${remaining} remain in ${selectedMob.paddock}`;
            setMobs(prev => prev.map(m => m.id === mobId ? { ...m, count: remaining } : m));
            setShowPaddockPicker(false);
            showToast(`${moveCount} head → ${target.name}, ${remaining} remain`);
            try {
              await api.updateMob(mobId, { count: remaining });
              await api.addMobHistory(mobId, { action: "Move", detail, date: todayStr() });
              const newMob = await api.createMob(farmName, {
                name: `${selectedMob.name} (split)`,
                desc: selectedMob.desc, count: moveCount,
                paddock: target.name, dse: selectedMob.dse,
                species: selectedMob.species, type: selectedMob.type,
                breed: selectedMob.breed, ageClass: selectedMob.ageClass,
                mgmtGroup: selectedMob.mgmtGroup, tag: selectedMob.tag, daysInPaddock: 0,
              });
              setMobs(prev => [...prev, newMob]);
              await api.addMobHistory(newMob.id, { action: "Move", detail: `Split from ${selectedMob.name} in ${selectedMob.paddock}`, date: todayStr() });
            } catch (err) { showToast(err.message || "Couldn't save split"); }
          }}
        />
      )}

      {/* ── Records Screen ── */}
      {showRecords && (() => {
        const RECORD_TYPES = [
          { id: "deaths",     label: "Deaths",          action: "Death"  },
          { id: "treatments", label: "Treatments",      action: "Treat"  },
          { id: "scans",      label: "Pregnancy Scans", action: "Scan"   },
          { id: "weights",    label: "Weights",         action: "Weigh"  },
          { id: "scores",     label: "Cond. Scores",    action: "Score"  },
          { id: "moves",      label: "Mob Moves",       action: "Move"   },
          { id: "spray",      label: "Spray Records",   action: null     },
          { id: "rainfall",   label: "Rainfall",        action: null     },
        ];

        const currentType = RECORD_TYPES.find(t => t.id === recordsType) || RECORD_TYPES[0];

        // Build rows based on type
        let rows = [];
        let columns = [];

        if (recordsType === "rainfall") {
          rows = [...rainfall].sort((a, b) => (a.date < b.date ? 1 : -1));
          columns = [
            { key: "date",  label: "Date" },
            { key: "mm",    label: "Rainfall (mm)" },
          ];
        } else if (recordsType === "spray") {
          rows = [...sprayInventory].sort((a, b) => (a.treatmentDate < b.treatmentDate ? 1 : -1));
          columns = [
            { key: "treatmentDate",    label: "Date" },
            { key: "title",            label: "Chemical" },
            { key: "location",         label: "Paddock(s)" },
            { key: "areaTreated",      label: "Area (ha)" },
            { key: "quantity",         label: "Quantity" },
            { key: "applicationRate",  label: "Rate" },
            { key: "applicationMethod",label: "Method" },
            { key: "whp",              label: "WHP (days)" },
            { key: "batchNumber",      label: "Batch #" },
          ];
        } else {
          // Mob history based record types
          const actionFilter = currentType.action;
          rows = allMobHistory.filter(h => {
            if (h.action !== actionFilter) return false;
            if (recordsDateFrom && h.date < recordsDateFrom) return false;
            if (recordsDateTo && h.date > recordsDateTo) return false;
            // Only show records for accessible farms
            if (h.farm && !accessibleFarms.includes(h.farm)) return false;
            return true;
          });
          if (recordsType === "deaths") {
            columns = [
              { key: "date",    label: "Date" },
              { key: "mobName", label: "Mob" },
              { key: "species", label: "Species" },
              { key: "breed",   label: "Breed" },
              { key: "ageClass",label: "Age Class" },
              { key: "mgmtGroup", label: "Mgmt Tag" },
              { key: "paddock", label: "Paddock" },
              { key: "detail",  label: "Detail" },
            ];
          } else if (recordsType === "treatments") {
            columns = [
              { key: "date",    label: "Date" },
              { key: "mobName", label: "Mob" },
              { key: "species", label: "Species" },
              { key: "breed",   label: "Breed" },
              { key: "mgmtGroup", label: "Mgmt Tag" },
              { key: "paddock", label: "Paddock" },
              { key: "detail",  label: "Treatment detail" },
            ];
          } else {
            columns = [
              { key: "date",    label: "Date" },
              { key: "mobName", label: "Mob" },
              { key: "species", label: "Species" },
              { key: "mgmtGroup", label: "Mgmt Tag" },
              { key: "paddock", label: "Paddock" },
              { key: "detail",  label: "Detail" },
            ];
          }
        }

        // ── Column filters + header sorting ──
        // preFilterRows keeps the full set so filter dropdowns list every value
        const preFilterRows = rows;
        const activeFilters = Object.entries(recordsFilters).filter(([k, v]) => v && columns.some(c => c.key === k));
        if (activeFilters.length) {
          rows = rows.filter(r => activeFilters.every(([k, v]) => String(r[k] || "") === v));
        }
        if (recordsSort && columns.some(c => c.key === recordsSort.key)) {
          const { key, dir } = recordsSort;
          rows = [...rows].sort((a, b) =>
            String(a[key] || "").localeCompare(String(b[key] || ""), undefined, { numeric: true }) * (dir === "asc" ? 1 : -1)
          );
        }
        const FILTERABLE_KEYS = ["mobName", "species", "breed", "ageClass", "paddock", "mgmtGroup", "title", "location", "applicationMethod"];
        const filterableCols = columns.filter(c => FILTERABLE_KEYS.includes(c.key));

        // Export helpers
        const toCSV = () => {
          const header = columns.map(c => c.label).join(",");
          const body = rows.map(r =>
            columns.map(c => {
              const v = String(r[c.key] || "").replace(/"/g, '""');
              return v.includes(",") ? `"${v}"` : v;
            }).join(",")
          ).join("\n");
          const csv = `${header}\n${body}`;
          const blob = new Blob([csv], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${farmName}-${currentType.label}-${todayStr()}.csv`;
          a.click();
        };

        const toExcel = () => {
          // Simple TSV that Excel opens correctly
          const header = columns.map(c => c.label).join("\t");
          const body = rows.map(r => columns.map(c => r[c.key] || "").join("\t")).join("\n");
          const tsv = `${header}\n${body}`;
          const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${farmName}-${currentType.label}-${todayStr()}.xls`;
          a.click();
        };

        const toPrint = () => {
          const tableRows = rows.map(r =>
            `<tr>${columns.map(c => `<td>${r[c.key] || ""}</td>`).join("")}</tr>`
          ).join("");
          const html = `
            <html><head><title>${farmName} — ${currentType.label}</title>
            <style>
              body { font-family: system-ui, sans-serif; font-size: 12px; }
              h2 { color: #450a0a; margin-bottom: 4px; }
              p { color: #666; margin-bottom: 12px; }
              table { width: 100%; border-collapse: collapse; }
              th { background: #450a0a; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
              td { border-bottom: 1px solid #e2e8f0; padding: 5px 8px; }
              tr:nth-child(even) td { background: #f8fafc; }
            </style></head>
            <body>
              <h2>${farmName} — ${currentType.label}</h2>
              <p>Exported ${todayStr()} · ${rows.length} records</p>
              <table>
                <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join("")}</tr></thead>
                <tbody>${tableRows}</tbody>
              </table>
            </body></html>`;
          // Print from a hidden iframe so the app stays open — opening a new
          // window strands iPhone/PWA users outside the app with no way back.
          try {
            const frame = document.createElement("iframe");
            frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
            frame.srcdoc = html;
            frame.onload = () => {
              try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch {}
              setTimeout(() => { try { frame.remove(); } catch {} }, 60000);
            };
            document.body.appendChild(frame);
          } catch {
            const win = window.open("", "_blank");
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 500);
          }
        };

        return (
          <div className="fixed inset-0 bg-white z-[150] flex flex-col max-w-full">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setShowRecords(false)} className="text-stone-600 font-semibold text-sm flex items-center gap-1">← Back</button>
              <div className="flex-1">
                <div className="font-semibold tracking-tight text-stone-800">Records</div>
                <div className="text-xs text-stone-400">{farmName}</div>
              </div>
              {recordsLoading && <div className="text-xs text-stone-400">Loading…</div>}
            </div>

            {/* Type tabs */}
            <div className="flex overflow-x-auto gap-1 px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
              {RECORD_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={async () => {
                    setRecordsType(t.id);
                    setRecordsFilters({});
                    setRecordsSort(null);
                    // Always refetch so records entered by others show up fresh
                    if (t.action !== null) {
                      setRecordsLoading(true);
                      try {
                        const h = await api.listAllMobHistory(farmName);
                        setAllMobHistory(h);
                      } catch { /* silent */ }
                      setRecordsLoading(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors border ${recordsType === t.id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-100 flex-shrink-0 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <div className="flex items-center gap-1">
                <label className="text-xs text-slate-400">From</label>
                <input type="date" value={recordsDateFrom}
                  onChange={e => setRecordsDateFrom(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white" />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-slate-400">To</label>
                <input type="date" value={recordsDateTo}
                  onChange={e => setRecordsDateTo(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white" />
              </div>
              {(recordsDateFrom || recordsDateTo) && (
                <button onClick={() => { setRecordsDateFrom(""); setRecordsDateTo(""); }}
                  className="text-xs text-amber-700 font-semibold px-2 py-1 rounded-lg bg-amber-50">
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400">{rows.length} records</span>
            </div>
            {/* Column filters */}
            {filterableCols.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-100 flex-shrink-0 flex-wrap">
                {filterableCols.map(c => {
                  const values = [...new Set(preFilterRows.map(r => r[c.key]).filter(Boolean).map(String))]
                    .sort((a, b) => a.localeCompare(b));
                  if (values.length === 0) return null;
                  return (
                    <select key={c.key} value={recordsFilters[c.key] || ""}
                      onChange={e => setRecordsFilters(prev => ({ ...prev, [c.key]: e.target.value }))}
                      className={`border rounded-lg px-2 py-1 text-xs ${recordsFilters[c.key] ? "border-amber-400 bg-amber-50 font-semibold text-amber-800" : "border-slate-200 bg-white text-slate-600"}`}>
                      <option value="">{c.label}: All</option>
                      {values.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  );
                })}
                {Object.values(recordsFilters).some(Boolean) && (
                  <button onClick={() => setRecordsFilters({})}
                    className="text-xs text-amber-700 font-semibold px-2 py-1 rounded-lg bg-amber-50">
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {/* Export buttons */}
            <div className="flex gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <div className="text-xs text-slate-400 font-semibold self-center mr-1">Export:</div>
              <button onClick={toCSV} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50">CSV</button>
              <button onClick={toExcel} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50">Excel</button>
              <button onClick={toPrint} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50">Print / PDF</button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {recordsLoading ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading records…</div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm gap-2">
                  <div className="text-3xl">📋</div>
                  <div>No {currentType.label.toLowerCase()} recorded yet for {farmName}</div>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {columns.map(c => (
                        <th key={c.key}
                          onClick={() => setRecordsSort(s => s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" })}
                          className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-slate-800"
                          title="Tap to sort">
                          {c.label}{recordsSort?.key === c.key ? (recordsSort.dir === "asc" ? " ▲" : " ▼") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        {columns.map(c => (
                          <td key={c.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">{r[c.key] || "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Paddock List modal (accessible from Menu) ── */}
      {showPaddockList && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex flex-col">
          <div className="bg-white flex-1 overflow-y-auto mt-16 rounded-t-3xl max-w-md mx-auto w-full">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3">
              <button onClick={() => setShowPaddockList(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X size={16} />
              </button>
              <h2 className="font-semibold text-slate-800 tracking-tight flex-1">{farmName} Paddocks</h2>
              <div className="text-xs text-slate-400 font-medium">{paddocks.length} total · {paddocks.reduce((s,p)=>s+Number(p.ha||0),0).toFixed(0)} ha</div>
            </div>
            {canEdit && (() => {
              // Detect duplicate records (same boundary saved more than once) —
              // these inflate the farm's total ha and clutter pickers
              const groups = {};
              paddocks.forEach(p => {
                const k = paddockGeomKey(p.geojson);
                if (!k) return;
                (groups[k] = groups[k] || []).push(p);
              });
              const dupeGroups = Object.values(groups).filter(g => g.length > 1);
              const dupeCount = dupeGroups.reduce((s, g) => s + g.length - 1, 0);
              if (dupeCount === 0) return null;
              const dupeHa = dupeGroups.reduce((s, g) => s + (g.length - 1) * (Number(g[0].ha) || 0), 0);
              return (
                <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-sm font-bold text-amber-800">⚠ {dupeCount} duplicate paddock{dupeCount > 1 ? "s" : ""} detected</div>
                  <div className="text-xs text-amber-700 mt-1">
                    The same boundary has been saved more than once (usually from re-importing a GeoJSON file) — inflating this farm's total by ≈{dupeHa.toFixed(0)} ha.
                  </div>
                  <button onClick={async () => {
                    let removed = 0;
                    const renames = []; // [oldName, keptName] so mobs follow the kept paddock
                    for (const g of dupeGroups) {
                      // Keep the renamed one if there is one, otherwise the first
                      const keep = g.find(p => !isDefaultPaddockName(p.name)) || g[0];
                      for (const p of g) {
                        if (p.id === keep.id) continue;
                        try {
                          await api.deletePaddock(p.id);
                          removed++;
                          setPaddocks(prev => prev.filter(x => x.id !== p.id));
                          if (p.name !== keep.name) renames.push([p.name, keep.name]);
                        } catch {}
                      }
                    }
                    // Re-point any mobs that referenced a removed duplicate's name
                    for (const [oldName, newName] of renames) {
                      const affected = mobs.filter(m => m.paddock === oldName);
                      for (const m of affected) {
                        try { await api.updateMob(m.id, { paddock: newName }); } catch {}
                      }
                      if (affected.length) setMobs(prev => prev.map(m => m.paddock === oldName ? { ...m, paddock: newName } : m));
                    }
                    markChanged();
                    showToast(`Removed ${removed} duplicate paddock${removed !== 1 ? "s" : ""}`);
                  }} className="mt-2.5 w-full bg-amber-500 text-white rounded-xl py-2.5 text-sm font-bold">
                    Remove duplicates (keeps your renamed ones)
                  </button>
                </div>
              );
            })()}
            <div className="p-4 space-y-2">
              {paddocks.length === 0 && (
                <div className="text-center text-slate-400 text-sm py-8">No paddocks yet. Import GeoJSON or draw paddocks on the map.</div>
              )}
              {[...paddocks].sort((a,b)=>a.name.localeCompare(b.name)).map((p) => {
                const paddockMobs = mobs.filter(m => m.paddock === p.name);
                const dse = paddockMobs.reduce((s,m)=>s+m.count*(Number(m.dse)||0),0);
                const isGrazingP = !NON_GRAZING_LAND_USES.has(p.landUse);
                const dsePerHa = (isGrazingP && Number(p.ha) > 0) ? dse/Number(p.ha) : 0;
                return (
                  <button key={p.id} onClick={() => { setPaddockDetail(p); setShowPaddockList(false); }}
                    className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-slate-100 shadow-sm text-left hover:bg-slate-50">
                    <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: COLOUR_HEX[p.colour] || "#94a3b8" }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.landUse || "Grazing"} · {p.pasture || ""}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-slate-700 text-sm">{Number(p.ha||0).toFixed(1)} ha</div>
                      {dsePerHa > 0 && <div className="text-xs text-slate-400">{dsePerHa.toFixed(1)} DSE/ha</div>}
                      {paddockMobs.length > 0 && <div className="text-xs text-amber-600 font-medium">{paddockMobs.length} mob{paddockMobs.length!==1?"s":""}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      )}

      {/* ── Field Notes List Screen ── */}
      {showFieldNotes && (() => {
        const open = fieldNotes.filter(n => !n.resolvedAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const resolved = fieldNotes.filter(n => n.resolvedAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const urgentCount = open.filter(n => n.priority === "urgent").length;
        return (
          <div className="fixed inset-0 bg-white z-[150] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <button onClick={() => setShowFieldNotes(false)} className="text-slate-600 font-semibold text-sm flex items-center gap-1">← Back</button>
              <div className="font-bold text-slate-800">Field Notes</div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowFieldNotes(false); setMapMode("Notes"); setTab("map"); }}
                  className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">🗺 Map</button>
                <button onClick={() => setFieldNoteForm({ lat: null, lng: null, locationApprox: true, paddock: null, category: "General", body: "", priority: "normal" })}
                  className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg font-bold">+</button>
              </div>
            </div>
            {urgentCount > 0 && (
              <div className="bg-red-50 border-b border-red-100 px-4 py-2 text-sm text-red-700 font-semibold flex items-center gap-2 flex-shrink-0">
                <span className="text-base">🚨</span>{urgentCount} urgent note{urgentCount > 1 ? "s" : ""} need attention
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {open.length === 0 && resolved.length === 0 && (
                <div className="text-center text-slate-400 py-16">
                  <div className="text-4xl mb-3">📍</div>
                  <div className="font-semibold">No field notes yet</div>
                  <div className="text-sm mt-1">Tap + to record an observation</div>
                </div>
              )}
              {open.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Open — {open.length}</div>
                  {open.map(note => {
                    const cat = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
                    return (
                      <button key={note.id} onClick={() => setFieldNoteDetail(note)}
                        className="w-full text-left px-4 py-3 border-b border-slate-50 active:bg-slate-50">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0 mt-0.5">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold" style={{ color: cat.colour }}>{note.category}</span>
                              {note.priority === "urgent" && <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">URGENT</span>}
                              {note.paddock && <span className="text-xs text-slate-400">{note.paddock}</span>}
                            </div>
                            <div className="text-sm text-slate-700 leading-snug line-clamp-2">{note.body}</div>
                            <div className="text-xs text-slate-400 mt-1">{note.authorName} · {note.createdAt ? new Date(note.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
                          </div>
                          <ChevronRight size={14} className="text-slate-300 flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {resolved.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Resolved — {resolved.length}</div>
                  {resolved.map(note => {
                    const cat = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
                    return (
                      <button key={note.id} onClick={() => setFieldNoteDetail(note)}
                        className="w-full text-left px-4 py-3 border-b border-slate-50 active:bg-slate-50 opacity-60">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0 mt-0.5">{cat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold" style={{ color: cat.colour }}>{note.category}</span>
                              <span className="text-xs text-green-600 font-semibold">✓ Resolved</span>
                            </div>
                            <div className="text-sm text-slate-500 line-clamp-1">{note.body}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Field Note Detail ── */}

      {showRainfall && (() => {
        const sortedRainfall = [...rainfall].sort((a, b) => (a.date < b.date ? 1 : -1));
        return (
          <Modal title="Rainfall Records" onClose={() => { setShowRainfall(false); setRainfallForm({}); }}>
            <div className="space-y-2 mb-4">
              {sortedRainfall.length === 0 && <p className="text-slate-400 text-sm py-2">No rainfall recorded yet.</p>}
              {sortedRainfall.map((r) => (
                <div key={r.id} className="flex justify-between items-center border-b border-slate-100 py-2.5 gap-2">
                  {rainfallForm.editId === r.id ? (
                    // Inline edit mode
                    <>
                      <input type="date" value={rainfallForm.date || r.date}
                        onChange={(e) => setRainfallForm(p => ({ ...p, date: e.target.value }))}
                        className="flex-1 border border-amber-300 rounded-lg px-2 py-1 text-sm bg-white" />
                      <input type="number" value={rainfallForm.mm ?? r.mm}
                        onChange={(e) => setRainfallForm(p => ({ ...p, mm: e.target.value }))}
                        className="w-16 border border-amber-300 rounded-lg px-2 py-1 text-sm bg-white text-center" />
                      <button onClick={async () => {
                        try {
                          const updated = await api.updateRainfall(r.id, { date: rainfallForm.date || r.date, mm: rainfallForm.mm ?? r.mm });
                          setRainfall(prev => prev.map(x => x.id === r.id ? { ...x, ...updated } : x));
                          setRainfallForm({});
                          showToast("Updated");
                        } catch { showToast("Couldn't save"); }
                      }} className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg font-semibold">Save</button>
                      <button onClick={() => setRainfallForm({})} className="text-xs text-slate-400">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-600 text-sm">{r.date}</span>
                      <span className="font-bold text-slate-800">{r.mm}mm</span>
                      {canEdit && (
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => setRainfallForm({ editId: r.id, date: r.date, mm: r.mm })}
                            className="text-xs text-amber-700 font-semibold px-2 py-1 bg-amber-50 rounded-lg">Edit</button>
                          <button onClick={async () => {
                            if (!window.confirm("Delete this rainfall entry?")) return;
                            try {
                              await api.deleteRainfall(r.id);
                              setRainfall(prev => prev.filter(x => x.id !== r.id));
                              showToast("Deleted");
                            } catch { showToast("Couldn't delete"); }
                          }} className="text-xs text-rose-500 font-semibold px-2 py-1 bg-rose-50 rounded-lg">✕</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={rainfallForm.date || todayStr()}
                onChange={(e) => setRainfallForm((p) => ({ ...p, date: e.target.value }))}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              />
              <input
                type="number"
                value={rainfallForm.mm || ""}
                onChange={(e) => setRainfallForm((p) => ({ ...p, mm: e.target.value }))}
                placeholder="mm"
                className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              />
            </div>
            <button
              onClick={async () => {
                if (!rainfallForm.mm) { showToast("Please enter a rainfall amount"); return; }
                const date = rainfallForm.date || todayStr();
                try {
                  const created = await api.addRainfall(farmName, date, rainfallForm.mm);
                  setRainfall((prev) => [...prev, created]);
                  setRainfallForm({});
                  markChanged();
                  showToast("Rainfall entry added");
                } catch (err) {
                  showToast(err.message || "Couldn't save to the server");
                }
              }}
              className="mt-2 w-full bg-red-900 text-white rounded-2xl py-3 font-bold"
            >
              + Add Reading
            </button>
          </Modal>
        );
      })()}

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between items-center border-b border-slate-100 py-2"><span className="text-slate-600">Units</span><span className="text-slate-400">Metric</span></div>
            <div className="flex justify-between items-center border-b border-slate-100 py-2"><span className="text-slate-600">Notifications</span><span className="text-slate-400">On</span></div>
            <div className="flex justify-between items-center border-b border-slate-100 py-2"><span className="text-slate-600">Offline maps</span><span className="text-slate-400">Downloaded</span></div>
            <div className="flex justify-between items-center border-b border-slate-100 py-2"><span className="text-slate-600">App version</span><span className="text-slate-400">4.32.1</span></div>
          </div>
          <div className="text-sm font-bold text-slate-700 mb-1">Google Maps</div>
          <p className="text-xs text-slate-400 mb-2">
            The Google Maps API key isn't stored in the app for security reasons — it's configured separately as a deployment setting on Render. Without it, a built-in offline map is used instead.
          </p>
          <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${googleMapsKey ? "bg-green-500" : "bg-slate-300"}`} />
            <p className="text-xs font-semibold text-slate-600">
              {googleMapsKey ? "Google Maps key detected — satellite map active" : "No Google Maps key configured for this deployment"}
            </p>
          </div>
          {mapLoadError && (
            <p className="text-xs text-rose-500 font-semibold mt-2">⚠ Couldn't load Google Maps — check the key is valid, billing is enabled, and the Maps JavaScript API is turned on for it. Falling back to the offline map.</p>
          )}
          {currentUserId === 1 && (
            <p className="text-xs text-slate-400 mt-3">To set or change the key, update the <span className="font-mono">VITE_GOOGLE_MAPS_KEY</span> environment variable in the Render dashboard and redeploy.</p>
          )}
        </Modal>
      )}

      {showHelp && (
        <Modal title="Get Help" onClose={() => setShowHelp(false)}>
          <div className="space-y-1 text-sm">
            <button onClick={() => showToast("Opening help center...")} className="w-full text-left border-b border-slate-100 py-3 font-semibold text-slate-700">📖 Help Center</button>
            <button onClick={() => showToast("Starting live chat...")} className="w-full text-left border-b border-slate-100 py-3 font-semibold text-slate-700">💬 Chat with support</button>
            <button onClick={() => showToast("Calling support...")} className="w-full text-left border-b border-slate-100 py-3 font-semibold text-slate-700">📞 Call support</button>
            <button onClick={() => showToast("Opening tutorials...")} className="w-full text-left py-3 font-semibold text-slate-700">🎥 Video tutorials</button>
          </div>
        </Modal>
      )}
    </div>
  );

  const updateNewMob = (key, val) => setNewMobForm((prev) => ({ ...prev, [key]: val }));

  const AddMobModal = () => {
    const species = newMobForm.species || "Cattle";
    const breedOptions = [...(BREEDS_DEFAULT[species] || []), ...(customBreeds[species] || []).filter((b) => !(BREEDS_DEFAULT[species] || []).includes(b))];
    const ageOptions = AGE_CLASSES[species];

    const saveMob = async () => {
      if (!newMobForm.name) { showToast("Mob name is required"); return; }
      if (!newMobForm.paddock) { showToast("Please select a paddock"); return; }
      if (!newMobForm.size) { showToast("Please enter a mob size"); return; }
      const fields = {
        name: newMobForm.name,
        desc: `${newMobForm.breed || species} ${(newMobForm.ageClass || "").toLowerCase()}${newMobForm.dob ? " · " + newMobForm.dob : ""}`.trim(),
        count: Number(newMobForm.size),
        paddock: newMobForm.paddock,
        dse: newMobForm.dse ? Number(newMobForm.dse) : (species === "Sheep" || species === "Rams" ? 1.5 : 8),
        species,
        type: ageOptions?.includes(newMobForm.ageClass) ? newMobForm.ageClass : (species === "Sheep" || species === "Rams" ? "Ewes" : species === "Bulls" ? "Bulls" : "Cows"),
        breed: newMobForm.breed || "Mixed",
        ageClass: newMobForm.ageClass || "Adult",
        mgmtGroup: newMobForm.mgmtGroup || "Unassigned",
        tag: newMobForm.tagColour || "Unassigned",
        whp: editingMobId ? (mobs.find((m) => m.id === editingMobId)?.whp || 0) : 0,
      };
      try {
        if (editingMobId) {
          const updated = await api.updateMob(editingMobId, fields);
          setMobs((prev) => prev.map((m) => (m.id === editingMobId ? updated : m)));
          markChanged();
          showToast("Mob updated");
        } else {
          const created = await api.createMob(farmName, fields);
          setMobs((prev) => [...prev, created]);
          markChanged();
          showToast("Mob created");
        }
      } catch (err) {
        showToast(err.message || "Couldn't save mob to the server");
        return;
      }
      // Remember custom breeds for future use, both locally and on the server
      if (newMobForm.breed && !(BREEDS_DEFAULT[species] || []).includes(newMobForm.breed)) {
        setCustomBreeds((prev) => ({
          ...prev,
          [species]: [...new Set([...(prev[species] || []), newMobForm.breed])],
        }));
        api.addBreed(species, newMobForm.breed).catch(() => {});
      }
      setEditingMobId(null);
      setShowAddMob(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-50 z-40 flex flex-col max-w-md mx-auto">
        <div className="bg-white border-b border-stone-200 flex items-center justify-between px-4 py-4">
          <button onClick={() => { setShowAddMob(false); setEditingMobId(null); }} className="text-sm font-semibold text-slate-300">CANCEL</button>
          <h1 className="text-base font-bold">{editingMobId ? "Edit Mob" : "Add Mob"}</h1>
          <div className="w-14" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Species *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "Cattle", emoji: "🐄" },
                { id: "Sheep",  emoji: "🐑" },
                { id: "Bulls",  emoji: "🐂" },
                { id: "Rams",   emoji: "🐏" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateNewMob("species", s.id)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold ${species === s.id ? "border-red-900 bg-amber-200 text-red-950" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 ${species === s.id ? "border-red-900 bg-red-900" : "border-slate-300"}`} />
                  <span>{s.emoji} {s.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Mob name *</label>
            <p className="text-xs text-slate-400 mb-2">A name to help identify the group of animals.</p>
            <input value={newMobForm.name || ""} onChange={(e) => updateNewMob("name", e.target.value)} placeholder="e.g. Coleraine cows" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Breed *</label>
            <select value={breedOptions.includes(newMobForm.breed || "") ? (newMobForm.breed || "") : "__custom__"}
              onChange={(e) => {
                if (e.target.value === "__custom__") updateNewMob("breed", "");
                else updateNewMob("breed", e.target.value);
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white mb-2">
              <option value="">Select a breed...</option>
              {breedOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              <option value="__custom__">+ Enter a different breed</option>
            </select>
            {(!newMobForm.breed || !breedOptions.includes(newMobForm.breed)) && (
              <input
                value={newMobForm.breed || ""}
                onChange={(e) => updateNewMob("breed", e.target.value)}
                placeholder="Type breed name..."
                className="w-full border border-amber-200 rounded-xl px-3 py-2.5 bg-white"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Age class *</label>
            <select value={newMobForm.ageClass || ""} onChange={(e) => updateNewMob("ageClass", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
              <option value="">Make a selection</option>
              {ageOptions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Date of birth *</label>
            <p className="text-xs text-slate-400 mb-2">Select a day, month or year of birth, or skip tracking.</p>
            <div className="flex gap-2 flex-wrap">
              {["Day", "Month", "Year", "Do not track"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateNewMob("dobOption", opt)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-medium text-sm ${newMobForm.dobOption === opt ? "border-red-900 bg-amber-200 text-red-950" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 ${newMobForm.dobOption === opt ? "border-red-900 bg-red-900" : "border-slate-300"}`} />
                  {opt}
                </button>
              ))}
            </div>
            {newMobForm.dobOption && newMobForm.dobOption !== "Do not track" && (
              <input
                type={newMobForm.dobOption === "Year" ? "number" : newMobForm.dobOption === "Month" ? "month" : "date"}
                placeholder={`Select ${newMobForm.dobOption.toLowerCase()}`}
                value={newMobForm.dob || ""}
                onChange={(e) => updateNewMob("dob", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white mt-2"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Management Tag</label>
            <p className="text-xs text-slate-400 mb-2">Assign to a group of animals to manage or report on.</p>
            {(() => {
              // Only tags currently in use — keeps everyone using identical spellings
              const usedTags = [...new Set(mobs.map(m => m.mgmtGroup).filter(t => t && t !== "Unassigned"))]
                .sort((a, b) => a.localeCompare(b));
              const val = newMobForm.mgmtGroup || "";
              const customMode = newMobForm._mgmtCustom || (val && !usedTags.includes(val));
              return (<>
                <select
                  value={customMode ? "__custom__" : val}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") { updateNewMob("_mgmtCustom", true); updateNewMob("mgmtGroup", ""); }
                    else { updateNewMob("_mgmtCustom", false); updateNewMob("mgmtGroup", e.target.value); }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white mb-2">
                  <option value="">No management tag</option>
                  {usedTags.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">+ Add a new tag</option>
                </select>
                {customMode && (
                  <input value={val} onChange={(e) => updateNewMob("mgmtGroup", e.target.value)}
                    placeholder="Type new tag name..." autoFocus
                    className="w-full border border-amber-200 rounded-xl px-3 py-2.5 bg-white" />
                )}
              </>);
            })()}
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Tag colour *</label>
            <select value={newMobForm.tagColour || ""} onChange={(e) => updateNewMob("tagColour", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
              <option value="">Select a tag colour...</option>
              {TAG_COLOURS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Average weight</label>
            <div className="flex gap-2">
              <input type="number" value={newMobForm.avgWeight || ""} onChange={(e) => updateNewMob("avgWeight", e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
              <div className="bg-slate-100 rounded-xl px-4 py-2.5 font-semibold text-slate-500 text-sm flex items-center">kg</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">DSE per head</label>
            <input type="number" step="0.1" inputMode="decimal" value={newMobForm.dse || ""} onChange={(e) => updateNewMob("dse", e.target.value)} placeholder={species === "Sheep" ? "e.g. 1.5" : "e.g. 6"} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Mob description</label>
            <textarea value={newMobForm.description || ""} onChange={(e) => updateNewMob("description", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Paddock *</label>
            <p className="text-xs text-slate-400 mb-2">Assign animals to a paddock.</p>
            <select value={newMobForm.paddock || ""} onChange={(e) => updateNewMob("paddock", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
              <option value="">Make a selection</option>
              {[...paddocks].sort((a, b) => a.name.localeCompare(b.name)).map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Mob size *</label>
            <p className="text-xs text-slate-400 mb-2">Number of head</p>
            <input type="number" value={newMobForm.size || ""} onChange={(e) => updateNewMob("size", e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-100 bg-white">
          <button onClick={() => { setShowAddMob(false); setEditingMobId(null); }} className="flex-1 border border-slate-200 rounded-2xl py-3 font-bold text-slate-500">Cancel</button>
          <button onClick={saveMob} className="flex-1 bg-red-900 text-white rounded-2xl py-3 font-bold">{editingMobId ? "Save Changes" : "Save"}</button>
        </div>
      </div>
    );
  };

  if (showSplash || authLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-6 px-8">
        <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="w-48 rounded-xl shadow-2xl" />
        {apiWaking && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-white/60 text-sm font-medium">Server waking up — this takes about 15 seconds on first load…</p>
          </div>
        )}
      </div>
    );
  }

  // ── Password setup screen (invite link from email) ───────────────────────

  if (locked && loggedInEmail) {
    return (
      <div className="max-w-md mx-auto min-h-screen font-sans bg-stone-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-stone-200 w-full p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-red-950 flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
            {(currentUser.name || currentUser.email)[0].toUpperCase()}
          </div>
          <div className="text-lg font-extrabold text-slate-800">Welcome back</div>
          <div className="text-sm text-slate-400 mb-6">{currentUser.name} · {currentUser.email}</div>
          <button onClick={() => setLocked(false)} className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold">Continue</button>
          <button
            onClick={() => { setAuthToken(null); setCurrentAccount(null); setLoggedInEmail(null); setLocked(false); setLoginEmail(""); setStayLoggedIn(true); }}
            className="w-full text-slate-400 text-sm font-semibold mt-3"
          >
            Use a different account
          </button>
        </div>
      </div>
    );
  }

  if (!loggedInEmail) {
    return (
      <div className="max-w-md mx-auto min-h-screen font-sans bg-stone-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-stone-200 w-full p-6">
          <div className="text-center mb-6">
            <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="w-32 mx-auto mb-3 rounded-lg shadow" />
            <div className="text-sm text-slate-400 mt-1">Sign in with your invited account</div>
          </div>
          <div className="space-y-3 mb-2">
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                placeholder="name@example.com"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              />
            </div>
          </div>
          <button
            onClick={() => setStayLoggedIn((v) => !v)}
            className="w-full flex items-center gap-2 mb-2 text-left"
          >
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${stayLoggedIn ? "bg-red-900 border-red-900" : "border-slate-300"}`}>
              {stayLoggedIn && <Check size={14} className="text-white" />}
            </span>
            <span className="text-sm font-medium text-slate-600">Stay logged in on this device</span>
          </button>
          {loginError && <p className="text-sm text-rose-500 font-medium mb-2">{loginError}</p>}
          <button
            onClick={async (e) => {
              const btn = e.currentTarget;
              const email = loginEmail.trim().toLowerCase();
              if (!email || !loginPassword) { setLoginError("Please enter your email and password."); return; }
              setLoginError("");
              btn.disabled = true;
              btn.textContent = "Signing in…";
              try {
                const { token, account } = await api.login(email, loginPassword);
                setAuthToken(token);
                setCurrentAccount(account);
                setLoggedInEmail(account.email);
                setLoginPassword("");
              } catch (err) {
                btn.disabled = false;
                btn.textContent = "Sign in";
                setLoginError(err.message === "Couldn't reach the server — check your connection."
                  ? "Server is starting up — wait 15 seconds and try again."
                  : (err.message || "Couldn't sign in. Please try again."));
              }
            }}
            className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold mt-2 disabled:opacity-60"
          >
            Sign in
          </button>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Only people invited by an Admin (via Menu → Accounts) can access this farm's data. Ask your farm Admin for an invite.
          </p>
        </div>
      </div>
    );
  }

  // ── Desktop layout: sidebar nav + content panel on wide screens ──
  const DesktopSidebar = () => (
    <div className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-stone-200 fixed left-0 top-0 bottom-0 z-30">
      <div className="px-4 py-5 border-b border-stone-100">
        <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="w-full rounded-lg" />
        <div className="text-xs text-stone-400 mt-2 text-center font-medium">{farmName}</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "map", icon: "🗺️", label: "Map" },
          { id: "livestock", icon: "🐄", label: "Livestock" },
          { id: "workflow", icon: "📋", label: "Workflow" },
          { id: "cattle_feeding", icon: "🐄", label: "Cattle Feeding" },
          { id: "sheep_feeding", icon: "🐑", label: "Sheep Feeding" },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === id ? "bg-stone-100 text-stone-900 font-semibold" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"}`}
          >
            <span className="text-base flex-shrink-0">{icon}</span>
            <span>{label}</span>
            {tab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-stone-100">
        <button onClick={() => setShowMenu(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800">
          <span className="text-base flex-shrink-0">☰</span>
          <span>Menu</span>
          {(syncCount + pendingChanges) > 0 && (
            <span className="ml-auto bg-amber-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{syncCount + pendingChanges}</span>
          )}
        </button>
        <div className="text-xs text-stone-400 px-3 pt-2 truncate">{currentUser.name} · {currentUser.role}</div>
      </div>
    </div>
  );

  return (
    <div className="md:flex min-h-screen bg-slate-100">
      <DesktopSidebar />
      <div className="md:ml-56 flex-1">
    <div className="max-w-md md:max-w-none mx-auto bg-stone-50 min-h-screen font-sans relative">
      {tab === "home" && <HomeScreen
        setTab={setTab} setFarmName={setFarmName}
        setFarmsMobs={setFarmsMobs} setFarmsPaddocks={setFarmsPaddocks} setFarmsLandmarks={setFarmsLandmarks}
        farmsMobs={farmsMobs} farmsPaddocks={farmsPaddocks} farmName={farmName}
        totalCattle={totalCattle} totalSheep={totalSheep} totalDSE={totalDSE}
        farmSummaries={farmSummaries} rainfall={rainfall} setShowRainfall={setShowRainfall}
        isOnline={isOnline} pendingChanges={pendingChanges} syncCount={syncCount}
        syncing={syncing} handleSync={handleSync} setShowPaddockList={setShowPaddockList}
        paddocks={paddocks} LOGO_DATA_URI={LOGO_DATA_URI} api={api} farmCenters={FARM_CENTERS}
        currentUser={currentUser} homeFarm={homeFarm} setHomeFarm={setHomeFarm}
      />}
      {tab === "map" && MapScreen()}
      {tab === "livestock" && LivestockScreen()}
      {tab === "moblist" && MobListScreen()}
      {tab === "mobactivity" && MobActivityScreen()}
      {tab === "workflow" && <WorkflowScreen setTab={setTab} currentAccount={currentAccount} />}
      {tab === "cattle_feeding" && <CattleFeedingScreen setTab={setTab} showToast={showToast} api={api} />}
      {tab === "sheep_feeding" && <SheepFeedingScreen setTab={setTab} showToast={showToast} api={api} />}
      <div className="md:hidden"><BottomNav /></div>
      {selectedMob && MobDetails()}
      {showMenu && MenuScreen()}

      {/* ── Field Note Detail — outside MapScreen so tap-on-pin works first time ── */}
      {fieldNoteDetail && (() => {
        const note = fieldNoteDetail;
        const cat = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
        const isResolved = !!note.resolvedAt;
        const photos = Array.isArray(note.photos) ? note.photos : [];
        return (
          <Modal title="Field Note" onClose={() => setFieldNoteDetail(null)}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: cat.colour }}>{note.category}</div>
                {note.paddock && <div className="text-xs text-slate-400">{note.paddock} · {note.farmName}</div>}
              </div>
              <div className="ml-auto flex gap-1">
                {note.priority === "urgent" && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">URGENT</span>}
                {isResolved && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Resolved</span>}
              </div>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{note.body}</p>
            {photos.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {photos.map((src, i) => (
                  <img key={i} src={src} alt={`Photo ${i+1}`}
                    className="w-24 h-24 object-cover rounded-xl border border-slate-200 cursor-pointer"
                    onClick={() => window.open(src, "_blank")}
                  />
                ))}
              </div>
            )}
            <div className="text-xs text-slate-400 mb-4">
              {note.locationApprox ? "📍 Location approximate" : `📍 ${Number(note.lat).toFixed(5)}, ${Number(note.lng).toFixed(5)}${note.accuracyM ? ` ±${Math.round(Number(note.accuracyM))}m` : ""}`}
              <br />By {note.authorName} · {note.createdAt ? new Date(note.createdAt).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
            </div>
            <div className="space-y-2">
              {!isResolved && (
                <button onClick={async () => {
                  const updated = await api.updateFieldNote(note.id, { resolvedAt: new Date().toISOString() });
                  setFieldNotes(prev => prev.map(n => n.id === note.id ? { ...n, resolvedAt: updated.resolvedAt } : n));
                  setFieldNoteDetail({ ...note, resolvedAt: updated.resolvedAt });
                  showToast("Marked as resolved");
                }} className="w-full bg-green-500 text-white rounded-2xl py-3 font-bold">✓ Mark Resolved</button>
              )}
              {!note.taskCreated && (
                <button onClick={async () => {
                  const cat2 = NOTE_CATEGORIES.find(c => c.id === note.category) || NOTE_CATEGORIES[NOTE_CATEGORIES.length - 1];
                  const taskContent = note.paddock ? `${cat2.icon} ${note.category} — ${note.paddock}: ${note.body.slice(0, 80)}` : `${cat2.icon} ${note.category}: ${note.body.slice(0, 80)}`;
                  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                  const dueDate = tomorrow.toISOString().slice(0, 10);
                  const dueDay = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][tomorrow.getDay()];
                  const newTask = { id: `fn-${note.id}-${Date.now()}`, farm: note.farmName || farmName, content: taskContent, notes: note.body, color: note.priority === "urgent" ? "red" : "default", assignedStaff: [], completed: false, createdAt: new Date().toISOString(), day: dueDay, date: dueDate, recur: "none", lat: note.lat, lng: note.lng, paddock: note.paddock, fieldNoteId: note.id };
                  try { await api.appendWorkflowTask(newTask); } catch { try { const raw = localStorage.getItem("kwp-workflow-cache"); const cache = raw ? JSON.parse(raw) : {}; cache.tasks = [...(cache.tasks || []), newTask]; localStorage.setItem("kwp-workflow-cache", JSON.stringify(cache)); } catch {} }
                  try { await api.updateFieldNote(note.id, { taskCreated: true }); setFieldNotes(prev => prev.map(n => n.id === note.id ? { ...n, taskCreated: true } : n)); setFieldNoteDetail({ ...note, taskCreated: true }); showToast("Task added to Workflow"); } catch { showToast("Task created"); }
                }} className="w-full bg-amber-500 text-white rounded-2xl py-3 font-bold">📋 Convert to Workflow Task</button>
              )}
              {note.taskCreated && <div className="w-full bg-slate-100 text-slate-500 rounded-2xl py-3 font-semibold text-center text-sm">📋 Task already created</div>}
              <div className="flex gap-2">
                <button onClick={() => { setFieldNoteForm({ ...note, photos: Array.isArray(note.photos) ? note.photos : [] }); setFieldNoteDetail(null); }}
                  className="flex-1 bg-slate-100 text-slate-700 rounded-2xl py-3 font-semibold">✏️ Edit</button>
                <button onClick={async () => {
                  if (!window.confirm("Delete this field note?")) return;
                  await api.deleteFieldNote(note.id);
                  setFieldNotes(prev => prev.filter(n => n.id !== note.id));
                  setFieldNoteDetail(null);
                  showToast("Note deleted");
                }} className="bg-rose-50 text-rose-500 rounded-2xl py-3 px-4 font-semibold">Delete</button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ── Map Overlay picker — outside MapScreen/MenuScreen so tap works first time ── */}
      {showInsightPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end z-[200]" onClick={() => setShowInsightPicker(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
            <div className="text-center font-semibold text-slate-800 py-3 border-b border-slate-100 text-base tracking-tight">Map Overlay</div>
            <div className="p-3 space-y-1 pb-8">
              {INSIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setInsightMode(opt.id); setShowInsightPicker(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors border ${insightMode === opt.id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-700 border-stone-100 hover:border-stone-300"}`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="font-medium text-sm">{opt.label}</span>
                  {insightMode === opt.id && <span className="ml-auto text-xs opacity-70">Active</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Field Note Form — outside MapScreen/MenuScreen so tap works first time ── */}
      {/* ── Field Note Create / Edit Form ── */}
      {fieldNoteForm !== null && !fieldNoteForm._pickingPin && (() => {
        const isEdit = !!fieldNoteForm.id;
        const form = fieldNoteForm;
        const setForm = (patch) => setFieldNoteForm(prev => ({ ...prev, ...patch }));
        const hasLocation = form.lat && form.lng;
        return (
          <Modal title={isEdit ? "Edit Note" : "New Field Note"} onClose={() => setFieldNoteForm(null)}>
            {/* Location picker */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-600 block mb-1.5">Location</label>
              {hasLocation ? (
                <div className="flex items-center gap-2">
                  <div className={`flex-1 flex items-center gap-2 text-xs rounded-xl px-3 py-2.5 ${form.locationApprox ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                    <span className="text-base">📍</span>
                    <span>{form.locationApprox ? "Farm centre (approximate)" : `${Number(form.lat).toFixed(4)}, ${Number(form.lng).toFixed(4)}${form.accuracyM ? ` ±${Math.round(form.accuracyM)}m` : ""}`}</span>
                  </div>
                  <button type="button" onClick={() => setForm({ lat: null, lng: null, locationApprox: true })}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-2 rounded-lg border border-slate-200">✕</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* GPS button — works on phone */}
                  <button type="button" onClick={async () => {
                    try {
                      const pos = await new Promise((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true })
                      );
                      // Detect paddock from GPS
                      let detectedPaddock = form.paddock;
                      if (window.google?.maps?.geometry?.poly) {
                        const latlng = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                        const polys = livMapRef.current?.polygons || {};
                        for (const [pid, poly] of Object.entries(polys)) {
                          if (window.google.maps.geometry.poly.containsLocation(latlng, poly)) {
                            const p = paddocks.find(x => String(x.id) === String(pid));
                            if (p) { detectedPaddock = p.name; break; }
                          }
                        }
                      }
                      setForm({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy, locationApprox: false, paddock: detectedPaddock });
                    } catch {
                      showToast("GPS unavailable — use map pin instead");
                    }
                  }} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl py-3 text-sm font-semibold">
                    <span>📡</span> Use my GPS
                  </button>
                  {/* Map pin button — works on desktop and phone */}
                  <button type="button" onClick={() => {
                    // Save current form state, close modal, enter pin-picking mode
                    // The effect will re-open the modal with location filled when user clicks map
                    const saved = { ...fieldNoteForm };
                    setFieldNoteForm({ ...saved, _pickingPin: true, _modalOpen: false });
                  }} className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl py-3 text-sm font-semibold">
                    <span>🗺</span> Place on map
                  </button>
                </div>
              )}
            </div>
            {/* Paddock */}
            <div className="mb-3">
              <label className="text-sm font-semibold text-slate-600 block mb-1">Paddock</label>
              <select value={form.paddock || ""} onChange={e => setForm({ paddock: e.target.value || null })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm">
                <option value="">— No paddock —</option>
                {paddocks.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            {/* Category */}
            <div className="mb-3">
              <label className="text-sm font-semibold text-slate-600 block mb-1">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {NOTE_CATEGORIES.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setForm({ category: cat.id })}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-colors ${form.category === cat.id ? "border-amber-400 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600"}`}>
                    <span>{cat.icon}</span>{cat.id}
                  </button>
                ))}
              </div>
            </div>
            {/* Priority */}
            <div className="mb-3 flex gap-2">
              {["normal", "urgent"].map(p => (
                <button key={p} type="button" onClick={() => setForm({ priority: p })}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold border-2 transition-colors ${form.priority === p
                    ? (p === "urgent" ? "border-red-400 bg-red-50 text-red-700" : "border-slate-300 bg-slate-100 text-slate-700")
                    : "border-slate-200 bg-white text-slate-400"}`}>
                  {p === "urgent" ? "🚨 Urgent" : "Normal"}
                </button>
              ))}
            </div>
            {/* Body */}
            <div className="mb-3">
              <label className="text-sm font-semibold text-slate-600 block mb-1">Observation *</label>
              <textarea value={form.body || ""} onChange={e => setForm({ body: e.target.value })} rows={4}
                placeholder="Describe what you observed…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none" />
            </div>
            {/* Photos */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-slate-600 block mb-1.5">Photos (up to 3)</label>
              {/* Existing photos */}
              {(form.photos || []).length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {(form.photos || []).map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt={`Photo ${i+1}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
                      <button type="button" onClick={() => setForm({ photos: (form.photos || []).filter((_, j) => j !== i) })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                </div>
              )}
              {(form.photos || []).length < 3 && (
                <label className="flex items-center justify-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-500 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-colors">
                  <span>📷</span> {(form.photos || []).length === 0 ? "Add photo" : "Add another"}
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Compress to canvas at max 1200px, quality 0.7
                      const img = new Image();
                      img.onload = () => {
                        const MAX = 1200;
                        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                        const canvas = document.createElement("canvas");
                        canvas.width = Math.round(img.width * scale);
                        canvas.height = Math.round(img.height * scale);
                        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                        setForm({ photos: [...(form.photos || []), dataUrl] });
                      };
                      img.src = URL.createObjectURL(file);
                      e.target.value = ""; // allow re-selecting same file
                    }}
                  />
                </label>
              )}
            </div>
            <button onClick={async () => {
              const current = fieldNoteForm;
              if (!current?.body?.trim()) { showToast("Please add a description"); return; }
              let lat = current.lat, lng = current.lng, accuracyM = current.accuracyM, locationApprox = current.locationApprox;
              // If no GPS coords yet, try a fresh grab, then fall back to farm center
              if (!lat) {
                try {
                  const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
                  lat = pos.coords.latitude; lng = pos.coords.longitude;
                  accuracyM = pos.coords.accuracy; locationApprox = false;
                } catch {
                  // Fall back to farm center — note will be marked approximate
                  lat = FARM_CENTERS[farmName]?.[0] || -37.21;
                  lng = FARM_CENTERS[farmName]?.[1] || 141.62;
                  locationApprox = true;
                }
              }
              try {
                if (isEdit) {
                  const updated = await api.updateFieldNote(current.id, { body: current.body, category: current.category, priority: current.priority, paddock: current.paddock, photos: current.photos || [] });
                  setFieldNotes(prev => prev.map(n => n.id === current.id ? { ...n, ...updated } : n));
                  showToast("Note updated");
                } else {
                  const created = await api.createFieldNote(farmName, {
                    lat, lng, accuracyM, locationApprox,
                    paddock: current.paddock,
                    category: current.category,
                    body: current.body.trim(),
                    priority: current.priority,
                    photos: current.photos || [],
                    authorName: currentUser?.name || null,
                  });
                  setFieldNotes(prev => [created, ...prev]);
                  showToast("Note saved");
                }
                setFieldNoteForm(null);
              } catch (err) { showToast(err.message || "Couldn't save note"); }
            }} className="w-full bg-amber-500 text-white rounded-2xl py-3.5 font-bold">
              {isEdit ? "Save Changes" : "Save Note"}
            </button>
          </Modal>
        );
      })()}


      {showAddMob && AddMobModal()}

      {showMobSummaryDetail && (
        <Modal title="Livestock Summary" onClose={() => setShowMobSummaryDetail(false)}>
          <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-2xl p-4 mb-3 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Total DSE</div>
            <div className="text-3xl font-bold tracking-tight">{totalDSE.toLocaleString(undefined,{maximumFractionDigits:1})}</div>
          </div>
          {mobs.map((m) => (
            <div key={m.id} className="flex justify-between border-b border-slate-100 py-2 text-sm">
              <span className="text-slate-600 font-medium">{m.name}</span><span className="font-bold text-slate-800">{m.count}</span>
            </div>
          ))}
        </Modal>
      )}

      {showAllFarms && (() => {
        const farmStats = Object.entries(farmsMobs).map(([fName, fMobs]) => ({
          name: fName,
          cattle: fMobs.filter((m) => /steer|cow|calf|calves|heifer|bull/i.test(m.name) || m.species === "Cattle").reduce((s, m) => s + m.count, 0),
          sheep: fMobs.filter((m) => m.species === "Sheep").reduce((s, m) => s + m.count, 0),
          dse: fMobs.reduce((s, m) => s + m.count * (m.dse || 0), 0),
          mobCount: fMobs.length,
        }));
        const grand = farmStats.reduce((acc, f) => ({
          cattle: acc.cattle + f.cattle,
          sheep: acc.sheep + f.sheep,
          dse: acc.dse + f.dse,
          mobCount: acc.mobCount + f.mobCount,
        }), { cattle: 0, sheep: 0, dse: 0, mobCount: 0 });
        return (
          <Modal title="All Farms" onClose={() => setShowAllFarms(false)}>
            <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-2xl p-4 mb-3 text-white">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Combined Total DSE</div>
              <div className="text-3xl font-bold tracking-tight">{grand.dse.toLocaleString(undefined,{maximumFractionDigits:1})}</div>
              <div className="flex gap-4 mt-3 text-sm font-semibold">
                <span>🐄 {grand.cattle.toLocaleString()} cattle</span>
                <span>🐑 {grand.sheep.toLocaleString()} sheep</span>
              </div>
            </div>
            <div className="space-y-2">
              {farmStats.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    const name = f.name;
                    setFarmName(name);
                    // Don't clear existing data — keep it visible while fresh data loads in background
                    // This prevents the "jumping to 0" flash when switching farms
                    setShowAllFarms(false);
                    showToast(`Switched to ${name}`);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border ${f.name === farmName ? "border-red-700 bg-orange-50" : "border-slate-100 bg-white"} shadow-sm`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{f.name}</span>
                    {f.name === farmName && <span className="text-xs font-bold text-red-950">CURRENT</span>}
                  </div>
                  <div className="text-xs text-slate-400">{f.mobCount} mobs · 🐄 {f.cattle.toLocaleString()} · 🐑 {f.sheep.toLocaleString()}</div>
                  <div className="text-xs text-red-950 font-semibold mt-1">{f.dse.toLocaleString(undefined,{maximumFractionDigits:1})} DSE</div>
                </button>
              ))}
            </div>
            {isAdmin && (
              <>
                <button onClick={() => { setNewFarmName(""); setShowAddFarm(true); }} className="w-full mt-3 border-2 border-dashed border-amber-500 text-red-950 rounded-2xl py-3 font-bold">+ Add Farm</button>
                <p className="text-xs text-slate-400 mt-3 text-center">As an Admin you can add new farms here.</p>
              </>
            )}
            {!isAdmin && (
              <p className="text-xs text-slate-400 mt-3 text-center">Only Admins can add or remove farms.</p>
            )}
          </Modal>
        );
      })()}

      {showAccounts && (
        <div className="fixed inset-0 bg-slate-50 z-40 flex flex-col max-w-md mx-auto">
          <div className="bg-slate-800 text-white flex items-center justify-between px-4 py-4 flex-shrink-0">
            <button onClick={() => setShowAccounts(false)} className="text-sm font-semibold text-slate-300">CLOSE</button>
            <h1 className="text-base font-bold">Accounts</h1>
            <div className="w-14" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-orange-50 rounded-2xl p-4 mb-4">
            <div className="text-xs font-semibold text-red-950 uppercase tracking-wide mb-2">Signed in as</div>
            <div className="font-semibold text-slate-700">{currentUser.name} ({currentUser.email}) · {currentUser.role}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
            <div className="text-sm font-bold text-slate-700 mb-2">Change my password</div>
            <div className="flex gap-2">
              <input
                type="password"
                value={changePasswordValue}
                onChange={(e) => setChangePasswordValue(e.target.value)}
                placeholder="New password"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm"
              />
              <button
                onClick={async () => {
                  if (!changePasswordValue || changePasswordValue.length < 4) { showToast("Password must be at least 4 characters"); return; }
                  try {
                    await api.changePassword(currentUserId, changePasswordValue);
                    setChangePasswordValue("");
                    showToast("Password updated");
                  } catch (err) {
                    showToast(err.message || "Couldn't update password");
                  }
                }}
                className="bg-red-900 text-white rounded-xl px-4 font-bold text-sm"
              >
                Update
              </button>
            </div>
          </div>

          <div className="text-sm font-bold text-slate-700 mb-0.5">Team members</div>
          <div className="text-xs text-slate-400 mb-2">Changes save automatically — you'll see a confirmation each time.</div>
          <div className="space-y-2 mb-4">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{a.name || a.email}</div>
                  <div className="text-xs text-slate-400">{a.email}</div>
                </div>
                {isAdmin ? (
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                      <select
                        value={a.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          const prevRole = a.role;
                          setAccounts((prev) => prev.map((acc) => acc.id === a.id ? { ...acc, role: newRole } : acc));
                          try {
                            const updated = await api.updateAccount(a.id, { role: newRole });
                            // Sync with what the server actually stored
                            setAccounts((prev) => prev.map((acc) => acc.id === a.id ? { ...acc, ...updated } : acc));
                            showToast(`✓ ${a.name || a.email} is now ${newRole}`);
                          } catch (err) {
                            // Save failed — snap the dropdown back so it's obvious
                            setAccounts((prev) => prev.map((acc) => acc.id === a.id ? { ...acc, role: prevRole } : acc));
                            showToast(`Couldn't save role change — ${err.message || "check your connection and try again"}`);
                          }
                        }}
                        className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                      >
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {a.id !== currentUserId && (
                        <button
                          onClick={async () => {
                          setAccounts((prev) => prev.filter((acc) => acc.id !== a.id));
                          try {
                            await api.deleteAccount(a.id);
                          } catch (err) {
                            showToast(err.message || "Couldn't remove account");
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    )}
                    </div>
                    {/* Farm access — not shown for Admin (they always see all) */}
                    {a.role !== "Admin" && (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 mb-1">Farm access:</div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {ALL_FARM_NAMES.map(f => {
                            const allowed = a.allowedFarms || [];
                            const hasAccess = allowed.length === 0 || allowed.includes(f);
                            return (
                              <button key={f}
                                onClick={async () => {
                                  const current = a.allowedFarms || [];
                                  // Empty array = all farms. Build explicit list when restricting.
                                  let base = current.length === 0 ? [...ALL_FARM_NAMES] : [...current];
                                  const next = base.includes(f) ? base.filter(x => x !== f) : [...base, f];
                                  // If all farms selected, store as empty (= no restriction)
                                  const toStore = next.length === ALL_FARM_NAMES.length ? [] : next;
                                  const prevFarms = a.allowedFarms || [];
                                  setAccounts(prev => prev.map(acc => acc.id === a.id ? { ...acc, allowedFarms: toStore } : acc));
                                  try {
                                    await api.updateAccount(a.id, { allowedFarms: toStore });
                                    showToast("✓ Farm access saved");
                                  } catch (err) {
                                    // Save failed — snap the chips back so it's obvious
                                    setAccounts(prev => prev.map(acc => acc.id === a.id ? { ...acc, allowedFarms: prevFarms } : acc));
                                    showToast(`Couldn't save farm access — ${err.message || "check your connection and try again"}`);
                                  }
                                }}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-colors ${
                                  hasAccess
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                }`}
                              >
                                {f.replace("Kurra-Wirra","KW")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-bold text-red-950 bg-orange-50 px-2 py-1 rounded-full">{a.role}</span>
                )}
              </div>
            ))}
          </div>

          {isAdmin ? (
            <>
              <div className="text-sm font-bold text-slate-700 mb-2">Invite a team member</div>
              <div className="space-y-3 mb-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Name</label>
                  <input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} type="text" placeholder="e.g. Sam Taylor" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Email address</label>
                  <input value={newAccountEmail} onChange={(e) => setNewAccountEmail(e.target.value)} type="email" placeholder="name@example.com" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Permission level</label>
                  <select value={newAccountRole} onChange={(e) => setNewAccountRole(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!newAccountName.trim()) { showToast("Please enter a name"); return; }
                    if (!newAccountEmail.trim()) { showToast("Please enter an email"); return; }
                    if (accounts.some((a) => a.email.toLowerCase() === newAccountEmail.trim().toLowerCase())) { showToast("That email is already added"); return; }
                    try {
                      const created = await api.inviteAccount({ name: newAccountName.trim(), email: newAccountEmail.trim(), role: newAccountRole });
                      setAccounts((prev) => [...prev, created]);
                      setNewAccountName("");
                      setNewAccountEmail("");
                      setNewAccountRole("Worker");
                      showToast(`${newAccountName} added — password is "password"`);
                    } catch (err) {
                      showToast(err.message || "Couldn't send invite");
                    }
                  }}
                  className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold"
                >
                  Add Staff Member
                </button>
              </div>
              <p className="text-xs text-slate-400">
                <strong>Admin</strong> — full access including farms &amp; accounts. <strong>Manager</strong> — can edit mobs, inventory and records but can't add/delete farms or manage accounts. <strong>Worker</strong> — can record day-to-day tasks (treat, weigh, recount, tag, sales/deaths) but can't edit, delete, merge or create mobs.
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">Only Admins can invite people or change roles.</p>
          )}
          </div>
        </div>
      )}

      {showAddFarm && (
        <Modal title="Add Farm" onClose={() => setShowAddFarm(false)}>
          <label className="text-sm font-semibold text-slate-600 block mb-1">Farm name</label>
          <input value={newFarmName} onChange={(e) => setNewFarmName(e.target.value)} placeholder="e.g. Glenfern" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white mb-4" />
          <button
            onClick={() => {
              if (!newFarmName.trim()) { showToast("Please enter a farm name"); return; }
              if (farmsMobs[newFarmName]) { showToast("A farm with that name already exists"); return; }
              setFarmsMobs((prev) => ({ ...prev, [newFarmName]: [] }));
              setFarmName(newFarmName);
              setShowAddFarm(false);
              setShowAllFarms(false);
              showToast(`${newFarmName} added`);
            }}
            className="w-full bg-stone-800 text-white rounded-2xl py-3.5 font-semibold"
          >
            Save Farm
          </button>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-full z-50 max-w-[90%] text-center shadow-xl">
          {toast}
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
