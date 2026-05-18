const https = require("https");
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const GOLF_RULES = require("./rules.js");

const SYSTEM_PROMPT = `Eres un experto árbitro de golf certificado con dominio completo del Código de Reglas de Golf USGA/R&A 2023.

INSTRUCCIONES:
- Responde SIEMPRE en español
- Cita el número exacto de la regla aplicable (ej: Regla 12.2b(1))
- Sé preciso y directo — no inventes reglas ni suavices penalidades
- Si hay penalización, indícala claramente: 1 golpe, 2 golpes, pérdida del hoyo
- Si la situación es ambigua, explica las distintas interpretaciones posibles
- Para competencias oficiales, recomienda siempre consultar un árbitro en el campo
- Puerto Rico opera bajo jurisdicción USGA

A continuación el texto oficial completo de las Reglas de Golf 2023:

═══════════════════════════════════════════════
TEXTO OFICIAL — REGLAS DE GOLF 2023 (USGA/R&A)
═══════════════════════════════════════════════

${GOLF_RULES}

═══════════════════════════════════════════════
FIN DEL TEXTO OFICIAL
═══════════════════════════════════════════════`;

require("http").createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/rules") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch(e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    // Override system prompt with our official rules
    const payload = JSON.stringify({
      model: parsed.model || "claude-haiku-4-5-20251001",
      max_tokens: parsed.max_tokens || 1024,
      system: SYSTEM_PROMPT,
      messages: parsed.messages
    });

    const opt = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const pr = https.request(opt, r => {
      let d = "";
      r.on("data", c => d += c);
      r.on("end", () => {
        res.writeHead(r.statusCode, { "Content-Type": "application/json" });
        res.end(d);
      });
    });

    pr.on("error", e => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    });

    pr.write(payload);
    pr.end();
  });
}).listen(PORT, () => console.log("FairPlay Rules API on port " + PORT + " — Rules 2023 loaded ✓"));
