const https = require("https");
const http = require("http");
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "FairPlay2023!";
const GOLF_RULES = require("./rules.js");

const GITHUB_OWNER = "asuazo64";
const GITHUB_REPO = "fairplay-rules-api";
const GITHUB_FILE = "rules.js";

let currentRules = GOLF_RULES;

const SYSTEM_PROMPT = () => `You are FairPlay Rules, a professional golf ruling assistance system based on current USGA/R&A Rules.

CRITICAL PRINCIPLES:
1. ALWAYS cite the exact rule number: "According to Rule 17.1d(3)..."
2. NEVER simplify penalties
3. For Penalty Area/OB: ALWAYS verify Known or Virtually Certain
4. If critical facts are missing, ASK before issuing ruling
5. List ASSUMED FACTS at start of each ruling
6. Indicate confidence level: High (90-100%) / Moderate (70-89%) / Low (<70%)
7. If insufficient information: state exactly what data you need
8. NEVER say "you can do X" without citing the rule that permits it

RESPONSE FORMAT:
---ASSUMED FACTS---
[List of assumed facts]

---RULES APPLIED---
[Rule + exact number, e.g. Rule 19.2a]

---RULING---
[Ruling with exact penalty per format]

---RELIEF OPTIONS---
[If applicable]

---CONFIDENCE---
[Level % and missing facts if not High]

MANDATORY — ALWAYS append this JSON block at the END of EVERY response, even if just answering a question:
###RULING_DATA###
{
  "rule": "Rule X.Xa",
  "penalty": "X strokes / loss of hole / no penalty",
  "facts_confirmed": [],
  "confidence": 75
}
###END_RULING_DATA###

If no ruling applies yet (still gathering facts), use:
###RULING_DATA###
{
  "rule": "",
  "penalty": "",
  "facts_confirmed": [],
  "confidence": 0
}
###END_RULING_DATA###

GOLF RULES 2023 (USGA/R&A):
${currentRules}`;

function updateGitHub(newRulesText, callback) {
  const getOpts = {
    hostname: "api.github.com",
    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
    method: "GET",
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "User-Agent": "FairPlay-Admin", "Accept": "application/vnd.github.v3+json" }
  };
  const getReq = https.request(getOpts, (getRes) => {
    let getData = "";
    getRes.on("data", c => getData += c);
    getRes.on("end", () => {
      const fileInfo = JSON.parse(getData);
      const sha = fileInfo.sha;
      const newContent = `// GOLF RULES USGA/R&A\n// Updated: ${new Date().toISOString()}\nconst GOLF_RULES_2023 = ${JSON.stringify(newRulesText)};\nmodule.exports = GOLF_RULES_2023;\n`;
      const encoded = Buffer.from(newContent).toString("base64");
      const updateBody = JSON.stringify({ message: `Update rules - ${new Date().toLocaleDateString()}`, content: encoded, sha });
      const updateOpts = {
        hostname: "api.github.com",
        path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`,
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "User-Agent": "FairPlay-Admin", "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json", "Content-Length": Buffer.byteLength(updateBody) }
      };
      const updateReq = https.request(updateOpts, (updateRes) => {
        let updateData = "";
        updateRes.on("data", c => updateData += c);
        updateRes.on("end", () => {
          if (updateRes.statusCode === 200 || updateRes.statusCode === 201) {
            currentRules = newRulesText;
            callback(null, "Rules updated in GitHub. Render will redeploy in ~2 minutes.");
          } else {
            callback(new Error(`GitHub error: ${updateRes.statusCode}`));
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

function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from('--' + boundary);
  let start = 0;
  while (start < body.length) {
    const boundaryIdx = body.indexOf(boundaryBuffer, start);
    if (boundaryIdx === -1) break;
    const headerStart = boundaryIdx + boundaryBuffer.length + 2;
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), headerStart);
    if (headerEnd === -1) break;
    const headers = body.slice(headerStart, headerEnd).toString();
    const dataStart = headerEnd + 4;
    const nextBoundary = body.indexOf(boundaryBuffer, dataStart);
    const dataEnd = nextBoundary === -1 ? body.length : nextBoundary - 2;
    parts.push({ headers, data: body.slice(dataStart, dataEnd) });
    start = nextBoundary === -1 ? body.length : nextBoundary;
  }
  return parts;
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>FairPlay Admin</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,sans-serif;background:#f0f4f0;padding:2rem 1rem;}
.container{max-width:700px;margin:0 auto;}.header{background:#1a4731;color:white;padding:1.5rem;border-radius:12px 12px 0 0;}
.card{background:white;padding:1.5rem;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
label{display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px;margin-top:1.2rem;}
input[type="password"]{width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;}
.drop-zone{border:2px dashed #1a4731;border-radius:10px;padding:2.5rem;text-align:center;cursor:pointer;color:#1a4731;}
.drop-zone:hover{background:#e8f4ea;}.drop-zone input{display:none;}
.file-info{margin-top:10px;padding:10px;background:#e8f4ea;border-radius:8px;font-size:13px;color:#1a4731;display:none;}
.btn{width:100%;margin-top:1.2rem;padding:13px;background:#1a4731;color:white;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;}
.status{margin-top:1rem;padding:12px;border-radius:8px;font-size:14px;display:none;}
.success{background:#d4edda;color:#155724;display:block;}.error{background:#f8d7da;color:#721c24;display:block;}
.info{background:#e8f4ea;padding:12px;border-radius:8px;font-size:13px;color:#1a4731;margin-top:1rem;}
</style></head><body>
<div class="container">
  <div class="header"><h1>&#9971; FairPlay Admin</h1><p style="font-size:13px;opacity:.8;margin-top:4px">Actualizacion de Reglas de Golf</p></div>
  <div class="card">
    <div class="info">Sube el PDF con las nuevas reglas. El sistema extrae el texto y actualiza GitHub. Render redesplegara en ~2 minutos.</div>
    <label>Contrasena de administrador</label>
    <input type="password" id="password" placeholder="Contrasena...">
    <label>Archivo PDF de las reglas</label>
    <div class="drop-zone" onclick="document.getElementById('fi').click()">
      <input type="file" id="fi" accept=".pdf" onchange="handleFile(this.files[0])">
      <div style="font-size:36px">&#128196;</div>
      <div style="font-size:15px;font-weight:600">Haz clic o arrastra el PDF aqui</div>
      <div style="font-size:12px;color:#666;margin-top:4px">Solo archivos PDF</div>
    </div>
    <div class="file-info" id="fileInfo"></div>
    <button class="btn" id="updateBtn" onclick="updateRules()" disabled>&#128260; Actualizar Reglas en GitHub</button>
    <div class="status" id="status"></div>
  </div>
</div>
<script>
let selectedFile=null;
const dz=document.getElementById('fi').parentElement;
dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.background='#e8f4ea';});
dz.addEventListener('dragleave',()=>dz.style.background='');
dz.addEventListener('drop',e=>{e.preventDefault();dz.style.background='';const f=e.dataTransfer.files[0];if(f&&f.type==='application/pdf')handleFile(f);});
function handleFile(f){selectedFile=f;const i=document.getElementById('fileInfo');i.style.display='block';i.textContent='&#128206; '+f.name+' ('+(f.size/1024).toFixed(0)+' KB)';document.getElementById('updateBtn').disabled=false;}
async function updateRules(){
  const pw=document.getElementById('password').value;const btn=document.getElementById('updateBtn');const st=document.getElementById('status');
  if(!pw||!selectedFile){st.className='status error';st.textContent='Por favor completa todos los campos.';return;}
  btn.disabled=true;btn.textContent='Procesando...';st.className='status';st.style.display='none';
  const fd=new FormData();fd.append('password',pw);fd.append('pdf',selectedFile);
  try{const r=await fetch('/admin/update-rules',{method:'POST',body:fd});const d=await r.json();
    if(r.ok){st.className='status success';st.textContent=d.message;}
    else{st.className='status error';st.textContent='Error: '+(d.error||'Desconocido');}
  }catch(e){st.className='status error';st.textContent='Error de conexion: '+e.message;}
  finally{btn.disabled=false;btn.textContent='Actualizar Reglas en GitHub';}
}
</script></body></html>`;

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS,GET");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  if (req.method === "GET" && req.url === "/admin") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(ADMIN_HTML); return;
  }

  if (req.method === "POST" && req.url === "/admin/update-rules") {
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) { res.writeHead(400, {"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Expected multipart"})); return; }
    const boundary = boundaryMatch[1];
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", async () => {
      const body = Buffer.concat(chunks);
      const parts = parseMultipart(body, boundary);
      let password = "", pdfBuffer = null;
      for (const part of parts) {
        if (part.headers.includes('name="password"')) password = part.data.toString().trim();
        else if (part.headers.includes('name="pdf"')) pdfBuffer = part.data;
      }
      if (password !== ADMIN_PASSWORD) { res.writeHead(401,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Wrong password"})); return; }
      if (!pdfBuffer || pdfBuffer.length < 100) { res.writeHead(400,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"PDF not received"})); return; }
      try {
        const pdfParse = require("pdf-parse");
        const data = await pdfParse(pdfBuffer);
        if (!data.text || data.text.trim().length < 100) { res.writeHead(400,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"Could not extract text from PDF"})); return; }
        updateGitHub(data.text, (err, message) => {
          if (err) { res.writeHead(500,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:err.message})); }
          else { res.writeHead(200,{"Content-Type":"application/json"}); res.end(JSON.stringify({message})); }
        });
      } catch(e) { res.writeHead(500,{"Content-Type":"application/json"}); res.end(JSON.stringify({error:"PDF error: "+e.message})); }
    }); return;
  }

  if (req.method !== "POST" || req.url !== "/api/rules") { res.writeHead(404); res.end("Not found"); return; }

  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch(e) { res.writeHead(400); res.end(JSON.stringify({error:"Invalid JSON"})); return; }
    
    // Extract language instruction from client system prompt if provided
    let langInstruction = "";
    if (parsed.system && parsed.system.includes("CRITICAL LANGUAGE INSTRUCTION")) {
      const match = parsed.system.match(/CRITICAL LANGUAGE INSTRUCTION[^\n]+\n/);
      if (match) langInstruction = match[0] + "\n";
    }
    
    const payload = JSON.stringify({
      model: parsed.model || "claude-haiku-4-5-20251001",
      max_tokens: parsed.max_tokens || 1500,
      system: langInstruction + SYSTEM_PROMPT(),
      messages: parsed.messages
    });
    const opt = {
      hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "Content-Length": Buffer.byteLength(payload) }
    };
    const pr = https.request(opt, r => {
      let d = "";
      r.on("data", c => d += c);
      r.on("end", () => { res.writeHead(r.statusCode, {"Content-Type":"application/json"}); res.end(d); });
    });
    pr.on("error", e => { res.writeHead(500); res.end(JSON.stringify({error:e.message})); });
    pr.write(payload); pr.end();
  });
}).listen(PORT, () => console.log("FairPlay API on port " + PORT));
