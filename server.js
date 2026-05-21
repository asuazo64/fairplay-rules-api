const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@tPqTq!9640710";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

// ── Logging ────────────────────────────────────────────────────────────────
const logs = [];
function addLog(type, data) {
  logs.unshift({ ts: new Date().toISOString(), type, data });
  if (logs.length > 200) logs.pop();
}

// ── Helper: llamada segura a Claude ───────────────────────────────────────
async function callClaude(system, userContent, maxTokens = 1200) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: system,
    messages: [{ role: "user", content: userContent }],
  });
  return response.content[0].text;
}

// ── Helper: limpiar JSON de Claude ────────────────────────────────────────
function cleanJSON(raw) {
  return raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

// ══════════════════════════════════════════════════════════════════════════
// FASE 1 — Extraer hechos + assumed facts
// POST /phase1   { description, lang, sport }
// ══════════════════════════════════════════════════════════════════════════
app.post("/phase1", async (req, res) => {
  try {
    const { description, lang = "en", sport = "" } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: "Description too short" });
    }

    addLog("phase1_req", { lang, sport, len: description.length });

    const system = `You are a professional sports rules analyst and fact extractor.
Extract objective facts AND assumptions from the user's incident description.
Respond ONLY with valid JSON — no markdown, no code blocks, no extra text.

JSON structure:
{
  "facts": [
    { "id": 1, "text": "fact stated by user in language ${lang}", "key": "short_key" }
  ],
  "assumedFacts": [
    "assumption the system makes that was NOT stated by user"
  ],
  "sport": "detected sport name",
  "detectedRules": "general rule area likely applicable"
}

Rules for extraction:
- facts: 3-8 items, each a simple verifiable statement from user input
- assumedFacts: 2-4 items the system assumes (e.g. "No local rules provided", "Standard competition rules apply", "Ball not in penalty area unless stated")
- For elevated objects (ball in tree, caught in net, etc.) always note: "Reference point is the spot on the ground directly below where the ball rests"
- Write facts in language: ${lang}
- Be precise and neutral — no interpretation yet`;

    const userContent = `Sport: ${sport || "not specified"}

User description:
${description}

Extract facts and assumptions as JSON.`;

    const raw = await callClaude(system, userContent, 1024);
    let parsed;
    try {
      parsed = JSON.parse(cleanJSON(raw));
    } catch {
      addLog("phase1_parse_err", { raw: raw.slice(0, 300) });
      return res.status(500).json({ error: "Failed to parse AI response", raw: raw.slice(0, 200) });
    }

    addLog("phase1_ok", { factsCount: parsed.facts?.length, assumedCount: parsed.assumedFacts?.length });
    res.json(parsed);
  } catch (err) {
    addLog("phase1_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FASE 2 — Pass-through (instantáneo, sin llamada a Claude)
// POST /phase2   { facts, lang, sport }
// ══════════════════════════════════════════════════════════════════════════
app.post("/phase2", async (req, res) => {
  try {
    const { facts, lang = "en" } = req.body;

    if (!facts || !Array.isArray(facts) || facts.length === 0) {
      return res.status(400).json({ error: "No facts provided" });
    }

    addLog("phase2_req", { factsCount: facts.length, lang });

    const questions = facts.map((f) => ({
      id: f.id,
      key: f.key,
      fact: f.text,
    }));

    res.json({ questions });
  } catch (err) {
    addLog("phase2_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FASE 3 — Ruling profesional con estructura completa
// POST /ruling   { confirmedFacts, deniedFacts, assumedFacts, sport, lang }
// ══════════════════════════════════════════════════════════════════════════
app.post("/ruling", async (req, res) => {
  try {
    const {
      confirmedFacts = [],
      deniedFacts = [],
      assumedFacts = [],
      sport = "",
      lang = "en",
    } = req.body;

    if (!confirmedFacts || confirmedFacts.length === 0) {
      return res.status(400).json({ error: "No confirmed facts provided" });
    }

    addLog("ruling_req", {
      confirmed: confirmedFacts.length,
      denied: deniedFacts.length,
      assumed: assumedFacts.length,
      lang,
      sport,
    });

    const confirmedList = confirmedFacts
      .map((f, i) => `${i + 1}. ${f.fact || f.text || f}`)
      .join("\n");

    const deniedList = deniedFacts.length > 0
      ? deniedFacts.map((f, i) => `${i + 1}. ${f.fact || f.text || f}`).join("\n")
      : "None";

    const assumedList = assumedFacts.length > 0
      ? assumedFacts.map((a, i) => `${i + 1}. ${a}`).join("\n")
      : "Standard competition rules apply. No local rules provided.";

    const system = `You are a professional sports rules authority delivering an official ruling.
Sport: ${sport || "general sports"}
Language: ${lang}

CRITICAL RULES FOR YOUR RESPONSE:
1. Base your ruling ONLY on confirmed facts. Do not invent or assume additional facts.
2. Do NOT automatically assume the worst outcome. If a player CAN play the ball as it lies, state that option first.
3. For balls in elevated positions (trees, nets, stands): the reference point for relief is the spot on the GROUND directly below where the ball rests — never the elevated position itself.
4. Present ALL available options to the player — do not pre-select one option.
5. Use neutral, official language. Do not recommend "the most common" option.
6. Always include the legal disclaimer at the end.
7. Confidence score: assess how complete the facts are (0-100). Lower if key facts are missing.

Respond in language: ${lang}

Use EXACTLY these section headers in your response:

## RULING
[State whether the situation results in a penalty, free relief, or no penalty. If multiple options exist, list ALL of them clearly numbered.]

## RULE APPLIED
[Cite the specific rule number and name. Example: "Rule 19 – Unplayable Ball" or "Rule 13 – Putting Green"]

## INTERPRETATION
[2-3 sentences: explain how the rule applies to the specific confirmed facts. Mention elevated reference points if relevant.]

## EXCEPTIONS & EDGE CASES
[Any exceptions that could change this ruling based on facts NOT confirmed by the user. Keep it short — 1-3 bullet points max.]

## ASSUMED FACTS
[List what the system assumed that the user did NOT state. Be transparent.]

## CONFIDENCE
[Single number 0-100 followed by one sentence explaining the confidence level. Example: "72 — Key facts about ball position and lie were not confirmed."]

## DISCLAIMER
Final rulings in competition are determined by the Committee or an authorized referee. This analysis is based solely on the facts confirmed by the user and standard rules of play.`;

    const userContent = `CONFIRMED FACTS:
${confirmedList}

DENIED FACTS:
${deniedList}

SYSTEM ASSUMPTIONS:
${assumedList}

Deliver the official ruling based only on confirmed facts.`;

    const ruling = await callClaude(system, userContent, 1600);

    addLog("ruling_ok", { len: ruling.length });
    res.json({ ruling, confirmedCount: confirmedFacts.length });
  } catch (err) {
    addLog("ruling_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════
app.get("/admin", (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send(`
      <html><body style="font-family:sans-serif;padding:2rem;background:#0f0f0f;color:#eee">
        <h2 style="color:#4ade80">🔒 FairPlay Admin</h2>
        <form style="margin-top:1rem">
          <input name="password" type="password" placeholder="Password"
            style="padding:.6rem;font-size:1rem;background:#1a1a1a;border:1px solid #333;color:#eee;border-radius:4px"/>
          <button type="submit"
            style="padding:.6rem 1.2rem;margin-left:.5rem;background:#4ade80;color:#000;border:none;border-radius:4px;cursor:pointer">
            Enter
          </button>
        </form>
      </body></html>
    `);
  }

  const rows = logs.map((l) => `
    <tr>
      <td style="color:#888;white-space:nowrap;font-size:11px">${l.ts}</td>
      <td><b style="color:#4ade80">${l.type}</b></td>
      <td><pre style="margin:0;font-size:11px;max-width:520px;overflow-x:auto">${JSON.stringify(l.data, null, 2)}</pre></td>
    </tr>`).join("");

  res.send(`
    <html>
    <head>
      <title>FairPlay Admin</title>
      <style>
        body { font-family: sans-serif; padding: 1rem; background: #0a0a0a; color: #eee; }
        h2 { color: #4ade80; margin-bottom: .3rem; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; margin-top: 1rem; }
        th { background: #1a1a1a; padding: .5rem .7rem; text-align: left; color: #aaa; }
        td { border-bottom: 1px solid #1a1a1a; padding: .5rem .7rem; vertical-align: top; }
        pre { background: #111; padding: .4rem; border-radius: 4px; color: #ccc; }
        a { color: #4ade80; }
      </style>
      <meta http-equiv="refresh" content="30">
    </head>
    <body>
      <h2>⚖️ FairPlay Rules — Admin</h2>
      <p style="color:#666;font-size:12px">${logs.length} entries · auto-refresh 30s ·
        <a href="/admin?password=${password}">Refresh now</a> ·
        <a href="/health">Health</a>
      </p>
      <table>
        <tr><th>Timestamp</th><th>Event</th><th>Data</th></tr>
        ${rows || '<tr><td colspan="3" style="color:#555;padding:1rem">No logs yet</td></tr>'}
      </table>
    </body>
    </html>
  `);
});

// ── Health ────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", model: MODEL, logs: logs.length, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`FairPlay Rules API v2.1 on port ${PORT}`);
});
