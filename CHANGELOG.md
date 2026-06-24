# Kurra-Wirra Farm App — Change Log & Known-Good Fixes

## Critical Patterns (DO NOT BREAK)

### 1. Menu navigation (Records, Paddock List, Rainfall)
- **Fix**: `pendingMenuAction` ref + `useEffect([showMenu])` pattern
- Buttons set `pendingMenuAction.current = "records"` then call `setShowMenu(false)`
- Effect fires AFTER menu unmounts, then opens the modal
- **Never** call `setTab("home")` from menu buttons — unnecessary and causes flash

### 2. Map overlay button (🗺)
- **Fix**: Rendered at App level as fixed-position button, NOT inside `MapScreen()`
- `MapScreen` is an inline function `const MapScreen = () => (...)` — buttons inside it don't batch state properly
- The overlay button lives outside `MapScreen` entirely

### 3. Gate open/close
- **Fix**: `renderAllLandmarks(zoom, freshOpenGateIds)` accepts fresh openGateIds as parameter
- Avoids stale closure — `openGateIds` is passed directly, not captured from outer scope
- `mapInstanceRef.current.currentOpenGateIds` always kept up to date
- `e.stopPropagation()` on gate toggle button

### 4. Map zoom-out on background sync
- **Fix**: `mobs` removed from main map `useEffect` deps
- Mob markers updated via separate effect `[mobs, mode]` using `ref.mobOverlays`
- Main effect only reruns on `[paddocks, center, apiKey, mode, drawMode, userLocation, landmarkPinMode]`

### 5. Paddock labels (name + ha on separate lines)
- **Fix**: Single canvas-rendered marker — `updateLabelForZoom(g, map, centroid, p, ref, zoom, currentInsightMode, currentPaddockStats)`
- Both insightMode and paddockStats passed as parameters (not closure) to avoid stale values
- Badge shows at zoom >= 14 (not 15)

### 6. Insight mode (FOO/DSE/ha labels on map)
- **Fix**: `insightMode` effect redraw labels AND update polygon colours
- `ref.currentInsightMode` and `ref.currentPaddockStats` always kept current on ref
- Zoom-change listener reads from ref: `mapInstanceRef.current?.currentInsightMode`

### 7. homeFarm state (farm dashboard)
- **Fix**: `homeFarm` and `setHomeFarm` live at App level (not inside HomeScreen)
- HomeScreen receives them as props
- Prevents reset when App re-renders due to modal state changes

### 8. Modal z-indexes
- Records screen: `z-[150]`
- Paddock list: `z-[150]`
- Insight picker: `z-[200]`
- Mob move sheet: `z-[300]`
- Modal component: `z-[250]`
- Menu: `z-[100]`

### 9. Delete confirmations (two-step)
- Paddock: only in edit mode, uses `confirmPaddockDel` App-level state (NOT useState in IIFE)
- Landmark: only in edit mode, uses `confirmLmDel` App-level state
- Mob: requires typing mob name to confirm
- `useState` must NEVER be called inside `(() => { ... })()` inline IIFEs

### 10. Mob click on livestock map
- **Fix**: Click listeners added in BOTH the main map effect AND the separate mob overlay effect
- Separate effect uses `onSelectPinRef` (a ref) so callbacks are always fresh

---

## Workflow HTML Fixes

### 1. Always view-only by default
- `isAdmin = false` always on KW_INIT — never set from role
- Login via 🔒 button + password `admin` to get edit access

### 2. Date timezone fix
- `getVisibleTasks()` parses dates as local: `new Date(year, month-1, day)` not `new Date(isoString)`
- `isoString` is treated as UTC which shifts the day in AU timezone

### 3. Workflow blank on mobile
- Boot `loadState()` skipped when embedded (iframe) — waits for `KW_INIT` with token
- `isEmbedded = window.self !== window.top` check
- KW_INIT handler calls `loadState().then(render).then(startAutoRefresh)`

### 4. Mobile week calendar
- Default `mobileViewMode = "cal"` 
- `body.m-cal .desktop-grid { display: flex }` — requires m-cal class on body
- `applyMobileViewClass()` called at start of `render()`
- `visibleDays()` never returns empty array — always shows at least current/future days

### 5. Drag and drop (desktop)
- `dragFromHandle` boolean flag set on handle `mousedown`, checked in `dragstart`
- `e.target.closest()` does NOT work in dragstart (e.target is the draggable div, not the handle)

### 6. Touch drag (mobile)
- `touchmove` and `touchend` on `document` level (not on the handle element)
- Handle `touchstart` calls `e.preventDefault()` to block iOS text selection

---

## Role Permissions
- **Admin**: full app access, workflow edit via password
- **Manager**: same as Worker in app UI, view-only workflow
- **Worker**: can record Treat, Weigh, Recount, WEC, Score, Death, Sale
- Workflow: everyone sees view-only; Admin password unlocks edit mode

---

## Key Architecture
- Single `App.jsx` (~6000 lines) — all screens are inline functions inside App()
- `MapScreen`, `LivestockScreen`, `MobListScreen`, `MenuScreen` are `const X = () => (...)` inside App
  - Called as `X()` not `<X />` — React has no component boundary
  - State updates from buttons inside these DON'T batch normally
  - Fix pattern: use refs + effects, or lift state/handlers to App level
- `WeatherWidget`, `MyScheduleWidget`, `HomeScreen`, `WorkflowScreen` are proper top-level components
- Backend: Express + Drizzle ORM + PostgreSQL on Render
- Deploy: GitHub Desktop push → Render auto-deploys (2-3 min)

---

## Farms & Coordinates
- Arundale: [-37.21, 141.62]
- Hamilton: [-37.745, 142.02]  
- Kurra-Wirra: [-36.95, 141.85]
- Mooralla: [-37.36, 141.65]
- Carramar: [-37.10, 141.75]

