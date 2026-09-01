import React, { useState, useMemo, useEffect } from 'react';
import {
  Building,
  Mail,
  Phone,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Send,
  FileText,
  ShieldCheck,
  Layers,
  RefreshCw,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaResponsavel,
  Employee,
  Contract,
  TrabalhistaEnvio,
  BrandConfig,
  SystemStats,
} from '../types/index.ts';
import { calculateAreaMetrics, calculateSystemStats } from '../utils/storage.ts';

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
  onSelectAreaForDispatch?: (area: AreaResponsavel) => void;
  onNavigateToDetailed?: (filterStatus: 'TODOS' | 'ATIVOS' | 'PENDENTES' | 'A_VENCER' | 'EM_DIA' | 'DESLIGADOS', category?: 'CADIM' | 'TRABALHISTA' | 'DEMAIS') => void;
  brand: BrandConfig;
}

const LOCAL_STORAGE_CUSTOM_RESUMO = 'resumo_resultado_geral_campos_v2';

export const AreasModule: React.FC<AreasModuleProps> = ({
  areas,
  employees,
  contracts = [],
  trabalhistaEnvios = [],
  resumoConfig,
  onSaveResumoConfig,
  onSelectAreaForDispatch,
  onNavigateToDetailed,
  brand,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const primaryColor = brand?.primaryColor || '#006837';
  const accentColor = brand?.accentColor || '#f59e0b';

  // --------------------------------------------------------------------------
  // CÁLCULO UNIFICADO COM CALCULATESYSTEMSTATS (Storage Compartilhado)
  // --------------------------------------------------------------------------
  const calculatedStats = useMemo(() => {
    return calculateSystemStats(employees, trabalhistaEnvios, contracts);
  }, [employees, trabalhistaEnvios, contracts]);

  const sstSectionStats = calculatedStats.sstDocs;
  const trabalhistaSectionStats = calculatedStats.trabalhistaStats;
  const demaisSectionStats = calculatedStats.demaisStats;

  // --------------------------------------------------------------------------
  // RESULTADO GERAL: INDICADOR EM FORMATO DE DONUT COM 2 CAMPOS (VÁLIDOS E PENDENTES)
  // --------------------------------------------------------------------------
  const sistemaTotalAuditados = sstSectionStats.totalDocs + trabalhistaSectionStats.totalDocs + demaisSectionStats.totalDocs;
  const sistemaTotalValidados = sstSectionStats.validados + trabalhistaSectionStats.validados + demaisSectionStats.validados;
  const sistemaTotalPendentes = Math.max(0, sistemaTotalAuditados - sistemaTotalValidados);

  // Estados dos dois campos (Válidos e Pendentes)
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

  // Dimensões do SVG Donut Chart
  const chartSize = 220;
  const strokeWidth = 20;
  const chartCenter = chartSize / 2;
  const chartRadius = 86;
  const innerRingRadius = chartRadius - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * chartRadius;
  const strokeDashoffset = circumference - (percentualGeral / 100) * circumference;

  const filteredAreas = areas.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.nome.toLowerCase().includes(term) ||
      a.responsavelNome.toLowerCase().includes(term) ||
      (a.unidadeOuLoja && a.unidadeOuLoja.toLowerCase().includes(term))
    );
  });

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
                {/* Background Ring */}
                <circle
                  cx={chartCenter}
                  cy={chartCenter}
                  r={chartRadius}
                  fill="transparent"
                  stroke={pendentes > 0 ? '#dc2626' : '#e2e8f0'}
                  strokeWidth={strokeWidth}
                />

                {/* Progress Ring */}
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

                {/* Anel interno concêntrico */}
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

              {/* Conteúdo Central */}
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

          {/* Lado Direito: Painel Executivo Consolidado com Clique para Navegação */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Documentos Validados (Navega para EM_DIA) */}
              <div
                onClick={() => onNavigateToDetailed?.('EM_DIA', 'CADIM')}
                className="bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 space-y-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm"
                title="Clique para ver colaboradores com documentação 100% Em Dia"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Válidos & Conformes</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-200 shadow-2xs">
                      {percentualGeral}%
                    </span>
                    <ChevronRight className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-800">
                  {validos.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-emerald-700/80 font-medium">
                  Clique para visualizar no detalhado.
                </p>
              </div>

              {/* Card 2: Pendências em Aberto (Navega para PENDENTES) */}
              <div
                onClick={() => onNavigateToDetailed?.('PENDENTES', 'CADIM')}
                className="bg-rose-50/50 hover:bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 space-y-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm"
                title="Clique para ver colaboradores com pendências"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Pendências em Aberto</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-rose-800 bg-white px-1.5 py-0.2 rounded border border-rose-200 shadow-2xs">
                      {totalGeral > 0 ? Math.round((pendentes / totalGeral) * 100) : 0}%
                    </span>
                    <ChevronRight className="w-3 h-3 text-rose-600" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-800">
                  {pendentes.toLocaleString('pt-BR')}
                </div>
                <p className="text-[10px] text-rose-700/80 font-medium">
                  Clique para visualizar no detalhado.
                </p>
              </div>

              {/* Card 3: Total Geral no Escopo (Navega para TODOS) */}
              <div
                onClick={() => onNavigateToDetailed?.('TODOS', 'CADIM')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 space-y-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm"
                title="Clique para ver a lista completa de terceiros"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
                    Total de Docs Auditados
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
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
                <div
                  onClick={() => onNavigateToDetailed?.('TODOS', 'CADIM')}
                  className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver todos no CADIM"
                >
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Total</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{sstSectionStats.totalDocs}</span>
                </div>
                <div
                  onClick={() => onNavigateToDetailed?.('EM_DIA', 'CADIM')}
                  className="p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver validados no CADIM"
                >
                  <span className="text-[9px] font-bold text-emerald-600 block uppercase">Validados</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700">{sstSectionStats.validados}</span>
                </div>
                <div
                  onClick={() => onNavigateToDetailed?.('PENDENTES', 'CADIM')}
                  className="p-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver pendentes no CADIM"
                >
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
                <div
                  onClick={() => onNavigateToDetailed?.('TODOS', 'TRABALHISTA')}
                  className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver todos no Trabalhista"
                >
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Envios</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{trabalhistaSectionStats.totalDocs}</span>
                </div>
                <div
                  onClick={() => onNavigateToDetailed?.('EM_DIA', 'TRABALHISTA')}
                  className="p-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver validados no Trabalhista"
                >
                  <span className="text-[9px] font-bold text-blue-600 block uppercase">Validados</span>
                  <span className="text-xs sm:text-sm font-black text-blue-700">{trabalhistaSectionStats.validados}</span>
                </div>
                <div
                  onClick={() => onNavigateToDetailed?.('PENDENTES', 'TRABALHISTA')}
                  className="p-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver pendentes no Trabalhista"
                >
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
                <div
                  onClick={() => onNavigateToDetailed?.('TODOS', 'DEMAIS')}
                  className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver todos nos Contratos"
                >
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Docs</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">{demaisSectionStats.totalDocs}</span>
                </div>
                <div
                  onClick={() => onNavigateToDetailed?.('EM_DIA', 'DEMAIS')}
                  className="p-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver validados nos Contratos"
                >
                  <span className="text-[9px] font-bold text-purple-600 block uppercase">Validados</span>
                  <span className="text-xs sm:text-sm font-black text-purple-700">{demaisSectionStats.validados}</span>
                </div>
                <div
                  onClick={() => onNavigateToDetailed?.('PENDENTES', 'DEMAIS')}
                  className="p-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
                  title="Ver pendentes nos Contratos"
                >
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
      {/* 3. RESUMO DE ÁREAS & GESTORES (MATRIZ OPERACIONAL - SOMENTE VISUALIZAÇÃO)   */}
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
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar área, gestor ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Grid de Áreas */}
        {filteredAreas.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Nenhuma Área Encontrada</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              As áreas cadastradas no sistema serão exibidas aqui com seus indicadores operacionais.
            </p>
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
                  <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div
                        onClick={() => onNavigateToDetailed?.('TODOS', 'CADIM')}
                        className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                        title="Ver terceiros da área"
                      >
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Colabs
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {metrics.totalColaboradores}
                        </span>
                      </div>

                      <div
                        onClick={() => onNavigateToDetailed?.('EM_DIA', 'CADIM')}
                        className="p-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 cursor-pointer transition-colors"
                        title="Ver colaboradores em dia"
                      >
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Em Dia
                        </span>
                        <span className="text-sm font-black text-emerald-600">
                          {metrics.emDia}
                        </span>
                      </div>

                      <div
                        onClick={() => onNavigateToDetailed?.('A_VENCER', 'CADIM')}
                        className="p-2 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 cursor-pointer transition-colors"
                        title="Ver colaboradores a vencer"
                      >
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Vencendo
                        </span>
                        <span className="text-sm font-black text-amber-600">
                          {metrics.aVencer30Dias}
                        </span>
                      </div>

                      <div
                        onClick={() => onNavigateToDetailed?.('PENDENTES', 'CADIM')}
                        className="p-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
                        title="Ver colaboradores críticos/pendentes"
                      >
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
                    {onSelectAreaForDispatch && (
                      <button
                        type="button"
                        onClick={() => onSelectAreaForDispatch(area)}
                        style={{ backgroundColor: primaryColor }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        <Send className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        <span>Disparar Cobrança para {area.responsavelNome.split(' ')[0]}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
