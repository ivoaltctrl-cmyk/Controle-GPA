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
  return (
    <div className="space-y-4">
      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Compliance Rate */}
        <div
          onClick={() => onFilterClick('TODOS')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md bg-white ${
            currentFilter === 'TODOS'
              ? 'border-[#002D62] ring-2 ring-[#002D62]/15 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Taxa de Conformidade SST
            </span>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-[#002D62]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.taxaConformidadeGeral}%
            </span>
            <span className="text-xs font-medium text-slate-500">índice consolidado</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                stats.taxaConformidadeGeral >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : stats.taxaConformidadeGeral >= 60
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                  : 'bg-gradient-to-r from-rose-600 to-red-500'
              }`}
              style={{ width: `${Math.min(stats.taxaConformidadeGeral, 100)}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between font-medium">
            <span>Base total: <strong>{stats.totalFuncionarios}</strong> colaboradores</span>
            <span className="text-emerald-700 font-bold">{stats.totalEmDia} regulares</span>
          </p>
        </div>

        {/* Card 2: 100% Em Dia */}
        <div
          onClick={() => onFilterClick('EM_DIA')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md bg-white ${
            currentFilter === 'EM_DIA'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total 100% Em Dia
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {stats.totalEmDia}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({stats.totalFuncionarios > 0 ? Math.round((stats.totalEmDia / stats.totalFuncionarios) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Colaboradores com todos os documentos e treinamentos válidos.
          </p>
          <div className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Liberados para acesso irrestrito</span>
          </div>
        </div>

        {/* Card 3: Com Pendências & Críticos */}
        <div
          onClick={() => onFilterClick('COM_PENDENCIA')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md bg-white ${
            currentFilter === 'COM_PENDENCIA' || currentFilter === 'CRITICO'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pendências & Críticos
            </span>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {stats.totalComPendencia}
            </span>
            <span className="text-xs text-rose-600 font-bold">
              ({stats.totalCriticos + stats.totalBloqueados} críticos/vencidos)
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Requerem demanda de regularização junto ao gestor ou RH do contrato.
          </p>
          <div className="mt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Clique para filtrar apenas pendentes</span>
          </div>
        </div>

        {/* Card 4: Bloqueios de Acesso */}
        <div
          onClick={() => onFilterClick('BLOQUEADO')}
          className={`relative overflow-hidden rounded-2xl p-5 border cursor-pointer transition-all hover:shadow-md bg-white ${
            currentFilter === 'BLOQUEADO'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bloqueios de Acesso
            </span>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {stats.totalBloqueados}
            </span>
            <span className="text-xs font-medium text-slate-500">colaboradores barrados</span>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Risco de interrupção operacional em <strong>{totalContracts}</strong> contratos ativos.
          </p>
          <div className="mt-2 text-[11px] font-bold text-rose-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Ver bloqueios imediatos</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: The 4 Document Pillars Quick Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: Ordem de Serviço */}
        <button
          onClick={() => onFilterClick('FILTRO_OS')}
          className={`p-3.5 rounded-xl border text-left transition-all bg-white cursor-pointer hover:shadow-xs ${
            currentFilter === 'FILTRO_OS'
              ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Ordem de Serviço (NR-01)</span>
            </div>
            <span className="text-xs font-extrabold text-sky-700">{stats.ordemServico.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
            <span>Em dia: <strong className="text-emerald-600">{stats.ordemServico.emDia}</strong></span>
            <span>Pendentes: <strong className="text-amber-600">{stats.ordemServico.pendente + stats.ordemServico.vencido}</strong></span>
          </div>
        </button>

        {/* Pillar 2: ASO */}
        <button
          onClick={() => onFilterClick('FILTRO_ASO')}
          className={`p-3.5 rounded-xl border text-left transition-all bg-white cursor-pointer hover:shadow-xs ${
            currentFilter === 'FILTRO_ASO'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">ASO Médico (NR-07)</span>
            </div>
            <span className="text-xs font-extrabold text-purple-700">{stats.aso.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
            <span>Em dia: <strong className="text-emerald-600">{stats.aso.emDia}</strong></span>
            <span>Vencidos: <strong className="text-rose-600">{stats.aso.vencido}</strong></span>
          </div>
        </button>

        {/* Pillar 3: Ficha de EPI */}
        <button
          onClick={() => onFilterClick('FILTRO_EPI')}
          className={`p-3.5 rounded-xl border text-left transition-all bg-white cursor-pointer hover:shadow-xs ${
            currentFilter === 'FILTRO_EPI'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Ficha de EPI (NR-06)</span>
            </div>
            <span className="text-xs font-extrabold text-indigo-700">{stats.fichaEpi.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
            <span>Em dia: <strong className="text-emerald-600">{stats.fichaEpi.emDia}</strong></span>
            <span>Pendentes: <strong className="text-amber-600">{stats.fichaEpi.pendente + stats.fichaEpi.vencido}</strong></span>
          </div>
        </button>

        {/* Pillar 4: Radioproteção */}
        <button
          onClick={() => onFilterClick('FILTRO_RADIO')}
          className={`p-3.5 rounded-xl border text-left transition-all bg-white cursor-pointer hover:shadow-xs ${
            currentFilter === 'FILTRO_RADIO'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Radioproteção (CNEN)</span>
            </div>
            <span className="text-xs font-extrabold text-amber-700">{stats.radioprotecao.taxa}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
            <span>Em dia: <strong className="text-emerald-600">{stats.radioprotecao.emDia}</strong></span>
            <span>Vencidos: <strong className="text-rose-600">{stats.radioprotecao.vencido}</strong></span>
          </div>
        </button>
      </div>
    </div>
  );
};
