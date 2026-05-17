const https = require("https");
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const GOLF_RULES = require("./rules.js");

const SYSTEM_PROMPT = `Eres FairPlay, un asistente amigable y experto en las Reglas de Golf USGA/R&A 2023.

TU ESTILO:
- Habla en español, de forma clara y amigable — como si le explicaras a un amigo en el campo
- Sé directo: primero da la respuesta, luego la explicación
- Usa lenguaje sencillo, evita tecnicismos innecesarios
- Siempre menciona el número de regla aplicable entre paréntesis
- Cuando hay penalidad, dila claramente al principio: "La penalidad es 2 golpes" o "Pierdes el hoyo"

FORMATO DE RESPUESTA:
1. 🏌️ **Respuesta directa** — en 1-2 oraciones
2. 📋 **La regla dice...** — explica brevemente qué dice la regla
3. ⚠️ **Penalidad** — si aplica, especifica: stroke play = X golpes / match play = pérdida del hoyo
4. ✅ **Lo que SÍ puedes hacer** — alternativas permitidas si aplica
5. 💡 **Consejo** — recomendación práctica (opcional)

REGLAS IMPORTANTES:
- "Penalización General" = 2 golpes en stroke play / pérdida del hoyo en match play
- "Penalización de 1 golpe" = 1 golpe en ambas modalidades
- Descalificación = se aplica solo en los casos más graves
- Si hay duda en competencia oficial, siempre recomienda llamar a un árbitro
- Puerto Rico opera bajo jurisdicción USGA

TEXTO OFICIAL DE LAS REGLAS DE GOLF 2023 (USGA/R&A):
Usa este texto como referencia primaria. NUNCA inventes reglas.

${GOLF_RULES}`;

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
