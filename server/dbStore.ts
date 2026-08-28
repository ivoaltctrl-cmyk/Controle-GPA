import path from "path";
import fs from "fs";

export interface AppDatabase {
  employees: any[];
  contracts: any[];
  areas: any[];
  trabalhistas: any[];
  demandLogs: any[];
  brandConfig: any;
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DATA_DIR, "database.json");

// Ensure data folder exists
export function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb(): AppDatabase {
  ensureDataDirExists();
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        employees: Array.isArray(parsed.employees) ? parsed.employees : [],
        contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
        areas: Array.isArray(parsed.areas) ? parsed.areas : [],
        trabalhistas: Array.isArray(parsed.trabalhistas) ? parsed.trabalhistas : [],
        demandLogs: Array.isArray(parsed.demandLogs) ? parsed.demandLogs : [],
        brandConfig: parsed.brandConfig || null,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("Erro ao ler database.json:", err);
  }
  return {
    employees: [],
    contracts: [],
    areas: [],
    trabalhistas: [],
    demandLogs: [],
    brandConfig: null,
    lastUpdated: new Date().toISOString(),
  };
}

export function saveDb(db: Partial<AppDatabase>): AppDatabase {
  ensureDataDirExists();
  const current = readDb();
  const merged: AppDatabase = {
    employees: db.employees !== undefined ? db.employees : current.employees,
    contracts: db.contracts !== undefined ? db.contracts : current.contracts,
    areas: db.areas !== undefined ? db.areas : current.areas,
    trabalhistas: db.trabalhistas !== undefined ? db.trabalhistas : current.trabalhistas,
    demandLogs: db.demandLogs !== undefined ? db.demandLogs : current.demandLogs,
    brandConfig: db.brandConfig !== undefined ? db.brandConfig : current.brandConfig,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}
