import type { IncomingMessage, ServerResponse } from "http";
import { extractPendingFromImage, generateDemandMessage } from "./geminiService.ts";
import { readDb, saveDb } from "./dbStore.ts";

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      // Protect against overly huge uploads (25MB limit for images)
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error("Arquivo muito grande (limite de 25MB)"));
      }
    });
    req.on("end", () => {
      try {
        if (!body) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const fullUrl = req.url || "";
  const [pathname] = fullUrl.split("?");

  if (!pathname.startsWith("/api/")) {
    return next();
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // 1. Health & Backend Status Check
  if (pathname === "/api/health" && req.method === "GET") {
    const db = readDb();
    return sendJson(res, 200, {
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
  }

  // 2. Read full backend database: GET /api/data
  if (pathname === "/api/data" && req.method === "GET") {
    try {
      const db = readDb();
      return sendJson(res, 200, {
        success: true,
        ...db,
      });
    } catch (error: any) {
      console.error("[Backend API] Erro ao ler dados:", error);
      return sendJson(res, 500, { success: false, error: error.message || "Erro ao ler banco de dados" });
    }
  }

  // 3. Write / Merge full backend database: POST /api/data
  if (pathname === "/api/data" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      let payloadToSave = body;
      if (body && typeof body.collection === "string" && body.data !== undefined) {
        payloadToSave = { [body.collection]: body.data };
      }
      const updated = saveDb(payloadToSave);
      return sendJson(res, 200, {
        success: true,
        lastUpdated: updated.lastUpdated,
      });
    } catch (error: any) {
      console.error("[Backend API] Erro ao salvar dados:", error);
      return sendJson(res, 500, { success: false, error: error.message || "Erro ao salvar banco de dados" });
    }
  }

  // 4. Update specific collection: POST /api/data/:collection
  if (pathname.startsWith("/api/data/") && req.method === "POST") {
    try {
      const collection = pathname.replace("/api/data/", "").trim();
      const body = await parseJsonBody(req);
      const data = body.data !== undefined ? body.data : body;

      if (!collection) {
        return sendJson(res, 400, { success: false, error: "Nome de coleção inválido" });
      }

      const current = readDb();
      if (collection in current) {
        const updated = saveDb({ [collection]: data });
        return sendJson(res, 200, {
          success: true,
          collection,
          count: Array.isArray(data) ? data.length : 1,
          lastUpdated: updated.lastUpdated,
        });
      }

      // If valid generic key, save as well
      const updated = saveDb({ [collection]: data } as any);
      return sendJson(res, 200, {
        success: true,
        collection,
        lastUpdated: updated.lastUpdated,
      });
    } catch (error: any) {
      console.error("[Backend API] Erro ao salvar coleção:", error);
      return sendJson(res, 500, { success: false, error: error.message || "Erro ao atualizar coleção" });
    }
  }

  // 5. OCR Scanner for SST Print: POST /api/parse-sst-image OR POST /api/scan-pending
  if ((pathname === "/api/parse-sst-image" || pathname === "/api/scan-pending") && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const imageBase64 = body.image || body.imageBase64;
      const mimeType = body.mimeType || "image/png";

      if (!imageBase64) {
        return sendJson(res, 400, { success: false, error: "Imagem base64 não fornecida." });
      }

      const extracted = await extractPendingFromImage(imageBase64, mimeType);
      return sendJson(res, 200, { success: true, data: extracted });
    } catch (error: any) {
      console.error("[Backend API] Erro no OCR Gemini:", error);
      return sendJson(res, 500, {
        success: false,
        error: error.message || "Erro ao processar imagem via IA Gemini",
      });
    }
  }

  // 6. Generate demand message: POST /api/generate-demand-message
  if (pathname === "/api/generate-demand-message" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const result = await generateDemandMessage(body);
      return sendJson(res, 200, { success: true, data: result });
    } catch (error: any) {
      console.error("[Backend API] Erro ao gerar demanda:", error);
      return sendJson(res, 500, {
        success: false,
        error: error.message || "Erro ao gerar mensagem de cobrança",
      });
    }
  }

  // 404 Fallback for unhandled /api/*
  return sendJson(res, 404, { success: false, error: `Endpoint não encontrado: ${pathname}` });
}

