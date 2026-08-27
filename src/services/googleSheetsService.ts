/**
 * Google Sheets Integration Service for GPA_BD
 * Spreadsheet ID: 1eiiiADFvTgdKFp37zwWU5r5iJktZSdsr5BlFVAXZKIc
 *
 * Estrutura 100% alinhada com as abas e colunas oficiais:
 * 1. "Pendências SST" (Documento, Nome, Cargo, Área/Setor, STATUS, Contrato, CNPJ, OS, Validade OS, ASO, Validade ASO, EPI, Validade EPI, Treinamentos, Validade Certificado, Observações)
 * 2. "Pendências trabalhistas" (Mês, Ano, Envio, Status)
 * 3. "Pendências Contratuais" (Contrato, Objeto do Contrato, Categoria, Início, Término, Status, Documentos)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Employee, Contract, TrabalhistaEnvio, AreaResponsavel, PendingDoc } from '../types/index.ts';

export const DEFAULT_SPREADSHEET_ID = '1eiiiADFvTgdKFp37zwWU5r5iJktZSdsr5BlFVAXZKIc';
const SPREADSHEET_ID_KEY = 'sst_gpa_spreadsheet_id_v1';
const WEBHOOK_URL_KEY = 'sst_gpa_webhook_url_v1';
const AUTO_SYNC_KEY = 'sst_gpa_auto_sync_sheets_v1';

export const SHEET_TABS = {
  SST: 'Pendências SST',
  TRABALHISTAS: 'Pendências trabalhistas',
  CONTRATUAIS: 'Pendências Contratuais',
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets and Drive scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  cachedUser = user;
  if (!user) {
    cachedAccessToken = null;
  }
});

export function getStoredSpreadsheetId(): string {
  try {
    return localStorage.getItem(SPREADSHEET_ID_KEY) || DEFAULT_SPREADSHEET_ID;
  } catch {
    return DEFAULT_SPREADSHEET_ID;
  }
}

export function saveStoredSpreadsheetId(id: string) {
  try {
    localStorage.setItem(SPREADSHEET_ID_KEY, id.trim());
  } catch (e) {
    console.error('Erro ao salvar Spreadsheet ID:', e);
  }
}

export function getStoredWebhookUrl(): string {
  try {
    return localStorage.getItem(WEBHOOK_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredWebhookUrl(url: string) {
  try {
    localStorage.setItem(WEBHOOK_URL_KEY, url.trim());
  } catch (e) {
    console.error('Erro ao salvar Webhook URL:', e);
  }
}

export function isAutoSyncEnabled(): boolean {
  try {
    return localStorage.getItem(AUTO_SYNC_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAutoSyncEnabled(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Erro ao salvar flag auto sync:', e);
  }
}

export function getCachedGoogleUser(): User | null {
  return cachedUser;
}

export function getStoredGoogleToken(): string | null {
  return cachedAccessToken;
}

/**
 * Conexão com Conta Google via Firebase Auth Popup
 */
export async function requestGoogleAccessToken(): Promise<{ token: string; user: User }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('Não foi possível obter o token de acesso da conta Google.');
    }

    cachedAccessToken = accessToken;
    cachedUser = result.user;
    return { token: accessToken, user: result.user };
  } catch (err: any) {
    console.error('Erro ao autenticar com o Google via Firebase:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error('A janela de autenticação do Google foi fechada antes de concluir.');
    } else if (err.code === 'auth/popup-blocked') {
      throw new Error('O navegador bloqueou a janela pop-up do Google. Por favor, permita pop-ups para este site.');
    }
    throw new Error(err.message || 'Falha na autenticação Google.');
  }
}

export async function disconnectGoogleAccount(): Promise<void> {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    cachedUser = null;
  } catch (e) {
    console.error('Erro ao desconectar conta Google:', e);
  }
}

// Execute Google Sheets API calls
async function callSheetsApi(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  token?: string
) {
  let activeToken = token || cachedAccessToken;
  if (!activeToken) {
    // Tenta obter novo token
    const authRes = await requestGoogleAccessToken();
    activeToken = authRes.token;
  }

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sessão Google expirada ou sem permissão. Por favor, clique em Conectar Conta Google.');
    }
    throw new Error(
      errorData.error?.message || `Erro na requisição Google Sheets (${response.status}): ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * 1. Inicializa ou verifica a estrutura das abas da planilha GPA_BD
 */
export async function setupSpreadsheetTabs(spreadsheetId = getStoredSpreadsheetId(), token?: string): Promise<{ success: boolean; message: string }> {
  try {
    const meta = await callSheetsApi(`${spreadsheetId}?fields=sheets.properties`, 'GET', undefined, token);
    const existingTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title);

    const neededTabs = [SHEET_TABS.SST, SHEET_TABS.TRABALHISTAS, SHEET_TABS.CONTRATUAIS];
    const requestsToAdd: any[] = [];

    neededTabs.forEach((tabTitle) => {
      if (!existingTitles.includes(tabTitle)) {
        requestsToAdd.push({
          addSheet: {
            properties: {
              title: tabTitle,
              gridProperties: { rowCount: 1500, columnCount: 20 },
            },
          },
        });
      }
    });

    if (requestsToAdd.length > 0) {
      await callSheetsApi(`${spreadsheetId}:batchUpdate`, 'POST', { requests: requestsToAdd }, token);
    }

    // Inicializa os cabeçalhos exatamente iguais aos layouts definidos
    await initializeHeaders(spreadsheetId, token);

    return { success: true, message: 'Planilha GPA_BD estruturada com as colunas oficiais!' };
  } catch (error: any) {
    console.error('Erro ao estruturar planilha:', error);
    throw error;
  }
}

/**
 * Define os cabeçalhos oficiais exatos nas abas da planilha GPA_BD
 */
export async function initializeHeaders(spreadsheetId: string, token?: string) {
  const headers = {
    [SHEET_TABS.SST]: [
      [
        'Documento',
        'Nome do Colaborador *',
        'Cargo / Função *',
        'Área / Setor *',
        'STATUS',
        'Contrato',
        'CNPJ',
        'Ordem de Serviço (NR-01) [EM_DIA / PENDENTE / VENCIDO]',
        'Validade OS (AAAA-MM-DD)',
        'ASO Ocupacional (NR-07) [EM_DIA / PENDENTE / VENCIDO]',
        'Validade ASO (AAAA-MM-DD)',
        'Ficha de EPI (NR-06) [EM_DIA / PENDENTE / VENCIDO]',
        'Validade Ficha EPI (AAAA-MM-DD)',
        'Treinamento / Certificação Técnica [EM_DIA / PENDENTE / VENCIDO / N_A]',
        'Validade Certificado (AAAA-MM-DD)',
        'Observações',
      ],
    ],
    [SHEET_TABS.TRABALHISTAS]: [
      [
        'Mês',
        'Ano',
        'Envio',
        'Status',
      ],
    ],
    [SHEET_TABS.CONTRATUAIS]: [
      [
        'Contrato',
        'Objeto do Contrato',
        'Categoria',
        'Início',
        'Término',
        'Status',
        'Documentos',
      ],
    ],
  };

  const valueData = [
    {
      range: `'${SHEET_TABS.SST}'!A1:P1`,
      values: headers[SHEET_TABS.SST],
    },
    {
      range: `'${SHEET_TABS.TRABALHISTAS}'!A1:D1`,
      values: headers[SHEET_TABS.TRABALHISTAS],
    },
    {
      range: `'${SHEET_TABS.CONTRATUAIS}'!A1:G1`,
      values: headers[SHEET_TABS.CONTRATUAIS],
    },
  ];

  await callSheetsApi(
    `${spreadsheetId}/values:batchUpdate`,
    'POST',
    {
      valueInputOption: 'USER_ENTERED',
      data: valueData,
    },
    token
  );
}

/**
 * 2. EXPORTA dados do aplicativo para a planilha Google Sheets
 */
export async function pushAllToSheets(
  data: {
    employees: Employee[];
    trabalhistas: TrabalhistaEnvio[];
    contracts: Contract[];
  },
  spreadsheetId = getStoredSpreadsheetId(),
  token?: string
): Promise<{ success: boolean; updatedCells: number }> {
  try {
    // Garante que as abas existem
    await setupSpreadsheetTabs(spreadsheetId, token);

    // Formata Aba "Pendências SST" (Colunas A até P)
    const sstRows: any[][] = data.employees.map((emp) => {
      const getDoc = (type: string) => {
        return emp.pendencias?.find((p) => p.tipo === type);
      };

      const osDoc = getDoc('ORDEM_DE_SERVICO');
      const asoDoc = getDoc('ATESTADO_SAUDE_OCUPACIONAL');
      const epiDoc = getDoc('FICHA_EPI');
      const nrDoc = getDoc('TREINAMENTO_NR') || getDoc('TREINAMENTO_RADIOPROTECAO');

      const docClean = emp.cpf ? emp.cpf.replace(/\D/g, '') : emp.matricula || '';
      const cnpjClean = '5007113000132';

      return [
        docClean, // Col A: Documento
        emp.nome, // Col B: Nome do Colaborador *
        emp.cargo || 'AGENTE DE PROTECAO', // Col C: Cargo / Função *
        emp.setor || emp.areaNome || 'GRU SEGURANCA CANAL DE II', // Col D: Área / Setor *
        emp.statusGeral === 'EM_DIA' ? 'A' : 'A', // Col E: STATUS (A = Ativo / F = Férias/Inativo)
        emp.contratoNome || emp.contratoId || '1', // Col F: Contrato
        cnpjClean, // Col G: CNPJ
        osDoc ? osDoc.status : 'EM_DIA', // Col H: Ordem de Serviço (NR-01)
        osDoc?.dataVencimento || '1/1/22027', // Col I: Validade OS (AAAA-MM-DD)
        asoDoc ? asoDoc.status : 'EM_DIA', // Col J: ASO Ocupacional (NR-07)
        asoDoc?.dataVencimento || '1/1/22027', // Col K: Validade ASO (AAAA-MM-DD)
        epiDoc ? epiDoc.status : 'EM_DIA', // Col L: Ficha de EPI (NR-06)
        epiDoc?.dataVencimento || '1/1/22027', // Col M: Validade Ficha EPI (AAAA-MM-DD)
        nrDoc ? nrDoc.status : 'EM_DIA', // Col N: Treinamento / Certificação Técnica
        nrDoc?.dataVencimento || '1/1/22027', // Col O: Validade Certificado (AAAA-MM-DD)
        `Conformidade: ${emp.indicadorPercentual || 100}%`, // Col P: Observações
      ];
    });

    // Formata Aba "Pendências trabalhistas" (Colunas A até D)
    const trabRows: any[][] = data.trabalhistas.map((t) => [
      Number(t.mes) || 1, // Col A: Mês
      Number(t.ano) || 2026, // Col B: Ano
      t.dataEnvio || new Date().toLocaleString('pt-BR'), // Col C: Envio
      t.status || 'Validado', // Col D: Status
    ]);

    // Formata Aba "Pendências Contratuais" (Colunas A até G)
    const contractRows: any[][] = data.contracts.map((c) => [
      c.numero || c.id, // Col A: Contrato
      c.objeto || c.titulo || 'PRESTAÇÃO DE SERVIÇOS DE CONTROLE DE ACESSO', // Col B: Objeto do Contrato
      c.categoria || 'ESATA', // Col C: Categoria
      c.dataInicio || c.vigenciaInicio || '01/10/2020', // Col D: Início
      c.dataTermino || c.vigenciaFim || '30/11/2026', // Col E: Término
      c.statusVigencia || (c.status === 'ATIVO' ? 'Vigente' : 'Vencido'), // Col F: Status
      c.statusDocumentos || 'Validado', // Col G: Documentos
    ]);

    // Limpa linhas existentes
    await callSheetsApi(
      `${spreadsheetId}/values:batchClear`,
      'POST',
      {
        ranges: [
          `'${SHEET_TABS.SST}'!A2:P2500`,
          `'${SHEET_TABS.TRABALHISTAS}'!A2:D2000`,
          `'${SHEET_TABS.CONTRATUAIS}'!A2:G1000`,
        ],
      },
      token
    );

    const updateData: any[] = [];
    if (sstRows.length > 0) {
      updateData.push({
        range: `'${SHEET_TABS.SST}'!A2:P${sstRows.length + 1}`,
        values: sstRows,
      });
    }
    if (trabRows.length > 0) {
      updateData.push({
        range: `'${SHEET_TABS.TRABALHISTAS}'!A2:D${trabRows.length + 1}`,
        values: trabRows,
      });
    }
    if (contractRows.length > 0) {
      updateData.push({
        range: `'${SHEET_TABS.CONTRATUAIS}'!A2:G${contractRows.length + 1}`,
        values: contractRows,
      });
    }

    if (updateData.length > 0) {
      const res = await callSheetsApi(
        `${spreadsheetId}/values:batchUpdate`,
        'POST',
        {
          valueInputOption: 'USER_ENTERED',
          data: updateData,
        },
        token
      );

      return {
        success: true,
        updatedCells: res.totalUpdatedCells || 0,
      };
    }

    return { success: true, updatedCells: 0 };
  } catch (error: any) {
    console.error('Erro ao enviar dados para Google Sheets:', error);
    throw error;
  }
}

/**
 * 3. IMPORTA dados da planilha Google Sheets
 */
export async function pullAllFromSheets(
  spreadsheetId = getStoredSpreadsheetId(),
  token?: string
): Promise<{
  employees: Employee[];
  trabalhistas: TrabalhistaEnvio[];
  contracts: Contract[];
}> {
  try {
    const ranges = [
      `'${SHEET_TABS.SST}'!A2:P2500`,
      `'${SHEET_TABS.TRABALHISTAS}'!A2:D2000`,
      `'${SHEET_TABS.CONTRATUAIS}'!A2:G1000`,
    ];

    const res = await callSheetsApi(
      `${spreadsheetId}/values:batchGet?ranges=${ranges.map(encodeURIComponent).join('&ranges=')}`,
      'GET',
      undefined,
      token
    );

    const valueRanges = res.valueRanges || [];
    const sstValues: any[][] = valueRanges[0]?.values || [];
    const trabValues: any[][] = valueRanges[1]?.values || [];
    const contractValues: any[][] = valueRanges[2]?.values || [];

    // Converter Aba 3: "Pendências Contratuais"
    const contracts: Contract[] = contractValues
      .filter((row) => row && row[0] && String(row[0]).trim().length > 0)
      .map((row, idx) => {
        const num = String(row[0] || `CTR-${idx + 1}`).trim();
        const statusVig = String(row[5] || '').toLowerCase().includes('vencid') ? 'Vencido' : 'Vigente';
        const docRaw = String(row[6] || '').trim();
        let statusDoc: any = 'Validado';
        if (docRaw.toLowerCase().includes('reprovad')) statusDoc = 'Reprovado';
        else if (docRaw.toLowerCase().includes('análise') || docRaw.toLowerCase().includes('analise')) statusDoc = 'Em Análise';

        return {
          id: `ctr_${num.replace(/[^a-zA-Z0-9]/g, '_')}`,
          numero: num,
          titulo: row[1] || num,
          objeto: row[1] || '',
          cnpjPrestador: '05.007.113/0001-32',
          empresaPrestador: 'ORBITAL SERV. AUX. DE TRANSP. AÉREO',
          categoria: row[2] || 'ESATA',
          cliente: 'GRU Airport',
          unidade: 'Terminal Operacional',
          gestorResponsavel: 'Gestão de Contratos',
          emailContato: 'fiscalizacao@gru.com.br',
          telefoneContato: '(11) 2445-0000',
          dataInicio: row[3] || '01/10/2020',
          dataTermino: row[4] || '30/11/2026',
          vigenciaInicio: row[3] || '2020-10-01',
          vigenciaFim: row[4] || '2026-11-30',
          statusVigencia: statusVig,
          statusDocumentos: statusDoc,
          status: statusVig === 'Vigente' ? 'ATIVO' : 'ENCERRADO',
          limiteBloqueioConformidade: 85,
          observacoes: `Categoria: ${row[2] || 'ESATA'} | Documentos: ${statusDoc}`,
        };
      });

    // Converter Aba 2: "Pendências trabalhistas"
    const mesesNomes: Record<number, string> = {
      1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
      5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
      9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    const trabalhistas: TrabalhistaEnvio[] = trabValues
      .filter((row) => row && row[0] && row[1])
      .map((row, idx) => {
        const mesNum = Number(row[0]) || 1;
        const anoNum = Number(row[1]) || 2026;
        const mesPadded = String(mesNum).padStart(2, '0');
        const statusRaw = String(row[3] || 'Validado').trim();
        let statusNorm: any = 'Validado';
        if (statusRaw.toLowerCase().includes('reprovad')) statusNorm = 'Reprovado';
        else if (statusRaw.toLowerCase().includes('análise') || statusRaw.toLowerCase().includes('analise')) statusNorm = 'Em Análise';

        return {
          id: `trab_${anoNum}_${mesPadded}_${idx}`,
          mes: mesPadded,
          mesNome: mesesNomes[mesNum] || `Mês ${mesNum}`,
          ano: anoNum,
          dataEnvio: row[2] || new Date().toLocaleString('pt-BR'),
          status: statusNorm,
          empresa: 'ORBITAL SERV. AUX. DE TRANSP. AÉREO',
          contratoNome: 'Contrato Geral GPA',
          documentosAnexados: ['Folha de Pagamento', 'Comprovante GFIP/FGTS', 'CNDT'],
          motivoReprovacao: statusNorm === 'Reprovado' ? 'Guia com inconsistência de recolhimento' : undefined,
          observacoes: `Envio registrado em ${row[2] || 'data não informada'}`,
          usuarioEnvio: 'Prestador (GPA_BD)',
          validadoPor: statusNorm === 'Validado' ? 'Fiscalização GRU' : undefined,
          dataValidacao: row[2] || undefined,
        };
      });

    // Converter Aba 1: "Pendências SST"
    const employees: Employee[] = sstValues
      .filter((row) => row && (row[0] || row[1]))
      .map((row, idx) => {
        const rawDoc = String(row[0] || '').trim();
        const nome = String(row[1] || `Colaborador ${idx + 1}`).trim();
        const cargo = String(row[2] || 'AGENTE DE PROTECAO').trim();
        const setor = String(row[3] || 'GRU SEGURANCA CANAL DE II').trim();

        const parseDoc = (
          tipo: any,
          nomeDoc: string,
          statusCell: string,
          validadeCell: string
        ): PendingDoc => {
          const val = String(statusCell || '').toUpperCase().trim();
          let status: any = 'EM_DIA';
          if (val.includes('VENCID')) status = 'VENCIDO';
          else if (val.includes('PENDENT')) status = 'PENDENTE';
          else if (val.includes('A_VENCER') || val.includes('A VENCER')) status = 'A_VENCER';
          else if (val.includes('ANALIS') || val.includes('ANÁLIS')) status = 'EM_ANALISE';
          else if (val.includes('N_A') || val.includes('N/A') || val.includes('NAO') || val.includes('NÃO')) status = 'NAO_APLICAVEL';

          return {
            id: `doc_${idx}_${tipo}`,
            tipo,
            nomeDocumento: nomeDoc,
            status,
            obrigatorio: true,
            categoria: 'SST',
            dataVencimento: validadeCell || '2027-01-01',
          };
        };

        const pendencias: PendingDoc[] = [
          parseDoc('ORDEM_DE_SERVICO', 'Ordem de Serviço (NR-01)', row[7], row[8]),
          parseDoc('ATESTADO_SAUDE_OCUPACIONAL', 'ASO Ocupacional (NR-07)', row[9], row[10]),
          parseDoc('FICHA_EPI', 'Ficha de EPI (NR-06)', row[11], row[12]),
          parseDoc('TREINAMENTO_NR', 'Treinamento / Certificação Técnica', row[13], row[14]),
        ];

        const hasVencido = pendencias.some((p) => p.status === 'VENCIDO');
        const hasPendente = pendencias.some((p) => p.status === 'PENDENTE');
        const hasAVencer = pendencias.some((p) => p.status === 'A_VENCER');

        let statusGeral: any = 'EM_DIA';
        if (hasVencido) statusGeral = 'NAO_CONFORME';
        else if (hasPendente) statusGeral = 'PENDENTE';
        else if (hasAVencer) statusGeral = 'A_VENCER';

        const totalValid = pendencias.filter((p) => p.status === 'EM_DIA' || p.status === 'NAO_APLICAVEL').length;
        const indicadorPercentual = Math.round((totalValid / pendencias.length) * 100);

        const isCpf = rawDoc.replace(/\D/g, '').length === 11;
        const formattedCpf = isCpf
          ? rawDoc.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          : rawDoc;

        return {
          id: `emp_${rawDoc || idx + 1}`,
          matricula: isCpf ? `MAT-${rawDoc.slice(-4)}` : rawDoc || `MAT-${1000 + idx}`,
          nome,
          cpf: formattedCpf,
          cargo,
          setor,
          empresa: 'ORBITAL SERV. AUX. DE TRANSP. AÉREO',
          contratoId: String(row[5] || '1'),
          contratoNome: `Contrato ${row[5] || '1'}`,
          areaNome: setor,
          areaResponsavelNome: 'Gestão de Segurança GRU',
          statusGeral,
          indicadorPercentual,
          pendencias,
          dataCadastro: '2026-01-01',
          dataUltimaLeitura: new Date().toLocaleDateString('pt-BR'),
        };
      });

    return { employees, trabalhistas, contracts };
  } catch (error: any) {
    console.error('Erro ao buscar dados do Google Sheets:', error);
    throw error;
  }
}

/**
 * 4. MESCLAGEM INTELIGENTE (Smart Merge / Upsert Sem Conflito)
 */
export function smartMergeData(
  current: {
    employees: Employee[];
    trabalhistas: TrabalhistaEnvio[];
    contracts: Contract[];
  },
  imported: {
    employees: Employee[];
    trabalhistas: TrabalhistaEnvio[];
    contracts: Contract[];
  }
): {
  employees: Employee[];
  trabalhistas: TrabalhistaEnvio[];
  contracts: Contract[];
  stats: {
    newEmployees: number;
    updatedEmployees: number;
    newContracts: number;
    newTrabalhistas: number;
  };
} {
  const stats = {
    newEmployees: 0,
    updatedEmployees: 0,
    newContracts: 0,
    newTrabalhistas: 0,
  };

  // 1. Merge Employees (Chave: CPF ou Matrícula ou Nome)
  const empMap = new Map<string, Employee>();
  current.employees.forEach((emp) => {
    const key = (emp.cpf || emp.matricula || emp.nome).replace(/\D/g, '') || emp.nome.toLowerCase().trim();
    empMap.set(key, emp);
  });

  imported.employees.forEach((impEmp) => {
    const key = (impEmp.cpf || impEmp.matricula || impEmp.nome).replace(/\D/g, '') || impEmp.nome.toLowerCase().trim();
    if (empMap.has(key)) {
      const existing = empMap.get(key)!;
      empMap.set(key, {
        ...existing,
        ...impEmp,
        id: existing.id,
      });
      stats.updatedEmployees++;
    } else {
      empMap.set(key, impEmp);
      stats.newEmployees++;
    }
  });

  // 2. Merge Contracts (Chave: Número do Contrato)
  const contractMap = new Map<string, Contract>();
  current.contracts.forEach((c) => {
    contractMap.set(c.numero.trim().toUpperCase(), c);
  });

  imported.contracts.forEach((impC) => {
    const key = impC.numero.trim().toUpperCase();
    if (contractMap.has(key)) {
      const existing = contractMap.get(key)!;
      contractMap.set(key, { ...existing, ...impC, id: existing.id });
    } else {
      contractMap.set(key, impC);
      stats.newContracts++;
    }
  });

  // 3. Merge Trabalhistas (Chave: Ano + Mês + Data Envio)
  const trabMap = new Map<string, TrabalhistaEnvio>();
  current.trabalhistas.forEach((t) => {
    const key = `${t.ano}_${t.mes}_${t.dataEnvio}`;
    trabMap.set(key, t);
  });

  imported.trabalhistas.forEach((impT) => {
    const key = `${impT.ano}_${impT.mes}_${impT.dataEnvio}`;
    if (!trabMap.has(key)) {
      trabMap.set(key, impT);
      stats.newTrabalhistas++;
    }
  });

  return {
    employees: Array.from(empMap.values()),
    contracts: Array.from(contractMap.values()),
    trabalhistas: Array.from(trabMap.values()),
    stats,
  };
}
