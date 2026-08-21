import * as XLSX from 'xlsx';
import { Contract, Employee, DemandLog, SystemStats, PendingDoc } from '../types/index.ts';
import { INITIAL_CONTRACTS, INITIAL_EMPLOYEES, INITIAL_DEMAND_LOGS } from '../data/mockData.ts';

const EMPLOYEES_KEY = 'sst_pendencias_employees_v1';
const CONTRACTS_KEY = 'sst_pendencias_contracts_v1';
const DEMAND_LOGS_KEY = 'sst_pendencias_demand_logs_v1';

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_KEY);
    if (!raw) {
      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler funcionários do localStorage:', e);
    return INITIAL_EMPLOYEES;
  }
}

export function saveStoredEmployees(employees: Employee[]) {
  try {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  } catch (e) {
    console.error('Erro ao salvar funcionários:', e);
  }
}

export function getStoredContracts(): Contract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_KEY);
    if (!raw) {
      localStorage.setItem(CONTRACTS_KEY, JSON.stringify(INITIAL_CONTRACTS));
      return INITIAL_CONTRACTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler contratos:', e);
    return INITIAL_CONTRACTS;
  }
}

export function saveStoredContracts(contracts: Contract[]) {
  try {
    localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.error('Erro ao salvar contratos:', e);
  }
}

export function getStoredDemandLogs(): DemandLog[] {
  try {
    const raw = localStorage.getItem(DEMAND_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(DEMAND_LOGS_KEY, JSON.stringify(INITIAL_DEMAND_LOGS));
      return INITIAL_DEMAND_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler logs de demanda:', e);
    return INITIAL_DEMAND_LOGS;
  }
}

export function saveStoredDemandLogs(logs: DemandLog[]) {
  try {
    localStorage.setItem(DEMAND_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar logs de demanda:', e);
  }
}

export function resetDatabaseToDefaults() {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(INITIAL_EMPLOYEES));
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(INITIAL_CONTRACTS));
  localStorage.setItem(DEMAND_LOGS_KEY, JSON.stringify(INITIAL_DEMAND_LOGS));
}

export function calculateSystemStats(employees: Employee[]): SystemStats {
  const total = employees.length;
  if (total === 0) {
    return {
      totalFuncionarios: 0,
      totalEmDia: 0,
      totalComPendencia: 0,
      totalCriticos: 0,
      totalBloqueados: 0,
      taxaConformidadeGeral: 0,
      ordemServico: { total: 0, emDia: 0, pendente: 0, vencido: 0, taxa: 0 },
      aso: { total: 0, emDia: 0, pendente: 0, vencido: 0, taxa: 0 },
      fichaEpi: { total: 0, emDia: 0, pendente: 0, vencido: 0, taxa: 0 },
      radioprotecao: { total: 0, emDia: 0, pendente: 0, vencido: 0, taxa: 0 },
    };
  }

  let totalEmDia = 0;
  let totalCriticos = 0;
  let totalBloqueados = 0;
  let totalComPendencia = 0;
  let sumIndicators = 0;

  const osStats = { total: 0, emDia: 0, pendente: 0, vencido: 0 };
  const asoStats = { total: 0, emDia: 0, pendente: 0, vencido: 0 };
  const epiStats = { total: 0, emDia: 0, pendente: 0, vencido: 0 };
  const radioStats = { total: 0, emDia: 0, pendente: 0, vencido: 0 };

  for (const emp of employees) {
    sumIndicators += emp.indicadorPercentual || 0;

    if (emp.statusGeral === 'EM_DIA') totalEmDia++;
    else if (emp.statusGeral === 'CRITICO') totalCriticos++;
    else if (emp.statusGeral === 'BLOQUEADO') totalBloqueados++;

    if (emp.statusGeral !== 'EM_DIA') {
      totalComPendencia++;
    }

    for (const p of emp.pendencias || []) {
      if (p.tipo === 'ORDEM_DE_SERVICO') {
        osStats.total++;
        if (p.status === 'EM_DIA') osStats.emDia++;
        else if (p.status === 'VENCIDO') osStats.vencido++;
        else if (p.status === 'PENDENTE' || p.status === 'EM_ANALISE') osStats.pendente++;
      } else if (p.tipo === 'ATESTADO_SAUDE_OCUPACIONAL') {
        asoStats.total++;
        if (p.status === 'EM_DIA') asoStats.emDia++;
        else if (p.status === 'VENCIDO') asoStats.vencido++;
        else if (p.status === 'PENDENTE' || p.status === 'EM_ANALISE') asoStats.pendente++;
      } else if (p.tipo === 'FICHA_EPI') {
        epiStats.total++;
        if (p.status === 'EM_DIA') epiStats.emDia++;
        else if (p.status === 'VENCIDO') epiStats.vencido++;
        else if (p.status === 'PENDENTE' || p.status === 'EM_ANALISE') epiStats.pendente++;
      } else if (p.tipo === 'TREINAMENTO_RADIOPROTECAO') {
        if (p.status !== 'NAO_APLICAVEL') {
          radioStats.total++;
          if (p.status === 'EM_DIA') radioStats.emDia++;
          else if (p.status === 'VENCIDO') radioStats.vencido++;
          else if (p.status === 'PENDENTE' || p.status === 'EM_ANALISE') radioStats.pendente++;
        }
      }
    }
  }

  const taxaGeral = Math.round(sumIndicators / total);

  return {
    totalFuncionarios: total,
    totalEmDia,
    totalComPendencia,
    totalCriticos,
    totalBloqueados,
    taxaConformidadeGeral: taxaGeral,
    ordemServico: {
      ...osStats,
      taxa: osStats.total > 0 ? Math.round((osStats.emDia / osStats.total) * 100) : 100,
    },
    aso: {
      ...asoStats,
      taxa: asoStats.total > 0 ? Math.round((asoStats.emDia / asoStats.total) * 100) : 100,
    },
    fichaEpi: {
      ...epiStats,
      taxa: epiStats.total > 0 ? Math.round((epiStats.emDia / epiStats.total) * 100) : 100,
    },
    radioprotecao: {
      ...radioStats,
      taxa: radioStats.total > 0 ? Math.round((radioStats.emDia / radioStats.total) * 100) : 100,
    },
  };
}

export function calculateContractMetrics(contractId: string, employees: Employee[]) {
  const contractEmployees = employees.filter((e) => e.contratoId === contractId);
  const total = contractEmployees.length;

  if (total === 0) {
    return {
      totalColaboradores: 0,
      emDia: 0,
      comPendencias: 0,
      criticos: 0,
      taxaConformidade: 100,
      temBloqueio: false,
    };
  }

  let emDia = 0;
  let criticos = 0;
  let sumScore = 0;

  for (const emp of contractEmployees) {
    sumScore += emp.indicadorPercentual || 0;
    if (emp.statusGeral === 'EM_DIA') emDia++;
    if (emp.statusGeral === 'CRITICO' || emp.statusGeral === 'BLOQUEADO') criticos++;
  }

  const taxa = Math.round(sumScore / total);
  return {
    totalColaboradores: total,
    emDia,
    comPendencias: total - emDia,
    criticos,
    taxaConformidade: taxa,
    temBloqueio: criticos > 0 || taxa < 80,
  };
}

/**
 * Recalculates an employee's compliance score (0-100) and status general
 * based on their pending docs.
 */
export function recalculateEmployeeStatus(emp: Partial<Employee>): {
  indicadorPercentual: number;
  statusGeral: 'EM_DIA' | 'PENDENTE' | 'CRITICO' | 'BLOQUEADO';
} {
  const docs = emp.pendencias || [];
  if (docs.length === 0) {
    return { indicadorPercentual: 100, statusGeral: 'EM_DIA' };
  }

  const applicableDocs = docs.filter((d) => d.status !== 'NAO_APLICAVEL');
  if (applicableDocs.length === 0) {
    return { indicadorPercentual: 100, statusGeral: 'EM_DIA' };
  }

  let okCount = 0;
  let hasVencido = false;
  let hasPendente = false;

  for (const d of applicableDocs) {
    if (d.status === 'EM_DIA') {
      okCount++;
    } else if (d.status === 'VENCIDO') {
      hasVencido = true;
    } else if (d.status === 'PENDENTE' || d.status === 'EM_ANALISE') {
      hasPendente = true;
    }
  }

  const score = Math.round((okCount / applicableDocs.length) * 100);

  let status: 'EM_DIA' | 'PENDENTE' | 'CRITICO' | 'BLOQUEADO' = 'EM_DIA';
  if (score === 100) {
    status = 'EM_DIA';
  } else if (hasVencido && score < 50) {
    status = 'BLOQUEADO';
  } else if (hasVencido) {
    status = 'CRITICO';
  } else if (hasPendente) {
    status = 'PENDENTE';
  }

  return {
    indicadorPercentual: score,
    statusGeral: status,
  };
}

/**
 * Generates an Excel (.xlsx) file with employees and documents
 */
export function exportEmployeesToExcel(employees: Employee[], contracts: Contract[]) {
  const rows = employees.map((emp) => {
    const getDocStatus = (type: string) => {
      const doc = emp.pendencias.find((p) => p.tipo === type);
      if (!doc) return 'NÃO CONSTA';
      if (doc.status === 'NAO_APLICAVEL') return 'N/A';
      return `${doc.status}${doc.dataVencimento ? ` (Venc: ${doc.dataVencimento})` : ''}`;
    };

    return {
      'Nome do Colaborador': emp.nome,
      'Matrícula': emp.matricula,
      'CPF': emp.cpf || '',
      'Cargo/Função': emp.cargo,
      'Setor': emp.setor,
      'Empresa / Prestadora': emp.empresa,
      'Contrato': emp.contratoNome || '',
      'Status Geral': emp.statusGeral,
      'Índice de Conformidade (%)': `${emp.indicadorPercentual}%`,
      'Ordem de Serviço (NR-01)': getDocStatus('ORDEM_DE_SERVICO'),
      'ASO (NR-07)': getDocStatus('ATESTADO_SAUDE_OCUPACIONAL'),
      'Ficha de EPI (NR-06)': getDocStatus('FICHA_EPI'),
      'Treinamento Radioproteção': getDocStatus('TREINAMENTO_RADIOPROTECAO'),
      'Resumo de Pendências': emp.resumoGeral || '',
      'Última Atualização': emp.dataUltimaLeitura || emp.dataCadastro,
    };
  });

  const contractsRows = contracts.map((c) => {
    const metrics = calculateContractMetrics(c.id, employees);
    return {
      'Código do Contrato': c.numero,
      'Título / Objeto': c.titulo,
      'Cliente': c.cliente,
      'Unidade / Local': c.unidade,
      'Gestor Responsável': c.gestorResponsavel,
      'E-mail Contato': c.emailContato || '',
      'Telefone': c.telefoneContato || '',
      'Vigência Início': c.vigenciaInicio,
      'Vigência Fim': c.vigenciaFim,
      'Total de Funcionários': metrics.totalColaboradores,
      'Em Dia': metrics.emDia,
      'Com Pendências': metrics.comPendencias,
      'Taxa de Conformidade': `${metrics.taxaConformidade}%`,
      'Status de Acesso': metrics.temBloqueio ? 'BLOQUEADO / ALERTA' : 'REGULAR',
    };
  });

  const wb = XLSX.utils.book_new();

  const wsEmployees = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Colaboradores e Pendências');

  const wsContracts = XLSX.utils.json_to_sheet(contractsRows);
  XLSX.utils.book_append_sheet(wb, wsContracts, 'Matriz de Contratos');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Relatorio_Pendencias_SST_${today}.xlsx`);
}

/**
 * Downloads a structured CSV
 */
export function exportEmployeesToCsv(employees: Employee[]) {
  const headers = [
    'Nome',
    'Matricula',
    'CPF',
    'Cargo',
    'Setor',
    'Empresa',
    'Contrato',
    'StatusGeral',
    'IndicadorConformidade',
    'OrdemDeServico',
    'ASO',
    'FichaEPI',
    'Radioprotecao',
  ];

  const escapeCell = (val: string | number = '') => `"${String(val).replace(/"/g, '""')}"`;

  const rows = employees.map((emp) => {
    const getStatus = (tipo: string) => {
      const doc = emp.pendencias.find((p) => p.tipo === tipo);
      return doc ? doc.status : 'N/A';
    };

    return [
      escapeCell(emp.nome),
      escapeCell(emp.matricula),
      escapeCell(emp.cpf),
      escapeCell(emp.cargo),
      escapeCell(emp.setor),
      escapeCell(emp.empresa),
      escapeCell(emp.contratoNome),
      escapeCell(emp.statusGeral),
      escapeCell(`${emp.indicadorPercentual}%`),
      escapeCell(getStatus('ORDEM_DE_SERVICO')),
      escapeCell(getStatus('ATESTADO_SAUDE_OCUPACIONAL')),
      escapeCell(getStatus('FICHA_EPI')),
      escapeCell(getStatus('TREINAMENTO_RADIOPROTECAO')),
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `base_dados_pendencias_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
