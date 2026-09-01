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
  FileText,
  KeyRound,
  Shield,
  Settings,
  ExternalLink,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { WfsLogo } from './WfsLogo.tsx';
import { BrandConfig } from '../types/index.ts';

export type MainPortalMode = 'pendencias' | 'areas' | 'demands' | 'settings' | 'demandados' | 'admin';

export type AdminTabType =
  | 'dashboard'
  | 'employees'
  | 'trabalhista'
  | 'areas'
  | 'contracts'
  | 'demands'
  | 'reports';

interface NavbarProps {
  portalMode: MainPortalMode;
  setPortalMode: (mode: MainPortalMode) => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  onOpenAdminLogin: (target?: MainPortalMode) => void;
  onOpenChangePassword: () => void;
  onOpenGoogleSheetsSync?: () => void;
  onOpenOfficialGuide?: () => void;
  activeTab?: AdminTabType;
  setActiveTab?: (tab: AdminTabType) => void;
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
  syncStatus?: {
    status: 'idle' | 'syncing' | 'synced' | 'error';
    lastSynced?: string;
    message?: string;
  };
  onRefreshSheets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portalMode,
  setPortalMode,
  isAdminLoggedIn,
  onAdminLogout,
  onOpenAdminLogin,
  onOpenChangePassword,
  onOpenGoogleSheetsSync,
  onOpenOfficialGuide,
  activeTab = 'dashboard',
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
  syncStatus,
  onRefreshSheets,
}) => {
  const primaryColor = brand?.primaryColor || '#E21B23';
  const companyName = brand?.companyName || 'GPA';

  // Normalize mode for backward compatibility
  const currentMode =
    portalMode === 'demandados' || portalMode === 'admin'
      ? 'pendencias'
      : portalMode;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar Tier */}
        <div className="flex items-center justify-between h-15 sm:h-16">
          {/* Left: Logo & Brand */}
          <div className="flex items-center space-x-3 sm:space-x-3.5 shrink-0">
            <div className="flex items-center py-0.5">
              <WfsLogo
                brand={brand}
                size="md"
                className="transition-transform hover:scale-105"
              />
            </div>
            <div className="hidden md:block border-l border-slate-200 pl-3">
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }}
                  className="text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded shadow-2xs"
                >
                  {companyName}
                </span>
                <span className="text-xs font-black text-slate-800 tracking-tight">
                  GESTÃO & AUDITORIA DE TERCEIROS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Consulta de Pendências & Conformidade
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Unificado e Profissional) */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-inner overflow-x-auto shrink-0 gap-1">
            {/* 1. Resumo Geral (Primeira tela padrão) */}
            <button
              id="nav-tab-resumo"
              onClick={() => setPortalMode('areas')}
              style={
                currentMode === 'areas'
                  ? { backgroundColor: '#ffffff', color: primaryColor }
                  : {}
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'areas'
                  ? 'shadow-xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Resumo Geral</span>
            </button>

            {/* 2. Painel de Pendências (Máximo Destaque) */}
            <button
              id="nav-tab-pendencias"
              onClick={() => setPortalMode('pendencias')}
              style={
                currentMode === 'pendencias'
                  ? { backgroundColor: primaryColor, color: '#ffffff' }
                  : {}
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'pendencias'
                  ? 'shadow-md ring-1 ring-rose-300'
                  : 'text-slate-700 bg-white/70 hover:bg-white hover:text-slate-900 shadow-2xs border border-slate-200/80'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${currentMode === 'pendencias' ? 'text-white' : 'text-[#E21B23]'}`} />
              <span>Painel de Pendências</span>
              {totalPending > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    blinkingAlerts ? 'animate-pulse' : ''
                  } ${
                    currentMode === 'pendencias'
                      ? 'bg-white text-[#E21B23]'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {totalPending}
                </span>
              )}
            </button>

            {/* 3. Gestão GRU (Protegida por senha) */}
            <button
              id="nav-tab-gestao"
              onClick={() => {
                if (isAdminLoggedIn) {
                  setPortalMode('demands');
                } else {
                  onOpenAdminLogin('demands');
                }
              }}
              style={
                currentMode === 'demands'
                  ? { backgroundColor: '#ffffff', color: primaryColor }
                  : {}
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'demands'
                  ? 'shadow-xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {isAdminLoggedIn ? (
                <Send className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Lock className="w-3 h-3 text-amber-500" />
              )}
              <span>Gestão GRU</span>
              {!isAdminLoggedIn && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 uppercase font-black tracking-wider hidden lg:inline">
                  Senha
                </span>
              )}
            </button>

            {/* 4. Configuração (Protegida por senha) */}
            <button
              id="nav-tab-configuracao"
              onClick={() => {
                if (isAdminLoggedIn) {
                  setPortalMode('settings');
                } else {
                  onOpenAdminLogin('settings');
                }
              }}
              style={
                currentMode === 'settings'
                  ? { backgroundColor: '#ffffff', color: '#0f172a' }
                  : {}
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentMode === 'settings'
                  ? 'shadow-xs font-black ring-1 ring-slate-200 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {isAdminLoggedIn ? (
                <Settings className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Lock className="w-3 h-3 text-amber-500" />
              )}
              <span>Configuração</span>
              {!isAdminLoggedIn && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 uppercase font-black tracking-wider hidden lg:inline">
                  Senha
                </span>
              )}
            </button>
          </nav>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-2">
            {/* Guia Sistema Oficial Quick Action */}
            {onOpenOfficialGuide && (
              <button
                onClick={onOpenOfficialGuide}
                title="Como regularizar pendências no sistema oficial"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="hidden xl:inline">Saneamento no Sistema Oficial</span>
                <span className="xl:hidden">Sistema Oficial</span>
              </button>
            )}

            {/* Status Nuvem Google Sheets */}
            {syncStatus?.lastSynced && (
              <button
                onClick={onRefreshSheets}
                title="Sincronização Google Sheets GPA_BD ativa. Clique para atualizar."
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{syncStatus.lastSynced}</span>
                <RefreshCw className="w-3 h-3 text-emerald-600 hover:rotate-180 transition-transform" />
              </button>
            )}

            {/* Relatório de Auditoria Button */}
            <button
              onClick={onOpenAuditReport}
              title="Visualizar e Imprimir Relatório Executivo de Auditoria"
              className="px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Relatório</span>
            </button>

            {/* Admin Logout */}
            {isAdminLoggedIn && (
              <button
                onClick={onAdminLogout}
                title="Sair do Modo Administrador"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
