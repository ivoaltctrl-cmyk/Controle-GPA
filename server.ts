import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";
import { extractPendingFromImage, generateDemandMessage } from "./server/geminiService.ts";
import { readDb, saveDb, hashPassword, verifyPassword } from "./server/dbStore.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// -------------------------------------------------------------
// Admin Session Storage (In-memory, 8 hours expiration)
// -------------------------------------------------------------
interface AdminSession {
  token: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

const activeAdminSessions = new Map<string, AdminSession>();
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

function createAdminSession(username: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  activeAdminSessions.set(token, {
    token,
    username,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  });
  return token;
}

function isValidAdminSession(token: string | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const session = activeAdminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return false;
  }
  return true;
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers["x-admin-token"];
  if (typeof customHeader === "string") {
    return customHeader.trim();
  }
  if (req.body && typeof req.body.token === "string") {
    return req.body.token.trim();
  }
  return undefined;
}

// Middleware to enforce Admin Authentication
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!isValidAdminSession(token)) {
    return res.status(401).json({
      success: false,
      error: "Acesso não autorizado. Sessão de administrador inválida ou expirada. Faça login novamente.",
    });
  }
  next();
}

// -------------------------------------------------------------
// Backend Persistence Endpoints (Sincronização Front <-> Back)
// -------------------------------------------------------------
// GET /api/data sanitizado: NUNCA expõe adminCredentials (senhas, hashes ou salts)
app.get("/api/data", (_req, res) => {
  const db = readDb();
  const { adminCredentials, ...safeDb } = db;
  res.json({ success: true, ...safeDb });
});

// Admin Authentication: Validação estrita via Hash/Salt (Sem senhas mestras ou fallback 'gpa')
app.post("/api/admin/auth", (req, res) => {
  try {
    const { username, password } = req.body;
    const db = readDb();
    const storedCreds = db.adminCredentials;

    if (!storedCreds || !storedCreds.passwordHash || !storedCreds.salt) {
      return res.status(500).json({
        success: false,
        authenticated: false,
        error: "Configuração de credenciais do servidor inconsistente.",
      });
    }

    const cleanUser = typeof username === "string" ? username.trim().toLowerCase() : "";
    const cleanPass = typeof password === "string" ? password.trim() : "";
    const targetUser = (storedCreds.username || "admin").trim().toLowerCase();

    // Validação estrita: usuário correspondente e verificação criptográfica do hash
    const isUserMatch = cleanUser === targetUser;
    const isPassMatch = verifyPassword(cleanPass, storedCreds.passwordHash, storedCreds.salt);

    if (isUserMatch && isPassMatch) {
      const sessionToken = createAdminSession(storedCreds.username || "admin");
      return res.json({
        success: true,
        authenticated: true,
        sessionToken,
        username: storedCreds.username || "admin",
        expiresIn: SESSION_DURATION_MS / 1000,
      });
    }

    return res.status(401).json({
      success: false,
      authenticated: false,
      error: "Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.",
    });
  } catch (error: any) {
    console.error("Erro no login admin do backend:", error);
    res.status(500).json({ error: error.message || "Erro no servidor" });
  }
});

// Session Validation Endpoint: Verifica se a sessão do admin ainda é válida
app.post("/api/admin/verify-session", (req, res) => {
  const token = extractToken(req);
  if (isValidAdminSession(token)) {
    const session = activeAdminSessions.get(token!);
    return res.json({
      success: true,
      valid: true,
      username: session?.username || "admin",
    });
  }
  return res.status(401).json({
    success: false,
    valid: false,
    error: "Sessão inválida ou expirada.",
  });
});

// Admin Logout Endpoint
app.post("/api/admin/logout", (req, res) => {
  const token = extractToken(req);
  if (token) {
    activeAdminSessions.delete(token);
  }
  res.json({ success: true, message: "Sessão encerrada com sucesso." });
});

// Admin Password Update Endpoint (Protegido por token de sessão)
app.post("/api/admin/credentials", requireAdminAuth, (req, res) => {
  try {
    const { username, password } = req.body;
    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "A senha não pode estar em branco." });
    }
    const cleanUsername = (username && typeof username === "string" && username.trim()) ? username.trim() : "admin";
    const cleanPassword = password.trim();

    const { hash, salt } = hashPassword(cleanPassword);

    const updated = saveDb({
      adminCredentials: {
        username: cleanUsername,
        passwordHash: hash,
        salt,
        lastUpdated: new Date().toISOString(),
      },
    });

    return res.json({
      success: true,
      message: "Credenciais de administrador atualizadas com sucesso!",
      username: cleanUsername,
      lastUpdated: updated.lastUpdated,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar credenciais:", error);
    res.status(500).json({ error: error.message || "Erro no servidor" });
  }
});

// Admin Reset Endpoint (Operação destrutiva protegida por token de sessão)
app.post("/api/admin/reset", requireAdminAuth, (req, res) => {
  try {
    const { mode } = req.body;
    if (mode === "production_blank") {
      const updated = saveDb({
        employees: [],
        contracts: [],
        areas: [],
        trabalhistas: [],
        demandLogs: [],
      });
      return res.json({ success: true, message: "Ambiente zerado com sucesso para produção.", lastUpdated: updated.lastUpdated });
    }
    return res.status(400).json({ error: "Modo de reset inválido." });
  } catch (error: any) {
    console.error("Erro ao resetar ambiente:", error);
    res.status(500).json({ error: error.message || "Erro no servidor" });
  }
});

app.post("/api/data", (req, res) => {
  try {
    let payload = req.body;
    if (payload && typeof payload.collection === "string" && payload.data !== undefined) {
      payload = { [payload.collection]: payload.data };
    }
    // Impede alteração de credenciais via POST /api/data genérico
    if (payload && payload.adminCredentials !== undefined) {
      delete payload.adminCredentials;
    }
    const updated = saveDb(payload);
    res.json({ success: true, lastUpdated: updated.lastUpdated });
  } catch (error: any) {
    console.error("Erro ao salvar dados no backend:", error);
    res.status(500).json({ error: error.message || "Erro ao salvar dados no backend" });
  }
});

// Update specific collection endpoint (Aberto para operações normais de saneamento de pendências, exceto adminCredentials)
app.post("/api/data/:collection", (req, res) => {
  try {
    const { collection } = req.params;
    const { data } = req.body;

    // Bloqueio explícito: adminCredentials NÃO PODE ser alterado por esta rota aberta
    if (collection === "adminCredentials") {
      return res.status(403).json({
        error: "Alteração de credenciais permitida apenas via rota protegida /api/admin/credentials.",
      });
    }

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
