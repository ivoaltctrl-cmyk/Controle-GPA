import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Building,
  Building2,
  FileText,
  HeartPulse,
  HardHat,
  Radio,
  User,
  UserX,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
  ExternalLink,
  HelpCircle,
  Eye,
  Send,
  Copy,
} from 'lucide-react';
import { Employee, Contract, AreaResponsavel, DocType, DocStatus, BrandConfig, PendingDoc, TrabalhistaEnvio } from '../types/index.ts';
import { updateEmployeeCalculatedFields } from '../utils/storage.ts';
import { TrabalhistaModule } from './TrabalhistaModule.tsx';
import { ContractsModule } from './ContractsModule.tsx';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

interface DemandadoPortalProps {
  employees: Employee[];
  contracts: Contract[];
  areas: AreaResponsavel[];
  brand: BrandConfig;
  initialStatusFilter?: 'TODOS' | 'ATIVOS' | 'PENDENTES' | 'A_VENCER' | 'EM_DIA' | 'DESLIGADOS';
  initialCategory?: 'CADIM' | 'SST' | 'TRABALHISTA' | 'DEMAIS';
  onSaveEmployee: (employee: Employee) => void;
  onSaveContract?: (contract: Contract) => void;
  onDeleteContract?: (contractId: string) => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
  onSwitchToAdminTab?: () => void;
  onResetData?: () => void;
  blinkingAlerts?: boolean;
  trabalhistaEnvios?: TrabalhistaEnvio[];
  onSaveTrabalhistaEnvios?: (envios: TrabalhistaEnvio[]) => void;
  onOpenGoogleSheetsSync?: () => void;
  onDirectSync?: () => Promise<any>;
  onOpenOfficialGuide?: (employee?: Employee) => void;
  onOpenEmployeeDetail?: (employee: Employee) => void;
  onOpenDemandCenter?: (employee: Employee) => void;
}

type SortField = 'matricula' | 'cpf' | 'nome' | 'cargo' | 'setor' | 'os' | 'aso' | 'epi' | 'radio' | 'statusGeral';
type SortOrder = 'asc' | 'desc';

export const DemandadoPortal: React.FC<DemandadoPortalProps> = ({
  employees,
  contracts,
  areas,
  brand,
  initialStatusFilter = 'TODOS',
  initialCategory = 'CADIM',
  onSaveEmployee,
  onSaveContract,
  onDeleteContract,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onSwitchToAdminTab,
  onResetData,
  blinkingAlerts = true,
  trabalhistaEnvios = [],
  onSaveTrabalhistaEnvios,
  onOpenGoogleSheetsSync,
  onDirectSync,
  onOpenOfficialGuide,
  onOpenEmployeeDetail,
  onOpenDemandCenter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'CADIM' | 'SST' | 'TRABALHISTA' | 'DEMAIS'>(initialCategory);
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'ATIVOS' | 'PENDENTES' | 'A_VENCER' | 'EM_DIA' | 'DESLIGADOS'>(initialStatusFilter);
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Toast feedback & sync state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingDirect, setIsSyncingDirect] = useState(false);

  const handleQuickSync = async () => {
    if (onDirectSync) {
      setIsSyncingDirect(true);
      try {
        const res = await onDirectSync();
        const count = res?.employees?.length ?? 0;
        setToastMessage(`Sincronização on-time concluída! ${count} registros refletidos no painel.`);
        setTimeout(() => setToastMessage(null), 4000);
      } catch (e: any) {
        setToastMessage(`Erro ao sincronizar: ${e.message || 'Falha de conexão com a planilha'}`);
        setTimeout(() => setToastMessage(null), 5000);
      } finally {
        setIsSyncingDirect(false);
      }
    } else if (onOpenGoogleSheetsSync) {
      onOpenGoogleSheetsSync();
    }
  };

  const primaryColor = brand?.primaryColor || '#E21B23'; // WFS Red
  const companyName = brand?.companyName || 'WFS';
  const companySubtitle = brand?.companySubtitle || 'A SATS COMPANY';

  // Cálculos de pendências por categoria para dar destaque visual imediato
  const cadimPendingCount = useMemo(() => {
    return employees.filter(
      (e) =>
        e.statusGeral !== 'EM_DIA' &&
        !e.resumoGeral?.includes('Desligado') &&
        !e.resumoGeral?.includes('Cancelado')
    ).length;
  }, [employees]);

  const trabalhistaPendingCount = useMemo(() => {
    return trabalhistaEnvios.filter(
      (t) => t.status === 'Reprovado' || t.status === 'Em Análise'
    ).length;
  }, [trabalhistaEnvios]);

  const demaisPendingCount = useMemo(() => {
    return contracts.filter(
      (c) =>
        c.status !== 'ATIVO' ||
        c.statusDocumentos === 'Reprovado' ||
        c.statusDocumentos === 'Em Análise'
    ).length;
  }, [contracts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to extract doc by type
  const getEmpDoc = (emp: Employee, tipo: DocType): PendingDoc | undefined => {
    return emp.pendencias.find((p) => p.tipo === tipo);
  };

  // 1-Click Toggle for a specific doc
  const handleToggleDoc = (emp: Employee, docType: DocType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const doc = getEmpDoc(emp, docType);
    if (!doc) return;

    const isCurrentlyEmDia = doc.status === 'EM_DIA';
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedDocs: PendingDoc[] = emp.pendencias.map((d) => {
      if (d.tipo === docType) {
        if (isCurrentlyEmDia) {
          // Reopen pendency
          return {
            ...d,
            status: 'PENDENTE' as DocStatus,
            diasRestantes: undefined,
            observacoes: `Reaberto em ${new Date().toLocaleDateString('pt-BR')}`,
            ultimaAtualizacao: todayStr,
          };
        } else {
          // Mark as checked / sanado
          return {
            ...d,
            status: 'EM_DIA' as DocStatus,
            dataEmissao: todayStr,
            dataVencimento: nextYearStr,
            diasRestantes: 365,
            observacoes: `Sanado via Lista WFS em ${new Date().toLocaleDateString('pt-BR')}`,
            ultimaAtualizacao: todayStr,
          };
        }
      }
      return d;
    });

    const updatedEmp = updateEmployeeCalculatedFields({
      ...emp,
      pendencias: updatedDocs,
      dataUltimaLeitura: todayStr,
    });

    onSaveEmployee(updatedEmp);

    if (!isCurrentlyEmDia) {
      showToast(`✓ Documento de ${emp.nome.split(' ')[0]} atualizado para EM DIA!`);
      if (updatedEmp.statusGeral === 'EM_DIA') {
        try {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch {}
      }
    } else {
      showToast(`Pendência reaberta para ${emp.nome.split(' ')[0]}.`);
    }
  };

  // 1-Click Sanar All Documents for an employee
  const handleSanarEmployeeAll = (emp: Employee, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedDocs: PendingDoc[] = emp.pendencias.map((d) => {
      if (d.status === 'NAO_APLICAVEL') return d;
      return {
        ...d,
        status: 'EM_DIA' as DocStatus,
        dataEmissao: todayStr,
        dataVencimento: nextYearStr,
        diasRestantes: 365,
        observacoes: `100% Sanado via WFS em ${new Date().toLocaleDateString('pt-BR')}`,
        ultimaAtualizacao: todayStr,
      };
    });

    const updatedEmp = updateEmployeeCalculatedFields({
      ...emp,
      pendencias: updatedDocs,
      dataUltimaLeitura: todayStr,
    });

    onSaveEmployee(updatedEmp);
    showToast(`✓ Todas as pendências de ${emp.nome} foram sanadas!`);
  };

  // Bulk sanar selected
  const handleBulkSanarSelected = () => {
    if (selectedIds.length === 0) return;
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    let count = 0;
    employees.forEach((emp) => {
      if (selectedIds.includes(emp.id)) {
        const updatedDocs: PendingDoc[] = emp.pendencias.map((d) => {
          if (d.status === 'NAO_APLICAVEL') return d;
          return {
            ...d,
            status: 'EM_DIA' as DocStatus,
            dataEmissao: todayStr,
            dataVencimento: nextYearStr,
            diasRestantes: 365,
            observacoes: `Sanado em lote WFS em ${new Date().toLocaleDateString('pt-BR')}`,
            ultimaAtualizacao: todayStr,
          };
        });

        const updatedEmp = updateEmployeeCalculatedFields({
          ...emp,
          pendencias: updatedDocs,
          dataUltimaLeitura: todayStr,
        });

        onSaveEmployee(updatedEmp);
        count++;
      }
    });

    setSelectedIds([]);
    showToast(`✓ ${count} colaboradores foram 100% regularizados com sucesso!`);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Export spreadsheet matching the exact image structure
  const handleExportExcel = () => {
    const dataToExport = filteredEmployees.map((emp) => {
      const os = getEmpDoc(emp, 'ORDEM_DE_SERVICO');
      const aso = getEmpDoc(emp, 'ATESTADO_SAUDE_OCUPACIONAL');
      const epi = getEmpDoc(emp, 'FICHA_EPI');
      const radio = getEmpDoc(emp, 'TREINAMENTO_RADIOPROTECAO');

      const formatDocExcel = (doc?: PendingDoc) => {
        if (!doc) return 'NÃO APLICÁVEL';
        if (doc.status === 'EM_DIA') return 'EM DIA';
        if (doc.status === 'A_VENCER') return `VENCENDO EM ${doc.diasRestantes ?? 30} DIAS`;
        if (doc.status === 'VENCIDO') return 'VENCIDO';
        if (doc.status === 'NAO_APLICAVEL') return 'NÃO APLICÁVEL';
        return 'PENDENTE';
      };

      return {
        'Matrícula': emp.matricula,
        'CPF': emp.cpf || '',
        'Nome': emp.nome,
        'Função': emp.cargo,
        'Setor': emp.setor || emp.areaNome || '',
        'OS': formatDocExcel(os),
        'ASO': formatDocExcel(aso),
        'FICHA DE EPI': formatDocExcel(epi),
        'RADIOPROTEÇÃO': formatDocExcel(radio),
        'Status Geral': emp.statusGeral,
        'Conformidade %': `${emp.indicadorPercentual}%`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Controle CADIM WFS');
    XLSX.writeFile(workbook, `WFS_Controle_CADIM_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Planilha Excel baixada com sucesso!');
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search match across all fields
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = emp.nome.toLowerCase().includes(term);
        const matchMatricula = emp.matricula.toLowerCase().includes(term);
        const matchCpf = emp.cpf ? emp.cpf.toLowerCase().includes(term) : false;
        const matchCargo = emp.cargo.toLowerCase().includes(term);
        const matchSetor = (emp.setor || '').toLowerCase().includes(term);
        const matchArea = (emp.areaNome || '').toLowerCase().includes(term);
        const matchEmpresa = (emp.empresa || '').toLowerCase().includes(term);

        if (!matchName && !matchMatricula && !matchCpf && !matchCargo && !matchSetor && !matchArea && !matchEmpresa) {
          return false;
        }
      }

      // Contract filter
      if (selectedContractId && emp.contratoId !== selectedContractId) {
        return false;
      }

      // Area filter
      if (selectedAreaId && emp.areaId !== selectedAreaId) {
        return false;
      }

      // Status filter
      if (filterStatus === 'ATIVOS') {
        const isDesligado = emp.resumoGeral?.includes('Desligado') || emp.resumoGeral?.includes('Cancelado') || emp.statusGeral === 'BLOQUEADO';
        if (isDesligado) return false;
      } else if (filterStatus === 'DESLIGADOS') {
        const isDesligado = emp.resumoGeral?.includes('Desligado') || emp.resumoGeral?.includes('Cancelado') || emp.statusGeral === 'BLOQUEADO';
        if (!isDesligado) return false;
      } else if (filterStatus === 'PENDENTES') {
        const isDesligado = emp.resumoGeral?.includes('Desligado') || emp.resumoGeral?.includes('Cancelado');
        if (isDesligado) return false;
        const hasPendingOrExpired = emp.pendencias.some(
          (p) => p.status === 'PENDENTE' || p.status === 'VENCIDO'
        );
        if (!hasPendingOrExpired && emp.statusGeral === 'EM_DIA') return false;
      } else if (filterStatus === 'A_VENCER') {
        const isDesligado = emp.resumoGeral?.includes('Desligado') || emp.resumoGeral?.includes('Cancelado');
        if (isDesligado) return false;
        const hasAVencer = emp.pendencias.some((p) => p.status === 'A_VENCER');
        if (!hasAVencer) return false;
      } else if (filterStatus === 'EM_DIA') {
        if (emp.statusGeral !== 'EM_DIA') return false;
      }

      return true;
    });
  }, [employees, searchTerm, selectedContractId, selectedAreaId, filterStatus]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    const list = [...filteredEmployees];
    list.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'matricula':
          valA = a.matricula.toLowerCase();
          valB = b.matricula.toLowerCase();
          break;
        case 'cpf':
          valA = (a.cpf || '').toLowerCase();
          valB = (b.cpf || '').toLowerCase();
          break;
        case 'nome':
          valA = a.nome.toLowerCase();
          valB = b.nome.toLowerCase();
          break;
        case 'cargo':
          valA = a.cargo.toLowerCase();
          valB = b.cargo.toLowerCase();
          break;
        case 'setor':
          valA = (a.setor || a.areaNome || '').toLowerCase();
          valB = (b.setor || b.areaNome || '').toLowerCase();
          break;
        case 'os':
          valA = getEmpDoc(a, 'ORDEM_DE_SERVICO')?.status || '';
          valB = getEmpDoc(b, 'ORDEM_DE_SERVICO')?.status || '';
          break;
        case 'aso':
          valA = getEmpDoc(a, 'ATESTADO_SAUDE_OCUPACIONAL')?.status || '';
          valB = getEmpDoc(b, 'ATESTADO_SAUDE_OCUPACIONAL')?.status || '';
          break;
        case 'epi':
          valA = getEmpDoc(a, 'FICHA_EPI')?.status || '';
          valB = getEmpDoc(b, 'FICHA_EPI')?.status || '';
          break;
        case 'radio':
          valA = getEmpDoc(a, 'TREINAMENTO_RADIOPROTECAO')?.status || '';
          valB = getEmpDoc(b, 'TREINAMENTO_RADIOPROTECAO')?.status || '';
          break;
        case 'statusGeral':
          valA = a.indicadorPercentual;
          valB = b.indicadorPercentual;
          break;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredEmployees, sortField, sortOrder]);

  // Paginate
  const totalItems = sortedEmployees.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalItems / effectivePageSize) : 1;
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 0) return sortedEmployees;
    const start = (currentPage - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, currentPage, pageSize]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // KPI calculations
  const totalDemandados = employees.length;
  const totalAtivos = employees.filter(
    (e) => !e.resumoGeral?.includes('Desligado') && !e.resumoGeral?.includes('Cancelado') && e.statusGeral !== 'BLOQUEADO'
  ).length;
  const totalEmDia = employees.filter((e) => e.statusGeral === 'EM_DIA').length;
  const totalDesligados = employees.filter(
    (e) => (e.resumoGeral && e.resumoGeral.includes('Desligado')) || (e.resumoGeral && e.resumoGeral.includes('Cancelado')) || e.statusGeral === 'BLOQUEADO'
  ).length;
  const totalCriticos = employees.filter(
    (e) =>
      !e.resumoGeral?.includes('Desligado') &&
      (e.statusGeral === 'CRITICO' || e.statusGeral === 'PENDENTE' || e.pendencias.some((p) => p.status === 'PENDENTE' || p.status === 'VENCIDO'))
  ).length;
  const totalAVencer = employees.filter(
    (e) => !e.resumoGeral?.includes('Desligado') && e.pendencias.some((p) => p.status === 'A_VENCER')
  ).length;

  // Toggle select all on page
  const handleToggleSelectAll = () => {
    const pageIds = paginatedEmployees.map((e) => e.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  /**
   * Helper component to render an interactive document cell optimized for single-page view (no scrollbar)
   */
  const renderDocCell = (emp: Employee, docType: DocType) => {
    const doc = getEmpDoc(emp, docType);
    const isDesligado = emp.resumoGeral?.includes('Desligado') || emp.resumoGeral?.includes('Cancelado') || emp.statusGeral === 'BLOQUEADO';
    
    if (isDesligado) {
      return (
        <div className="text-center">
          <span className="text-slate-400 text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded" title="Colaborador Inativo/Desligado no GPA">
            INATIVO
          </span>
        </div>
      );
    }

    if (!doc || doc.status === 'NAO_APLICAVEL') {
      return (
        <div className="text-center">
          <span className="text-slate-300 text-[11px] font-normal" title="Não aplicável para esta função">
            —
          </span>
        </div>
      );
    }

    if (doc.status === 'EM_DIA') {
      return (
        <button
          onClick={(e) => handleToggleDoc(emp, docType, e)}
          title="Status: EM DIA. Clique se desejar reabrir a pendência."
          className="w-full inline-flex items-center justify-center gap-1 px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 font-bold text-[10.5px] cursor-pointer transition-all hover:scale-102"
        >
          <Check className="w-3 h-3 stroke-[3] text-emerald-600 shrink-0" />
          <span className="truncate">EM DIA</span>
        </button>
      );
    }

    if (doc.status === 'A_VENCER') {
      const dias = doc.diasRestantes ?? 22;
      return (
        <button
          onClick={(e) => handleToggleDoc(emp, docType, e)}
          title={`Vencendo em ${dias} dias. Clique para registrar renovação (Dar Check)!`}
          className={`w-full inline-flex items-center justify-center gap-1 px-1.5 py-1 rounded bg-amber-50 text-amber-900 hover:bg-amber-100 border font-bold text-[10.5px] cursor-pointer transition-all hover:scale-102 ${
            blinkingAlerts ? 'border-amber-400 ring-1 ring-amber-300' : 'border-amber-300'
          }`}
        >
          {/* Pulsing Amber Beacon Indicator */}
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {blinkingAlerts && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 animate-pulse" />
          </span>
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="truncate">{dias}d (Renovar)</span>
        </button>
      );
    }

    // VENCIDO or PENDENTE -> Render interactive single-click status with pulsing alert
    return (
      <button
        onClick={(e) => handleToggleDoc(emp, docType, e)}
        title="Status: VENCIDO. Clique aqui para informar que a pendência foi sanada (Dar Check)!"
        className={`w-full inline-flex items-center justify-center gap-1 px-1.5 py-1 rounded text-rose-700 hover:text-rose-900 border font-bold text-[10.5px] cursor-pointer transition-all hover:shadow-xs group ${
          blinkingAlerts
            ? 'bg-rose-50/90 hover:bg-rose-100 border-rose-400 ring-1 ring-rose-300 animate-pulse'
            : 'bg-rose-50 hover:bg-rose-100 border-rose-300'
        }`}
      >
        {/* Pulsing Red Radar Beacon */}
        <span className="relative flex h-2 w-2 shrink-0">
          {blinkingAlerts && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E21B23]" />
        </span>
        <span className="font-black text-rose-800 shrink-0">VENCIDO</span>
        <span className="text-[10px] text-rose-600 group-hover:text-rose-800 underline truncate">
          (Sanar)
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-1 rounded-full bg-[#E21B23] text-white">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header - Portal Unificado de Pendências e Conformidade GPA */}
      <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-xs border border-slate-200 border-l-4 border-l-[#E21B23] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black bg-[#E21B23]/10 text-[#E21B23] uppercase tracking-wider border border-[#E21B23]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E21B23]" />
            <span>PORTAL DE PENDÊNCIAS & CONFORMIDADE • GPA</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Consulta & Regularização de Pendências
          </h2>
          <p className="text-xs text-slate-600 font-medium max-w-2xl">
            Consulte as pendências documentais dos terceiros e realize a regularização diretamente no sistema oficial da empresa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Botão Principal de Sincronização em Tempo Real */}
          <button
            onClick={handleQuickSync}
            disabled={isSyncingDirect}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60"
            title="Sincronizar dados em tempo real com o Google Sheets GPA_BD"
          >
            {isSyncingDirect ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-100 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-100" />
            )}
            <span>{isSyncingDirect ? 'Sincronizando...' : 'Sincronizar GPA_BD'}</span>
          </button>

          {/* Botões Secundários com Visual Corporativo e Discreto */}
          <a
            href="https://gpa.gru.com.br/Login"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="Acessar o sistema oficial GPA para saneamento de pendências documentais"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Sistema GPA</span>
          </a>

          {onOpenOfficialGuide && (
            <button
              onClick={() => onOpenOfficialGuide()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="Ver passo a passo de como sanar no sistema oficial de cadastro"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Guia</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Seletor de Categorias de Pendências com Máximo Destaque e Contadores Nítidos */}
      <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-2 shadow-sm">
        <button
          onClick={() => {
            setSelectedCategory('CADIM');
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[200px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            selectedCategory === 'CADIM' || selectedCategory === 'SST'
              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${selectedCategory === 'CADIM' || selectedCategory === 'SST' ? 'text-white' : 'text-emerald-400'}`} />
          <span className="tracking-tight uppercase">Pendências de CADIM</span>
          {cadimPendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
              selectedCategory === 'CADIM' || selectedCategory === 'SST'
                ? 'bg-white text-emerald-800'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {cadimPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setSelectedCategory('TRABALHISTA');
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[200px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            selectedCategory === 'TRABALHISTA'
              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${selectedCategory === 'TRABALHISTA' ? 'text-white' : 'text-blue-400'}`} />
          <span className="tracking-tight uppercase">Pendências Trabalhistas</span>
          {trabalhistaPendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
              selectedCategory === 'TRABALHISTA'
                ? 'bg-white text-blue-800'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {trabalhistaPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setSelectedCategory('DEMAIS');
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[200px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            selectedCategory === 'DEMAIS'
              ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/40'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${selectedCategory === 'DEMAIS' ? 'text-white' : 'text-purple-400'}`} />
          <span className="tracking-tight uppercase">Demais Pendências</span>
          {demaisPendingCount > 0 && (
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
              selectedCategory === 'DEMAIS'
                ? 'bg-white text-purple-800'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              {demaisPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL POR CATEGORIA */}
      {selectedCategory === 'TRABALHISTA' ? (
        <TrabalhistaModule
          envios={trabalhistaEnvios}
          onSaveEnvios={onSaveTrabalhistaEnvios || (() => {})}
          brand={brand}
          isAdmin={isAdminLoggedIn}
          blinkingAlerts={blinkingAlerts}
        />
      ) : selectedCategory === 'DEMAIS' ? (
        <div className="space-y-4">
          <ContractsModule
            contracts={contracts}
            employees={employees}
            onSelectContractToFilter={() => setSelectedCategory('CADIM')}
            onSaveContract={onSaveContract || (() => {})}
            onDeleteContract={onDeleteContract || (() => {})}
            onDemandContract={() => {}}
            brand={brand}
            isAdmin={isAdminLoggedIn}
          />
        </div>
      ) : (
        <>
      {/* Barra de Filtros, Busca & Paginação */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Matrícula, CPF, Nome, Função ou Setor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Filtros Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1 min-w-[170px]">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedContractId}
                onChange={(e) => {
                  setSelectedContractId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Todos os Contratos/Bases</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} - {c.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 min-w-[170px]">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAreaId}
                onChange={(e) => {
                  setSelectedAreaId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:ring-2 focus:ring-slate-900"
              >
                <option value="">Todos os Setores/Áreas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            {(searchTerm || selectedContractId || selectedAreaId || filterStatus !== 'TODOS') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedContractId('');
                  setSelectedAreaId('');
                  setFilterStatus('TODOS');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Linha de Filtros Rápidos + Ações em Lote */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Filtro:</span>
            <button
              onClick={() => {
                setFilterStatus('TODOS');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'TODOS'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({employees.length})
            </button>
            <button
              onClick={() => {
                setFilterStatus('ATIVOS');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'ATIVOS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              Ativos ({totalAtivos})
            </button>
            <button
              onClick={() => {
                setFilterStatus('PENDENTES');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'PENDENTES'
                  ? 'bg-[#E21B23] text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {blinkingAlerts && totalCriticos > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    filterStatus === 'PENDENTES' ? 'bg-white' : 'bg-[#E21B23]'
                  }`}
                />
              </span>
              <span>Vencidos / Pendentes ({totalCriticos})</span>
            </button>
            <button
              onClick={() => {
                setFilterStatus('A_VENCER');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'A_VENCER'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {blinkingAlerts && totalAVencer > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    filterStatus === 'A_VENCER' ? 'bg-white' : 'bg-amber-500'
                  }`}
                />
              </span>
              <span>A Vencer ({totalAVencer})</span>
            </button>
            <button
              onClick={() => {
                setFilterStatus('EM_DIA');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'EM_DIA'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Em Dia ({totalEmDia})
            </button>
            <button
              onClick={() => {
                setFilterStatus('DESLIGADOS');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'DESLIGADOS'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Desligados ({totalDesligados})
            </button>
          </div>

          {/* Bulk Action Button */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {selectedIds.length} selecionado(s)
              </span>
              <button
                onClick={handleBulkSanarSelected}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Sanar Selecionados (100% Em Dia)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABELA PLANILHA COM ROLAGEM SUAVE E COLUNAS ESPAÇADAS (ZERO SOBREPOSIÇÃO) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[1150px]">
          <colgroup>
            <col className="w-10" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="min-w-[220px]" />
            <col className="min-w-[180px]" />
            <col className="min-w-[180px]" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-28" />
          </colgroup>

          {/* Header da Planilha */}
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-black uppercase text-[10.5px] border-b border-slate-300 select-none">
              <th className="py-2.5 px-3 text-center">
                <input
                  type="checkbox"
                  checked={paginatedEmployees.length > 0 && paginatedEmployees.every((e) => selectedIds.includes(e.id))}
                  onChange={handleToggleSelectAll}
                  className="rounded text-[#E21B23] focus:ring-[#E21B23] cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('matricula')}
                className="py-2.5 px-2 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>MATRÍCULA</span>
                  {sortField === 'matricula' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('cpf')}
                className="py-2.5 px-2 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>CPF</span>
                  {sortField === 'cpf' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('nome')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>NOME DO COLABORADOR</span>
                  {sortField === 'nome' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('cargo')}
                className="py-2.5 px-2 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>FUNÇÃO / CARGO</span>
                  {sortField === 'cargo' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('setor')}
                className="py-2.5 px-2 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>SETOR / ÁREA</span>
                  {sortField === 'setor' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('os')}
                className="py-2.5 px-1.5 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>OS</span>
                  {sortField === 'os' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('aso')}
                className="py-2.5 px-1.5 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>ASO</span>
                  {sortField === 'aso' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('epi')}
                className="py-2.5 px-1.5 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>FICHA EPI</span>
                  {sortField === 'epi' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('radio')}
                className="py-2.5 px-1.5 text-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>RADIOPROTEÇÃO</span>
                  {sortField === 'radio' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#E21B23] shrink-0" /> : <ArrowDown className="w-3 h-3 text-[#E21B23] shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-30 shrink-0" />
                  )}
                </div>
              </th>
              <th className="py-2.5 px-2 text-center">
                <span>AÇÕES</span>
              </th>
            </tr>
          </thead>

            {/* Linhas da Tabela */}
            <tbody className="divide-y divide-slate-200">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 px-4 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-base text-slate-800">Nenhum colaborador encontrado</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {employees.length === 0
                        ? 'A base de dados está vazia. Você pode carregar a base de dados de demonstração da WFS com mais de 1.450 colaboradores cadastrados.'
                        : 'Não encontramos nenhum registro correspondente aos filtros e termos de busca aplicados.'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {employees.length === 0 && onResetData ? (
                        <button
                          onClick={onResetData}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-[#E21B23] text-white hover:bg-red-700 shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Carregar Base Demonstrativa WFS (+1.450 Colaboradores)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedContractId('');
                            setSelectedAreaId('');
                            setFilterStatus('TODOS');
                            setCurrentPage(1);
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
                        >
                          Limpar Todos os Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, index) => {
                  const isSelected = selectedIds.includes(emp.id);
                  const isAllEmDia = emp.statusGeral === 'EM_DIA';

                  const displayName = (emp.nome || '').replace(/^[:\s\-\.]+/, '').trim();
                  const displayMatricula = (emp.matricula || '').replace(/^[:\s\-\.]+/, '').trim();
                  const displayCpf = (emp.cpf || '').replace(/^[:\s\-\.]+/, '').trim();
                  const displayCargo = (emp.cargo || '').replace(/^[:\s\-\.]+/, '').trim();
                  const displaySetor = (emp.setor || emp.areaNome || 'Operações').replace(/^[:\s\-\.]+/, '').trim();

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-red-50/30' : index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(emp.id)}
                          className="rounded text-[#E21B23] focus:ring-[#E21B23] cursor-pointer"
                        />
                      </td>

                      {/* Matrícula */}
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-800 text-xs" title={displayMatricula}>
                        {displayMatricula}
                      </td>

                      {/* CPF */}
                      <td className="py-2.5 px-2 font-mono text-slate-600 text-xs whitespace-nowrap" title={displayCpf || '—'}>
                        {displayCpf || '—'}
                      </td>

                      {/* Nome */}
                      <td className="py-2.5 px-3 font-bold text-slate-900 text-xs" title={displayName}>
                        {displayName}
                      </td>

                      {/* Função */}
                      <td className="py-2.5 px-2 text-slate-700 text-xs" title={displayCargo}>
                        {displayCargo}
                      </td>

                      {/* Setor */}
                      <td className="py-2.5 px-2 text-slate-700 text-xs" title={displaySetor}>
                        {displaySetor}
                      </td>

                      {/* OS */}
                      <td className="py-2.5 px-1.5 text-center">
                        {renderDocCell(emp, 'ORDEM_DE_SERVICO')}
                      </td>

                      {/* ASO */}
                      <td className="py-2.5 px-1.5 text-center">
                        {renderDocCell(emp, 'ATESTADO_SAUDE_OCUPACIONAL')}
                      </td>

                      {/* FICHA DE EPI */}
                      <td className="py-2.5 px-1.5 text-center">
                        {renderDocCell(emp, 'FICHA_EPI')}
                      </td>

                      {/* RADIOPROTEÇÃO */}
                      <td className="py-2.5 px-1.5 text-center">
                        {renderDocCell(emp, 'TREINAMENTO_RADIOPROTECAO')}
                      </td>

                      {/* Ações Rápidas */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {emp.resumoGeral?.includes('Desligado') || emp.resumoGeral?.includes('Cancelado') || emp.statusGeral === 'BLOQUEADO' ? (
                            <div className="flex items-center justify-center gap-1">
                              <span className="inline-flex items-center justify-center gap-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                <span>Desligado</span>
                              </span>
                              {onOpenEmployeeDetail && (
                                <button
                                  onClick={() => onOpenEmployeeDetail(emp)}
                                  title="Visualizar ficha cadastral completa"
                                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : !isAllEmDia ? (
                            <>
                              <button
                                onClick={() => {
                                  if (onOpenOfficialGuide) {
                                    onOpenOfficialGuide(emp);
                                  } else {
                                    handleSanarEmployeeAll(emp);
                                  }
                                }}
                                title="Ver orientações para sanar pendências no sistema oficial"
                                className="px-1.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer transition-all shadow-2xs flex items-center gap-1 shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span className="hidden xl:inline">Saneamento Oficial</span>
                                <span className="xl:hidden">Sanar</span>
                              </button>

                              {onOpenEmployeeDetail && (
                                <button
                                  onClick={() => onOpenEmployeeDetail(emp)}
                                  title="Visualizar ficha cadastral e histórico completo"
                                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <span className="inline-flex items-center justify-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Regular</span>
                              </span>
                              {onOpenEmployeeDetail && (
                                <button
                                  onClick={() => onOpenEmployeeDetail(emp)}
                                  title="Visualizar ficha cadastral completa"
                                  className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Paginação e Contadores (Ideal para 1.000+ Linhas) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Linhas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-slate-900"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={0}>Todos ({totalItems})</option>
            </select>

            <span className="text-slate-500 ml-2">
              Mostrando{' '}
              <strong className="text-slate-800">
                {totalItems === 0 ? 0 : (currentPage - 1) * (pageSize || totalItems) + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-slate-800">
                {pageSize === 0 ? totalItems : Math.min(currentPage * pageSize, totalItems)}
              </strong>{' '}
              de <strong className="text-slate-800">{totalItems.toLocaleString('pt-BR')}</strong> colaboradores
            </span>
          </div>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Primeira página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-bold text-slate-800">
                Pág. {currentPage} de {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </>
      )}
    </div>
  );
};
