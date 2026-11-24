// Farm assistant: a 💬 button (bottom-right) that opens a chat you can type or speak to.
// It answers questions about the farm and lines up changes as CARDS — nothing is saved until you
// tap Confirm on the card. See api-server/src/assistant for the other half.
import React, { useEffect, useRef, useState } from "react";
import { executeProposal } from "./assistantActions.js";

const SPEAK_KEY = "kw_assistant_speak";
const getSpeechRec = () => (typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null);

const ASK_EXAMPLES = ["How many sheep do I have?", "Which mobs are in withholding?", "What's in this paddock?", "How much rain this month?"];
const DO_EXAMPLES = ["A ewe died in North Flat", "Move these to the next paddock", "Recount this mob to 125", "Drench this mob with Zolvex"];

// What the model should see for a past assistant turn, including what happened to its cards
const toApiText = (m) => {
  if (m.role !== "assistant" || !m.cards?.length) return m.content;
  const status = (c) => (c.status === "done" ? "CONFIRMED and saved" : c.status === "cancelled" ? "cancelled by the user" : c.status === "error" ? `FAILED: ${c.error}` : "still waiting for the user");
  return `${m.content}\n[Cards: ${m.cards.map((c) => `${c.card.title} — ${status(c)}`).join("; ")}]`;
};

function CardView({ c, onConfirm, onCancel, busy }) {
  const { card, status } = c;
  const [head, ...rest] = card.lines;
  return (
    <div className={`rounded-2xl border p-3 mt-2 ${card.warn ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"} ${status === "cancelled" ? "opacity-50" : ""}`}>
      <div className="text-xs font-bold uppercase tracking-wide text-red-900 mb-1">{card.title}</div>
      <div className="text-xs text-slate-500 mb-1">{head}</div>
      {rest.map((l, i) => (
        <div key={i} className={i === 0 && /→/.test(l) ? "text-lg font-extrabold text-slate-800 leading-snug" : "text-sm text-slate-600"}>{l}</div>
      ))}
      {status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button onClick={onCancel} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-[2] py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm disabled:opacity-50">Confirm</button>
        </div>
      )}
      {status === "running" && <div className="text-sm text-slate-500 mt-2">Saving…</div>}
      {status === "done" && <div className="text-sm font-semibold text-green-700 mt-2">✓ {c.result}</div>}
      {status === "error" && <div className="text-sm font-semibold text-red-700 mt-2">✕ {c.error}</div>}
      {status === "cancelled" && <div className="text-xs text-slate-500 mt-2">Cancelled</div>}
    </div>
  );
}

export default function Assistant({ api, canAct, context, onChanged, mapTab = false }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);       // { enabled, canAct } | { error }
  const [items, setItems] = useState([]);           // transcript
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [micState, setMicState] = useState("");     // "" | "starting" | "listening"
  const listening = micState === "listening";
  const [speak, setSpeak] = useState(() => { try { return localStorage.getItem(SPEAK_KEY) === "1"; } catch { return false; } });
  const [note, setNote] = useState("");
  const endRef = useRef(null);
  const recRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const busyRef = useRef(false);
  const lastSentRef = useRef({ text: "", at: 0 });
  const [vv, setVv] = useState(null);                 // the part of the screen that's actually visible (above the keyboard)

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [items, busy, open]);

  // Is the assistant switched on at the server? Checked every time the sheet opens, so adding the
  // key (or getting back into signal) takes effect without reloading the app.
  useEffect(() => {
    if (!open) return;
    let live = true;
    api.assistantStatus().then((s) => live && setStatus(s)).catch((e) => live && setStatus({ error: e.message || "Couldn't reach the server" }));
    return () => { live = false; };
  }, [open, api]);

  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const v = window.visualViewport;
    const upd = () => setVv({ h: Math.round(v.height), top: Math.round(v.offsetTop) });
    upd();
    v.addEventListener("resize", upd); v.addEventListener("scroll", upd);
    return () => { v.removeEventListener("resize", upd); v.removeEventListener("scroll", upd); };
  }, [open]);

  useEffect(() => () => { try { dropRecogniser(); window.speechSynthesis?.cancel(); } catch {} }, []);

  const say = (t) => {
    if (!speak || !window.speechSynthesis) return;
    try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "en-AU"; window.speechSynthesis.speak(u); } catch {}
  };
  const toggleSpeak = () => { const v = !speak; setSpeak(v); try { localStorage.setItem(SPEAK_KEY, v ? "1" : "0"); } catch {} if (!v) { try { window.speechSynthesis?.cancel(); } catch {} } };

  const send = async (raw) => {
    const content = String(raw ?? text).trim();
    if (!content || busyRef.current) return;
    // Speech recognition can call back twice for one utterance — the same words within a few seconds are one message
    const now = Date.now();
    if (content === lastSentRef.current.text && now - lastSentRef.current.at < 5000) return;
    lastSentRef.current = { text: content, at: now };
    busyRef.current = true;
    setText(""); setNote("");
    const next = [...itemsRef.current, { role: "user", content }];
    setItems(next); setBusy(true);
    try {
      const messages = next.slice(-12).map((m) => ({ role: m.role, content: toApiText(m) }));
      const res = await api.assistantChat({ messages, context });
      const cards = (res.proposals || []).map((card) => ({ card, status: "pending" }));
      setItems((prev) => [...prev, { role: "assistant", content: res.reply || "Done.", cards }]);
      say(res.reply);
    } catch (err) {
      setItems((prev) => [...prev, { role: "assistant", content: err.message || "Something went wrong — try again.", error: true }]);
    } finally { busyRef.current = false; setBusy(false); }
  };

  const patchCard = (mi, ci, patch) => setItems((prev) => prev.map((m, i) => (i !== mi ? m : { ...m, cards: m.cards.map((c, j) => (j === ci ? { ...c, ...patch } : c)) })));

  const confirmCard = async (mi, ci) => {
    const c = itemsRef.current[mi]?.cards?.[ci];
    if (!c || c.status !== "pending") return true;
    patchCard(mi, ci, { status: "running" });
    try {
      const result = await executeProposal(c.card, { api });
      patchCard(mi, ci, { status: "done", result });
      onChanged?.([c.card.farm]);
      return true;
    } catch (err) {
      patchCard(mi, ci, { status: "error", error: err.message || "Couldn't save that" });
      return false;
    }
  };
  const confirmAll = async (mi) => {
    const cards = itemsRef.current[mi].cards;
    for (let ci = 0; ci < cards.length; ci++) {
      if (cards[ci].status !== "pending") continue;
      if (!(await confirmCard(mi, ci))) break;      // stop at the first problem
    }
  };

  // ── Voice ──
  // Phone speech engines are touchy: slow to start, quick to give up, and an iPhone may keep the
  // microphone "busy" after the first use. So each turn (1) throws away the previous recogniser and lets
  // the phone release the mic, (2) shows "starting" until it really is listening, (3) never gets stuck —
  // a watchdog resets the button if the phone forgets to say it has finished, and (4) says what went wrong.
  const micRef = useRef({ rec: null, timers: [] });
  const clearMicTimers = () => { micRef.current.timers.forEach(clearTimeout); micRef.current.timers = []; };
  const dropRecogniser = () => {
    const r = micRef.current.rec; micRef.current.rec = null; clearMicTimers();
    if (!r) return false;
    r.onstart = r.onaudiostart = r.onresult = r.onerror = r.onend = null;
    try { r.abort(); } catch { try { r.stop(); } catch {} }
    return true;
  };
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const toggleMic = () => {
    const SpeechRec = getSpeechRec();
    if (!SpeechRec) { setNote("Voice isn't available in this browser — tap the 🎤 on your keyboard to dictate instead."); return; }
    const cur = micRef.current;
    // Tap while it's listening = "that's all" (send what's been heard). Tap while stuck on "starting" = start over.
    if (micState === "listening" && cur.rec) { try { cur.rec.stop(); } catch {} cur.timers.push(setTimeout(() => { if (micRef.current.rec === cur.rec) { cur.rec?.onend?.(); } }, 1500)); return; }
    try { window.speechSynthesis?.cancel(); } catch {}   // spoken replies can leave the microphone muted on iPhone
    const hadOld = dropRecogniser();
    setNote(""); setMicState("starting");
    const begin = () => {
      let finalText = "", sent = false, heard = false, failed = false, finished = false, silenceTimer = null;
      const timers = micRef.current.timers;
      try {
        const rec = new SpeechRec();
        rec.lang = "en-AU"; rec.interimResults = true;
        rec.continuous = !isIOS();                        // iPhones are more reliable one phrase at a time
        const stop = () => { try { rec.stop(); } catch {} };
        const done = () => {
          if (finished) return; finished = true;
          clearTimeout(silenceTimer); clearMicTimers(); micRef.current.rec = null; setMicState("");
          try { rec.abort(); } catch {}
          if (!sent && finalText.trim()) { sent = true; send(finalText); }
          else if (!heard && !failed) setNote("I didn't hear anything. Tap 🎤, wait for \"Listening\", then speak.");
        };
        const ready = () => { setMicState("listening"); timers.push(setTimeout(stop, 9000)); };
        rec.onstart = ready; rec.onaudiostart = ready;
        rec.onresult = (e) => {
          heard = true; setMicState("listening");
          let t = "";
          for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
          finalText = t; setText(t);
          clearTimeout(silenceTimer); silenceTimer = setTimeout(() => { stop(); timers.push(setTimeout(done, 1200)); }, 1600);   // paused -> finish (watchdog if the phone never says it ended)
        };
        rec.onerror = (e) => {
          failed = true;
          const msg = {
            "not-allowed": "Microphone is blocked — allow it for this app in your phone's settings, or use the keyboard's 🎤.",
            "service-not-allowed": "Voice is switched off on this phone — turn on Dictation in Settings → General → Keyboard, or use the keyboard's 🎤.",
            "audio-capture": "The microphone is busy — wait a moment and tap 🎤 again, or use the keyboard's 🎤.",
            "network": "Voice needs a phone signal. Try again, or type it.",
            "no-speech": "I didn't hear anything. Hold the phone closer and try again.",
            "aborted": "",
          }[e.error];
          setNote(msg ?? "Couldn't hear that — try again, or use the keyboard's 🎤.");
        };
        rec.onend = done;
        micRef.current.rec = rec;
        rec.start();
        timers.push(setTimeout(() => { if (!finished && !heard) { stop(); timers.push(setTimeout(done, 1200)); } }, 12000));   // never sit on "starting" forever
      } catch { clearMicTimers(); micRef.current.rec = null; setMicState(""); setNote("Couldn't start the microphone — use the keyboard's 🎤 instead."); }
    };
    if (hadOld) micRef.current.timers.push(setTimeout(begin, 300));   // give the phone a moment to release the mic
    else begin();
  };

  const reset = () => { setItems([]); setNote(""); try { window.speechSynthesis?.cancel(); } catch {} };
  const examples = canAct ? [...ASK_EXAMPLES.slice(0, 2), ...DO_EXAMPLES.slice(0, 2)] : ASK_EXAMPLES;
  const off = status && (status.error || status.enabled === false);

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Farm assistant"
          className={`fixed z-[240] bottom-24 md:bottom-6 ${mapTab ? "right-[88px] md:right-6" : "right-4 md:right-6"} w-14 h-14 rounded-full bg-red-900 text-white text-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center`}>
          💬
        </button>
      )}
      {open && (
        <div className="fixed left-0 right-0 z-[255] flex flex-col md:items-end md:justify-end md:p-6 pointer-events-none md:!top-0 md:!h-full"
          style={{ top: vv ? vv.top : 0, height: vv ? vv.h : "100dvh" }}>
          <div className="absolute inset-0 bg-black/30 md:hidden pointer-events-auto" onClick={() => setOpen(false)} />
          <div className="relative mt-8 md:mt-0 flex-1 min-h-0 md:flex-none md:w-[400px] md:h-[620px] bg-stone-50 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
            <div className="bg-red-900 text-white px-4 py-3 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight">Farm assistant</div>
                <div className="text-[11px] opacity-80">{canAct ? "Ask, or tell me what to record" : "Questions only"}</div>
              </div>
              {items.length > 0 && <button onClick={reset} className="text-xs border border-white/40 rounded-lg px-2 py-1">New chat</button>}
              <button onClick={toggleSpeak} aria-label="Read answers aloud" title="Read answers aloud" className={`w-8 h-8 rounded-full text-base ${speak ? "bg-white text-red-900" : "bg-white/15"}`}>🔊</button>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-white/15 text-lg leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {!status && <div className="text-sm text-slate-400 text-center py-6">Checking…</div>}
              {off && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 text-sm rounded-2xl p-3">
                  {status.error ? status.error : "The assistant isn't switched on yet. An administrator needs to add the Anthropic API key to the server (see Render → kw-farm-api → Environment → ANTHROPIC_API_KEY)."}
                </div>
              )}
              {status && !off && items.length === 0 && (
                <div className="pt-2">
                  <div className="text-sm text-slate-600 mb-2">Type or tap the 🎤 and speak. For example:</div>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((e) => <button key={e} onClick={() => setText(e)} className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-600">{e}</button>)}
                  </div>
                </div>
              )}
              {items.map((m, mi) => (
                <div key={mi} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div className={m.role === "user" ? "max-w-[85%] bg-red-900 text-white rounded-2xl rounded-br-md px-3.5 py-2 text-sm whitespace-pre-wrap" : "max-w-full"}>
                    {m.role === "user" ? m.content : (
                      <div>
                        <div className={`text-sm whitespace-pre-wrap rounded-2xl rounded-bl-md px-3.5 py-2 inline-block max-w-[92%] ${m.error ? "bg-red-50 text-red-800" : "bg-white border border-slate-200 text-slate-800"}`}>{m.content}</div>
                        {m.cards?.map((c, ci) => <CardView key={c.card.id} c={c} busy={m.cards.some((x) => x.status === "running")} onConfirm={() => confirmCard(mi, ci)} onCancel={() => patchCard(mi, ci, { status: "cancelled" })} />)}
                        {m.cards?.filter((c) => c.status === "pending").length > 1 && (
                          <button onClick={() => confirmAll(mi)} className="mt-2 w-full py-2.5 rounded-xl bg-green-700 text-white font-bold text-sm">Confirm all {m.cards.filter((c) => c.status === "pending").length}</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <div className="text-sm text-slate-400 px-1">Thinking…</div>}
              <div ref={endRef} />
            </div>

            {note && <div className="px-3 pb-1 text-xs text-amber-700">{note}</div>}
            <div className="border-t border-slate-200 bg-white p-2 flex items-end gap-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} disabled={off || !status}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia?.("(min-width: 768px)").matches) { e.preventDefault(); send(); } }}
                placeholder={micState === "starting" ? "Starting microphone…" : listening ? "Listening — speak now…" : "Ask or tell me something…"}
                style={{ fontSize: 16 }} className="flex-1 min-w-0 resize-none border border-slate-200 rounded-2xl px-3 py-2.5 max-h-28 bg-stone-50" />
              <button onClick={toggleMic} disabled={off || !status || busy} aria-label="Speak"
                className={`w-11 h-11 rounded-full text-lg shrink-0 ${listening ? "bg-red-600 text-white animate-pulse" : micState === "starting" ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-700"} disabled:opacity-40`}>🎤</button>
              <button onClick={() => send()} disabled={off || !status || busy || !text.trim()} aria-label="Send"
                className="w-11 h-11 rounded-full bg-red-900 text-white text-lg shrink-0 disabled:opacity-40">➤</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
