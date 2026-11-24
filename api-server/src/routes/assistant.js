import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/index.js";
import { assistantRouter } from "../assistant/handler.js";

// One shared client; the key comes from ANTHROPIC_API_KEY on the server (never from the app)
let client = null;
const getClient = () => (client ||= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 60_000 }));

export default assistantRouter({ db, getClient });
