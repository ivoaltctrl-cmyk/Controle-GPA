import React, { useState, useMemo, useEffect } from 'react';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  Check,
  X,
  Send,
  Sparkles,
  FileText,
  ShieldCheck,
  Layers,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  AreaResponsavel,
  Employee,
  Contract,
  TrabalhistaEnvio,
  BrandConfig,
  SystemStats,
} from '../types/index.ts';
import { calculateAreaMetrics, getTrabalhistaMesesConsolidados } from '../utils/storage.ts';

interface AreasModuleProps {
  areas: AreaResponsavel[];
  employees: Employee[];
  contracts?: Contract[];
  trabalhistaEnvios?: TrabalhistaEnvio[];
  stats?: SystemStats;
  resumoConfig?: {
    validos: number;
    pendentes: number;
    lastUpdated?: string;
  } | null;
  onSaveResumoConfig?: (config: { validos: number; pendentes: number }) => void;
  onSaveArea: (area: AreaResponsavel) => void;
  onDeleteArea: (id: string) => void;
  onSelectAreaForDispatch: (area: AreaResponsavel) => void;
  brand: BrandConfig;
}

const LOCAL_STORAGE_CUSTOM_RESUMO = 'resumo_resultado_geral_campos_v2';

export const AreasModule: React.FC<AreasModuleProps> = ({
  areas,
  employees,
  contracts = [],
  trabalhistaEnvios = [],
  stats,
  resumoConfig,
  onSaveResumoConfig,
  onSaveArea,
  onDeleteArea,
  onSelectAreaForDispatch,
  brand,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaResponsavel | null>(null);

  const primaryColor = brand?.primaryColor || '#006837';
  const accentColor = brand?.accentColor || '#f59e0b';

  // --------------------------------------------------------------------------
  // 1. CÁLCULO SEÇÃO 1: DOCUMENTOS DE SST (CADIM)
  // --------------------------------------------------------------------------
  const sstSectionStats = useMemo(() => {
    let totalDocs = 0;
    let validados = 0;
    let aVencer = 0;
    let pendentes = 0;
    let vencidos = 0;

    let osTotal = 0;
    let osValidados = 0;
    let asoTotal = 0;
    let asoValidados = 0;
    let epiTotal = 0;
    let epiValidados = 0;
    let radioTotal = 0;
    let radioValidados = 0;

    employees.forEach((emp) => {
      (emp.pendencias || []).forEach((p) => {
        if (p.status === 'NAO_APLICAVEL') return;
        totalDocs++;

        const isOk = p.status === 'EM_DIA';
        const isAv = p.status === 'A_VENCER';
        const isPd = p.status === 'PENDENTE' || p.status === 'EM_ANALISE';
        const isVc = p.status === 'VENCIDO';

        if (isOk || isAv) validados++;
        if (isAv) aVencer++;
        if (isPd) pendentes++;
        if (isVc) vencidos++;

        if (p.tipo === 'ORDEM_DE_SERVICO') {
          osTotal++;
          if (isOk || isAv) osValidados++;
        } else if (p.tipo === 'ATESTADO_SAUDE_OCUPACIONAL') {
          asoTotal++;
          if (isOk || isAv) asoValidados++;
        } else if (p.tipo === 'FICHA_EPI') {
          epiTotal++;
          if (isOk || isAv) epiValidados++;
        } else {
          radioTotal++;
          if (isOk || isAv) radioValidados++;
        }
      });
    });

    const taxa = totalDocs > 0 ? Math.round((validados / totalDocs) * 100) : 100;

    return {
      totalDocs,
      validados,
      aVencer,
      pendentes,
      vencidos,
      taxa,
      os: { total: osTotal, validados: osValidados, taxa: osTotal > 0 ? Math.round((osValidados / osTotal) * 100) : 100 },
      aso: { total: asoTotal, validados: asoValidados, taxa: asoTotal > 0 ? Math.round((asoValidados / asoTotal) * 100) : 100 },
      epi: { total: epiTotal, validados: epiValidados, taxa: epiTotal > 0 ? Math.round((epiValidados / epiTotal) * 100) : 100 },
      outros: { total: radioTotal, validados: radioValidados, taxa: radioTotal > 0 ? Math.round((radioValidados / radioTotal) * 100) : 100 },
    };
  }, [employees]);

  // --------------------------------------------------------------------------
  // 2. CÁLCULO SEÇÃO 2: DOCUMENTOS TRABALHISTAS
  // --------------------------------------------------------------------------
  const trabalhistaSectionStats = useMemo(() => {
    const totalEnvios = trabalhistaEnvios.length;
    const validados = trabalhistaEnvios.filter((e) => e.status === 'Validado').length;
    const emAnalise = trabalhistaEnvios.filter((e) => e.status === 'Em Análise').length;
    const reprovados = trabalhistaEnvios.filter((e) => e.status === 'Reprovado').length;

    const meses = getTrabalhistaMesesConsolidados(trabalhistaEnvios);
    const mesesValidados = meses.filter((m) => m.isValidado).length;

    const taxa = totalEnvios > 0 ? Math.round((validados / totalEnvios) * 100) : (meses.length > 0 ? Math.round((mesesValidados / meses.length) * 100) : 100);

    return {
      totalDocs: totalEnvios,
      validados,
      emAnalise,
      reprovados,
      totalMeses: meses.length,
      mesesValidados,
      taxa,
    };
  }, [trabalhistaEnvios]);

  // --------------------------------------------------------------------------
  // 3. CÁLCULO SEÇÃO 3: DEMAIS DOCUMENTOS (CONTRATUAIS & REGULATÓRIOS)
  // --------------------------------------------------------------------------
  const demaisSectionStats = useMemo(() => {
    let totalDocs = 0;
    let validados = 0;
    let emAnalise = 0;
    let reprovados = 0;

    contracts.forEach((c) => {
      const docs = c.documentosContrato || [];
      docs.forEach((d) => {
        totalDocs++;
        if (d.status === 'Validado') validados++;
        else if (d.status === 'Em Análise') emAnalise++;
        else if (d.status === 'Reprovado') reprovados++;
      });
    });

    // Se contratos não tiverem docs individuais cadastrados ainda, conta o status do contrato
    if (totalDocs === 0 && contracts.length > 0) {
      totalDocs = contracts.length;
      validados = contracts.filter((c) => c.status === 'ATIVO' || c.statusDocumentos === 'Validado').length;
      reprovados = contracts.filter((c) => c.status === 'BLOQUEADO' || c.statusDocumentos === 'Reprovado').length;
      emAnalise = totalDocs - validados - reprovados;
    }

    const taxa = totalDocs > 0 ? Math.round((validados / totalDocs) * 100) : 100;

    return {
      totalDocs,
      validados,
      emAnalise,
      reprovados,
      taxa,
      totalContratos: contracts.length,
      contratosAtivos: contracts.filter((c) => c.status === 'ATIVO').length,
    };
  }, [contracts]);

  // --------------------------------------------------------------------------
  // 4. RESULTADO GERAL: INDICADOR EM FORMATO DE DONUT COM 2 CAMPOS (VÁLIDOS E PENDENTES)
  // --------------------------------------------------------------------------
  // Soma real do sistema:
  const sistemaTotalAuditados = sstSectionStats.totalDocs + trabalhistaSectionStats.totalDocs + demaisSectionStats.totalDocs;
  const sistemaTotalValidados = sstSectionStats.validados + trabalhistaSectionStats.validados + demaisSectionStats.validados;
  const sistemaTotalPendentes = Math.max(0, sistemaTotalAuditados - sistemaTotalValidados);

  // Estados dos dois campos solicitados pelo usuário (Válidos e Pendentes)
  const [validos, setValidos] = useState<number>(() => {
    if (resumoConfig && typeof resumoConfig.validos === 'number') {
      return resumoConfig.validos;
    }
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_RESUMO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.validos === 'number') return parsed.validos;
        if (typeof parsed.validados === 'number') return parsed.validados;
      }
    } catch (e) {}
    return sistemaTotalValidados > 0 ? sistemaTotalValidados : 4404;
  });

  const [pendentes, setPendentes] = useState<number>(() => {
    if (resumoConfig && typeof resumoConfig.pendentes === 'number') {
      return resumoConfig.pendentes;
    }
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_RESUMO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.pendentes === 'number') return parsed.pendentes;
      }
    } catch (e) {}
    return sistemaTotalPendentes > 0 ? sistemaTotalPendentes : 2;
  });

  // Mantém em sincronia quando o backend ou outro PC atualiza o resumoConfig
  useEffect(() => {
    if (resumoConfig && typeof resumoConfig.validos === 'number' && typeof resumoConfig.pendentes === 'number') {
      setValidos(resumoConfig.validos);
      setPendentes(resumoConfig.pendentes);
      try {
        localStorage.setItem(
          LOCAL_STORAGE_CUSTOM_RESUMO,
          JSON.stringify({ validos: resumoConfig.validos, pendentes: resumoConfig.pendentes })
        );
      } catch (e) {}
    }
  }, [resumoConfig?.validos, resumoConfig?.pendentes, resumoConfig?.lastUpdated]);

  // Salva alterações nos 2 campos no localStorage, no backend central e atualiza imediatamente
  const handleUpdateValidos = (val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    setValidos(safeVal);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_CUSTOM_RESUMO,
        JSON.stringify({ validos: safeVal, pendentes })
      );
    } catch (e) {}
    onSaveResumoConfig?.({ validos: safeVal, pendentes });
  };

  const handleUpdatePendentes = (val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    setPendentes(safeVal);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_CUSTOM_RESUMO,
        JSON.stringify({ validos, pendentes: safeVal })
      );
    } catch (e) {}
    onSaveResumoConfig?.({ validos, pendentes: safeVal });
  };

  const handleAutoFillFromSystem = () => {
    const v = sistemaTotalValidados > 0 ? sistemaTotalValidados : 0;
    const p = Math.max(0, sistemaTotalAuditados - sistemaTotalValidados);
    setValidos(v);
    setPendentes(p);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_CUSTOM_RESUMO,
        JSON.stringify({ validos: v, pendentes: p })
      );
    } catch (e) {}
    onSaveResumoConfig?.({ validos: v, pendentes: p });
  };

  // Cálculo percentual dinâmico do Resultado Geral (Válidos / (Válidos + Pendentes))
  const totalGeral = validos + pendentes;
  const percentualGeral = useMemo(() => {
    if (totalGeral <= 0) return validos > 0 ? 100 : 0;
    const pct = Math.round((validos / totalGeral) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [validos, totalGeral]);

  // Dimensões do SVG Donut Chart com alta nitidez, proporções harmônicas e espaçamento perfeito
  const chartSize = 220;
  const strokeWidth = 20;
  const chartCenter = chartSize / 2;
  const chartRadius = 86;
  const innerRingRadius = chartRadius - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * chartRadius;
  const strokeDashoffset = circumference - (percentualGeral / 100) * circumference;

  // Form de Área
  const [formData, setFormData] = useState<Partial<AreaResponsavel>>({
    nome: '',
    responsavelNome: '',
    responsavelCargo: '',
    responsavelEmail: '',
    responsavelTelefone: '',
    unidadeOuLoja: '',
    observacoes: '',
  });

  const filteredAreas = areas.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.nome.toLowerCase().includes(term) ||
      a.responsavelNome.toLowerCase().includes(term) ||
      (a.unidadeOuLoja && a.unidadeOuLoja.toLowerCase().includes(term))
    );
  });

  const handleOpenNew = () => {
    setEditingArea(null);
    setFormData({
      id: `area-${Date.now()}`,
      nome: '',
      responsavelNome: '',
      responsavelCargo: '',
      responsavelEmail: '',
      responsavelTelefone: '',
      unidadeOuLoja: '',
      observacoes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (area: AreaResponsavel) => {
    setEditingArea(area);
    setFormData({ ...area });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.responsavelNome) return;

    const areaToSave: AreaResponsavel = {
      id: formData.id || `area-${Date.now()}`,
      nome: formData.nome,
      responsavelNome: formData.responsavelNome,
      responsavelCargo: formData.responsavelCargo || 'Responsável de Área',
      responsavelEmail: formData.responsavelEmail || '',
      responsavelTelefone: formData.responsavelTelefone || '',
      unidadeOuLoja: formData.unidadeOuLoja || '',
      observacoes: formData.observacoes || '',
    };

    onSaveArea(areaToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. CARD PRINCIPAL: RESULTADO DE SST (DESTAQUE MÁXIMO DO PAINEL)           */}
      {/* ========================================================================= */}
      <section
        id="secao-resultado-sst"
        className="bg-white rounded-2xl sm:rounded-3xl border-2 border-emerald-500/80 shadow-md overflow-hidden ring-2 ring-emerald-50/70"
      >
        {/* Header do Card com Destaque de Segurança SST */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-slate-50 to-white flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: primaryColor }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-300/60"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                  RESULTADO DE SST
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-emerald-700 text-white shadow-xs tracking-wider">
                  Destaque Principal
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Indicador consolidado de conformidade e segurança e saúde no trabalho (SST)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFillFromSystem}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Carregar a soma exata dos dados do sistema (SST + Trabalhistas + Demais)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sincronizar com o Sistema</span>
            </button>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-2xs ${
                percentualGeral >= 85
                  ? 'bg-emerald-600 text-white border border-emerald-700'
                  : percentualGeral >= 60
                  ? 'bg-amber-500 text-white border border-amber-600'
                  : 'bg-rose-600 text-white border border-rose-700'
              }`}
            >
              {percentualGeral >= 85 ? 'Conformidade Plena' : percentualGeral >= 60 ? 'Atenção' : 'Crítico'}
            </span>
          </div>
        </div>

        {/* Corpo do Resultado de SST: Donut Chart à Esquerda e Indicadores Analíticos à Direita */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-gradient-to-b from-white to-slate-50/40">
          {/* Lado Esquerdo: Donut Chart Elegante e Nítido */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 w-full max-w-[240px] sm:max-w-[260px] shadow-2xs">
              <svg
                width={chartSize}
                height={chartSize}
                viewBox={`0 0 ${chartSize} ${chartSize}`}
                className="transform -rotate-90 origin-center filter drop-shadow-xs"
              >
                {/* Background Ring (Trilha de Fundo / Pendentes em Vermelho quando houver pendências) */}
                <circle
                  cx={chartCenter}
                  cy={chartCenter}
                  r={chartRadius}
                  fill="transparent"
                  stroke={pendentes > 0 ? '#dc2626' : '#e2e8f0'}
                  strokeWidth={strokeWidth}
                />

                {/* Progress Ring (Arco dos Válidos em Verde Vibrante e Nítido) */}
                {validos > 0 && (
                  <circle
                    cx={chartCenter}
                    cy={chartCenter}
                    r={chartRadius}
                    fill="transparent"
                    stroke="#16a34a"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 ease-out"
                  />
                )}

                {/* Anel interno concêntrico branco com borda verde refinada */}
                <circle
                  cx={chartCenter}
                  cy={chartCenter}
                  r={innerRingRadius}
                  fill="#ffffff"
                  stroke="#16a34a"
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
              </svg>

              {/* Conteúdo Central com Tipografia Espaçada e Nítida (Zero Sobreposição) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Validados
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight my-0.5">
                  {percentualGeral}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {validos} de {totalGeral} docs
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-xs font-semibold text-slate-600 mt-2.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Válidos: <strong>{validos}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>Pendentes: <strong>{pendentes}</strong></span>
              </span>
            </div>
          </div>

          {/* Lado Direito: Painel Executivo Consolidado de Conformidade */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Documentos Validados */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Válidos & Conformes</span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200 shadow-2xs">
                    {percentualGeral}%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-800">
                  {validos.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-emerald-700/80 font-medium">
                  Documentações aprovadas e em dia no sistema.
                </p>
              </div>

              {/* Card 2: Pendências em Aberto */}
              <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Pendências em Aberto</span>
                  </span>
                  <span className="text-[10px] font-black text-rose-800 bg-white px-1.5 py-0.2 rounded border border-rose-200 shadow-2xs">
                    {totalGeral > 0 ? Math.round((pendentes / totalGeral) * 100) : 0}%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-800">
                  {pendentes.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-rose-700/80 font-medium">
                  Itens com pendência documental a sanar.
                </p>
              </div>

              {/* Card 3: Total Geral no Escopo */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                  Total de Docs Auditados
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {totalGeral.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Soma de CADIM, Trabalhistas e Demais.
                </p>
              </div>

              {/* Card 4: Status do Ecossistema */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Status Operacional
                  </span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    percentualGeral >= 85 ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {percentualGeral >= 85 ? 'Excelente' : 'Monitoramento'}
                  </span>
                </div>
                <div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentualGeral}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                    Taxa global de conformidade: <strong>{percentualGeral}%</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. RESULTADOS DE CADA SEÇÃO (SST, TRABALHISTAS E DEMAIS DOCUMENTOS)       */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>RESULTADO DETALHADO POR SEÇÃO</span>
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhamento analítico da conformidade segmentado pelas 3 frentes de auditoria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* SEÇÃO 1: DOCUMENTOS DE SST (CADIM) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            {/* Header da Seção SST */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider block">
                      SEÇÃO 01
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      DOCUMENTOS DE SST (CADIM)
                    </h3>
                  </div>
                </div>

                <span className="text-base font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                  {sstSectionStats.taxa}%
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Ordens de Serviço (NR-01), Atestados de Saúde Ocupacional (NR-07), Fichas de EPI e Treinamentos.
              </p>
            </div>

            {/* Métricas da Seção SST */}
            <div className="p-3.5 sm:p-4 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{sstSectionStats.totalDocs}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-emerald-600 block uppercase">Validados</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">{sstSectionStats.validados}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-rose-600 block uppercase">Pendentes</span>
                  <span className="text-xs sm:text-sm font-black text-rose-700">{sstSectionStats.pendentes + sstSectionStats.vencidos}</span>
                </div>
              </div>

              {/* Breakdown dos 4 Pilares de SST */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200/70 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">OS (NR-01):</span>
                  <span className="font-bold text-slate-900">{sstSectionStats.os.validados}/{sstSectionStats.os.total} ({sstSectionStats.os.taxa}%)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">ASO (NR-07):</span>
                  <span className="font-bold text-slate-900">{sstSectionStats.aso.validados}/{sstSectionStats.aso.total} ({sstSectionStats.aso.taxa}%)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Ficha EPI (NR-06):</span>
                  <span className="font-bold text-slate-900">{sstSectionStats.epi.validados}/{sstSectionStats.epi.total} ({sstSectionStats.epi.taxa}%)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Treinamentos:</span>
                  <span className="font-bold text-slate-900">{sstSectionStats.outros.validados}/{sstSectionStats.outros.total} ({sstSectionStats.outros.taxa}%)</span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${sstSectionStats.taxa}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DOCUMENTOS TRABALHISTAS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            {/* Header da Seção Trabalhista */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider block">
                      SEÇÃO 02
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      DOCUMENTOS TRABALHISTAS
                    </h3>
                  </div>
                </div>

                <span className="text-base font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
                  {trabalhistaSectionStats.taxa}%
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Folha de Pagamento, Guias de Recolhimento do FGTS (GFIP), GPS e Certidão CNDT.
              </p>
            </div>

            {/* Métricas da Seção Trabalhista */}
            <div className="p-3.5 sm:p-4 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Envios</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{trabalhistaSectionStats.totalDocs}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-blue-600 block uppercase">Validados</span>
                  <span className="text-xs sm:text-sm font-black text-blue-700">{trabalhistaSectionStats.validados}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-rose-600 block uppercase">Pendentes</span>
                  <span className="text-xs sm:text-sm font-black text-rose-700">{trabalhistaSectionStats.reprovados + trabalhistaSectionStats.emAnalise}</span>
                </div>
              </div>

              {/* Breakdown de Competências Trabalhistas */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200/70 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Meses Auditados:</span>
                  <span className="font-bold text-slate-900">{trabalhistaSectionStats.totalMeses} competências</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Meses 100% Regulares:</span>
                  <span className="font-bold text-emerald-700">{trabalhistaSectionStats.mesesValidados} meses</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Em Análise / Pendente:</span>
                  <span className="font-bold text-amber-700">{trabalhistaSectionStats.emAnalise} envios</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Status Geral:</span>
                  <span className="font-bold text-blue-700">{trabalhistaSectionStats.taxa >= 85 ? 'Regular' : 'Pendências'}</span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${trabalhistaSectionStats.taxa}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: DEMAIS DOCUMENTOS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            {/* Header da Seção Demais Documentos */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-purple-700 tracking-wider block">
                      SEÇÃO 03
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      DEMAIS DOCUMENTOS
                    </h3>
                  </div>
                </div>

                <span className="text-base font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 shrink-0">
                  {demaisSectionStats.taxa}%
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Contratos Sociais, Seguros de Responsabilidade Civil, PGR/PCMSO de Contrato, Homologações e CNDs.
              </p>
            </div>

            {/* Métricas da Seção Demais Documentos */}
            <div className="p-3.5 sm:p-4 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Docs</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{demaisSectionStats.totalDocs}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-purple-600 block uppercase">Validados</span>
                  <span className="text-xs sm:text-sm font-black text-purple-700">{demaisSectionStats.validados}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-bold text-rose-600 block uppercase">Pendentes</span>
                  <span className="text-xs sm:text-sm font-black text-rose-700">{demaisSectionStats.reprovados + demaisSectionStats.emAnalise}</span>
                </div>
              </div>

              {/* Breakdown de Contratos */}
              <div className="space-y-1.5 pt-1 border-t border-slate-200/70 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Contratos Auditados:</span>
                  <span className="font-bold text-slate-900">{demaisSectionStats.totalContratos} prestadores</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Contratos Ativos:</span>
                  <span className="font-bold text-purple-700">{demaisSectionStats.contratosAtivos} contratos</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Em Análise / Auditoria:</span>
                  <span className="font-bold text-amber-700">{demaisSectionStats.emAnalise} itens</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">Status Contratual:</span>
                  <span className="font-bold text-purple-700">{demaisSectionStats.taxa >= 85 ? 'Conforme' : 'Ajustes'}</span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-500"
                    style={{ width: `${demaisSectionStats.taxa}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RESUMO DE ÁREAS & GESTORES (MATRIZ OPERACIONAL)                         */}
      {/* ========================================================================= */}
      <section className="space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                RESUMO DE ÁREAS & GESTORES
              </h2>
              <span
                style={{ backgroundColor: `${accentColor}20`, color: primaryColor }}
                className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black uppercase"
              >
                {areas.length} Áreas
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gestores responsáveis e taxa de conformidade por departamento operacional
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar área, gestor ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            <button
              onClick={handleOpenNew}
              style={{ backgroundColor: primaryColor }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Área</span>
            </button>
          </div>
        </div>

        {/* Grid de Áreas */}
        {filteredAreas.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Nenhuma Área Encontrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-3">
              Cadastre as áreas da empresa (ex: Logística, Manutenção, Obras, Facilities, Segurança) e atrele os responsáveis para envio de pendências.
            </p>
            <button
              onClick={handleOpenNew}
              style={{ backgroundColor: primaryColor }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              Cadastrar Primeira Área
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredAreas.map((area) => {
              const metrics = calculateAreaMetrics(area.id, employees);

              return (
                <div
                  key={area.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Area Card Header */}
                  <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          {area.unidadeOuLoja || 'Área Operacional'}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {area.nome}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(area)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar Área"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir a área "${area.nome}"?`)) {
                              onDeleteArea(area.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir Área"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Manager Contact Box */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">
                          {area.responsavelNome}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block pl-6">
                        {area.responsavelCargo}
                      </span>

                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-[11px] text-slate-600">
                        {area.responsavelEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <a
                              href={`mailto:${area.responsavelEmail}`}
                              className="hover:underline text-slate-700"
                            >
                              {area.responsavelEmail}
                            </a>
                          </span>
                        )}
                        {area.responsavelTelefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{area.responsavelTelefone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="p-5 bg-slate-50/50 space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Colabs
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {metrics.totalColaboradores}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Em Dia
                        </span>
                        <span className="text-sm font-black text-emerald-600">
                          {metrics.emDia}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Vencendo
                        </span>
                        <span className="text-sm font-black text-amber-600">
                          {metrics.aVencer30Dias}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Críticos
                        </span>
                        <span className="text-sm font-black text-rose-600">
                          {metrics.criticos}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600">Conformidade da Área:</span>
                        <span
                          style={{ color: metrics.taxaConformidade >= 85 ? '#059669' : '#dc2626' }}
                        >
                          {metrics.taxaConformidade}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${metrics.taxaConformidade}%`,
                            backgroundColor:
                              metrics.taxaConformidade >= 85
                                ? '#059669'
                                : metrics.taxaConformidade >= 60
                                ? '#f59e0b'
                                : '#e11d48',
                          }}
                        />
                      </div>
                    </div>

                    {/* Dispatch Button for this Area */}
                    <button
                      type="button"
                      onClick={() => onSelectAreaForDispatch(area)}
                      style={{ backgroundColor: primaryColor }}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Send className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <span>Disparar Cobrança para {area.responsavelNome.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Criação / Edição de Área */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="p-2 rounded-xl text-white"
                >
                  <Building className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingArea ? 'Editar Área & Responsável' : 'Nova Área / Setor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o nome da área e os contatos do gestor responsável
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Área / Setor *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Logística & CDs, Manutenção, Obras, Facilities"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Gestor Responsável *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ricardo Fontes"
                    value={formData.responsavelNome || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavelNome: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Gerente de Operações"
                    value={formData.responsavelCargo || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavelCargo: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail Corporativo:
                  </label>
                  <input
                    type="email"
                    placeholder="gestor@gpa.com.br"
                    value={formData.responsavelEmail || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavelEmail: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone:
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.responsavelTelefone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, responsavelTelefone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade / Regional / Loja:
                </label>
                <input
                  type="text"
                  placeholder="Ex: CD Osasco, Regional SP, Matriz GPA"
                  value={formData.unidadeOuLoja || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, unidadeOuLoja: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações / Regras da Área:
                </label>
                <textarea
                  rows={2}
                  placeholder="Observações pertinentes à área..."
                  value={formData.observacoes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Área</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
