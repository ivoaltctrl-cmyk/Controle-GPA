import React from 'react';
import {
  FileScan,
  Users,
  Building,
  Building2,
  Send,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Palette,
  Trash2,
  Lock,
  LogOut,
  ShieldCheck,
  FileCheck,
  KeyRound,
  Shield,
} from 'lucide-react';
import { WfsLogo } from './WfsLogo.tsx';
import { BrandConfig } from '../types/index.ts';

export type MainPortalMode = 'demandados' | 'admin';

interface NavbarProps {
  portalMode: MainPortalMode;
  setPortalMode: (mode: MainPortalMode) => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  onOpenAdminLogin: () => void;
  onOpenChangePassword: () => void;
  activeTab: 'dashboard' | 'employees' | 'areas' | 'contracts' | 'demands' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'employees' | 'areas' | 'contracts' | 'demands' | 'reports') => void;
  onOpenOcrScanner: () => void;
  onOpenNewEmployee: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onOpenAuditReport: () => void;
  onResetData: () => void;
  onOpenProductionReset: () => void;
  onOpenBrandSettings: () => void;
  brand: BrandConfig;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  totalEmployees: number;
  totalPending: number;
  totalAVencer: number;
  blinkingAlerts?: boolean;
  onToggleBlinkingAlerts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portalMode,
  setPortalMode,
  isAdminLoggedIn,
  onAdminLogout,
  onOpenAdminLogin,
  onOpenChangePassword,
  activeTab,
  setActiveTab,
  onOpenOcrScanner,
  onOpenNewEmployee,
  onExportExcel,
  onExportCsv,
  onOpenAuditReport,
  onResetData,
  onOpenProductionReset,
  onOpenBrandSettings,
  brand,
  searchTerm,
  setSearchTerm,
  totalEmployees,
  totalPending,
  totalAVencer,
  blinkingAlerts = true,
  onToggleBlinkingAlerts,
}) => {
  const primaryColor = brand?.primaryColor || '#E21B23';
  const accentColor = brand?.accentColor || '#1E293B';
  const accentTextColor = brand?.accentTextColor || '#ffffff';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Brand, Master Mode Switcher, and User Session */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center">
            <WfsLogo
              brand={brand}
              size="md"
              onClickCustomize={isAdminLoggedIn ? onOpenBrandSettings : undefined}
            />
          </div>

          {/* Master Mode Switcher: 2 Main Tabs (Portal Demandados vs Painel ADM) */}
          <div className="flex items-center p-1 bg-slate-100/95 rounded-2xl border border-slate-200/90 shadow-inner">
            <button
              onClick={() => setPortalMode('demandados')}
              style={
                portalMode === 'demandados'
                  ? { backgroundColor: primaryColor, color: '#ffffff' }
                  : {}
              }
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                portalMode === 'demandados'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck className="w-4 h-4" style={{ color: portalMode === 'demandados' ? accentColor : undefined }} />
              <span>Portal do Demandado</span>
              {totalPending > 0 && (
                <span
                  style={{
                    backgroundColor: portalMode === 'demandados' ? accentColor : '#fef3c7',
                    color: portalMode === 'demandados' ? accentTextColor : '#92400e',
                  }}
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-2xs"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 animate-pulse" />
                  </span>
                  <span>{totalPending}</span>
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setPortalMode('admin');
                } else {
                  onOpenAdminLogin();
                }
              }}
              style={
                portalMode === 'admin'
                  ? { backgroundColor: '#0f172a', color: '#ffffff' }
                  : {}
              }
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                portalMode === 'admin'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {isAdminLoggedIn ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <span>Painel ADM</span>
              {!isAdminLoggedIn && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 uppercase font-black tracking-wider hidden sm:inline">
                  Login
                </span>
              )}
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {portalMode === 'admin' && isAdminLoggedIn ? (
              <>
                {/* Admin Quick Action: OCR Scanner */}
                <button
                  onClick={onOpenOcrScanner}
                  style={{
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }}
                  className="group relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <FileScan className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="hidden sm:inline">Lançar Print (OCR)</span>
                  <span className="sm:hidden">OCR</span>
                </button>

                {/* Password Change Button */}
                <button
                  onClick={onOpenChangePassword}
                  title="Alterar Senha do Administrador"
                  className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors hidden md:flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-600" />
                </button>

                {/* Brand/Theme Config Button */}
                <button
                  onClick={onOpenBrandSettings}
                  title="Personalizar Identidade Visual e Cores"
                  className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors hidden md:flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-slate-600" />
                </button>

                {/* Production Clear Button */}
                <button
                  onClick={onOpenProductionReset}
                  title="Zerar dados simulados para iniciar em produção"
                  className="px-2.5 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors hidden lg:flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar p/ Produção</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onAdminLogout}
                  title="Sair do Modo Administrador"
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Sair do ADM</span>
                </button>
              </>
            ) : (
              /* Portal Demandado Header Action (Sem botão duplicado de ADM) */
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuditReport}
                  title="Visualizar Relatório de Auditoria"
                  className="px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Relatório de Auditoria</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Second Tier: Admin Sub-Navigation Tabs (Visible only in ADM mode) */}
        {portalMode === 'admin' && isAdminLoggedIn && (
          <div className="py-2 border-t border-slate-100 flex items-center justify-between overflow-x-auto gap-2">
            <nav className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                style={activeTab === 'dashboard' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Painel</span>
              </button>

              <button
                onClick={() => setActiveTab('employees')}
                style={activeTab === 'employees' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'employees'
                    ? 'shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Colaboradores</span>
                {totalEmployees > 0 && (
                  <span className="text-[10px] opacity-80">({totalEmployees})</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('areas')}
                style={activeTab === 'areas' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'areas'
                    ? 'shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Áreas & Gestores</span>
              </button>

              <button
                onClick={() => setActiveTab('contracts')}
                style={activeTab === 'contracts' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'contracts'
                    ? 'shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Contratos</span>
              </button>

              <button
                onClick={() => setActiveTab('demands')}
                style={activeTab === 'demands' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'demands'
                    ? 'shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Demandas</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                style={activeTab === 'reports' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Auditoria & Disparos</span>
              </button>
            </nav>

            <div className="flex items-center gap-2">
              {/* Alertas ON/OFF Toggle na barra do ADM */}
              {onToggleBlinkingAlerts && (
                <button
                  onClick={onToggleBlinkingAlerts}
                  title="Ativar/Desativar efeito piscante de alertas de urgência em todo o sistema"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    blinkingAlerts
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {blinkingAlerts && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        blinkingAlerts ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  <span className="hidden sm:inline">Alertas:</span>
                  <strong>{blinkingAlerts ? 'ON' : 'OFF'}</strong>
                </button>
              )}

              <button
                onClick={onExportExcel}
                title="Exportar Base Completa para Excel (.xlsx)"
                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAuditReport}
                title="Imprimir / Salvar Relatório Executivo PDF"
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onResetData}
                title="Restaurar dados de exemplo da base"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
