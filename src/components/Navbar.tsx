import React from 'react';
import {
  FileScan,
  Users,
  Building2,
  Send,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Palette,
  Trash2,
} from 'lucide-react';
import { WfsLogo } from './WfsLogo.tsx';
import { BrandConfig } from '../types/index.ts';

interface NavbarProps {
  activeTab: 'dashboard' | 'employees' | 'contracts' | 'demands' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'employees' | 'contracts' | 'demands' | 'reports') => void;
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
}

export const Navbar: React.FC<NavbarProps> = ({
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
}) => {
  const primaryColor = brand?.primaryColor || '#1e293b';
  const accentColor = brand?.accentColor || '#f59e0b';
  const accentTextColor = brand?.accentTextColor || '#0f172a';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title with click to customize */}
          <div className="flex items-center">
            <WfsLogo
              brand={brand}
              size="md"
              onClickCustomize={onOpenBrandSettings}
            />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              style={activeTab === 'dashboard' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Painel</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              style={activeTab === 'employees' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'employees'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Colaboradores</span>
              {totalEmployees > 0 && (
                <span className="text-[10px] opacity-75">({totalEmployees})</span>
              )}
              {totalPending > 0 && (
                <span
                  style={{
                    backgroundColor: activeTab === 'employees' ? accentColor : '#fef3c7',
                    color: activeTab === 'employees' ? accentTextColor : '#92400e',
                  }}
                  className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
                >
                  {totalPending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              style={activeTab === 'contracts' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'contracts'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Contratos</span>
            </button>

            <button
              onClick={() => setActiveTab('demands')}
              style={activeTab === 'demands' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'demands'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Demandas & Cobranças</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              style={activeTab === 'reports' ? { backgroundColor: primaryColor, color: '#ffffff' } : {}}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Auditoria</span>
            </button>
          </nav>

          {/* Quick Actions & Brand Settings */}
          <div className="flex items-center gap-2">
            {/* Primary Action Button: OCR Leitor de Imagem */}
            <button
              onClick={onOpenOcrScanner}
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
              }}
              className="group relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <FileScan className="w-4 h-4" style={{ color: accentColor }} />
              <span className="hidden sm:inline">Lançar Print (OCR)</span>
              <span className="sm:hidden">OCR</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse hidden lg:block" />
            </button>

            {/* Brand/Theme Config Button */}
            <button
              onClick={onOpenBrandSettings}
              title="Personalizar Identidade Visual, Logotipo e Cores"
              className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Palette className="w-4 h-4 text-slate-600" />
              <span className="hidden xl:inline">Identidade & Cores</span>
            </button>

            {/* Production Clear Button */}
            <button
              onClick={onOpenProductionReset}
              title="Zerar dados simulados para iniciar em produção"
              className="px-2.5 py-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Zerar p/ Produção</span>
            </button>

            {/* Export & Utility Menu */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={onExportExcel}
                title="Exportar Base Completa para Excel (.xlsx)"
                className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAuditReport}
                title="Imprimir / Salvar Relatório Executivo PDF"
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onResetData}
                title="Restaurar dados de exemplo da base"
                className="p-2 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto text-xs bg-white">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded font-bold ${
              activeTab === 'dashboard' ? 'text-slate-900 bg-slate-100' : 'text-slate-600'
            }`}
          >
            Painel
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-2.5 py-1 rounded font-bold ${
              activeTab === 'employees' ? 'text-slate-900 bg-slate-100' : 'text-slate-600'
            }`}
          >
            Colaboradores ({totalEmployees})
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-2.5 py-1 rounded font-bold ${
              activeTab === 'contracts' ? 'text-slate-900 bg-slate-100' : 'text-slate-600'
            }`}
          >
            Contratos
          </button>
          <button
            onClick={() => setActiveTab('demands')}
            className={`px-2.5 py-1 rounded font-bold ${
              activeTab === 'demands' ? 'text-slate-900 bg-slate-100' : 'text-slate-600'
            }`}
          >
            Demandas
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 rounded font-bold ${
              activeTab === 'reports' ? 'text-slate-900 bg-slate-100' : 'text-slate-600'
            }`}
          >
            Auditoria
          </button>
        </div>
      </div>
    </header>
  );
};
