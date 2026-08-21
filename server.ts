import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { extractPendingFromImage, generateDemandMessage } from "./server/geminiService.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "25mb" }));

// API Endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/scan-pending", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/png" } = req.body;
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
