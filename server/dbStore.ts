import path from "path";
import fs from "fs";

export interface AppDatabase {
  employees: any[];
  contracts: any[];
  areas: any[];
  trabalhistas: any[];
  demandLogs: any[];
  brandConfig: any;
  adminCredentials?: {
    username: string;
    password: string;
    lastUpdated?: string;
  } | null;
  resumoConfig: {
    validos: number;
    pendentes: number;
    lastUpdated?: string;
  } | null;
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.resolve(DATA_DIR, "database.json");

const DEFAULT_SEED_AREAS = [
  {
    id: 'area-01',
    nome: 'Logística & Centros de Distribuição (CDs)',
    responsavelNome: 'Ricardo Fontes Silveira',
    responsavelCargo: 'Gerente Executivo de Operações Logísticas',
    responsavelEmail: 'ricardo.fontes@gpa.com.br',
    responsavelTelefone: '(11) 98765-4321',
    unidadeOuLoja: 'CD Central Osasco / SP',
    observacoes: 'Monitoramento contínuo de operadores de empilhadeira, motoristas e ajudantes de carga.',
  },
  {
    id: 'area-02',
    nome: 'Manutenção Predial & Obras',
    responsavelNome: 'Mariana Duarte Prado',
    responsavelCargo: 'Coordenadora de Engenharia & Manutenção',
    responsavelEmail: 'mariana.prado@gpa.com.br',
    responsavelTelefone: '(11) 97654-1122',
    unidadeOuLoja: 'Regional São Paulo Capital',
    observacoes: 'Controle de NR-10 (Elétrica), NR-35 (Altura) e fichas de EPI para equipes terceirizadas.',
  },
  {
    id: 'area-03',
    nome: 'Prevenção de Perdas & Segurança Patrimonial',
    responsavelNome: 'Carlos Alberto Tavares',
    responsavelCargo: 'Supervisor de Segurança e Prevenção',
    responsavelEmail: 'carlos.tavares@gpa.com.br',
    responsavelTelefone: '(11) 99882-3344',
    unidadeOuLoja: 'Lojas Pão de Açúcar & Minuto',
    observacoes: 'Fiscalização de vigilância armada/desarmada e controle de acessos às portarias.',
  },
  {
    id: 'area-04',
    nome: 'Facilities, Limpeza & Higienização',
    responsavelNome: 'Juliana Beatriz Neves',
    responsavelCargo: 'Gerente de Facilities & Terceiros',
    responsavelEmail: 'juliana.neves@gpa.com.br',
    responsavelTelefone: '(11) 99123-5566',
    unidadeOuLoja: 'Edifício Sede GPA - Brig. Luís Antônio',
    observacoes: 'Acompanhamento rigoroso de ASO admissional/periódico e treinamento de químicos.',
  },
  {
    id: 'area-05',
    nome: 'Operações de Loja & Perecíveis',
    responsavelNome: 'Fernando Henrique Lemos',
    responsavelCargo: 'Gerente Regional de Operações',
    responsavelEmail: 'fernando.lemos@gpa.com.br',
    responsavelTelefone: '(11) 98234-7788',
    unidadeOuLoja: 'Hiper & Supermercados GPA',
    observacoes: 'Controle de exames específicos para manipuladores de alimentos e câmaras frigoríficas.',
  },
];

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
        areas: Array.isArray(parsed.areas) && parsed.areas.length > 0 ? parsed.areas : DEFAULT_SEED_AREAS,
        trabalhistas: Array.isArray(parsed.trabalhistas) ? parsed.trabalhistas : [],
        demandLogs: Array.isArray(parsed.demandLogs) ? parsed.demandLogs : [],
        brandConfig: parsed.brandConfig || null,
        adminCredentials: parsed.adminCredentials || {
          username: "admin",
          password: "gpa",
          lastUpdated: new Date().toISOString(),
        },
        resumoConfig: parsed.resumoConfig || null,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("Erro ao ler database.json:", err);
  }
  return {
    employees: [],
    contracts: [],
    areas: DEFAULT_SEED_AREAS,
    trabalhistas: [],
    demandLogs: [],
    brandConfig: null,
    adminCredentials: {
      username: "admin",
      password: "gpa",
      lastUpdated: new Date().toISOString(),
    },
    resumoConfig: null,
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
    adminCredentials: db.adminCredentials !== undefined ? db.adminCredentials : current.adminCredentials,
    resumoConfig: db.resumoConfig !== undefined ? db.resumoConfig : current.resumoConfig,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}
