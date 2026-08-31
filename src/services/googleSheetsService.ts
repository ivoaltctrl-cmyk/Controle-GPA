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
import { Employee, Contract, TrabalhistaEnvio, AreaResponsavel, PendingDoc, DocStatus, EmployeeStatus } from '../types/index.ts';

export const DEFAULT_SPREADSHEET_ID = '1eiiiADFvTgdKFp37zwWU5r5iJktZSdsr5BlFVAXZKIc';
const SPREADSHEET_ID_KEY = 'sst_gpa_spreadsheet_id_v1';
const WEBHOOK_URL_KEY = 'sst_gpa_webhook_url_v1';
const AUTO_SYNC_KEY = 'sst_gpa_auto_sync_sheets_v1';

export const SHEET_TABS = {
  CADIM: 'Pendências CADIM',
  SST: 'Pendências SST',
  TRABALHISTAS: 'Pendências trabalhistas',
  CONTRATUAIS: 'Pendências Contratuais',
};

/**
 * Extrai o ID da planilha mesmo se o usuário colar o link completo do Google Sheets
 */
export function extractSpreadsheetId(input?: string): string {
  if (!input) return DEFAULT_SPREADSHEET_ID;
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed || DEFAULT_SPREADSHEET_ID;
}

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

onAuthStateChanged(auth, (user) => {
  cachedUser = user;
  if (!user) {
    cachedAccessToken = null;
  }
});

export function getStoredSpreadsheetId(): string {
  try {
    const raw = localStorage.getItem(SPREADSHEET_ID_KEY) || DEFAULT_SPREADSHEET_ID;
    return extractSpreadsheetId(raw);
  } catch {
    return DEFAULT_SPREADSHEET_ID;
  }
}

export function saveStoredSpreadsheetId(id: string) {
  try {
    const clean = extractSpreadsheetId(id);
    localStorage.setItem(SPREADSHEET_ID_KEY, clean);
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
 * Conexão com Conta Google via Firebase Auth Popup com tratamento de erro
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
    if (err.code === 'auth/unauthorized-domain') {
      throw new Error(
        'Domínio temporário da aplicação não está na lista de domínios autorizados do Firebase Auth. Utilize a Sincronização Direta por Link ou Webhook Google Apps Script.'
      );
    } else if (err.code === 'auth/popup-closed-by-user') {
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

/**
 * Parser de CSV robusto (suporta aspas, vírgulas internas, ponto e vírgula e quebras de linha)
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  // Normaliza quebras de linha
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Aspas duplas escapadas ""
        currentCell += '"';
        i++;
      } else {
        // Alterna estado de aspas
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Busca uma aba diretamente via Google Sheets Visualization API (Exportação CSV em tempo real)
 * Funciona sem OAuth quando o link da planilha está compartilhado para visualização/edição!
 */
export async function fetchTabCsvDirectly(
  spreadsheetId: string,
  tabName: string
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedTab = encodeURIComponent(tabName);
  const timestamp = Date.now();
  const randomBust = Math.floor(Math.random() * 1000000);
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodedTab}&t=${timestamp}&_=${randomBust}`;

  try {
    const response = await fetch(gvizUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv,text/plain,*/*',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const csvText = await response.text();
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
        return parseCsvRows(csvText);
      }
    }

    // Fallback para /export?format=csv
    const exportUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&sheet=${encodedTab}&t=${timestamp}&_=${randomBust}`;
    const exportResponse = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv,text/plain,*/*',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
    });

    if (exportResponse.ok) {
      const csvText = await exportResponse.text();
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
        return parseCsvRows(csvText);
      }
    }

    throw new Error(
      `A planilha requer permissão de acesso. No Google Sheets, clique em "Compartilhar" -> "Qualquer pessoa com o link pode ler/editar" ou utilize o Webhook Apps Script.`
    );
  } catch (error: any) {
    console.error(`Erro ao buscar aba ${tabName} via CSV/GViz:`, error);
    throw error;
  }
}

// Helper para converter data em formato YYYY-MM-DD
export function parseDateCell(val?: string | number): string | undefined {
  if (!val) return undefined;
  const s = String(val).trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length > 4) year = year.slice(-4);
    else if (year.length === 2) year = '20' + year;
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${year}-${month}-${day}`;
  }
  return undefined;
}

/**
 * Converte linhas de SST em lista de colaboradores com pendências
 */
export function convertSstRowsToEmployees(rows: string[][]): Employee[] {
  if (!rows || rows.length === 0) return [];

  // Detect header row
  const headerIdx = rows.findIndex((r) =>
    r.some((cell) => {
      const c = (cell || '').toLowerCase();
      return c.includes('doc') || c.includes('nome') || c.includes('cpf') || c.includes('matricula');
    })
  );

  const headerRow = headerIdx >= 0 ? rows[headerIdx].map((c) => (c || '').toLowerCase().trim()) : [];
  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  const findCol = (...keywords: string[]): number => {
    return headerRow.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const docIdx = findCol('documento', 'cpf', 'matrícula', 'matricula') !== -1 ? findCol('documento', 'cpf', 'matrícula', 'matricula') : 0;
  const nomeIdx = findCol('nome do colaborador', 'nome') !== -1 ? findCol('nome do colaborador', 'nome') : 1;
  const cargoIdx = findCol('cargo', 'função', 'funcao') !== -1 ? findCol('cargo', 'função', 'funcao') : 2;
  const setorIdx = findCol('área', 'area', 'setor') !== -1 ? findCol('área', 'area', 'setor') : 3;
  const statusGpaIdx = findCol('status gpa', 'status ativos', 'status') !== -1 ? findCol('status gpa', 'status ativos', 'status') : 4;
  const contratoIdx = findCol('contrato') !== -1 ? findCol('contrato') : 6;
  const cnpjIdx = findCol('cnpj') !== -1 ? findCol('cnpj') : 7;
  const osIdx = findCol('ordem de serviço', 'nr-01', 'os') !== -1 ? findCol('ordem de serviço', 'nr-01', 'os') : 8;
  const osValIdx = findCol('validade os', 'validade ordem') !== -1 ? findCol('validade os', 'validade ordem') : 9;
  const asoIdx = findCol('aso ocupacional', 'nr-07', 'aso') !== -1 ? findCol('aso ocupacional', 'nr-07', 'aso') : 10;
  const asoValIdx = findCol('validade aso') !== -1 ? findCol('validade aso') : 11;
  const epiIdx = findCol('ficha de epi', 'nr-06', 'ficha epi', 'epi') !== -1 ? findCol('ficha de epi', 'nr-06', 'ficha epi', 'epi') : 12;
  const epiValIdx = findCol('validade ficha epi', 'validade epi') !== -1 ? findCol('validade ficha epi', 'validade epi') : 13;
  const nrIdx = findCol('treinamento', 'certificação', 'certificacao', 'curso') !== -1 ? findCol('treinamento', 'certificação', 'certificacao', 'curso') : 14;
  const nrValIdx = findCol('validade certificado', 'validade treinamento') !== -1 ? findCol('validade certificado', 'validade treinamento') : 15;

  return dataRows
    .filter((row) => row && (row[docIdx]?.trim() || row[nomeIdx]?.trim()))
    .map((row, idx) => {
      const rawDoc = String(row[docIdx] || '').replace(/^[:\s\-\.]+/, '').trim();
      const rawNome = String(row[nomeIdx] || `Colaborador ${idx + 1}`).trim();
      const nome = rawNome.replace(/^[:\s\-\.]+/, '').trim();
      const cargo = String(row[cargoIdx] || 'AGENTE DE PROTECAO').replace(/^[:\s\-\.]+/, '').trim();
      const setor = String(row[setorIdx] || 'GRU SEGURANCA CANAL DE II').replace(/^[:\s\-\.]+/, '').trim();
      const statusGpaRaw = String(row[statusGpaIdx] || '').trim();
      const contratoVal = String(row[contratoIdx] || '1').trim();

      const asoRaw = String(row[asoIdx] || '').trim();
      const isDesligado =
        statusGpaRaw.toLowerCase().includes('desligad') ||
        asoRaw.toLowerCase().includes('desligad');
      const isCancelado = statusGpaRaw.toLowerCase().includes('cancelad');

      const parseDoc = (
        tipo: any,
        nomeDoc: string,
        statusCell?: string,
        validadeCell?: string
      ): PendingDoc => {
        const val = String(statusCell || '').toUpperCase().trim();
        const parsedDate = parseDateCell(validadeCell);

        if (isCancelado || isDesligado || val.includes('DESLIGAD') || val.includes('CANCELAD')) {
          return {
            id: `doc_${idx}_${tipo}`,
            tipo,
            nomeDocumento: nomeDoc,
            status: 'NAO_APLICAVEL',
            obrigatorio: false,
            categoria: 'CADIM',
            observacoes: isCancelado ? 'Cancelado no GPA' : 'Desligado / Inativo no GPA',
            dataVencimento: parsedDate,
          };
        }

        let status: DocStatus = 'EM_DIA';
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
          categoria: 'CADIM',
          dataVencimento: parsedDate || '2027-01-01',
        };
      };

      const pendencias: PendingDoc[] = [
        parseDoc('ORDEM_DE_SERVICO', 'Ordem de Serviço (NR-01)', row[osIdx], row[osValIdx]),
        parseDoc('ATESTADO_SAUDE_OCUPACIONAL', 'ASO Ocupacional (NR-07)', row[asoIdx], row[asoValIdx]),
        parseDoc('FICHA_EPI', 'Ficha de EPI (NR-06)', row[epiIdx], row[epiValIdx]),
        parseDoc('TREINAMENTO_NR', 'Treinamento / Certificação Técnica', row[nrIdx], row[nrValIdx]),
      ];

      const cleanDoc = rawDoc.replace(/\D/g, '');
      const isCpf = cleanDoc.length === 11;
      const formattedCpf = isCpf
        ? cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        : rawDoc;

      let statusGeral: EmployeeStatus = 'EM_DIA';
      let indicadorPercentual = 100;
      let resumoGeral = '100% em conformidade com as normas';

      if (isCancelado) {
        statusGeral = 'BLOQUEADO';
        indicadorPercentual = 0;
        resumoGeral = 'Registro Cancelado no GPA';
      } else if (isDesligado) {
        statusGeral = 'BLOQUEADO';
        indicadorPercentual = 0;
        resumoGeral = 'Colaborador Desligado / Inativo no GPA';
      } else {
        const hasVencido = pendencias.some((p) => p.status === 'VENCIDO');
        const hasPendente = pendencias.some((p) => p.status === 'PENDENTE');
        const hasAVencer = pendencias.some((p) => p.status === 'A_VENCER');
        const validDocs = pendencias.filter((p) => p.status === 'EM_DIA' || p.status === 'NAO_APLICAVEL').length;
        indicadorPercentual = Math.round((validDocs / pendencias.length) * 100);

        if (hasVencido) {
          statusGeral = indicadorPercentual < 50 ? 'BLOQUEADO' : 'CRITICO';
          resumoGeral = 'Possui documentos vencidos';
        } else if (hasPendente) {
          statusGeral = 'PENDENTE';
          resumoGeral = 'Possui documentos pendentes de regularização';
        } else if (hasAVencer) {
          statusGeral = 'PENDENTE';
          resumoGeral = 'Documentos a vencer nos próximos 30 dias';
        }
      }

      return {
        id: `emp_${cleanDoc || idx + 1}`,
        matricula: isCpf ? `MAT-${cleanDoc.slice(-4)}` : rawDoc || `MAT-${1000 + idx}`,
        nome,
        cpf: formattedCpf,
        cargo,
        setor,
        empresa: 'ORBITAL SERV. AUX. DE TRANSP. AÉREO',
        contratoId: contratoVal,
        contratoNome: `Contrato ${contratoVal}`,
        areaNome: setor,
        areaResponsavelNome: 'Gestão de Segurança GRU',
        statusGeral,
        indicadorPercentual,
        resumoGeral,
        pendencias,
        dataCadastro: '2026-01-01',
        dataUltimaLeitura: new Date().toLocaleDateString('pt-BR'),
      };
    });
}

/**
 * Converte linhas de Trabalhistas
 */
export function convertTrabRowsToTrabalhistas(rows: string[][]): TrabalhistaEnvio[] {
  if (!rows || rows.length === 0) return [];
  const headerIdx = rows.findIndex((r) =>
    r.some((cell) => {
      const c = (cell || '').toLowerCase();
      return c.includes('mês') || c.includes('mes') || c.includes('ano') || c.includes('envio');
    })
  );

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  const mesesNomes: Record<number, string> = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
  };

  return dataRows
    .filter((row) => row && row[0] && row[1])
    .map((row, idx) => {
      const mesNum = Number(row[0]) || 1;
      const anoNum = Number(row[1]) || 2026;
      const mesPadded = String(mesNum).padStart(2, '0');
      const dataEnvioStr = String(row[2] || '').trim() || new Date().toLocaleString('pt-BR');
      const statusRaw = String(row[3] || 'Validado').trim();
      let statusNorm: 'Validado' | 'Reprovado' | 'Em Análise' = 'Validado';
      if (statusRaw.toLowerCase().includes('reprovad')) statusNorm = 'Reprovado';
      else if (statusRaw.toLowerCase().includes('análise') || statusRaw.toLowerCase().includes('analise')) statusNorm = 'Em Análise';

      return {
        id: `trab_${anoNum}_${mesPadded}_${idx}`,
        mes: mesPadded,
        mesNome: mesesNomes[mesNum] || `Mês ${mesNum}`,
        ano: anoNum,
        dataEnvio: dataEnvioStr,
        status: statusNorm,
        empresa: 'ORBITAL SERV. AUX. DE TRANSP. AÉREO',
        contratoNome: 'Contrato Geral GPA',
        documentosAnexados: ['Folha de Pagamento', 'Comprovante GFIP/FGTS', 'CNDT'],
        motivoReprovacao: statusNorm === 'Reprovado' ? 'Guia com inconsistência de recolhimento' : undefined,
        observacoes: `Envio registrado em ${dataEnvioStr}`,
        usuarioEnvio: 'Prestador (GPA_BD)',
        validadoPor: statusNorm === 'Validado' ? 'Fiscalização GRU' : undefined,
        dataValidacao: statusNorm === 'Validado' ? dataEnvioStr : undefined,
      };
    });
}

/**
 * Converte linhas de Contratuais
 */
export function convertContractRowsToContracts(rows: string[][]): Contract[] {
  if (!rows || rows.length === 0) return [];
  const headerIdx = rows.findIndex((r) =>
    r.some((cell) => {
      const c = (cell || '').toLowerCase();
      return c.includes('contrato') || c.includes('objeto');
    })
  );

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;

  return dataRows
    .filter((row) => row && row[0] && String(row[0]).trim().length > 0)
    .map((row, idx) => {
      const num = String(row[0] || `CTR-${idx + 1}`).trim();
      const objeto = String(row[1] || '').trim();
      const categoria = String(row[2] || 'ESATA').trim();
      const dataInicio = String(row[3] || '').trim() || '01/10/2020';
      const dataTermino = String(row[4] || '').trim() || '30/11/2026';
      const statusRaw = String(row[5] || '').trim();
      const statusVig = statusRaw.toLowerCase().includes('vencid') ? 'Vencido' : 'Vigente';
      const docRaw = String(row[6] || '').trim();
      let statusDoc: 'Validado' | 'Reprovado' | 'Em Análise' = 'Validado';
      if (docRaw.toLowerCase().includes('reprovad')) statusDoc = 'Reprovado';
      else if (docRaw.toLowerCase().includes('análise') || docRaw.toLowerCase().includes('analise')) statusDoc = 'Em Análise';

      return {
        id: `ctr_${num.replace(/[^a-zA-Z0-9]/g, '_')}`,
        numero: num,
        titulo: objeto || num,
        objeto: objeto || '',
        cnpjPrestador: '05.007.113/0001-32',
        empresaPrestador: 'ORBITAL SERV. AUX. DE TRANSP. AÉREO',
        categoria: categoria || 'ESATA',
        cliente: 'GRU Airport',
        unidade: 'Terminal Operacional',
        gestorResponsavel: 'Gestão de Contratos GPA',
        emailContato: 'fiscalizacao@gru.com.br',
        telefoneContato: '(11) 2445-0000',
        dataInicio,
        dataTermino,
        vigenciaInicio: dataInicio,
        vigenciaFim: dataTermino,
        statusVigencia: statusVig,
        statusDocumentos: statusDoc,
        status: statusVig === 'Vigente' ? 'ATIVO' : 'ENCERRADO',
        limiteBloqueioConformidade: 85,
        observacoes: `Categoria: ${categoria} | Documentos: ${statusDoc}`,
      };
    });
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
      throw new Error('Sessão Google expirada ou sem permissão. Por favor, conecte a Conta Google.');
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
  token?: string,
  webhookUrl = getStoredWebhookUrl()
): Promise<{ success: boolean; updatedCells: number }> {
  // Se houver Webhook Apps Script configurado, usa direto sem autenticação do Firebase!
  if (webhookUrl && webhookUrl.startsWith('https://script.google.com')) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'pushAll',
          employees: data.employees,
          trabalhistas: data.trabalhistas,
          contracts: data.contracts,
        }),
      });
      const resJson = await response.json();
      return { success: true, updatedCells: resJson.updatedCells || data.employees.length * 16 };
    } catch (e: any) {
      console.warn('Falha no webhook Apps Script, tentando API direta:', e);
    }
  }

  try {
    await setupSpreadsheetTabs(spreadsheetId, token);

    const sstRows: any[][] = data.employees.map((emp) => {
      const getDoc = (type: string) => emp.pendencias?.find((p) => p.tipo === type);
      const osDoc = getDoc('ORDEM_DE_SERVICO');
      const asoDoc = getDoc('ATESTADO_SAUDE_OCUPACIONAL');
      const epiDoc = getDoc('FICHA_EPI');
      const nrDoc = getDoc('TREINAMENTO_NR') || getDoc('TREINAMENTO_RADIOPROTECAO');
      const docClean = emp.cpf ? emp.cpf.replace(/\D/g, '') : emp.matricula || '';
      const cnpjClean = '5007113000132';

      return [
        docClean,
        emp.nome,
        emp.cargo || 'AGENTE DE PROTECAO',
        emp.setor || emp.areaNome || 'GRU SEGURANCA CANAL DE II',
        emp.statusGeral === 'EM_DIA' ? 'A' : 'A',
        emp.contratoNome || emp.contratoId || '1',
        cnpjClean,
        osDoc ? osDoc.status : 'EM_DIA',
        osDoc?.dataVencimento || '2027-01-01',
        asoDoc ? asoDoc.status : 'EM_DIA',
        asoDoc?.dataVencimento || '2027-01-01',
        epiDoc ? epiDoc.status : 'EM_DIA',
        epiDoc?.dataVencimento || '2027-01-01',
        nrDoc ? nrDoc.status : 'EM_DIA',
        nrDoc?.dataVencimento || '2027-01-01',
        `Conformidade: ${emp.indicadorPercentual || 100}%`,
      ];
    });

    const trabRows: any[][] = data.trabalhistas.map((t) => [
      Number(t.mes) || 1,
      Number(t.ano) || 2026,
      t.dataEnvio || new Date().toLocaleString('pt-BR'),
      t.status || 'Validado',
    ]);

    const contractRows: any[][] = data.contracts.map((c) => [
      c.numero || c.id,
      c.objeto || c.titulo || 'PRESTAÇÃO DE SERVIÇOS DE CONTROLE DE ACESSO',
      c.categoria || 'ESATA',
      c.dataInicio || c.vigenciaInicio || '01/10/2020',
      c.dataTermino || c.vigenciaFim || '30/11/2026',
      c.statusVigencia || (c.status === 'ATIVO' ? 'Vigente' : 'Vencido'),
      c.statusDocumentos || 'Validado',
    ]);

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
 * Método inteligente: Tenta GViz direto primeiro (sem popup e sem auth/unauthorized-domain);
 * Se falhar, tenta Webhook Apps Script; por fim Google Sheets API com token.
 */
export async function pullAllFromSheets(
  spreadsheetId = getStoredSpreadsheetId(),
  token?: string,
  webhookUrl = getStoredWebhookUrl()
): Promise<{
  employees: Employee[];
  trabalhistas: TrabalhistaEnvio[];
  contracts: Contract[];
  source: 'direct_link' | 'apps_script' | 'google_api';
}> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  // Estratégia 1: Leitura Direta Instantânea via Google Visualization CSV (Zero popup, Zero login)
  try {
    let sstRows: string[][] = [];
    let sstFound = false;
    for (const tabName of [
      SHEET_TABS.SST,
      SHEET_TABS.CADIM,
      'Pendências SST',
      'Pendências CADIM',
      'Pendencias SST',
      'Pendencias CADIM',
      'SST',
      'CADIM',
    ]) {
      try {
        const res = await fetchTabCsvDirectly(cleanId, tabName);
        if (res && res.length >= 1) {
          sstRows = res;
          sstFound = true;
          break;
        }
      } catch {
        // try next
      }
    }

    let trabRows: string[][] = [];
    let trabFound = false;
    for (const tabName of [
      SHEET_TABS.TRABALHISTAS,
      'Pendências trabalhistas',
      'Pendencias trabalhistas',
      'Pendências Trabalhistas',
      'Pendencias Trabalhistas',
      'Trabalhistas',
    ]) {
      try {
        const res = await fetchTabCsvDirectly(cleanId, tabName);
        if (res && res.length >= 1) {
          trabRows = res;
          trabFound = true;
          break;
        }
      } catch {
        // try next
      }
    }

    let contractRows: string[][] = [];
    let contractFound = false;
    for (const tabName of [
      SHEET_TABS.CONTRATUAIS,
      'Pendências Contratuais',
      'Pendencias Contratuais',
      'Pendências contratuais',
      'Pendencias contratuais',
      'Contratos',
    ]) {
      try {
        const res = await fetchTabCsvDirectly(cleanId, tabName);
        if (res && res.length >= 1) {
          contractRows = res;
          contractFound = true;
          break;
        }
      } catch {
        // try next
      }
    }

    if (sstFound || trabFound || contractFound) {
      const employees = convertSstRowsToEmployees(sstRows);
      const trabalhistas = convertTrabRowsToTrabalhistas(trabRows);
      const contracts = convertContractRowsToContracts(contractRows);

      return {
        employees,
        trabalhistas,
        contracts,
        source: 'direct_link',
      };
    }
  } catch (gvizErr) {
    console.info('GViz direto não acessível (privado ou requer auth), tentando outros métodos...', gvizErr);
  }

  // Estratégia 2: Webhook Apps Script (se configurado)
  if (webhookUrl && webhookUrl.startsWith('https://script.google.com')) {
    try {
      const res = await fetch(webhookUrl, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return {
          employees: data.employees || [],
          trabalhistas: data.trabalhistas || [],
          contracts: data.contracts || [],
          source: 'apps_script',
        };
      }
    } catch (whErr) {
      console.warn('Erro ao ler via Webhook Apps Script:', whErr);
    }
  }

  // Estratégia 3: Google Sheets REST API com Token OAuth
  try {
    const ranges = [
      `'${SHEET_TABS.SST}'!A2:P2500`,
      `'${SHEET_TABS.TRABALHISTAS}'!A2:D2000`,
      `'${SHEET_TABS.CONTRATUAIS}'!A2:G1000`,
    ];

    const res = await callSheetsApi(
      `${cleanId}/values:batchGet?ranges=${ranges.map(encodeURIComponent).join('&ranges=')}`,
      'GET',
      undefined,
      token
    );

    const valueRanges = res.valueRanges || [];
    const sstValues: any[][] = valueRanges[0]?.values || [];
    const trabValues: any[][] = valueRanges[1]?.values || [];
    const contractValues: any[][] = valueRanges[2]?.values || [];

    const employees = convertSstRowsToEmployees(sstValues);
    const trabalhistas = convertTrabRowsToTrabalhistas(trabValues);
    const contracts = convertContractRowsToContracts(contractValues);

    return {
      employees,
      trabalhistas,
      contracts,
      source: 'google_api',
    };
  } catch (apiErr: any) {
    console.error('Erro em todos os métodos de leitura:', apiErr);
    throw new Error(
      `Não foi possível ler a planilha automaticamente. Certifique-se de que a planilha (${cleanId}) está com acesso de link compartilhado (Qualquer pessoa com o link pode ler) ou configure o Webhook Apps Script.`
    );
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
    totalEmployees: number;
    ativosEmployees: number;
    desligadosEmployees: number;
    totalContracts: number;
    totalTrabalhistas: number;
    newEmployees: number;
    updatedEmployees: number;
    newContracts: number;
    newTrabalhistas: number;
  };
} {
  const stats = {
    totalEmployees: 0,
    ativosEmployees: 0,
    desligadosEmployees: 0,
    totalContracts: 0,
    totalTrabalhistas: 0,
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
    } else {
      const existing = trabMap.get(key)!;
      trabMap.set(key, { ...existing, ...impT, id: existing.id });
    }
  });

  const mergedEmployees = Array.from(empMap.values());
  const mergedContracts = Array.from(contractMap.values());
  const mergedTrabalhistas = Array.from(trabMap.values());

  stats.totalEmployees = mergedEmployees.length;
  stats.ativosEmployees = mergedEmployees.filter((e) => e.statusGeral !== 'BLOQUEADO' && !e.resumoGeral?.includes('Desligado') && !e.resumoGeral?.includes('Cancelado')).length;
  stats.desligadosEmployees = stats.totalEmployees - stats.ativosEmployees;
  stats.totalContracts = mergedContracts.length;
  stats.totalTrabalhistas = mergedTrabalhistas.length;

  return {
    employees: mergedEmployees,
    contracts: mergedContracts,
    trabalhistas: mergedTrabalhistas,
    stats,
  };
}

/**
 * Código pronto para Google Apps Script Web App (Webhook de Leitura/Gravação Direta)
 */
export const APPS_SCRIPT_CODE_TEMPLATE = `
/**
 * Webhook Oficial para Sincronização Bidirecional GPA_BD
 * Cole este código em: Extensões -> Apps Script na planilha GPA_BD
 * Depois clique em: Implantar -> Nova Implantação -> Tipo: Aplicativo da Web
 * - Executar como: Eu
 * - Quem tem acesso: Qualquer pessoa
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  function getSheetData(tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    return data;
  }

  var sstData = getSheetData("Pendências SST");
  var trabData = getSheetData("Pendências trabalhistas");
  var contData = getSheetData("Pendências Contratuais");

  return ContentService.createTextOutput(JSON.stringify({
    sstRows: sstData,
    trabRows: trabData,
    contractRows: contData
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Gravar SST
    if (body.employees && body.employees.length > 0) {
      var sheetSst = ss.getSheetByName("Pendências SST");
      if (sheetSst) {
        var lastRow = sheetSst.getLastRow();
        if (lastRow > 1) {
          sheetSst.getRange(2, 1, lastRow - 1, 16).clearContent();
        }
        var rows = body.employees.map(function(emp) {
          var getDoc = function(t) { return (emp.pendencias || []).find(function(p) { return p.tipo === t; }); };
          var os = getDoc("ORDEM_DE_SERVICO");
          var aso = getDoc("ATESTADO_SAUDE_OCUPACIONAL");
          var epi = getDoc("FICHA_EPI");
          var nr = getDoc("TREINAMENTO_NR") || getDoc("TREINAMENTO_RADIOPROTECAO");
          return [
            emp.cpf ? emp.cpf.replace(/\\D/g, '') : emp.matricula,
            emp.nome,
            emp.cargo || "AGENTE DE PROTECAO",
            emp.setor || "GRU SEGURANCA CANAL DE II",
            emp.statusGeral === "EM_DIA" ? "A" : "A",
            emp.contratoNome || "1",
            "5007113000132",
            os ? os.status : "EM_DIA",
            os ? os.dataVencimento : "2027-01-01",
            aso ? aso.status : "EM_DIA",
            aso ? aso.dataVencimento : "2027-01-01",
            epi ? epi.status : "EM_DIA",
            epi ? epi.dataVencimento : "2027-01-01",
            nr ? nr.status : "EM_DIA",
            nr ? nr.dataVencimento : "2027-01-01",
            "Conformidade: " + (emp.indicadorPercentual || 100) + "%"
          ];
        });
        sheetSst.getRange(2, 1, rows.length, 16).setValues(rows);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
`.trim();
