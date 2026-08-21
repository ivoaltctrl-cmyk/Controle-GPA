import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Building2,
  TrendingUp,
  FileText,
  Radio,
  HardHat,
  HeartPulse,
} from 'lucide-react';
import { SystemStats } from '../types/index.ts';

interface DashboardStatsProps {
  stats: SystemStats;
  totalContracts: number;
  onFilterClick: (filterType: string) => void;
  currentFilter: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  totalContracts,
  onFilterClick,
  currentFilter,
}) => {
  const getComplianceColor = (pct: number) => {
    if (pct >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (pct >= 65) return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
  };

  return (
    <div className="space-y-4">
      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Compliance Rate */}
        <div
          onClick={() => onFilterClick('TODOS')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01] shadow-md ${
            currentFilter === 'TODOS'
              ? 'border-cyan-500 bg-slate-900 shadow-cyan-500/10'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Taxa de Conformidade SST
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats.taxaConformidadeGeral}%
            </span>
            <span className="text-xs text-slate-400">índice consolidado</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                stats.taxaConformidadeGeral >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : stats.taxaConformidadeGeral >= 60
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-600 to-red-500'
              }`}
              style={{ width: `${Math.min(stats.taxaConformidadeGeral, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Base total: {stats.totalFuncionarios} colaboradores</span>
            <span className="text-cyan-400 font-medium">{stats.totalEmDia} regulares</span>
          </p>
        </div>

        {/* Card 2: 100% Em Dia */}
        <div
          onClick={() => onFilterClick('EM_DIA')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01] shadow-md ${
            currentFilter === 'EM_DIA'
              ? 'border-emerald-500 bg-slate-900 shadow-emerald-500/10'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total 100% Em Dia
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats.totalEmDia}
            </span>
            <span className="text-xs text-slate-400">
              ({stats.totalFuncionarios > 0 ? Math.round((stats.totalEmDia / stats.totalFuncionarios) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Colaboradores com todos os documentos e treinamentos válidos.
          </p>
          <div className="mt-2 text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1">
            <span>Liberados para acesso total</span>
          </div>
        </div>

        {/* Card 3: Com Pendências & Críticos */}
        <div
          onClick={() => onFilterClick('COM_PENDENCIA')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01] shadow-md ${
            currentFilter === 'COM_PENDENCIA' || currentFilter === 'CRITICO'
              ? 'border-amber-500 bg-slate-900 shadow-amber-500/10'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pendências & Críticos
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {stats.totalComPendencia}
            </span>
            <span className="text-xs text-rose-400 font-bold">
              ({stats.totalCriticos + stats.totalBloqueados} críticos/vencidos)
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Requerem demanda imediata junto ao gestor ou RH do contrato.
          </p>
          <div className="mt-2 text-[11px] font-medium text-amber-400/90 flex items-center gap-1">
            <span>Clique para filtrar apenas pendentes</span>
          </div>
        </div>

        {/* Card 4: Bloqueados na Portaria / Contratos */}
        <div
          onClick={() => onFilterClick('BLOQUEADO')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:scale-[1.01] shadow-md ${
            currentFilter === 'BLOQUEADO'
              ? 'border-rose-500 bg-slate-900 shadow-rose-500/10'
              : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bloqueios de Acesso
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {stats.totalBloqueados}
            </span>
            <span className="text-xs text-slate-400">colaboradores barrados</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Risco de paralisação e autuação em {totalContracts} contratos ativos.
          </p>
          <div className="mt-2 text-[11px] font-medium text-rose-400/90 flex items-center gap-1">
            <span>Ver bloqueios imediatos</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: The 4 Document Pillars Quick Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: Ordem de Serviço */}
        <button
          onClick={() => onFilterClick('FILTRO_OS')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            currentFilter === 'FILTRO_OS'
              ? 'border-cyan-500 bg-cyan-950/20'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Ordem de Serviço (NR-01)</span>
            </div>
            <span className="text-xs font-bold text-cyan-400">{stats.ordemServico.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Em dia: <strong className="text-emerald-400">{stats.ordemServico.emDia}</strong></span>
            <span>Pendentes: <strong className="text-amber-400">{stats.ordemServico.pendente + stats.ordemServico.vencido}</strong></span>
          </div>
        </button>

        {/* Pillar 2: ASO */}
        <button
          onClick={() => onFilterClick('FILTRO_ASO')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            currentFilter === 'FILTRO_ASO'
              ? 'border-purple-500 bg-purple-950/20'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">ASO Médico (NR-07)</span>
            </div>
            <span className="text-xs font-bold text-purple-400">{stats.aso.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Em dia: <strong className="text-emerald-400">{stats.aso.emDia}</strong></span>
            <span>Vencidos: <strong className="text-rose-400">{stats.aso.vencido}</strong></span>
          </div>
        </button>

        {/* Pillar 3: Ficha de EPI */}
        <button
          onClick={() => onFilterClick('FILTRO_EPI')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            currentFilter === 'FILTRO_EPI'
              ? 'border-pink-500 bg-pink-950/20'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Ficha de EPI (NR-06)</span>
            </div>
            <span className="text-xs font-bold text-pink-400">{stats.fichaEpi.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Em dia: <strong className="text-emerald-400">{stats.fichaEpi.emDia}</strong></span>
            <span>Pendentes: <strong className="text-amber-400">{stats.fichaEpi.pendente + stats.fichaEpi.vencido}</strong></span>
          </div>
        </button>

        {/* Pillar 4: Radioproteção */}
        <button
          onClick={() => onFilterClick('FILTRO_RADIO')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            currentFilter === 'FILTRO_RADIO'
              ? 'border-amber-500 bg-amber-950/20'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">Radioproteção (CNEN)</span>
            </div>
            <span className="text-xs font-bold text-amber-400">{stats.radioprotecao.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Em dia: <strong className="text-emerald-400">{stats.radioprotecao.emDia}</strong></span>
            <span>Vencidos: <strong className="text-rose-400">{stats.radioprotecao.vencido}</strong></span>
          </div>
        </button>
      </div>
    </div>
  );
};
