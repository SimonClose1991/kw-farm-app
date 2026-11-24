// Tool definitions the model sees. Read tools answer questions; propose_* tools only queue a card
// for the user to confirm (see proposals.js). Descriptions are written for the model — keep them plain.
import { READ_HANDLERS } from "./readTools.js";
import { PROPOSE_HANDLERS } from "./proposals.js";

const str = (description) => ({ type: "string", description });
const int = (description) => ({ type: "integer", description });
const date = { type: "string", description: "yyyy-mm-dd. Leave out for today." };
const obj = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });

export const READ_TOOLS = [
  { name: "find_mobs", description: "Search the live (non-archived) mobs. Use this to find a mob's id before get_mob or any propose_ tool, and to answer 'what's in paddock X' / 'where are the ewes'. All filters are optional and combine; matching is loose (case-insensitive, partial).",
    input_schema: obj({ query: str("Words from the mob's name, species, breed, age class or paddock, e.g. 'merino ewes'"), paddock: str("Paddock name or part of it"), species: str("Sheep, Cattle, Rams, Bulls…"), farm: str("Farm name, if the user named one") }) },
  { name: "get_mob", description: "Full details and the last 20 history entries for one mob id.", input_schema: obj({ mob_id: int("Mob id from find_mobs") }, ["mob_id"]) },
  { name: "list_paddocks", description: "Paddocks with their size and the mobs currently in them. Use it to check exact paddock names.", input_schema: obj({ farm: str("Farm name (optional)") }) },
  { name: "farm_summary", description: "Head count by species for every farm the user can see, right now.", input_schema: obj({}) },
  { name: "withholding_status", description: "Mobs that are currently in a meat, ESI or wool withholding period, with the date each clears.", input_schema: obj({ farm: str("Farm name (optional)") }) },
  { name: "list_inventory", description: "Stock lists. kind 'treatment' = animal treatments (drenches etc., with withholding periods and stock left); kind 'spray' = spray chemicals.", input_schema: obj({ kind: { type: "string", enum: ["treatment", "spray"] }, farm: str("Farm name (optional)") }, ["kind"]) },
  { name: "spray_records", description: "Spray / bait treatments recorded against paddocks, newest first.", input_schema: obj({ paddock: str("Paddock name (optional)"), since: str("yyyy-mm-dd (optional)"), farm: str("Farm name (optional)") }) },
  { name: "rainfall_summary", description: "Rainfall totals and recent readings per farm for a date range.", input_schema: obj({ from: str("yyyy-mm-dd (optional)"), to: str("yyyy-mm-dd (optional)"), farm: str("Farm name (optional)") }) },
  { name: "mob_count_on_date", description: "How many head were on hand at the end of a past date, rebuilt from each mob's recount/death/sale/split history. It is an estimate: the result says which mobs could only be estimated, so pass that on to the user.", input_schema: obj({ date: str("yyyy-mm-dd, today or earlier"), species: str("Optional species filter, e.g. Sheep"), farm: str("Optional farm name") }, ["date"]) },
];

export const PROPOSE_TOOLS = [
  { name: "propose_death", description: "Line up a death record for one mob (reduces its head count). Does NOT save — the user confirms a card first.", input_schema: obj({ mob_id: int("Mob id"), count: int("Number that died"), cause: str("Cause if the user said (e.g. 'fly strike', 'unknown')"), date }, ["mob_id", "count"]) },
  { name: "propose_recount", description: "Line up a recount: set a mob's head count to the number the user counted. 0 archives the mob. Does NOT save.", input_schema: obj({ mob_id: int("Mob id"), new_count: int("The new head count"), date }, ["mob_id", "new_count"]) },
  { name: "propose_move", description: "Line up moving a WHOLE mob to another paddock. Does NOT save.", input_schema: obj({ mob_id: int("Mob id"), to_paddock: str("Destination paddock name"), date }, ["mob_id", "to_paddock"]) },
  { name: "propose_split", description: "Line up splitting some head off a mob and moving just those to another paddock (the rest stay). Does NOT save.", input_schema: obj({ mob_id: int("Mob id"), count: int("How many to split off"), to_paddock: str("Destination paddock name"), date }, ["mob_id", "count", "to_paddock"]) },
  { name: "propose_sale", description: "Line up a sale record (reduces the head count). Does NOT save.", input_schema: obj({ mob_id: int("Mob id"), count: int("Number sold"), price_per_head: { type: "number", description: "$ per head if the user said" }, date }, ["mob_id", "count"]) },
  { name: "propose_weigh", description: "Line up a weigh record: the mob's average weight in kg. Does NOT save.", input_schema: obj({ mob_id: int("Mob id"), average_weight_kg: { type: "number", description: "Average weight per head in kg" }, date }, ["mob_id", "average_weight_kg"]) },
  { name: "propose_treat", description: "Line up an animal treatment (drench, vaccine…) for a mob using product(s) from the treatment inventory; withholding periods come from the product. Does NOT save. Only give total_used if the user stated the amount.", input_schema: obj({ mob_id: int("Mob id"), products: { type: "array", items: { type: "string" }, description: "Product name(s) or inventory id(s) from list_inventory" }, date, notes: str("Short note if the user gave one"), total_used: { type: "number", description: "Total amount used, only if stated, single product only" }, unit: str("Unit for total_used, e.g. mL or L") }, ["mob_id", "products"]) },
  { name: "propose_rainfall", description: "Line up a rainfall reading for a farm. Does NOT save.", input_schema: obj({ farm: str("Farm name"), mm: { type: "number", description: "Millimetres of rain" }, date }, ["farm", "mm"]) },
];

export const ALL_HANDLERS = { ...READ_HANDLERS, ...PROPOSE_HANDLERS };

// Editors (Admin / Manager) may queue actions; everyone else can only ask questions
export const toolsFor = (canAct) => (canAct ? [...READ_TOOLS, ...PROPOSE_TOOLS] : READ_TOOLS);
