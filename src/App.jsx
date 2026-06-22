import React, { useState, useRef } from "react";
import { Home, MapPin, Tag, Menu, ChevronRight, X, HelpCircle, Search, ArrowLeftRight, RefreshCw, Droplet, Settings, LifeBuoy, Sparkles, Check } from "lucide-react";
import { api, setAuthToken, getStoredToken } from "./api.js";

// Module-level API URL — available at build time via Vite's env injection
const VITE_API_URL = (typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : null) || "http://localhost:3001/api";
const API_BASE_URL = VITE_API_URL.replace(/\/api$/, ""); // e.g. https://kw-farm-api.onrender.com

const LOGO_DATA_URI = "data:image/jpeg;base64,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";

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
const WORKER_ACTIONS = ["Treat", "Weigh", "Recount", "WEC", "Death", "Sale"];
const ROLE_OPTIONS = ["Admin", "Manager", "Worker"];

const BREEDS_DEFAULT = { Cattle: ["Angus", "Hereford", "Charolais", "Simmental", "Murray Grey", "Mixed"], Sheep: ["Merino", "Dorper", "Suffolk", "Poll Dorset", "Border Leicester", "Mixed"], Rams: ["Merino", "Dorper", "Suffolk", "Poll Dorset", "Mixed"], Other: [] };
const AGE_CLASSES = { Cattle: ["Calves", "Weaners", "Yearlings", "Adult"], Sheep: ["Lambs", "Hoggets", "Adult"] };
const TAG_COLOURS = ["Red", "Blue", "Green", "Yellow", "Orange", "Pink", "White", "Black"];
const TAG_COLOUR_HEX = { Red: "#ef4444", Blue: "#3b82f6", Green: "#22c55e", Yellow: "#eab308", Orange: "#f97316", Pink: "#ec4899", White: "#f8fafc", Black: "#1e293b" };
const SPECIES_ICON = { Cattle: "🐄", Sheep: "🐑" };
const PADDOCKS = ["North", "South", "East", "West", "River", "Yards"];
const PADDOCK_COLOURS = ["Sky Blue", "Forest Green", "Sunset Orange", "Ruby Red", "Lavender", "Mustard"];
const COLOUR_HEX = { "Sky Blue": "#38bdf8", "Forest Green": "#22c55e", "Sunset Orange": "#f97316", "Ruby Red": "#ef4444", "Lavender": "#a78bfa", "Mustard": "#eab308" };
const LAND_USES = ["Grazing", "Cropping", "Fallow", "Yards/Infrastructure"];
const PASTURE_TYPES = ["Native grass", "Improved pasture", "Lucerne", "Cereal crop", "N/A"];

// Landmark categories/types, modelled on the AgriWebb Farm Map Editor feature set
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
const USAGE_COLOURS = { Grazing: "#22c55e", Cropping: "#eab308", Fallow: "#94a3b8", "Yards/Infrastructure": "#64748b" };

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

function ringAreaHa(ring) {
  const R = 6378137;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    area += ((lon2 - lon1) * Math.PI / 180) * (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180));
  }
  return Math.abs(area * R * R / 2) / 10000;
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
    if (insightMode === "outline") return "none";
    if (insightMode === "usage") return USAGE_COLOURS[p.landUse] || "#999";
    if (insightMode === "crop") return COLOUR_HEX[p.colour] || "#999"; // crop/pasture mapped via paddock colour
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
    return COLOUR_HEX[p.colour] || "#999";
  };

  return (
    <div className="w-full h-full bg-slate-800 overflow-auto">
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
function GooglePaddockMap({
  paddocks, center, onSelect, apiKey, onError,
  mode = "paddocks",
  mobs = [], onSelectPin,
  landmarks = [], onSelectLandmark,
  insightMode = "usage", paddockStats = {},
  drawMode = false, drawPoints = [], onDrawPoint,
  userLocation = null,
  openGateIds = [],
  // Landmark pin-placement mode: when true, show a draggable pin on the map
  landmarkPinMode = false, landmarkPinPos = null, onLandmarkPinMoved,
}) {
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const colourForPaddock = (p) => {
    if (insightMode === "outline") return null;
    if (insightMode === "usage") return USAGE_COLOURS[p.landUse] || "#999999";
    if (insightMode === "crop")  return COLOUR_HEX[p.colour] || "#999999";
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
    return COLOUR_HEX[p.colour] || "#999999";
  };

  // Abbreviate a paddock name for mid-zoom labels: "Squashy Island" → "SI"
  const abbrev = (name) => name.split(/[\s\-_]+/).map(w => w[0]).join("").toUpperCase().slice(0,3);

  // Helper: build/update paddock label marker based on zoom level
  const updateLabelForZoom = (g, map, centroid, p, labelMarkerRef, zoom) => {
    if (labelMarkerRef.setMap) labelMarkerRef.setMap(null);
    let text = "";
    if (zoom >= 15) text = p.name;                       // full name
    else if (zoom >= 13) text = abbrev(p.name);          // abbreviation
    // zoom < 13: no label
    if (!text) return null;
    const stats = paddockStats[p.name] || {};
    let badge = `${Number(p.ha||0).toFixed(1)} ha`;
    if (insightMode === "stocking") badge = `${(stats.dsePerHa||0).toFixed(1)} DSE/ha`;
    else if (insightMode === "feed") badge = stats.lastFoo ? `${stats.lastFoo} kgDM/ha` : "";
    else if (insightMode === "grazed") badge = stats.daysSinceGrazed != null ? `${stats.daysSinceGrazed}d ago` : "";
    const labelText = zoom >= 15 ? `${text}\n${badge}` : text;
    const m = new g.Marker({
      position: centroid, map,
      label: { text: labelText, color: "#fff", fontWeight: "bold", fontSize: zoom >= 15 ? "12px" : "10px" },
      icon: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", scaledSize: new g.Size(1, 1) },
    });
    return m;
  };

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId;
    const render = () => {
      if (cancelled || !mapDivRef.current || !window.google?.maps) return;
      const g = window.google.maps;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.overlays?.forEach((o) => { try { o.setMap(null); } catch {} });
      }
      const map = new g.Map(mapDivRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: 13,
        mapTypeId: "satellite",
        streetViewControl: false, fullscreenControl: false, mapTypeControl: false,
      });
      const bounds = new g.LatLngBounds();
      const overlays = [];
      const centroids = {};
      const labelMarkers = {}; // paddock name → label marker
      const polygons = {};

      // ── Draw paddock polygons (both modes) ──
      paddocks.forEach((p, i) => {
        const latlngs = geometryToLatLngs(p.geojson) || fallbackPolygon(center, i, Number(p.ha) || 10);
        const path = latlngs.map(([lat, lng]) => ({ lat, lng }));
        path.forEach((pt) => bounds.extend(pt));
        const centroid = path.reduce((acc, pt) => ({ lat: acc.lat + pt.lat / path.length, lng: acc.lng + pt.lng / path.length }), { lat: 0, lng: 0 });
        centroids[p.name] = centroid;

        const isGateOpen = landmarks.some(l => l.type === "Gate" && openGateIds.includes(String(l.id)) && (l.paddockA === p.name || l.paddockB === p.name));
        const fillColour = mode === "paddocks" ? (colourForPaddock(p) || "#999999") : "transparent";
        const poly = new g.Polygon({
          paths: path,
          strokeColor: isGateOpen ? "#eab308" : "#ffffff",
          strokeWeight: isGateOpen ? 3 : (mode === "paddocks" ? 2 : 1.5),
          fillColor: mode === "paddocks" ? fillColour : "#38bdf8",
          fillOpacity: mode === "paddocks" ? 0.45 : 0.15,
          map,
        });
        if (mode === "paddocks") poly.addListener("click", () => onSelect(p));
        else poly.addListener("click", () => onSelect(p));
        polygons[p.name] = poly;
        overlays.push(poly);

        // Initial label at current zoom (always show in paddocks mode)
        const lm = updateLabelForZoom(g, map, centroid, p, { setMap: () => {} }, mode === "paddocks" ? map.getZoom() : 14);
        if (lm) { labelMarkers[p.name] = lm; overlays.push(lm); }
      });

      // Zoom-aware label update (paddocks mode)
      if (mode === "paddocks") {
        map.addListener("zoom_changed", () => {
          const z = map.getZoom();
          Object.entries(labelMarkers).forEach(([name, lm]) => {
            if (lm) lm.setMap(null);
          });
          paddocks.forEach((p) => {
            if (!centroids[p.name]) return;
            const newLm = updateLabelForZoom(g, map, centroids[p.name], p, { setMap: () => {} }, z);
            if (newLm) { labelMarkers[p.name] = newLm; overlays.push(newLm); }
            else labelMarkers[p.name] = null;
          });
        });
      }

      // ── Livestock pins (livestock mode) ──
      if (mode === "livestock") {
        // Group mobs by paddock + species so each species gets its own tile
        const groups = {};
        mobs.forEach((m) => {
          const key = `${m.paddock || "_nopad"}::${m.species || "Other"}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(m);
        });
        let gi = 0;
        Object.entries(groups).forEach(([key, groupMobs]) => {
          const [paddockName, species] = key.split("::");
          let base = centroids[paddockName];
          if (!base) {
            const angle = (gi / Math.max(Object.keys(groups).length, 1)) * 2 * Math.PI;
            base = { lat: center[0] + Math.cos(angle) * 0.012, lng: center[1] + Math.sin(angle) * 0.012 };
          }
          // Offset species tiles within the same paddock
          const speciesOffset = species === "Cattle" || species === "Bulls" ? 0 : (species === "Sheep" ? 0.0008 : 0.0004);
          const pos = { lat: base.lat + speciesOffset, lng: base.lng + speciesOffset * 0.5 };
          bounds.extend(pos);
          const totalCount = groupMobs.reduce((s, m) => s + m.count, 0);
          const tagColour = TAG_COLOUR_HEX[groupMobs[0]?.tag] || "#cbd5e1";
          const emoji = species === "Cattle" ? "🐄" : species === "Sheep" ? "🐑" : species === "Rams" ? "🐏" : species === "Bulls" ? "🐂" : "🐾";
          const marker = new g.Marker({
            position: pos, map,
            label: { text: `${emoji} ${totalCount}`, color: "#1e293b", fontWeight: "bold", fontSize: "12px" },
            icon: {
              path: g.SymbolPath.CIRCLE,
              scale: 18,
              fillColor: "#ffffff",
              fillOpacity: 1,
              strokeColor: tagColour,
              strokeWeight: 3,
            },
          });
          marker.addListener("click", () => onSelectPin?.({ l: totalCount, mob: groupMobs[0], mobs: groupMobs }));
          overlays.push(marker);
          gi++;
        });
      }

      // ── Landmarks (paddocks mode) ──
      if (mode === "paddocks") {
        landmarks.forEach((l) => {
          if (l.lat == null || l.lng == null) return;
          const pos = { lat: Number(l.lat), lng: Number(l.lng) };
          const cat = Object.values(LANDMARK_CATEGORIES).flat().find((c) => c.type === l.type);
          const marker = new g.Marker({
            position: pos, map,
            label: { text: cat?.icon || "📍", fontSize: "16px" },
            icon: { path: g.SymbolPath.CIRCLE, scale: 14, fillColor: LANDMARK_COLOUR_HEX[l.colour] || "#64748b", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
          });
          marker.addListener("click", () => onSelectLandmark?.(l));
          overlays.push(marker);
        });
      }

      // ── Draggable landmark placement pin ──
      if (landmarkPinMode) {
        const startPos = landmarkPinPos
          ? { lat: landmarkPinPos.lat, lng: landmarkPinPos.lng }
          : { lat: center[0], lng: center[1] };
        const pinMarker = new g.Marker({
          position: startPos,
          map,
          draggable: true,
          label: { text: "📍", fontSize: "22px" },
          icon: { path: g.SymbolPath.CIRCLE, scale: 2, fillOpacity: 0, strokeOpacity: 0 },
          title: "Drag to place landmark",
          zIndex: 999,
        });
        pinMarker.addListener("dragend", (e) => {
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

      // ── User location blue dot ──
      if (userLocation) {
        const dot = new g.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map,
          icon: { path: g.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
          zIndex: 999,
        });
        overlays.push(dot);
      }

      if (paddocks.length || landmarks.length) { try { map.fitBounds(bounds, 40); } catch {} }
      mapInstanceRef.current = { map, overlays };
    };

    if (window.google?.maps) {
      render();
    } else {
      const existing = document.getElementById("google-maps-js");
      if (existing) { existing.remove(); delete window.google; }
      window.__gmapsCallback = render;
      const script = document.createElement("script");
      script.id = "google-maps-js";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=__gmapsCallback`;
      script.async = true;
      script.onerror = () => { if (!cancelled) onError?.(); };
      document.body.appendChild(script);
      timeoutId = setTimeout(() => { if (!cancelled && !window.google?.maps) onError?.(); }, 8000);
    }
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.overlays?.forEach((o) => { try { o.setMap(null); } catch {} });
        mapInstanceRef.current = null;
      }
    };
  }, [paddocks, center, apiKey, mode, mobs, landmarks, insightMode, drawMode, drawPoints, userLocation, openGateIds, landmarkPinMode, landmarkPinPos]);

  return <div ref={mapDivRef} className="w-full h-full" />;
}


function geojsonToPaddocks(geojson) {
  const features = geojson?.features || (geojson?.type === "Feature" ? [geojson] : []);
  return features.map((f, i) => {
    const props = f.properties || {};
    const name = props.name || props.Name || props.NAME || props.paddock || `Paddock ${i + 1}`;
    let ha = props.ha || props.area_ha || props.Area || props.area;
    if (!ha && f.geometry) {
      const geom = f.geometry;
      let ring = null;
      if (geom.type === "Polygon") ring = geom.coordinates[0];
      else if (geom.type === "MultiPolygon") ring = geom.coordinates[0][0];
      if (ring) ha = ringAreaHa(ring);
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
  Treat: [{ label: "Treatment", type: "select", options: [] }, { label: "Dose rate", type: "text" }],
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
  Merge: [{ label: "Merge into mob", type: "select", options: [] }],
  Delete: [],
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end z-50 max-w-md mx-auto">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
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

  // On first load, try to restore a session from a stored token (so people stay logged in
  // across visits without re-entering credentials every time).
  React.useEffect(() => {
    const token = getStoredToken();
    if (!token) { setAuthLoading(false); return; }
    // Safety timeout — if the API doesn't respond in 5 seconds, clear loading anyway
    // so the user sees the login screen rather than a blank page forever.
    const timeout = setTimeout(() => {
      setAuthToken(null);
      setAuthLoading(false);
    }, 5000);
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
        setAuthLoading(false);
      });
    return () => clearTimeout(timeout);
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
  const [farmsMobs, setFarmsMobs] = useState({ Arundale: [], Hamilton: [], "Kurra-Wirra": [], Mooralla: [], Carramar: [] });
  const [farmName, setFarmName] = useState("Arundale");
  const [farmsPaddocks, setFarmsPaddocks] = useState({ Arundale: [], Hamilton: [], "Kurra-Wirra": [], Mooralla: [], Carramar: [] });
  const paddocks = farmsPaddocks[farmName] || [];
  const setPaddocks = (updater) => setFarmsPaddocks((prev) => ({
    ...prev,
    [farmName]: typeof updater === "function" ? updater(prev[farmName] || []) : updater,
  }));
  const [farmsLandmarks, setFarmsLandmarks] = useState({ Arundale: [], Hamilton: [], "Kurra-Wirra": [], Mooralla: [], Carramar: [] });
  const landmarks = farmsLandmarks[farmName] || [];
  const setLandmarks = (updater) => setFarmsLandmarks((prev) => ({
    ...prev,
    [farmName]: typeof updater === "function" ? updater(prev[farmName] || []) : updater,
  }));
  const [showAddLandmark, setShowAddLandmark] = useState(false);
  const [landmarkPinPos, setLandmarkPinPos] = useState(null);
  const [landmarkPinMode, setLandmarkPinMode] = useState(false);
  const [showPaddockAddMenu, setShowPaddockAddMenu] = useState(false);
  const [landmarkCategoryPick, setLandmarkCategoryPick] = useState(null);
  const [newLandmarkForm, setNewLandmarkForm] = useState({});
  const [landmarkDetail, setLandmarkDetail] = useState(null);
  const [landmarkEditMode, setLandmarkEditMode] = useState(false);
  const [mapDrawMode, setMapDrawMode] = useState(false); // true while drawing a new paddock shape
  const [drawPoints, setDrawPoints] = useState([]); // array of {x,y} in SVG space while drawing
  const [insightMode, setInsightMode] = useState("usage");
  const fileInputRef = useRef(null);
  const [showAddPaddock, setShowAddPaddock] = useState(false);
  const [newPaddockForm, setNewPaddockForm] = useState({});
  const [paddockDetail, setPaddockDetail] = useState(null);
  // Gate state: array of {id, paddockA, paddockB, landmarkId} — when a gate is open, the two
  // paddocks it connects are merged visually (yellow border) and their DSE/ha is combined.
  const [openGates, setOpenGates] = useState([]);
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
  const [paddockEditForm, setPaddockEditForm] = useState({});
  const mobs = farmsMobs[farmName];
  const setMobs = (updater) => setFarmsMobs((prev) => ({
    ...prev,
    [farmName]: typeof updater === "function" ? updater(prev[farmName]) : updater,
  }));
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
        setHistory((prev) => ({ ...prev, [selectedMobId]: h.map((row) => ({ action: row.action, detail: row.detail, date: row.date })).reverse() }));
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
  const [showRainfall, setShowRainfall] = useState(false);
  const [rainfall, setRainfall] = useState([]);
  const [rainfallForm, setRainfallForm] = useState({});
  React.useEffect(() => {
    if (!loggedInEmail) return;
    api.listRainfall(farmName).then(setRainfall).catch(() => {});
  }, [farmName, loggedInEmail]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  // Load all farm-scoped data from the API whenever we're logged in and/or the
  // selected farm changes, so every device sees the same live data.
  React.useEffect(() => {
    if (!loggedInEmail) return;
    let cancelled = false;
    setDataLoading(true);
    setDataError("");
    Promise.all([
      api.listMobs(farmName),
      api.listPaddocks(farmName),
      api.listLandmarks(farmName),
      api.listTreatments(farmName),
      api.listSprayInventory(farmName),
      api.listFoo(farmName),
    ])
      .then(([mobsRes, paddocksRes, landmarksRes, treatmentsRes, sprayRes, fooRes]) => {
        if (cancelled) return;
        setFarmsMobs((prev) => ({ ...prev, [farmName]: mobsRes }));
        setFarmsPaddocks((prev) => ({ ...prev, [farmName]: paddocksRes }));
        setFarmsLandmarks((prev) => ({ ...prev, [farmName]: landmarksRes }));
        setInventory(treatmentsRes);
        setSprayInventory(sprayRes);
        setFooHistory((prev) => [...prev.filter((r) => r._farm !== farmName), ...fooRes.map((r) => ({ ...r, _farm: farmName }))]);
      })
      .catch((err) => {
        if (!cancelled) setDataError(err.message || "Couldn't load farm data");
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => { cancelled = true; };
  }, [loggedInEmail, farmName]);

  // Pre-load ALL farms' mobs in the background so the Home screen all-farms totals are accurate
  React.useEffect(() => {
    if (!loggedInEmail) return;
    const OTHER_FARMS = ["Arundale", "Hamilton", "Kurra-Wirra", "Mooralla", "Carramar"].filter(f => f !== farmName);
    OTHER_FARMS.forEach((farm) => {
      api.listMobs(farm)
        .then((res) => setFarmsMobs((prev) => ({ ...prev, [farm]: res })))
        .catch(() => {}); // silent — home screen shows 0 if it fails, not a critical error
    });
  }, [loggedInEmail]); // only runs once on login, not on every farm switch

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

  const handleSync = () => {
    if (!isOnline) { showToast("You're offline — will sync automatically when back online"); return; }
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncCount(0);
      const synced = pendingChanges;
      setPendingChanges(0);
      showToast(synced > 0 ? `Synced ${synced} change${synced > 1 ? "s" : ""} (yours + team)` : "Sync complete");
    }, 1200);
  };

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
    if (name === "DSE") prefill["DSE rating per head"] = m.dse;
    if (name === "ADG" && m.assumedADG) prefill["Assumed ADG (kg/day)"] = m.assumedADG;
    setFormValues(prefill);
    setActionForm(name);
  };

  const submitAction = async () => {
    const name = actionForm;
    const mobId = selectedMobId;
    const mob = mobs.find((m) => m.id === mobId);
    if (!mob) return;

    let patch = {};
    if (name === "Recount" && formValues["New head count"]) patch.count = Number(formValues["New head count"]);
    if (name === "Move" && formValues["Move to paddock"]) { patch.paddock = formValues["Move to paddock"]; patch.daysInPaddock = 0; }
    if (name === "Death" && formValues["Number of deaths"]) patch.count = Math.max(0, mob.count - Number(formValues["Number of deaths"]));
    if (name === "Sale" && formValues["Number sold"]) patch.count = Math.max(0, mob.count - Number(formValues["Number sold"]));
    if (name === "DSE" && formValues["DSE rating per head"]) patch.dse = Number(formValues["DSE rating per head"]);
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
      const { id, ...rest } = mob;
      try {
        const created = await api.createMob(farmName, { ...rest, name: formValues["New mob name"] });
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
    const summary = Object.entries(formValues)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    const historyDate = formValues["Date"] || formValues["Date scanned"] || todayStr();
    setHistory((prev) => {
      const list = prev[mobId] || [];
      return {
        ...prev,
        [mobId]: [{ action: name, detail: summary || "Recorded", date: historyDate }, ...list],
      };
    });
    try {
      await api.addMobHistory(mobId, { action: name, detail: summary || "Recorded", date: historyDate });
    } catch (err) {
      // history is supplementary — don't block the main action on this failing
      console.error("Couldn't save history entry:", err);
    }

    setActionForm(null);
    setShowMore(false);
    markChanged();
    showToast(`${name} recorded`);
  };

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
    <div className="bg-white/95 backdrop-blur-xl border-t border-slate-100/80 flex justify-around items-center py-2 fixed bottom-0 left-0 right-0 max-w-md mx-auto shadow-[0_-1px_20px_rgba(0,0,0,0.06)]">
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
  const allMobs = Object.values(farmsMobs).flat();
  const totalCattle = allMobs.filter((m) => m.species === "Cattle" || /steer|cow|calf|calves|bull|heifer/i.test(m.type || "")).reduce((s, m) => s + m.count, 0);
  const totalSheep = allMobs.filter((m) => m.species === "Sheep" || /ewe|sheep|merino|lamb|wether|ram/i.test(m.type || "")).reduce((s, m) => s + m.count, 0);
  const totalDSE = allMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
  // Per-farm summaries for farm tiles
  const FARM_NAMES = ["Arundale", "Hamilton", "Kurra-Wirra", "Mooralla", "Carramar"];
  const farmSummaries = FARM_NAMES.map((name) => {
    const farmMobs = farmsMobs[name] || [];
    const cattle = farmMobs.filter((m) => m.species === "Cattle").reduce((s, m) => s + m.count, 0);
    const sheep = farmMobs.filter((m) => m.species === "Sheep").reduce((s, m) => s + m.count, 0);
    const dse = farmMobs.reduce((s, m) => s + m.count * (Number(m.dse) || 0), 0);
    return { name, cattle, sheep, dse };
  });

  const HomeScreen = () => (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-red-950 text-white px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-1">
          <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="h-10 rounded-lg" />
          <div className="flex items-center gap-2">
            {isOnline && syncCount === 0 && pendingChanges === 0 && (
              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-semibold">✓ Synced</span>
            )}
            {(syncCount > 0 || pendingChanges > 0) && (
              <button onClick={handleSync} disabled={syncing} className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full font-semibold">
                {syncing ? "Syncing…" : `Sync ${syncCount + pendingChanges}`}
              </button>
            )}
            {!isOnline && (
              <span className="text-xs bg-slate-600/50 text-slate-300 px-2 py-1 rounded-full font-semibold">📡 Offline</span>
            )}
          </div>
        </div>
        <div className="text-xs text-white/50 mb-4">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        {/* All-farms totals strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "CATTLE", value: totalCattle.toLocaleString(), icon: "🐄" },
            { label: "SHEEP", value: totalSheep.toLocaleString(), icon: "🐑" },
            { label: "TOTAL DSE", value: totalDSE.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: "🌿" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white/10 rounded-2xl p-3 text-center">
              <div className="text-lg mb-0.5">{icon}</div>
              <div className="text-xl font-extrabold text-white">{value}</div>
              <div className="text-[10px] text-white/50 font-semibold tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Workflow Planner — front and centre ── */}
      <div className="px-4 -mt-4">
        <button
          onClick={() => setTab("workflow")}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg flex items-center gap-4 mb-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">📋</div>
          <div className="text-left flex-1">
            <div className="font-extrabold text-white text-lg leading-tight">Weekly Workflow</div>
            <div className="text-white/80 text-sm mt-0.5">Tasks, staff & machinery planning</div>
            <div className="text-white/60 text-xs mt-1">Tap to open planner →</div>
          </div>
        </button>

        {/* ── Feeding Systems ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setTab("cattle_feeding")}
            className="bg-gradient-to-br from-red-900 to-red-950 rounded-2xl p-4 text-left shadow-sm"
          >
            <div className="text-2xl mb-2">🐄</div>
            <div className="font-bold text-white text-sm leading-tight">Cattle Feeding System</div>
            <div className="text-white/60 text-xs mt-1">Pens · rations · weights</div>
          </button>
          <button
            onClick={() => setTab("sheep_feeding")}
            className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 text-left shadow-sm"
          >
            <div className="text-2xl mb-2">🐑</div>
            <div className="font-bold text-white text-sm leading-tight">Sheep Feeding System</div>
            <div className="text-white/60 text-xs mt-1">Pens · rations · weights</div>
          </button>
        </div>

        {/* ── Farm tiles ── */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="font-bold text-slate-700">Farms</h2>
          <span className="text-xs text-slate-400">Tap to enter</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {farmSummaries.map(({ name, cattle, sheep, dse }) => (
            <button
              key={name}
              onClick={() => {
                setFarmName(name);
                setFarmsMobs((prev) => ({ ...prev, [name]: [] }));
                setFarmsPaddocks((prev) => ({ ...prev, [name]: [] }));
                setFarmsLandmarks((prev) => ({ ...prev, [name]: [] }));
                setTab("livestock");
              }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left"
            >
              <div className="font-bold text-slate-800 mb-2">{name}</div>
              <div className="space-y-1">
                {cattle > 0 && <div className="text-xs text-slate-500">🐄 {cattle.toLocaleString()} cattle</div>}
                {sheep > 0 && <div className="text-xs text-slate-500">🐑 {sheep.toLocaleString()} sheep</div>}
                {cattle === 0 && sheep === 0 && <div className="text-xs text-slate-400">No livestock loaded</div>}
                {dse > 0 && <div className="text-xs font-semibold text-red-950">{dse.toLocaleString(undefined, { maximumFractionDigits: 0 })} DSE</div>}
              </div>
            </button>
          ))}
        </div>

        {/* ── Rainfall strip ── */}
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="font-bold text-slate-700">Rainfall · {farmName}</h2>
          <button className="text-red-950 text-sm font-semibold" onClick={() => setShowRainfall(true)}>Records</button>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400 font-semibold tracking-wide">YTD</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {Math.round(rainfall.filter((r) => r.date?.slice(0, 4) === String(new Date().getFullYear())).reduce((s, r) => s + Number(r.mm || 0), 0))}mm
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-xs text-slate-400 font-semibold tracking-wide">365 DAYS</div>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">
              {(() => {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 365);
                const cutoffStr = cutoff.toISOString().slice(0, 10);
                return Math.round(rainfall.filter((r) => r.date >= cutoffStr).reduce((s, r) => s + Number(r.mm || 0), 0));
              })()}mm
            </div>
          </div>
        </div>
      </div>
    </div>
  );


      {!isOnline && (
        <div className="mx-4 mt-4 bg-slate-700 text-white flex items-center justify-between px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2 text-sm font-medium">
            📡 Offline — working from data on this device{pendingChanges > 0 ? ` (${pendingChanges} pending change${pendingChanges > 1 ? "s" : ""})` : ""}
          </div>
        </div>
      )}
      {isOnline && (syncCount > 0 || pendingChanges > 0) && (
        <div className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-center justify-between px-4 py-3 rounded-2xl">
          <div className="flex items-center gap-2 text-sm font-medium">
            ⚠️ {syncing ? "Syncing..." : `${syncCount + pendingChanges} item${syncCount + pendingChanges > 1 ? "s" : ""} to sync`}
          </div>
          <button onClick={handleSync} disabled={syncing} className="bg-yellow-500 text-white rounded-full px-4 py-1.5 text-sm font-semibold">
            {syncing ? "..." : "Sync"}
          </button>
        </div>
      )}
  // Drive map pins from the real mobs list (deterministic scatter so positions don't jump on re-render)
  const PIN_DATA = mobs.map((m, i) => {
    const seed = (m.id * 37) % 100;
    const row = Math.floor(i / 4);
    const col = i % 4;
    const t = `${18 + row * 16 + (seed % 7)}%`;
    const left = `${15 + col * 22 + ((seed * 3) % 9)}%`;
    return { l: String(m.count), t, left, mob: m };
  });

  const MapScreen = () => (
    <div className="pb-24 relative">
      <div className="bg-white/90 backdrop-blur-md flex items-center px-4 py-3 gap-2 sticky top-0 z-10 border-b border-slate-100">
        <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Settings size={16} /></button>
        <div className="flex-1 flex bg-slate-100 rounded-full p-1">
          {["Livestock", "Paddocks"].map((m) => (
            <button
              key={m}
              onClick={() => setMapMode(m)}
              className={`flex-1 py-1.5 text-sm rounded-full font-semibold transition-colors ${mapMode === m ? "bg-amber-500 text-white shadow-sm" : "text-slate-400"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><HelpCircle size={16} /></button>
      </div>

      {mapMode === "Livestock" && (
        <div className="h-[78vh] relative">
          {googleMapsKey && !mapLoadError ? (
            <GooglePaddockMap
              paddocks={paddocks}
              mobs={mobs}
              mode="livestock"
              center={FARM_CENTERS[farmName] || FARM_CENTERS.Arundale}
              onSelect={() => {}}
              onSelectPin={setPinSelected}
              apiKey={googleMapsKey}
              onError={() => setMapLoadError(true)}
              userLocation={userLocation}
            />
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
            <button onClick={() => showToast("Add new mob/pin")} className="bg-red-900 text-white rounded-2xl w-12 h-12 flex items-center justify-center text-2xl shadow-lg">+</button>
            <button onClick={locateMe} disabled={locating} className="bg-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg disabled:opacity-50">
              {locating ? "…" : "◎"}
            </button>
          </div>
        </div>
      )}

      {mapMode === "Paddocks" && (() => {
        // Guard: dataLoading means paddocks may not be fetched yet
        if (dataLoading) return (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading paddocks...</div>
        );
        if (dataError) return (
          <div className="flex items-center justify-center h-48 text-rose-500 text-sm p-4 text-center">{dataError}</div>
        );
        // Compute per-paddock stats used by insight overlays
        const paddockStats = {};
        paddocks.forEach((p) => {
          const paddockMobs = mobs.filter((m) => m.paddock === p.name);
          const dseTotal = paddockMobs.reduce((s, m) => s + m.count * (m.dse || 0), 0);
          const dsePerHa = p.ha ? dseTotal / Number(p.ha) : 0;
          const lastFooEntry = fooHistory.filter((r) => r.paddock === p.name).slice(-1)[0];
          const daysSinceGrazed = paddockMobs.length > 0 ? Math.min(...paddockMobs.map((m) => m.daysInPaddock ?? 999)) : null;
          paddockStats[p.name] = { dsePerHa, lastFoo: lastFooEntry ? Number(lastFooEntry.kgDm) : null, daysSinceGrazed };
        });

        return (
        <div className="bg-slate-50 min-h-[78vh] p-4">
          <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-2xl p-4 mb-3 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Total Area</div>
            <div className="text-3xl font-bold tracking-tight">{paddocks.reduce((s, p) => s + (Number(p.ha) || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} ha</div>
            <div className="text-xs opacity-80 mt-1">{paddocks.length} paddocks · {totalDSE.toLocaleString(undefined,{maximumFractionDigits:1})} total DSE</div>
          </div>

          <div className="mb-3 -mx-1 overflow-x-auto">
            <div className="flex gap-1.5 px-1 w-max">
              {INSIGHT_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setInsightMode(m.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${insightMode === m.key ? "bg-red-900 text-white" : "bg-white text-slate-500 border border-slate-200"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {paddocks.length > 0 || landmarks.length > 0 ? (
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 mb-3 relative" style={{ height: "65vh" }}>
              {googleMapsKey && !mapLoadError ? (
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
                />
              ) : (
                <PaddockMap
                  paddocks={paddocks}
                  center={FARM_CENTERS[farmName] || FARM_CENTERS.Arundale}
                  onSelect={setPaddockDetail}
                  landmarks={landmarks}
                  onSelectLandmark={(l) => { setLandmarkDetail(l); setLandmarkEditMode(false); }}
                  insightMode={insightMode}
                  paddockStats={paddockStats}
                  drawMode={mapDrawMode}
                  drawPoints={drawPoints}
                  onDrawPoint={(lat, lng, x, y) => setDrawPoints((prev) => [...prev, { lat, lng, x, y }])}
                  userLocation={userLocation}
                  openGateIds={openGates}
                />
              )}
              {/* Floating action buttons over the paddock map */}
              {!mapDrawMode && (
                <div className="absolute right-3 bottom-3 flex flex-col gap-2 z-10">
                  <button onClick={locateMe} disabled={locating} className="bg-white w-11 h-11 rounded-full shadow-lg flex items-center justify-center disabled:opacity-50 text-lg">
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
                <div className="absolute right-16 bottom-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20 w-48">
                  {[
                    { label: "Add Paddock", action: () => { setNewPaddockForm({ landUse: "Grazing", pasture: "Native grass", colour: "Sky Blue" }); setShowAddPaddock(true); setShowPaddockAddMenu(false); } },
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
                <button onClick={() => setShowSettings(true)} className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Maps key status
                </button>
              )}
              {mapLoadError && (
                <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-xs font-medium px-3 py-2 rounded-xl">
                  Google Maps failed to load — showing offline map. Check your API key in Settings.
                </div>
              )}
              {mapDrawMode && (
                <div className="absolute top-2 left-2 right-2 bg-green-700/90 text-white text-xs font-medium px-3 py-2 rounded-xl">
                  ✏️ Drawing mode — tap the map to drop points around the paddock boundary. Add at least 3 points, then tap Save below.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm mb-3">
              No paddocks mapped yet — import a GeoJSON export from AgriWebb, draw one on the map, or add one manually below.
            </div>
          )}

          {mapDrawMode ? (
            <div className="flex gap-2 mb-3">
              <button onClick={() => setDrawPoints((prev) => prev.slice(0, -1))} disabled={drawPoints.length === 0} className="flex-1 border border-slate-300 text-slate-500 rounded-2xl py-3 font-bold text-sm disabled:opacity-40">Undo Point</button>
              <button
                onClick={() => { setMapDrawMode(false); setDrawPoints([]); }}
                className="flex-1 border border-rose-300 text-rose-500 rounded-2xl py-3 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (drawPoints.length < 3) { showToast("Add at least 3 points to form a paddock"); return; }
                  const geojson = { type: "Polygon", coordinates: [[...drawPoints.map((p) => [p.lng, p.lat]), [drawPoints[0].lng, drawPoints[0].lat]]] };
                  const ha = Math.round(ringAreaHa(geojson.coordinates[0]) * 10) / 10;
                  setNewPaddockForm({ landUse: "Grazing", pasture: "Native grass", colour: PADDOCK_COLOURS[paddocks.length % PADDOCK_COLOURS.length], ha: String(ha), geojson });
                  setMapDrawMode(false);
                  setDrawPoints([]);
                  setShowAddPaddock(true);
                }}
                className="flex-1 bg-green-600 text-white rounded-2xl py-3 font-bold text-sm"
              >
                Save Shape
              </button>
            </div>
          ) : (
            <>
              {paddocks.length > 0 && (
                <p className="text-xs text-slate-400 text-center mb-3">Tap a paddock or landmark on the map (or in the list below) for details and editing. Pinch to zoom, drag to pan.</p>
              )}

              {canEdit && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button onClick={() => { setNewPaddockForm({ landUse: "Grazing", pasture: "Native grass", colour: "Sky Blue" }); setShowAddPaddock(true); }} className="bg-red-900 text-white rounded-2xl py-3 font-bold text-sm">+ Add Paddock</button>
                  <button onClick={() => { setDrawPoints([]); setMapDrawMode(true); }} className="bg-green-700 text-white rounded-2xl py-3 font-bold text-sm">✏️ Draw Paddock</button>
                  <button onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-amber-500 text-red-950 rounded-2xl py-3 font-bold text-sm">⬆ Import GeoJSON</button>
                  <button onClick={() => { setLandmarkCategoryPick(null); setNewLandmarkForm({}); setShowAddLandmark(true); }} className="bg-amber-500 text-white rounded-2xl py-3 font-bold text-sm">📍 Add Landmark</button>
                  <input ref={fileInputRef} type="file" accept=".json,.geojson,application/geo+json,application/json" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        const imported = geojsonToPaddocks(data);
                        if (imported.length === 0) { showToast("No paddock features found"); return; }
                        showToast(`Saving ${imported.length} paddock${imported.length > 1 ? "s" : ""}...`);
                        const created = [];
                        for (const p of imported) {
                          const { id, ...fields } = p;
                          try {
                            const saved = await api.createPaddock(farmName, fields);
                            created.push(saved);
                          } catch (err) {
                            console.error("Failed to save imported paddock:", p.name, err);
                          }
                        }
                        if (created.length === 0) {
                          showToast("Couldn't save imported paddocks to the server");
                          return;
                        }
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
              )}
            </>
          )}

          <div className="space-y-3">
            {paddocks.length === 0 && landmarks.length === 0 && <p className="text-center text-slate-400 text-sm py-6">No paddocks yet. Add one, draw one on the map, or import a GeoJSON map exported from AgriWebb.</p>}
            {paddocks.map((p) => {
              const stats = paddockStats[p.name] || {};
              const latestFoo = fooHistory.filter((r) => r.paddock === p.name).slice(-1)[0];
              const headCount = mobs.filter((m) => m.paddock === p.name).reduce((s, m) => s + m.count, 0);
              return (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <button onClick={() => setPaddockDetail(p)} className="w-full text-left p-4">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOUR_HEX[p.colour] || "#999" }} />
                        <span className="font-bold text-slate-800">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{Number(p.ha||0).toFixed(1)} ha</span>
                    </div>
                    <div className="text-xs text-slate-400">{p.landUse} · {p.pasture}</div>
                    <div className="flex gap-4 mt-2 text-xs font-semibold flex-wrap">
                      <span className="text-slate-600">{headCount.toLocaleString()} hd</span>
                      <span className="text-red-950">{stats.dsePerHa?.toFixed(1) || "0.0"} DSE/ha</span>
                      {latestFoo && <span className="text-green-700">🌾 {latestFoo.kgDm} kg DM/ha</span>}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {landmarks.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-bold text-slate-700 mb-2">Landmarks</div>
              <div className="grid grid-cols-2 gap-2">
                {landmarks.map((l) => {
                  const cat = Object.values(LANDMARK_CATEGORIES).flat().find((c) => c.type === l.type);
                  return (
                    <button key={l.id} onClick={() => { setLandmarkDetail(l); setLandmarkEditMode(false); }} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-left flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: LANDMARK_COLOUR_HEX[l.colour] || "#64748b" }}>{cat?.icon || "📍"}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{l.name || l.type}</div>
                        <div className="text-xs text-slate-400 truncate">{l.type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {pinSelected && (
        <Modal title={pinSelected.mob ? pinSelected.mob.name : `Group of ${pinSelected.l}`} onClose={() => setPinSelected(null)}>
          <p className="text-sm text-slate-500 mb-3">{pinSelected.mob ? pinSelected.mob.desc : "Unidentified group on map"}</p>
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
          {pinSelected.mob?.tag && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 mb-3">
              <span className="w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: TAG_COLOUR_HEX[pinSelected.mob.tag] || "#e2e8f0" }} />
              <div>
                <div className="text-xs text-slate-400 font-semibold">TAG COLOUR</div>
                <div className="text-sm font-bold text-slate-800">{pinSelected.mob.tag}</div>
              </div>
            </div>
          )}
          {pinSelected.mob && (
            <button
              onClick={() => { setSelectedMobId(pinSelected.mob.id); setMobTab("Summary"); setPinSelected(null); }}
              className="w-full bg-red-900 text-white rounded-2xl py-3 font-bold"
            >
              View Mob Details
            </button>
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
            className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold"
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

              {/* Pin placement map */}
              <div className="mb-3">
                <div className="text-sm font-bold text-slate-700 mb-1">Pin location on map</div>
                <p className="text-xs text-slate-400 mb-2">Drag the 📍 pin to exactly where this landmark sits.</p>
                <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height: "200px" }}>
                  {googleMapsKey && !mapLoadError ? (
                    <GooglePaddockMap
                      paddocks={paddocks}
                      center={FARM_CENTERS[farmName] || FARM_CENTERS.Arundale}
                      onSelect={() => {}}
                      apiKey={googleMapsKey}
                      onError={() => setMapLoadError(true)}
                      mode="paddocks"
                      insightMode="outline"
                      paddockStats={{}}
                      landmarks={[]}
                      landmarkPinMode={true}
                      landmarkPinPos={landmarkPinPos}
                      onLandmarkPinMoved={(lat, lng) => setLandmarkPinPos({ lat, lng })}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white text-xs text-center p-2">
                      {landmarkPinPos
                        ? `📍 Pinned at ${landmarkPinPos.lat.toFixed(5)}, ${landmarkPinPos.lng.toFixed(5)}`
                        : "Add a Google Maps key (Settings) to place the pin accurately. Will default to farm centre."}
                    </div>
                  )}
                </div>
                {landmarkPinPos && (
                  <div className="text-xs text-amber-600 font-semibold mt-1">
                    📍 {landmarkPinPos.lat.toFixed(5)}, {landmarkPinPos.lng.toFixed(5)}
                    <button onClick={() => setLandmarkPinPos(null)} className="ml-2 text-slate-400">Reset</button>
                  </div>
                )}
              </div>

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
        <Modal title={landmarkEditMode ? "Edit Landmark" : (landmarkDetail.name || landmarkDetail.type)} onClose={() => { setLandmarkDetail(null); setLandmarkEditMode(false); }}>
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
              {canEdit && (
                <div className="space-y-2">
                  {landmarkDetail.type === "Gate" && landmarkDetail.paddockA && landmarkDetail.paddockB && (() => {
                    const gateKey = `${landmarkDetail.id}`;
                    const isOpen = openGates.includes(gateKey);
                    const paddockAData = paddocks.find(p => p.name === landmarkDetail.paddockA);
                    const paddockBData = paddocks.find(p => p.name === landmarkDetail.paddockB);
                    const combinedHa = (Number(paddockAData?.ha||0) + Number(paddockBData?.ha||0)).toFixed(1);
                    const mobsInA = mobs.filter(m => m.paddock === landmarkDetail.paddockA);
                    const mobsInB = mobs.filter(m => m.paddock === landmarkDetail.paddockB);
                    const combinedDSE = [...mobsInA, ...mobsInB].reduce((s,m) => s + m.count*(m.dse||0), 0);
                    const combinedDsePerHa = Number(combinedHa) > 0 ? (combinedDSE / Number(combinedHa)).toFixed(2) : "0.00";
                    return (
                      <div className="mb-3">
                        <button
                          onClick={() => {
                            setOpenGates(prev => isOpen ? prev.filter(g => g !== gateKey) : [...prev, gateKey]);
                            showToast(isOpen ? `Gate closed — paddocks separated` : `Gate opened — ${landmarkDetail.paddockA} and ${landmarkDetail.paddockB} merged`);
                          }}
                          className={`w-full rounded-2xl py-3 font-bold text-sm mb-2 ${isOpen ? "bg-yellow-400 text-yellow-900" : "bg-slate-100 text-slate-700"}`}
                        >
                          {isOpen ? "🟡 Gate OPEN — tap to close" : "🔘 Gate CLOSED — tap to open"}
                        </button>
                        {isOpen && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-sm">
                            <div className="font-bold text-yellow-800 mb-1">Combined paddock stats</div>
                            <div className="text-yellow-700">{landmarkDetail.paddockA} + {landmarkDetail.paddockB} · {combinedHa} ha combined</div>
                            <div className="font-extrabold text-yellow-900 text-lg mt-1">{combinedDsePerHa} DSE/ha</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button onClick={() => setLandmarkEditMode(true)} className="w-full bg-slate-100 text-slate-700 rounded-2xl py-3 font-bold text-sm">Edit Details</button>
                  <button
                    onClick={async () => {
                      const id = landmarkDetail.id;
                      setLandmarks((prev) => prev.filter((l) => l.id !== id));
                      setLandmarkDetail(null);
                      markChanged();
                      try {
                        await api.deleteLandmark(id);
                        showToast("Landmark removed");
                      } catch (err) {
                        showToast(err.message || "Couldn't remove landmark on the server");
                      }
                    }}
                    className="w-full bg-rose-50 text-rose-500 rounded-2xl py-3 font-bold text-sm"
                  >
                    Remove Landmark
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {paddockDetail && (() => {
        const paddockMobs = mobs.filter((m) => m.paddock === paddockDetail.name);
        const headCount = paddockMobs.reduce((s, m) => s + m.count, 0);
        const dseTotal = paddockMobs.reduce((s, m) => s + m.count * (m.dse || 0), 0);
        const dsePerHa = paddockDetail.ha ? dseTotal / paddockDetail.ha : 0;
        return (
          <Modal title={paddockEditMode ? "Edit Paddock" : paddockDetail.name} onClose={() => { setPaddockDetail(null); setPaddockEditMode(false); }}>
            {paddockEditMode ? (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Name</label>
                  <input value={paddockEditForm.name ?? paddockDetail.name} onChange={(e) => setPaddockEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Land use</label>
                  <select value={paddockEditForm.landUse ?? paddockDetail.landUse} onChange={(e) => setPaddockEditForm((f) => ({ ...f, landUse: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {LAND_USES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Pasture/crop type</label>
                  <select value={paddockEditForm.pasture ?? paddockDetail.pasture} onChange={(e) => setPaddockEditForm((f) => ({ ...f, pasture: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {PASTURE_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Total area (ha)</label>
                  <input type="number" value={paddockEditForm.ha ?? paddockDetail.ha} onChange={(e) => setPaddockEditForm((f) => ({ ...f, ha: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1">Paddock colour</label>
                  <select value={paddockEditForm.colour ?? paddockDetail.colour} onChange={(e) => setPaddockEditForm((f) => ({ ...f, colour: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white">
                    {PADDOCK_COLOURS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPaddockEditMode(false)} className="flex-1 border border-slate-200 rounded-2xl py-3 font-bold text-slate-500">Cancel</button>
                  <button
                    onClick={async () => {
                      const fields = {
                        name: paddockEditForm.name ?? paddockDetail.name,
                        landUse: paddockEditForm.landUse ?? paddockDetail.landUse,
                        pasture: paddockEditForm.pasture ?? paddockDetail.pasture,
                        ha: paddockEditForm.ha !== undefined ? Number(paddockEditForm.ha) : paddockDetail.ha,
                        colour: paddockEditForm.colour ?? paddockDetail.colour,
                      };
                      try {
                        const updated = await api.updatePaddock(paddockDetail.id, fields);
                        setPaddocks((prev) => prev.map((p) => p.id === paddockDetail.id ? updated : p));
                        setPaddockDetail(updated);
                        setPaddockEditMode(false);
                        setPaddockEditForm({});
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
              </div>
            ) : (
            <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-400 font-medium uppercase">{paddockDetail.landUse} · {paddockDetail.pasture}</div>
              {canEdit && (
                <button onClick={() => { setPaddockEditForm({}); setPaddockEditMode(true); }} className="text-xs font-bold text-red-950 bg-orange-50 px-3 py-1.5 rounded-full">Edit</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-xs text-slate-400 font-semibold">TOTAL AREA</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">{Number(paddockDetail.ha||0).toFixed(1)} ha</div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-xs text-slate-400 font-semibold">HEAD COUNT</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">{headCount.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-2xl p-4 text-white col-span-2">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Stocking Rate</div>
                <div className="text-2xl font-extrabold mt-1">{dsePerHa.toFixed(2)} DSE/ha</div>
                <div className="text-xs opacity-80 mt-1">{dseTotal.toLocaleString(undefined,{maximumFractionDigits:1})} total DSE ÷ {paddockDetail.ha} ha</div>
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
                {canEdit && (
                  <button
                    onClick={async () => {
                      const id = paddockDetail.id;
                      setPaddocks((prev) => prev.filter((p) => p.id !== id));
                      setPaddockDetail(null);
                      markChanged();
                      try {
                        await api.deletePaddock(id);
                        showToast("Paddock removed");
                      } catch (err) {
                        showToast(err.message || "Couldn't remove paddock on the server");
                      }
                    }}
                    className="w-full bg-rose-50 text-rose-500 rounded-2xl py-3 font-bold text-sm"
                  >
                    Remove Paddock
                  </button>
                )}
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
                setSprayInventory((prev) => [...prev, created]);
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
                setSprayInventory((prev) => [...prev, created]);
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

  // ── Workflow Screen — embeds the workflow HTML via iframe ─────────────────
  // Passes the JWT token to the iframe via postMessage so it can call our API
  const WorkflowScreen = () => {
    const iframeRef = React.useRef(null);

    React.useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const sendCreds = () => {
        try {
          iframe.contentWindow?.postMessage({
            type: "KW_INIT",
            apiBase: API_BASE_URL,
            token: getStoredToken() || "",
          }, "*");
        } catch (e) { /* cross-origin guard */ }
      };
      const onMsg = (e) => { if (e.data?.type === "KW_WORKFLOW_READY") sendCreds(); };
      window.addEventListener("message", onMsg);
      iframe.addEventListener("load", sendCreds);
      return () => {
        window.removeEventListener("message", onMsg);
        iframe.removeEventListener("load", sendCreds);
      };
    }, []);

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
          style={{ height: "calc(100vh - 52px)", minHeight: 600 }}
        />
      </div>
    );
  };

  // ── Cattle Feeding Screen ─────────────────────────────────────────────────
  const CattleFeedingScreen = () => {
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
        <div className="pb-24 bg-slate-50 min-h-screen">
          <div className="bg-red-950 text-white px-5 py-4 flex items-center gap-3">
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
        <div className="pb-24 bg-slate-50 min-h-screen">
          <div className="bg-red-950 text-white px-5 py-4 flex items-center gap-3">
            <button onClick={() => setCattleTab("loads")} className="text-white/70">← Back</button>
            <h1 className="text-lg font-bold flex-1">Cattle Management</h1>
          </div>
          <div className="flex gap-1 px-4 pt-4 pb-2 overflow-x-auto">
            {["elements","classes","mobs","loads"].map(t => (
              <button key={t} onClick={() => setManageTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${manageTab===t ? "bg-red-950 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
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
      <div className="pb-24 bg-slate-50 min-h-screen">
        <div className="bg-red-950 text-white px-5 pt-6 pb-8">
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
  };

  // ── Sheep Feeding Screen ──────────────────────────────────────────────────
  const SheepFeedingScreen = () => {
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
      <div className="pb-24 bg-slate-50 min-h-screen">
        <div className="bg-slate-800 text-white px-5 pt-6 pb-8">
          <button onClick={() => setTab("home")} className="text-white/70 text-sm mb-3 flex items-center gap-1">← Home</button>
          <div className="text-3xl mb-1">🐑</div>
          <div className="text-2xl font-bold tracking-tight">Sheep Feeding System</div>
          <div className="text-white/70 text-sm mt-1">Pen feed runs & grain rosters</div>
        </div>
        <div className="flex gap-1 px-4 -mt-4 mb-3 overflow-x-auto">
          {[{id:"run",label:"🏃 Feed Run"},{id:"pens",label:"🐑 Pens"},{id:"history",label:"📋 History"}].map(t => (
            <button key={t.id} onClick={() => setSheepTab(t.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold flex-shrink-0 shadow-sm ${sheepTab===t.id ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
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
                        className={`px-4 py-1.5 rounded-full text-xs font-bold ${runPeriod===p ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
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
                }} className="w-full bg-slate-800 text-white rounded-2xl py-3.5 font-bold">
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
                  }} className="w-full bg-slate-800 text-white rounded-2xl py-2.5 font-bold text-sm">Add Pen</button>
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
  };

  const LivestockScreen = () => (
    <div className="pb-24 bg-slate-50 min-h-screen">
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
      <div className="pb-24 bg-slate-50 min-h-screen">
        <div className="bg-white/80 backdrop-blur-md flex items-center px-4 py-4 sticky top-0 z-10 border-b border-slate-100">
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
              {h.detail && <div className="text-sm text-slate-400 mt-1">{h.detail}</div>}
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
      case "Rams": return m.type === "Rams";
      case "Bulls": return m.type === "Bulls";
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
    <button key={m.id} onClick={() => { setSelectedMobId(m.id); setMobTab("Summary"); }} className="w-full flex items-center justify-between px-4 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-left active:scale-[0.99] transition-transform">
      <div>
        <div className="font-bold text-slate-800">{m.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
        <div className="text-xs text-red-950 font-semibold mt-1">{m.paddock} paddock · {m.dse} DSE/hd</div>
        {m.whp > 0 && <div className="text-xs text-rose-500 font-semibold mt-0.5">WHP {m.whp}d</div>}
      </div>
      <div className="text-xl font-extrabold text-slate-700">{m.count}</div>
    </button>
  );

  const MobListScreen = () => (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <div className="bg-white/80 backdrop-blur-md flex items-center px-4 py-4 sticky top-0 z-10 border-b border-slate-100">
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
        {groupedMobs.map((g, gi) => (
          <div key={gi}>
            {g.key && (
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">{g.key} ({g.items.reduce((s, m) => s + m.count, 0)})</div>
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
    if (field.type === "select") {
      let options = field.options;
      if (field.label === "Merge into mob") {
        options = mobs.filter((m) => m.id !== selectedMobId).map((m) => m.name);
      } else if (field.label === "Treatment") {
        options = inventory.map((i) => i.title);
      } else if (field.label === "Transfer to property") {
        options = Object.keys(farmsMobs).filter((f) => f !== farmName);
      } else if (field.label === "Move to paddock") {
        options = paddocks.map((p) => p.name);
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
          <button className="text-slate-400 text-sm font-semibold" onClick={() => setSelectedMobId(null)}>CLOSE</button>
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
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="text-xs text-slate-400 font-semibold">PADDOCK</div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">{selectedMob.paddock}</div>
                </div>
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
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3">
                  <div className="flex justify-between font-bold text-slate-800"><span>{h.action}</span><span className="text-slate-400 text-xs">{h.date}</span></div>
                  {h.detail && <div className="text-sm text-slate-400 mt-1">{h.detail}</div>}
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
              <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete "{selectedMob.name}"? This cannot be undone.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {ACTION_FIELDS[actionForm]?.map((f) => (
                  <div key={f.label}>
                    <label className="text-sm font-semibold text-slate-600 block mb-1">{f.label}</label>
                    {renderField(f)}
                  </div>
                ))}
              </div>
            )}
            <button onClick={submitAction} className={`w-full rounded-2xl py-3.5 font-bold text-white ${actionForm === "Delete" ? "bg-rose-500" : "bg-red-900"}`}>
              {actionForm === "Delete" ? "Delete Mob" : "Save"}
            </button>
          </Modal>
        )}
      </div>
    );
  };

  const MenuScreen = () => (
    <div className="fixed inset-0 z-30 flex max-w-md mx-auto">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => { setShowMenu(false); setInventoryView(null); }} />
      <div className="w-[82%] bg-white flex flex-col">
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
          <button onClick={() => setShowFarmSubmenu(true)} className="w-full flex items-center justify-between px-3 py-3.5 rounded-2xl active:bg-slate-50">
            <span className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-red-950"><Home size={16} /></div>
              <span className="font-semibold text-slate-700">Farm</span>
            </span>
            <ChevronRight size={16} className="text-slate-300" />
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
            {["Arundale", "Hamilton", "Kurra-Wirra", "Mooralla", "Carramar"].map((f) => (
              <button key={f} onClick={() => {
                setFarmName(f);
                // Clear the new farm's stale data immediately so nothing leaks in while the API re-fetches
                setFarmsMobs((prev) => ({ ...prev, [f]: [] }));
                setFarmsPaddocks((prev) => ({ ...prev, [f]: [] }));
                setFarmsLandmarks((prev) => ({ ...prev, [f]: [] }));
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
              {activeList.map((it) => (
                <button key={it.id} onClick={() => setInventoryView(it.id)} className="w-full flex items-center justify-between py-3 border-b border-slate-100 text-left">
                  <div>
                    <div className="font-bold text-slate-800">{it.title}</div>
                    {it.treatmentDate && <div className="text-xs text-amber-600">{it.treatmentDate} · {it.location}</div>}
                    {it.expiryDate && !it.treatmentDate && <div className="text-xs text-slate-400">Expires {it.expiryDate}</div>}
                  </div>
                  <span className="text-slate-500 text-sm font-semibold">{it.numContainers} {it.containerUnit}</span>
                </button>
              ))}
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
                try {
                  if (isTreatment) {
                    const created = await api.addTreatment(farmName, inventoryForm);
                    setInventory((prev) => [...prev, created]);
                  } else {
                    const created = await api.addSprayInventory(farmName, inventoryForm);
                    setSprayInventory((prev) => [...prev, created]);
                  }
                  setInventoryView(null);
                  markChanged();
                  showToast(`${isTreatment ? "Treatment" : "Spray chemical"} added`);
                } catch (err) {
                  showToast(err.message || "Couldn't save to the server");
                }
              }}
              className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold"
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
            <div className="space-y-2 mb-4">
              {fields.filter((f) => f.key !== "title" && item[f.key]).map((f) => (
                <div key={f.key} className="flex justify-between border-b border-slate-100 py-2 text-sm">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">{item[f.key]}</span>
                </div>
              ))}
            </div>
            {canEdit && (
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
                className="w-full bg-rose-500 text-white rounded-2xl py-3 font-bold"
              >
                Remove Record
              </button>
            )}
          </Modal>
        );
      })()}

      {showRainfall && (() => {
        const sortedRainfall = [...rainfall].sort((a, b) => (a.date < b.date ? 1 : -1));
        return (
          <Modal title="Rainfall Records" onClose={() => { setShowRainfall(false); setRainfallForm({}); }}>
            <div className="space-y-2 mb-4">
              {sortedRainfall.length === 0 && <p className="text-slate-400 text-sm py-2">No rainfall recorded yet.</p>}
              {sortedRainfall.map((r) => (
                <div key={r.id} className="flex justify-between border-b border-slate-100 py-2">
                  <span className="text-slate-600">{r.date}</span><span className="font-bold text-slate-800">{r.mm}mm</span>
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
        dse: newMobForm.dse ? Number(newMobForm.dse) : (species === "Sheep" ? 1.5 : 6),
        species,
        type: ageOptions?.includes(newMobForm.ageClass) ? newMobForm.ageClass : (species === "Sheep" ? "Ewes" : "Cows"),
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
        <div className="bg-slate-800 text-white flex items-center justify-between px-4 py-4">
          <button onClick={() => { setShowAddMob(false); setEditingMobId(null); }} className="text-sm font-semibold text-slate-300">CANCEL</button>
          <h1 className="text-base font-bold">{editingMobId ? "Edit Mob" : "Add Mob"}</h1>
          <div className="w-14" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Species *</label>
            <div className="flex gap-3">
              {["Cattle", "Sheep"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateNewMob("species", s)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-semibold ${species === s ? "border-red-900 bg-amber-200 text-red-950" : "border-slate-200 bg-white text-slate-600"}`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 ${species === s ? "border-red-900 bg-red-900" : "border-slate-300"}`} />
                  {s}
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
            <input value={newMobForm.mgmtGroup || ""} onChange={(e) => updateNewMob("mgmtGroup", e.target.value)} placeholder="e.g. Breeders" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
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
            <input type="number" value={newMobForm.dse || ""} onChange={(e) => updateNewMob("dse", e.target.value)} placeholder={species === "Sheep" ? "e.g. 1.5" : "e.g. 6"} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
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
              {paddocks.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
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
      <div className="max-w-md mx-auto min-h-screen bg-red-950 flex flex-col items-center justify-center">
        <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="w-48 rounded-xl shadow-2xl" />
      </div>
    );
  }

  if (locked && loggedInEmail) {
    return (
      <div className="max-w-md mx-auto min-h-screen font-sans bg-gradient-to-br from-red-950 to-amber-600 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-red-950 flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
            {(currentUser.name || currentUser.email)[0].toUpperCase()}
          </div>
          <div className="text-lg font-extrabold text-slate-800">Welcome back</div>
          <div className="text-sm text-slate-400 mb-6">{currentUser.name} · {currentUser.email}</div>
          <button onClick={() => setLocked(false)} className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold">Continue</button>
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
      <div className="max-w-md mx-auto min-h-screen font-sans bg-gradient-to-br from-red-950 to-amber-600 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full p-6">
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
            onClick={async () => {
              const email = loginEmail.trim().toLowerCase();
              if (!email || !loginPassword) { setLoginError("Please enter your email and password."); return; }
              setLoginError("");
              try {
                const { token, account } = await api.login(email, loginPassword);
                setAuthToken(token);
                setCurrentAccount(account);
                setLoggedInEmail(account.email);
                setLoginPassword("");
              } catch (err) {
                setLoginError(err.message || "Couldn't sign in. Please try again.");
              }
            }}
            className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold mt-2"
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
    <div className="hidden md:flex flex-col w-56 min-h-screen bg-red-950 text-white fixed left-0 top-0 bottom-0 z-30">
      <div className="px-4 py-6 border-b border-red-900">
        <img src={LOGO_DATA_URI} alt="Kurra-Wirra" className="w-full rounded-lg" />
        <div className="text-xs text-white/60 mt-2 text-center">{farmName}</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === id ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-red-900">
        <button onClick={() => setShowMenu(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white">
          <span className="text-base">☰</span>
          Menu
          {(syncCount + pendingChanges) > 0 && (
            <span className="ml-auto bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{syncCount + pendingChanges}</span>
          )}
        </button>
        <div className="text-xs text-white/40 px-3 pt-2">{currentUser.name} · {currentUser.role}</div>
      </div>
    </div>
  );

  return (
    <div className="md:flex min-h-screen bg-slate-100">
      <DesktopSidebar />
      <div className="md:ml-56 flex-1">
    <div className="max-w-md md:max-w-none mx-auto bg-white min-h-screen font-sans relative">
      {tab === "home" && HomeScreen()}
      {tab === "map" && MapScreen()}
      {tab === "livestock" && LivestockScreen()}
      {tab === "moblist" && MobListScreen()}
      {tab === "mobactivity" && MobActivityScreen()}
      {tab === "workflow" && WorkflowScreen()}
      {tab === "cattle_feeding" && CattleFeedingScreen()}
      {tab === "sheep_feeding" && SheepFeedingScreen()}
      <div className="md:hidden"><BottomNav /></div>
      {selectedMob && MobDetails()}
      {showMenu && MenuScreen()}
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
                    setFarmsMobs((prev) => ({ ...prev, [name]: [] }));
                    setFarmsPaddocks((prev) => ({ ...prev, [name]: [] }));
                    setFarmsLandmarks((prev) => ({ ...prev, [name]: [] }));
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

          <div className="text-sm font-bold text-slate-700 mb-2">Team members</div>
          <div className="space-y-2 mb-4">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{a.name || a.email}</div>
                  <div className="text-xs text-slate-400">{a.email}</div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={a.role}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        setAccounts((prev) => prev.map((acc) => acc.id === a.id ? { ...acc, role: newRole } : acc));
                        try {
                          await api.updateAccount(a.id, { role: newRole });
                        } catch (err) {
                          showToast(err.message || "Couldn't update role");
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
                      showToast("Invite sent — default password is \"password\"");
                    } catch (err) {
                      showToast(err.message || "Couldn't send invite");
                    }
                  }}
                  className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold"
                >
                  Send Invite
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
            className="w-full bg-red-900 text-white rounded-2xl py-3.5 font-bold"
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
