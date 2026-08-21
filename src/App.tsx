/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getStoredEmployees,
  saveStoredEmployees,
  getStoredContracts,
  saveStoredContracts,
  getStoredDemandLogs,
  saveStoredDemandLogs,
  calculateSystemStats,
  exportEmployeesToExcel,
  exportEmployeesToCsv,
  resetDatabaseToDefaults,
  recalculateEmployeeStatus,
} from './utils/storage.ts';
import { Employee, Contract, DemandLog, DocType, DocStatus } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { DashboardStats } from './components/DashboardStats.tsx';
import { EmployeeTable } from './components/EmployeeTable.tsx';
import { OcrScannerModal } from './components/OcrScannerModal.tsx';
import { EmployeeDetailModal } from './components/EmployeeDetailModal.tsx';
import { DemandCenterModal } from './components/DemandCenterModal.tsx';
import { ContractsModule } from './components/ContractsModule.tsx';
import { DemandHistory } from './components/DemandHistoryModal.tsx';
import { AuditReportModal } from './components/AuditReportModal.tsx';
import { ManualEmployeeModal } from './components/ManualEmployeeModal.tsx';
import confetti from 'canvas-confetti';
import {
  FileScan,
  ShieldCheck,
  Building2,
  Sparkles,
  Users,
  Send,
  Printer,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [demandLogs, setDemandLogs] = useState<DemandLog[]>([]);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'contracts' | 'demands' | 'reports'>('dashboard');
  const [activeFilter, setActiveFilter] = useState<string>('TODOS');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isManualEmployeeOpen, setIsManualEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [demandEmployee, setDemandEmployee] = useState<Employee | null>(null);
  const [demandContract, setDemandContract] = useState<Contract | null>(null);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);

  // Initialize data from localStorage on mount
  useEffect(() => {
    const loadedEmployees = getStoredEmployees();
    const loadedContracts = getStoredContracts();
    const loadedLogs = getStoredDemandLogs();

    setEmployees(loadedEmployees);
    setContracts(loadedContracts);
    setDemandLogs(loadedLogs);
  }, []);

  // Save changes to storage whenever states change
  const updateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    saveStoredEmployees(newEmployees);
  };

  const updateContracts = (newContracts: Contract[]) => {
    setContracts(newContracts);
    saveStoredContracts(newContracts);
  };

  const updateDemandLogs = (newLogs: DemandLog[]) => {
    setDemandLogs(newLogs);
    saveStoredDemandLogs(newLogs);
  };

  // Handlers for Employees
  const handleSaveEmployee = (savedEmp: Employee) => {
    const existsIndex = employees.findIndex(
      (e) =>
        e.id === savedEmp.id ||
        (e.matricula && savedEmp.matricula && e.matricula.trim().toLowerCase() === savedEmp.matricula.trim().toLowerCase())
    );

    let nextList: Employee[];
    if (existsIndex >= 0) {
      nextList = [...employees];
      nextList[existsIndex] = savedEmp;
    } else {
      nextList = [savedEmp, ...employees];
    }

    updateEmployees(nextList);

    // If detail modal was open with this employee, keep it synced
    if (detailEmployee && detailEmployee.id === savedEmp.id) {
      setDetailEmployee(savedEmp);
    }
  };

  const handleDeleteEmployee = (employeeId: string) => {
    const nextList = employees.filter((e) => e.id !== employeeId);
    updateEmployees(nextList);
    if (detailEmployee && detailEmployee.id === employeeId) {
      setDetailEmployee(null);
    }
  };

  const handleQuickToggleDoc = (employeeId: string, docType: DocType, newStatus: DocStatus) => {
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return;

    const updatedDocs = target.pendencias.map((d) =>
      d.tipo === docType
        ? {
            ...d,
            status: newStatus,
            ultimaAtualizacao: new Date().toISOString().split('T')[0],
          }
        : d
    );

    const recalculated = recalculateEmployeeStatus({ ...target, pendencias: updatedDocs });
    const updatedEmployee: Employee = {
      ...target,
      pendencias: updatedDocs,
      indicadorPercentual: recalculated.indicadorPercentual,
      statusGeral: recalculated.statusGeral,
    };

    handleSaveEmployee(updatedEmployee);

    if (newStatus === 'EM_DIA' && recalculated.statusGeral === 'EM_DIA') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}
    }
  };

  // Handlers for Contracts
  const handleSaveContract = (savedContract: Contract) => {
    const existsIndex = contracts.findIndex((c) => c.id === savedContract.id);
    let nextContracts: Contract[];
    if (existsIndex >= 0) {
      nextContracts = [...contracts];
      nextContracts[existsIndex] = savedContract;
    } else {
      nextContracts = [savedContract, ...contracts];
    }
    updateContracts(nextContracts);
  };

  const handleDeleteContract = (contractId: string) => {
    const nextContracts = contracts.filter((c) => c.id !== contractId);
    updateContracts(nextContracts);
  };

  // Handlers for Demands
  const handleSaveDemandLog = (log: DemandLog) => {
    const nextLogs = [log, ...demandLogs];
    updateDemandLogs(nextLogs);
  };

  const handleUpdateLogStatus = (logId: string, newStatus: 'ENVIADO' | 'EM_ANDAMENTO' | 'REGULARIZADO' | 'VENCIDO') => {
    const nextLogs = demandLogs.map((l) => (l.id === logId ? { ...l, status: newStatus } : l));
    updateDemandLogs(nextLogs);
  };

  const handleDeleteLog = (logId: string) => {
    const nextLogs = demandLogs.filter((l) => l.id !== logId);
    updateDemandLogs(nextLogs);
  };

  // System actions
  const handleResetData = () => {
    if (confirm('Deseja restaurar a base com os dados iniciais de demonstração da WFS?')) {
      resetDatabaseToDefaults();
      setEmployees(getStoredEmployees());
      setContracts(getStoredContracts());
      setDemandLogs(getStoredDemandLogs());
      setActiveFilter('TODOS');
      setSelectedContractId('');
      setSearchTerm('');
    }
  };

  const stats = calculateSystemStats(employees);
  const totalPendingCount = employees.filter((e) => e.statusGeral !== 'EM_DIA').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#00A3E0] selection:text-white">
      {/* Top Main Navigation Bar with WFS Branding */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'reports') {
            setIsAuditReportOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenOcrScanner={() => setIsOcrOpen(true)}
        onOpenNewEmployee={() => {
          setEditingEmployee(null);
          setIsManualEmployeeOpen(true);
        }}
        onExportExcel={() => exportEmployeesToExcel(employees, contracts)}
        onExportCsv={() => exportEmployeesToCsv(employees)}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        onResetData={handleResetData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        totalEmployees={employees.length}
        totalPending={totalPendingCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab 1: Dashboard & Fast Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Clean WFS Quick OCR Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#002D62] via-[#003B7A] to-[#00A3E0] p-6 sm:p-8 shadow-sm text-white">
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-sky-100 border border-white/20 backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Leitor Visual Multimodal com Gemini 3.7 Flash</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Extraia pendências de prints em segundos e automatize suas cobranças
                  </h2>
                  <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed font-medium">
                    Tire um print da tela do seu sistema de SST e cole aqui (<kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/20 text-white font-mono">Ctrl + V</kbd>). A IA lê automaticamente Ordem de Serviço, ASO, Ficha de EPI, Certificado de Radioproteção e indicadores de conformidade!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
                  <button
                    onClick={() => setIsOcrOpen(true)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-[#002D62] bg-white hover:bg-sky-50 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileScan className="w-5 h-5 text-[#002D62]" />
                    <span>Lançar Print / Fazer OCR</span>
                  </button>

                  <button
                    onClick={() => exportEmployeesToExcel(employees, contracts)}
                    className="w-full sm:w-auto px-4 py-3.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>Exportar Excel</span>
                  </button>
                </div>
              </div>

              {/* Decorative clean curves */}
              <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            </div>

            {/* KPI Cards and Pillar Gauges */}
            <DashboardStats
              stats={stats}
              totalContracts={contracts.length}
              onFilterClick={(filterType) => {
                setActiveFilter(filterType);
                // Scroll smoothly to table
                const tableElem = document.getElementById('employee-table-section');
                if (tableElem) {
                  tableElem.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              currentFilter={activeFilter}
            />

            {/* Dynamic Employee Table Section */}
            <div id="employee-table-section" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#002D62]" />
                    Base de Dados de Colaboradores & Status Documental
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clique nos botões de status para atualizar ou clique em Demandar para notificar via WhatsApp/E-mail.
                  </p>
                </div>
              </div>

              <EmployeeTable
                employees={employees}
                contracts={contracts}
                onOpenDetail={(emp) => setDetailEmployee(emp)}
                onOpenDemand={(emp) => {
                  setDemandEmployee(emp);
                  setDemandContract(null);
                }}
                onEditEmployee={(emp) => {
                  setEditingEmployee(emp);
                  setIsManualEmployeeOpen(true);
                }}
                onDeleteEmployee={handleDeleteEmployee}
                onQuickToggleDoc={handleQuickToggleDoc}
                onOpenNewEmployee={() => {
                  setEditingEmployee(null);
                  setIsManualEmployeeOpen(true);
                }}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                selectedContractId={selectedContractId}
                setSelectedContractId={setSelectedContractId}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Full Employees Database View */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#002D62]" />
                  Base Cadastral de Colaboradores WFS ({employees.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gerencie todo o quadro de pessoal, consulte pendências por contrato e emita notificações.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOcrOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#002D62] hover:bg-[#001f44] shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileScan className="w-4 h-4" />
                  <span>Ler Mais Prints (OCR)</span>
                </button>
              </div>
            </div>

            <EmployeeTable
              employees={employees}
              contracts={contracts}
              onOpenDetail={(emp) => setDetailEmployee(emp)}
              onOpenDemand={(emp) => {
                setDemandEmployee(emp);
                setDemandContract(null);
              }}
              onEditEmployee={(emp) => {
                setEditingEmployee(emp);
                setIsManualEmployeeOpen(true);
              }}
              onDeleteEmployee={handleDeleteEmployee}
              onQuickToggleDoc={handleQuickToggleDoc}
              onOpenNewEmployee={() => {
                setEditingEmployee(null);
                setIsManualEmployeeOpen(true);
              }}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              selectedContractId={selectedContractId}
              setSelectedContractId={setSelectedContractId}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        )}

        {/* Tab 3: Contracts Monitoring (Step 2) */}
        {activeTab === 'contracts' && (
          <ContractsModule
            contracts={contracts}
            employees={employees}
            onSelectContractToFilter={(contractId) => {
              setSelectedContractId(contractId);
              setActiveTab('employees');
            }}
            onSaveContract={handleSaveContract}
            onDeleteContract={handleDeleteContract}
            onDemandContract={(c) => {
              const firstPending = employees.find((e) => e.contratoId === c.id && e.statusGeral !== 'EM_DIA');
              setDemandEmployee(firstPending || employees.find((e) => e.contratoId === c.id) || null);
              setDemandContract(c);
            }}
          />
        )}

        {/* Tab 4: Demands & Follow-up History */}
        {activeTab === 'demands' && (
          <DemandHistory
            logs={demandLogs}
            onUpdateLogStatus={handleUpdateLogStatus}
            onDeleteLog={handleDeleteLog}
            onOpenNewDemand={() => {
              const pendingEmp = employees.find((e) => e.statusGeral !== 'EM_DIA') || employees[0];
              setDemandEmployee(pendingEmp || null);
              setDemandContract(null);
            }}
          />
        )}
      </main>

      {/* OCR Scanner Modal */}
      <OcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onSaveEmployee={handleSaveEmployee}
        contracts={contracts}
      />

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={!!detailEmployee}
        onClose={() => setDetailEmployee(null)}
        employee={detailEmployee}
        onSaveEmployee={handleSaveEmployee}
        onOpenDemand={(emp) => {
          setDetailEmployee(null);
          setDemandEmployee(emp);
          setDemandContract(null);
        }}
      />

      {/* Demand & Notification Generator Modal */}
      <DemandCenterModal
        isOpen={!!demandEmployee || !!demandContract}
        onClose={() => {
          setDemandEmployee(null);
          setDemandContract(null);
        }}
        employee={demandEmployee}
        contract={demandContract}
        contracts={contracts}
        onSaveDemandLog={handleSaveDemandLog}
      />

      {/* Manual Employee Add/Edit Modal */}
      <ManualEmployeeModal
        isOpen={isManualEmployeeOpen}
        onClose={() => setIsManualEmployeeOpen(false)}
        onSaveEmployee={handleSaveEmployee}
        editingEmployee={editingEmployee}
        contracts={contracts}
      />

      {/* Printable Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
        employees={employees}
        contracts={contracts}
        stats={stats}
        onExportExcel={() => exportEmployeesToExcel(employees, contracts)}
        onExportCsv={() => exportEmployeesToCsv(employees)}
      />
    </div>
  );
}
