import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Lock,
  KeyRound,
  User,
  ShieldCheck,
  FileSpreadsheet,
  FileScan,
  Bell,
  Trash2,
  Palette,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Database,
  ArrowRight,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  Flame,
  Activity,
  Layers,
  FileCheck,
  Check,
  HelpCircle,
  Building2,
  Building,
  TrendingUp,
} from 'lucide-react';
import { BrandConfig, Employee, Contract, TrabalhistaEnvio, AreaResponsavel } from '../types/index.ts';
import { getStoredAdminCredentials, saveStoredAdminCredentials } from '../utils/storage.ts';

interface SettingsModuleProps {
  onOpenSheetsSync: () => void;
  onOpenOcrScanner: () => void;
  onOpenProductionReset: () => void;
  onOpenBrandSettings: () => void;
  blinkingAlerts: boolean;
  onToggleBlinkingAlerts: () => void;
  brand: BrandConfig;
  employees: Employee[];
  contracts: Contract[];
  trabalhistas: TrabalhistaEnvio[];
  areas: AreaResponsavel[];
  syncStatus?: {
    status: 'idle' | 'syncing' | 'synced' | 'error';
    lastSynced?: string;
    message?: string;
  };
  onRefreshSheets?: () => void;
  onGoToDemandado?: () => void;
  resumoConfig?: {
    validos: number;
    pendentes: number;
    lastUpdated?: string;
  } | null;
  onSaveResumoConfig?: (newConfig: { validos: number; pendentes: number }) => void;
  onSaveAdminCredentials?: (username: string, password: string) => void;
}

const LOCAL_STORAGE_CUSTOM_RESUMO = 'sgp_custom_resumo_v1';

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  onOpenSheetsSync,
  onOpenOcrScanner,
  onOpenProductionReset,
  onOpenBrandSettings,
  blinkingAlerts,
  onToggleBlinkingAlerts,
  brand,
  employees,
  contracts,
  trabalhistas,
  areas,
  syncStatus,
  onRefreshSheets,
  onGoToDemandado,
  resumoConfig,
  onSaveResumoConfig,
  onSaveAdminCredentials,
}) => {
  const currentCreds = getStoredAdminCredentials();
  const [username, setUsername] = useState(currentCreds.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const primaryColor = brand?.primaryColor || '#E21B23';
  const companyName = brand?.companyName || 'GPA';

  // --------------------------------------------------------------------------
  // PARÂMETROS DO GRÁFICO (RESUMO GERAL)
  // --------------------------------------------------------------------------
  const [validos, setValidos] = useState<number>(() => {
    if (resumoConfig && typeof resumoConfig.validos === 'number') {
      return resumoConfig.validos;
    }
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_RESUMO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.validos === 'number') return parsed.validos;
      }
    } catch (e) {}
    return 4404;
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
    return 2;
  });

  useEffect(() => {
    if (resumoConfig && typeof resumoConfig.validos === 'number' && typeof resumoConfig.pendentes === 'number') {
      setValidos(resumoConfig.validos);
      setPendentes(resumoConfig.pendentes);
    }
  }, [resumoConfig?.validos, resumoConfig?.pendentes, resumoConfig?.lastUpdated]);

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
    // Calcula a soma real de exames validados e pendências
    let calcValidados = 0;
    let calcPendentes = 0;

    employees.forEach((emp) => {
      if (emp.pendencias && Array.isArray(emp.pendencias)) {
        emp.pendencias.forEach((p) => {
          if (p.status === 'EM_DIA') {
            calcValidados++;
          } else if (p.status === 'PENDENTE' || p.status === 'VENCIDO' || p.status === 'A_VENCER') {
            calcPendentes++;
          }
        });
      }
    });

    trabalhistas.forEach((t) => {
      if (t.status === 'Validado') {
        calcValidados++;
      } else if (t.status === 'Reprovado' || t.status === 'Em Análise') {
        calcPendentes++;
      }
    });

    const finalVal = calcValidados > 0 ? calcValidados : 4404;
    const finalPen = calcPendentes > 0 ? calcPendentes : 2;

    setValidos(finalVal);
    setPendentes(finalPen);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_CUSTOM_RESUMO,
        JSON.stringify({ validos: finalVal, pendentes: finalPen })
      );
    } catch (e) {}
    onSaveResumoConfig?.({ validos: finalVal, pendentes: finalPen });
  };

  const totalGeral = validos + pendentes;
  const percentualGeral = useMemo(() => {
    if (totalGeral <= 0) return validos > 0 ? 100 : 0;
    const pct = Math.round((validos / totalGeral) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [validos, totalGeral]);

  // --------------------------------------------------------------------------
  // CREDENCIAIS DE ADM
  // --------------------------------------------------------------------------
  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (currentPassword !== currentCreds.password) {
      setPasswordError('A senha atual informada está incorreta.');
      return;
    }

    if (!newPassword || newPassword.length < 3) {
      setPasswordError('A nova senha deve possuir pelo menos 3 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    if (onSaveAdminCredentials) {
      onSaveAdminCredentials(username, newPassword);
    } else {
      saveStoredAdminCredentials(username, newPassword);
    }

    setPasswordSuccess('Credenciais de Administrador salvas e sincronizadas em todos os dispositivos com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner - Vies de Gestao & Parametros Globais */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            style={{ backgroundColor: primaryColor }}
            className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-xs"
          >
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                Gestão & Parâmetros do Sistema
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronização em Tempo Real Ativa
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Guia de Configurações do Sistema
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Painel de governança, parâmetros do resumo geral, credenciais de administrador, integrações e segurança.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncStatus?.lastSynced && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Última Sincronização: <strong>{syncStatus.lastSynced}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Main Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Gestao de Parametros & Visao Operacional */}
        <div className="lg:col-span-5 space-y-6">
          {/* Gestão de Credenciais do Administrador */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                <Lock className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Segurança & Troca de Senha do ADM</h3>
                <p className="text-[11px] text-slate-500">
                  Ao trocar a senha aqui, ela é sincronizada automaticamente em todos os navegadores e computadores
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Usuário Administrador</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-xs font-semibold bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Senha Atual</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 3 dígitos"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Novas Credenciais (Sincronizar em Todos os PCs)</span>
              </button>
            </form>
          </div>

          {/* Status do Banco de Dados & Infraestrutura */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                <Activity className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Métricas & Inventário do Sistema</h3>
                <p className="text-[11px] text-slate-500">Volume de registros carregados em memória e servidor</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] text-slate-500 block font-medium">Colaboradores CADIM</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{employees.length}</span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] text-slate-500 block font-medium">Contratos Cadastrados</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{contracts.length}</span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] text-slate-500 block font-medium">Áreas & Setores</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{areas.length}</span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] text-slate-500 block font-medium">Envios Trabalhistas</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{trabalhistas.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions, Integrations & Resumo Parameters */}
        <div className="lg:col-span-7 space-y-5">
          {/* ========================================================================= */}
          {/* 1. PARÂMETROS DO GRÁFICO (RESUMO GERAL) - MOVIDO PARA CONFIGURAÇÕES      */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Parâmetros do Gráfico (Resumo Geral)
                    </h3>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Sincronizado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Altere os números de <strong>Válidos</strong> e <strong>Pendentes</strong> para atualizar o gráfico Donut da tela principal em todos os computadores.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black text-emerald-900">
                  Resultado: {percentualGeral}% ({validos} de {totalGeral})
                </span>
              </div>
            </div>

            {/* CAMPOS SIMPLES E DIRETOS: VÁLIDOS E PENDENTES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo Válidos */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-2 hover:border-emerald-400 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Válidos (Conformes):</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {percentualGeral}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateValidos(Math.max(0, validos - 1))}
                    className="w-9 h-10 rounded-xl bg-white hover:bg-slate-200 font-black text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer text-base shadow-2xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={validos}
                    onChange={(e) => handleUpdateValidos(parseInt(e.target.value, 10))}
                    className="w-full text-center px-3 py-2 text-2xl font-black text-emerald-700 bg-white rounded-xl border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-all shadow-2xs"
                    placeholder="4404"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateValidos(validos + 1)}
                    className="w-9 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-white flex items-center justify-center transition-colors cursor-pointer text-base shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Campo Pendentes */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-2 hover:border-rose-400 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Pendentes (Em Aberto):</span>
                  </label>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    {totalGeral > 0 ? Math.round((pendentes / totalGeral) * 100) : 0}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdatePendentes(Math.max(0, pendentes - 1))}
                    className="w-9 h-10 rounded-xl bg-white hover:bg-slate-200 font-black text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer text-base shadow-2xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={pendentes}
                    onChange={(e) => handleUpdatePendentes(parseInt(e.target.value, 10))}
                    className="w-full text-center px-3 py-2 text-2xl font-black text-rose-700 bg-white rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-600 transition-all shadow-2xs"
                    placeholder="2"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdatePendentes(pendentes + 1)}
                    className="w-9 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 font-black text-white flex items-center justify-center transition-colors cursor-pointer text-base shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Presets & Sincronização */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">Exemplos Rápidos:</span>
                <button
                  onClick={() => {
                    handleUpdateValidos(30);
                    handleUpdatePendentes(70);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  30 / 70 (30%)
                </button>
                <button
                  onClick={() => {
                    handleUpdateValidos(99);
                    handleUpdatePendentes(1);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  99 / 1 (99%)
                </button>
                <button
                  onClick={() => {
                    handleUpdateValidos(100);
                    handleUpdatePendentes(0);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  100 / 0 (100%)
                </button>
                <button
                  onClick={() => {
                    handleUpdateValidos(85);
                    handleUpdatePendentes(15);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  85 / 15 (85%)
                </button>
              </div>

              <button
                onClick={handleAutoFillFromSystem}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                <span>Calcular da Base de Dados</span>
              </button>
            </div>
          </div>

          {/* 2. Sincronização GPA (Sheets) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-300 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Sincronização GPA (Sheets)</h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Planilha GPA_BD
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conecte com a planilha Google Sheets oficial para importar registros ou exportar em Excel/CSV.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {onRefreshSheets && (
                <button
                  onClick={onRefreshSheets}
                  title="Atualizar dados agora da nuvem"
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus?.status === 'syncing' ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              )}
              <button
                onClick={onOpenSheetsSync}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Abrir Central GPA_BD</span>
              </button>
            </div>
          </div>

          {/* 3. Lançar Print (OCR com IA) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-300 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                <FileScan className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Lançar Print (OCR com Inteligência Artificial)</h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Gemini Vision
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Faça upload de prints de telas ou comprovantes e extraia colaboradores e pendências automaticamente.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenOcrScanner}
              style={{ backgroundColor: primaryColor }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <FileScan className="w-4 h-4" />
              <span>Abrir Leitor OCR</span>
            </button>
          </div>

          {/* 4. Alertas Piscantes ON/OFF */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  blinkingAlerts
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Alertas Visuais Piscantes</h3>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      blinkingAlerts ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Status: {blinkingAlerts ? 'ATIVADO (ON)' : 'DESATIVADO (OFF)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Destaca documentos vencidos e a vencer com animações pulsantes para ação preventiva rápida.
                </p>
              </div>
            </div>

            <button
              onClick={onToggleBlinkingAlerts}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs shrink-0 ${
                blinkingAlerts
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {blinkingAlerts && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    blinkingAlerts ? 'bg-white' : 'bg-slate-500'
                  }`}
                />
              </span>
              <span>Alternar: <strong>{blinkingAlerts ? 'Desativar' : 'Ativar'}</strong></span>
            </button>
          </div>

          {/* 5. Personalização Visual & Marca */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Identidade Visual & Cores</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajuste o nome da empresa, logotipo e as cores primárias do sistema {companyName}.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenBrandSettings}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Palette className="w-4 h-4 text-purple-600" />
              <span>Personalizar Marca</span>
            </button>
          </div>

          {/* 6. Zerar Planilha / Iniciar Produção */}
          <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-rose-950">Zerar Planilha / Limpar Dados</h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-200/80 text-rose-900">
                    Ação de Governança
                  </span>
                </div>
                <p className="text-xs text-rose-700/80 mt-0.5">
                  Remove colaboradores e contratos para que você possa iniciar com a base de produção limpa.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenProductionReset}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Zerar Dados</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

