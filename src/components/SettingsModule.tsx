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
  Plus,
  Edit2,
  X,
  Mail,
  Phone,
  UserCheck,
} from 'lucide-react';
import { BrandConfig, Employee, Contract, TrabalhistaEnvio, AreaResponsavel } from '../types/index.ts';
import { getStoredAdminSessionToken } from '../utils/storage.ts';
import { authenticateAdminOnServer, saveAdminCredentialsToServer } from '../services/backendSyncService.ts';

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
  onSaveArea?: (area: AreaResponsavel) => void;
  onDeleteArea?: (id: string) => void;
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
  onSaveAdminCredentials?: (username: string, password: string) => Promise<void>;
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
  onSaveArea,
  onDeleteArea,
  syncStatus,
  onRefreshSheets,
  onGoToDemandado,
  resumoConfig,
  onSaveResumoConfig,
  onSaveAdminCredentials,
}) => {
  const [username, setUsername] = useState('admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // --------------------------------------------------------------------------
  // CADASTRO / EDIÇÃO DE ÁREAS & GESTORES (CRUD)
  // --------------------------------------------------------------------------
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaResponsavel | null>(null);
  const [areaSearchTerm, setAreaSearchTerm] = useState('');
  const [areaFormData, setAreaFormData] = useState<Partial<AreaResponsavel>>({
    nome: '',
    responsavelNome: '',
    responsavelCargo: '',
    responsavelEmail: '',
    responsavelTelefone: '',
    unidadeOuLoja: '',
    observacoes: '',
  });

  const handleOpenNewArea = () => {
    setEditingArea(null);
    setAreaFormData({
      id: `area-${Date.now()}`,
      nome: '',
      responsavelNome: '',
      responsavelCargo: '',
      responsavelEmail: '',
      responsavelTelefone: '',
      unidadeOuLoja: '',
      observacoes: '',
    });
    setIsAreaModalOpen(true);
  };

  const handleOpenEditArea = (area: AreaResponsavel) => {
    setEditingArea(area);
    setAreaFormData({ ...area });
    setIsAreaModalOpen(true);
  };

  const handleAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaFormData.nome || !areaFormData.responsavelNome) return;

    const areaToSave: AreaResponsavel = {
      id: areaFormData.id || `area-${Date.now()}`,
      nome: areaFormData.nome,
      responsavelNome: areaFormData.responsavelNome,
      responsavelCargo: areaFormData.responsavelCargo || 'Responsável de Área',
      responsavelEmail: areaFormData.responsavelEmail || '',
      responsavelTelefone: areaFormData.responsavelTelefone || '',
      unidadeOuLoja: areaFormData.unidadeOuLoja || '',
      observacoes: areaFormData.observacoes || '',
    };

    onSaveArea?.(areaToSave);
    setIsAreaModalOpen(false);
  };

  const filteredAreasList = areas.filter((a) => {
    const term = areaSearchTerm.toLowerCase();
    return (
      a.nome.toLowerCase().includes(term) ||
      a.responsavelNome.toLowerCase().includes(term) ||
      (a.unidadeOuLoja && a.unidadeOuLoja.toLowerCase().includes(term))
    );
  });

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
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [showCredsPass, setShowCredsPass] = useState(false);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const cleanUser = username.trim() || 'admin';
    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setPasswordError('Informe a senha atual.');
      return;
    }

    if (!cleanNew || cleanNew.length < 3) {
      setPasswordError('A nova senha deve possuir pelo menos 3 caracteres.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    setIsSavingCreds(true);
    try {
      // Validação estrita via servidor
      const verifyCurrent = await authenticateAdminOnServer(cleanUser, cleanCurrent);
      if (!verifyCurrent.success) {
        setPasswordError('A senha atual informada está incorreta.');
        setIsSavingCreds(false);
        return;
      }

      const sessionToken = getStoredAdminSessionToken() || verifyCurrent.sessionToken;

      if (onSaveAdminCredentials) {
        await onSaveAdminCredentials(cleanUser, cleanNew);
      } else {
        const res = await saveAdminCredentialsToServer(cleanUser, cleanNew, sessionToken || undefined);
        if (!res.success) {
          setPasswordError(res.error || 'Erro ao sincronizar com o servidor.');
          setIsSavingCreds(false);
          return;
        }
      }

      setPasswordSuccess('Credenciais de Administrador salvas e sincronizadas em todos os dispositivos com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError('Erro ao sincronizar com o servidor.');
    } finally {
      setIsSavingCreds(false);
    }
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Lock className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Segurança & Troca de Senha do ADM</h3>
                  <p className="text-[11px] text-slate-500">
                    Sincronizada automaticamente em todos os computadores
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCredsPass(!showCredsPass)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                {showCredsPass ? 'Ocultar' : 'Ver senhas'}
              </button>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{passwordError}</span>
                  </div>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
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
                  type={showCredsPass ? 'text' : 'password'}
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
                    type={showCredsPass ? 'text' : 'password'}
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
                    type={showCredsPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSavingCreds ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sincronizando com Servidor...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Salvar Novas Credenciais (Sincronizar em Todos os PCs)</span>
                    </>
                  )}
                </button>
              </div>
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

          {/* 6. Gestão de Áreas & Gestores (CRUD) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Cadastro de Áreas & Gestores
                    </h3>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {areas.length} cadastradas
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cadastre e gerencie as áreas da empresa, unidades e seus respectivos gestores operacionais.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewArea}
                  style={{ backgroundColor: primaryColor }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Área</span>
                </button>
              </div>
            </div>

            {/* Busca Rápida de Áreas */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar área, gestor ou unidade cadastrada..."
                value={areaSearchTerm}
                onChange={(e) => setAreaSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            {/* Lista das Áreas com Botões de Editar e Excluir */}
            {filteredAreasList.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <Building className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <h4 className="text-xs font-bold text-slate-700">Nenhuma Área Cadastrada</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clique no botão acima para adicionar a primeira área operacional.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredAreasList.map((area) => (
                  <div
                    key={area.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          {area.unidadeOuLoja || 'Área Operacional'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{area.nome}</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditArea(area)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Editar Área"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Deseja excluir a área "${area.nome}"?`)) {
                              onDeleteArea?.(area.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir Área"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{area.responsavelNome}</span>
                        {area.responsavelCargo && (
                          <span className="text-[10px] font-normal text-slate-500">({area.responsavelCargo})</span>
                        )}
                      </div>
                      {area.responsavelEmail && (
                        <div className="flex items-center gap-1.5 text-slate-500 pl-5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{area.responsavelEmail}</span>
                        </div>
                      )}
                      {area.responsavelTelefone && (
                        <div className="flex items-center gap-1.5 text-slate-500 pl-5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{area.responsavelTelefone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Zerar Planilha / Iniciar Produção */}
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

      {/* Modal de Criação / Edição de Área */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="p-2 rounded-xl text-white"
                >
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingArea ? 'Editar Área & Gestor' : 'Nova Área / Setor'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o nome da área e os contatos do gestor responsável
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAreaModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAreaSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Área / Setor *:
                </label>
                <input
                  type="text"
                  required
                  value={areaFormData.nome || ''}
                  onChange={(e) => setAreaFormData({ ...areaFormData, nome: e.target.value })}
                  placeholder="Ex: Logística & CD, Manutenção, Obras..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Gestor *:
                  </label>
                  <input
                    type="text"
                    required
                    value={areaFormData.responsavelNome || ''}
                    onChange={(e) =>
                      setAreaFormData({ ...areaFormData, responsavelNome: e.target.value })
                    }
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    value={areaFormData.responsavelCargo || ''}
                    onChange={(e) =>
                      setAreaFormData({ ...areaFormData, responsavelCargo: e.target.value })
                    }
                    placeholder="Ex: Gerente de Operações"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail do Gestor:
                  </label>
                  <input
                    type="email"
                    value={areaFormData.responsavelEmail || ''}
                    onChange={(e) =>
                      setAreaFormData({ ...areaFormData, responsavelEmail: e.target.value })
                    }
                    placeholder="gestor@empresa.com.br"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone:
                  </label>
                  <input
                    type="tel"
                    value={areaFormData.responsavelTelefone || ''}
                    onChange={(e) =>
                      setAreaFormData({ ...areaFormData, responsavelTelefone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade / Loja (Opcional):
                </label>
                <input
                  type="text"
                  value={areaFormData.unidadeOuLoja || ''}
                  onChange={(e) =>
                    setAreaFormData({ ...areaFormData, unidadeOuLoja: e.target.value })
                  }
                  placeholder="Ex: CD São Paulo, Loja 102 - Morumbi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Internas:
                </label>
                <textarea
                  rows={2}
                  value={areaFormData.observacoes || ''}
                  onChange={(e) =>
                    setAreaFormData({ ...areaFormData, observacoes: e.target.value })
                  }
                  placeholder="Notas adicionais sobre a área..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-95 cursor-pointer"
                >
                  {editingArea ? 'Salvar Alterações' : 'Cadastrar Área'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

