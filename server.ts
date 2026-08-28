import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { extractPendingFromImage, generateDemandMessage } from "./server/geminiService.ts";
import { readDb, saveDb } from "./server/dbStore.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// -------------------------------------------------------------
// Backend Persistence Endpoints (Sincronização Front <-> Back)
// -------------------------------------------------------------
app.get("/api/data", (_req, res) => {
  const db = readDb();
  res.json({ success: true, ...db });
});

app.post("/api/data", (req, res) => {
  try {
    let payload = req.body;
    if (payload && typeof payload.collection === "string" && payload.data !== undefined) {
      payload = { [payload.collection]: payload.data };
    }
    const updated = saveDb(payload);
    res.json({ success: true, lastUpdated: updated.lastUpdated });
  } catch (error: any) {
    console.error("Erro ao salvar dados no backend:", error);
    res.status(500).json({ error: error.message || "Erro ao salvar dados no backend" });
  }
});

// Update specific collection endpoint
app.post("/api/data/:collection", (req, res) => {
  try {
    const { collection } = req.params;
    const { data } = req.body;
    if (data === undefined) {
      return res.status(400).json({ error: "Dados não fornecidos" });
    }
    const current = readDb();
    if (collection in current) {
      const updated = saveDb({ [collection]: data });
      return res.json({ success: true, collection, count: Array.isArray(data) ? data.length : 1, lastUpdated: updated.lastUpdated });
    }
    const updated = saveDb({ [collection]: data } as any);
    return res.json({ success: true, collection, count: Array.isArray(data) ? data.length : 1, lastUpdated: updated.lastUpdated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health Endpoint
app.get("/api/health", (_req, res) => {
  const db = readDb();
  res.json({
    status: "ok",
    backend: "active",
    timestamp: new Date().toISOString(),
    counts: {
      employees: db.employees.length,
      contracts: db.contracts.length,
      areas: db.areas.length,
      trabalhistas: db.trabalhistas.length,
      demandLogs: db.demandLogs.length,
    },
    lastUpdated: db.lastUpdated,
  });
});

// AI OCR Scanning via Gemini
app.post(["/api/scan-pending", "/api/parse-sst-image"], async (req, res) => {
  try {
    const imageBase64 = req.body.image || req.body.imageBase64;
    const mimeType = req.body.mimeType || "image/png";
    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem base64 não fornecida." });
    }
    const data = await extractPendingFromImage(imageBase64, mimeType);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Erro no OCR Gemini:", error);
    res.status(500).json({ error: error.message || "Erro ao processar imagem com IA" });
  }
});

// AI Demand Message Generation
app.post("/api/generate-demand-message", async (req, res) => {
  try {
    const data = await generateDemandMessage(req.body);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Erro ao gerar mensagem de cobrança:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar cobrança" });
  }
});

// Serve frontend in production
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
