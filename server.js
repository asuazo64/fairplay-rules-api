const https = require("https");
const http = require("http");
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GOLF_RULES = require("./rules.js");

// Admin password - change this to something secure
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "FairPlay2023!";

const GITHUB_OWNER = "asuazo64";
const GITHUB_REPO = "fairplay-rules-api";
const GITHUB_FILE = "rules.js";

let currentRules = GOLF_RULES;

const SYSTEM_PROMPT = () => `Eres FairPlay, un asistente amigable y experto en las Reglas de Golf USGA/R&A 2023.

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
- Descalificación = solo en los casos más graves
- Si hay duda en competencia oficial, recomienda llamar a un árbitro
- Puerto Rico opera bajo jurisdicción USGA

TEXTO OFICIAL DE LAS REGLAS DE GOLF 2023 (USGA/R&A):
${currentRules}`;

function updateGitHub(newRulesText, callback) {
  // First get the current file SHA
  const getOpts = {
    hostname: "api.github.com",
    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
    method: "GET",
    headers: {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "User-Agent": "FairPlay-Admin",
      "Accept": "application/vnd.github.v3+json"
    }
  };

  const getReq = https.request(getOpts, (getRes) => {
    let getData = "";
    getRes.on("data", c => getData += c);
    getRes.on("end", () => {
      const fileInfo = JSON.parse(getData);
      const sha = fileInfo.sha;

      // Build new rules.js content
      const newContent = `// REGLAS DE GOLF USGA/R&A\n// Actualizado: ${new Date().toISOString()}\nconst GOLF_RULES_2023 = ${JSON.stringify(newRulesText)};\nmodule.exports = GOLF_RULES_2023;\n`;
      const encoded = Buffer.from(newContent).toString("base64");

      // Update the file
      const updateBody = JSON.stringify({
        message: `Update rules - ${new Date().toLocaleDateString()}`,
        content: encoded,
        sha: sha
      });

      const updateOpts = {
        hostname: "api.github.com",
        path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "User-Agent": "FairPlay-Admin",
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(updateBody)
        }
      };

      const updateReq = https.request(updateOpts, (updateRes) => {
        let updateData = "";
        updateRes.on("data", c => updateData += c);
        updateRes.on("end", () => {
          if (updateRes.statusCode === 200 || updateRes.statusCode === 201) {
            currentRules = newRulesText;
            callback(null, "Reglas actualizadas exitosamente en GitHub. Render redesplegará en ~2 minutos.");
          } else {
            callback(new Error(`GitHub error: ${updateRes.statusCode} - ${updateData}`));
          }
        });
      });
      updateReq.on("error", callback);
      updateReq.write(updateBody);
      updateReq.end();
    });
  });
  getReq.on("error", callback);
  getReq.end();
}

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS,GET");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Admin page
  if (req.method === "GET" && req.url === "/admin") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FairPlay Admin — Actualizar Reglas</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, sans-serif; background: #f0f4f0; min-height: 100vh; padding: 2rem 1rem; }
.container { max-width: 700px; margin: 0 auto; }
.header { background: #1a4731; color: white; padding: 1.5rem; border-radius: 12px 12px 0 0; }
.header h1 { font-size: 20px; }
.header p { font-size: 13px; opacity: 0.8; margin-top: 4px; }
.card { background: white; padding: 1.5rem; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; margin-top: 1rem; }
input, textarea { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; font-family: inherit; }
input:focus, textarea:focus { outline: none; border-color: #1a4731; }
textarea { min-height: 300px; resize: vertical; font-family: monospace; font-size: 12px; }
.btn { width: 100%; margin-top: 1rem; padding: 12px; background: #1a4731; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
.btn:hover { opacity: 0.85; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.status { margin-top: 1rem; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
.status.success { background: #d4edda; color: #155724; display: block; }
.status.error { background: #f8d7da; color: #721c24; display: block; }
.info { background: #e8f4ea; padding: 12px; border-radius: 8px; font-size: 13px; color: #1a4731; margin-top: 1rem; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>⛳ FairPlay Admin</h1>
    <p>Actualización de Reglas de Golf</p>
  </div>
  <div class="card">
    <div class="info">
      📌 Pega el texto de las nuevas reglas abajo. Se actualizará automáticamente en GitHub y Render redesplegará en ~2 minutos.
    </div>
    <label>Contraseña de administrador</label>
    <input type="password" id="password" placeholder="Contraseña..." />
    <label>Texto de las reglas (pega el contenido nuevo aquí)</label>
    <textarea id="rulesText" placeholder="Pega aquí el texto completo de las reglas..."></textarea>
    <button class="btn" id="updateBtn" onclick="updateRules()">🔄 Actualizar Reglas en GitHub</button>
    <div class="status" id="status"></div>
  </div>
</div>
<script>
async function updateRules() {
  const password = document.getElementById('password').value;
  const rulesText = document.getElementById('rulesText').value;
  const btn = document.getElementById('updateBtn');
  const status = document.getElementById('status');

  if (!password || !rulesText) {
    status.className = 'status error';
    status.textContent = '❌ Por favor completa todos los campos.';
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Actualizando...';
  status.className = 'status';
  status.style.display = 'none';

  try {
    const res = await fetch('/admin/update-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, rules: rulesText })
    });
    const data = await res.json();
    if (res.ok) {
      status.className = 'status success';
      status.textContent = '✅ ' + data.message;
    } else {
      status.className = 'status error';
      status.textContent = '❌ ' + (data.error || 'Error desconocido');
    }
  } catch(e) {
    status.className = 'status error';
    status.textContent = '❌ Error de conexión: ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Actualizar Reglas en GitHub';
  }
}
</script>
</body>
</html>`);
    return;
  }

  // Admin update endpoint
  if (req.method === "POST" && req.url === "/admin/update-rules") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch(e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      if (parsed.password !== ADMIN_PASSWORD) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Contraseña incorrecta" }));
        return;
      }

      if (!parsed.rules || parsed.rules.trim().length < 100) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "El texto de las reglas es demasiado corto" }));
        return;
      }

      updateGitHub(parsed.rules, (err, message) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message }));
        }
      });
    });
    return;
  }

  // Rules API endpoint
  if (req.method !== "POST" || req.url !== "/api/rules") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch(e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const payload = JSON.stringify({
      model: parsed.model || "claude-haiku-4-5-20251001",
      max_tokens: parsed.max_tokens || 1024,
      system: SYSTEM_PROMPT(),
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

}).listen(PORT, () => console.log("FairPlay Rules API on port " + PORT + " — Admin panel at /admin"));
