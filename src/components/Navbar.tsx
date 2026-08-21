import React from 'react';
import {
  ShieldCheck,
  FileScan,
  Users,
  Building2,
  Send,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Database,
  Search,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'employees' | 'contracts' | 'demands' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'employees' | 'contracts' | 'demands' | 'reports') => void;
  onOpenOcrScanner: () => void;
  onOpenNewEmployee: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onOpenAuditReport: () => void;
  onResetData: () => void;
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
  searchTerm,
  setSearchTerm,
  totalEmployees,
  totalPending,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  SST Vision <span className="text-cyan-400 font-extrabold text-sm px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">OCR IA</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Leitor de Pendências (OS • ASO • EPI • Radioproteção) & Contratos
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Painel</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'employees'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Funcionários</span>
              {totalPending > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  {totalPending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contracts'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Contratos</span>
            </button>

            <button
              onClick={() => setActiveTab('demands')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'demands'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Demandas</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Auditoria</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Primary Action Button: OCR Leitor de Imagem */}
            <button
              onClick={onOpenOcrScanner}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <FileScan className="w-4 h-4 text-cyan-200 group-hover:rotate-6 transition-transform" />
              <span>Fazer Leitura (Print / OCR)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse hidden sm:block" />
            </button>

            {/* Export Menu Dropdown / Buttons */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={onExportExcel}
                title="Exportar Base Completa para Excel (.xlsx)"
                className="p-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAuditReport}
                title="Imprimir / Salvar Relatório Executivo PDF"
                className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onResetData}
                title="Restaurar dados de exemplo do sistema"
                className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Painel
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'employees' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Funcionários ({totalEmployees})
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'contracts' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Contratos
          </button>
          <button
            onClick={() => setActiveTab('demands')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'demands' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Demandas
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 rounded font-medium ${
              activeTab === 'reports' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            Relatórios
          </button>
        </div>
      </div>
    </header>
  );
};
