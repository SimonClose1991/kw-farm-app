// The tool loop: send the conversation to Claude, run whatever read tools it asks for, queue any
// propose_ cards, and stop when it gives a final answer. `client` is an Anthropic SDK client
// (injected so tests can point it at a fake server).
import { ALL_HANDLERS, toolsFor } from "./tools.js";
import { ProposalError } from "./proposals.js";
import { SYSTEM_STABLE, dynamicContext } from "./prompt.js";

const MAX_RESULT_CHARS = 14000;
const clip = (obj) => {
  const s = JSON.stringify(obj);
  return s.length > MAX_RESULT_CHARS ? s.slice(0, MAX_RESULT_CHARS) + '… (cut off — narrow the search)' : s;
};

export async function runAssistant({ client, model, effort = "medium", messages, ctx, canAct, user, context, maxRounds = 6, maxTokens = 4096 }) {
  const tools = toolsFor(canAct);
  const allowed = new Set(tools.map((t) => t.name));
  const system = [
    { type: "text", text: SYSTEM_STABLE, cache_control: { type: "ephemeral" } },
    { type: "text", text: dynamicContext({ today: ctx.today, user, farms: ctx.farms, context, canAct }) },
  ];
  const msgs = messages.map((m) => ({ role: m.role, content: m.content }));
  const proposals = [];
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, rounds: 0 };

  for (let round = 0; round < maxRounds; round++) {
    const resp = await client.messages.create({
      model, max_tokens: maxTokens, system, tools, messages: msgs,
      output_config: { effort },
    });
    usage.rounds++;
    usage.input += resp.usage?.input_tokens || 0;
    usage.output += resp.usage?.output_tokens || 0;
    usage.cacheRead += resp.usage?.cache_read_input_tokens || 0;
    usage.cacheWrite += resp.usage?.cache_creation_input_tokens || 0;

    const text = (resp.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (resp.stop_reason === "refusal") return { reply: "I can't help with that one.", proposals, usage };
    if (resp.stop_reason === "max_tokens") return { reply: text || "That answer got too long — try asking for less at once.", proposals, usage };
    if (resp.stop_reason !== "tool_use") return { reply: text || "Done.", proposals, usage };

    msgs.push({ role: "assistant", content: resp.content });
    const results = [];
    for (const block of (resp.content || []).filter((b) => b.type === "tool_use")) {
      let content, isError = false;
      try {
        if (!allowed.has(block.name) || !ALL_HANDLERS[block.name]) throw new ProposalError(`${block.name} isn't available`);
        const out = await ALL_HANDLERS[block.name](ctx, block.input || {});
        if (block.name.startsWith("propose_")) {
          // Skip an exact repeat of a card that's already queued
          const dup = proposals.find((p) => p.type === out.type && JSON.stringify(p.data) === JSON.stringify(out.data));
          if (!dup) proposals.push(out);
          content = JSON.stringify({ ok: true, queued: out.title, note: "Waiting for the user to tap Confirm — nothing is saved yet." });
        } else {
          content = clip(out);
        }
      } catch (err) {
        isError = true;
        content = err instanceof ProposalError ? err.message : "That lookup failed — try again or ask differently.";
        if (!(err instanceof ProposalError)) console.error(`assistant tool ${block.name} failed:`, err);
      }
      results.push({ type: "tool_result", tool_use_id: block.id, content, ...(isError ? { is_error: true } : {}) });
    }
    msgs.push({ role: "user", content: results });
  }
  return { reply: "That needed too many steps. Try asking for one thing at a time.", proposals, usage };
}
