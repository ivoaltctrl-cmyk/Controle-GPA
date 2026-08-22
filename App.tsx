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
  getStoredAreas,
  saveStoredAreas,
  getStoredDemandLogs,
  saveStoredDemandLogs,
  getStoredBrandConfig,
  saveStoredBrandConfig,
  calculateSystemStats,
  exportEmployeesToExcel,
  exportEmployeesToCsv,
  resetDatabaseToDefaults,
  resetToProductionEmpty,
  recalculateEmployeeStatus,
  updateEmployeeCalculatedFields,
  isStoredAdminAuthenticated,
  setStoredAdminAuthenticated,
} from './utils/storage.ts';
import {
  Employee,
  Contract,
  AreaResponsavel,
  DemandLog,
  DocType,
  DocStatus,
  BrandConfig,
} from './types/index.ts';
import { Navbar, MainPortalMode } from './components/Navbar.tsx';
import { DemandadoPortal } from './components/DemandadoPortal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminPasswordModal } from './components/AdminPasswordModal.tsx';
import { DashboardStats } from './components/DashboardStats.tsx';
import { EmployeeTable } from './components/EmployeeTable.tsx';
import { AreasModule } from './components/AreasModule.tsx';
import { AuditDispatchesTab } from './components/AuditDispatchesTab.tsx';
import { OcrScannerModal } from './components/OcrScannerModal.tsx';
import { ExcelImportModal } from './components/ExcelImportModal.tsx';
import { EmployeeDetailModal } from './components/EmployeeDetailModal.tsx';
import { DemandCenterModal } from './components/DemandCenterModal.tsx';
import { ContractsModule } from './components/ContractsModule.tsx';
import { DemandHistory } from './components/DemandHistoryModal.tsx';
import { AuditReportModal } from './components/AuditReportModal.tsx';
import { ManualEmployeeModal } from './components/ManualEmployeeModal.tsx';
import { ProductionResetModal } from './components/ProductionResetModal.tsx';
import { BrandSettingsModal } from './components/BrandSettingsModal.tsx';
import confetti from 'canvas-confetti';
import {
  FileScan,
  ShieldCheck,
  Building2,
  Building,
  Sparkles,
  Users,
  Send,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  Plus,
  Lock,
} from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [areas, setAreas] = useState<AreaResponsavel[]>([]);
  const [demandLogs, setDemandLogs] = useState<DemandLog[]>([]);
  const [brand, setBrand] = useState<BrandConfig>(getStoredBrandConfig());

  // Master Portal Mode: 'demandados' or 'admin'
  const [portalMode, setPortalMode] = useState<MainPortalMode>('demandados');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  // Admin Sub Navigation & Filtering
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'employees' | 'areas' | 'contracts' | 'demands' | 'reports'
  >('dashboard');
  const [activeFilter, setActiveFilter] = useState<string>('TODOS');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isManualEmployeeOpen, setIsManualEmployeeOpen] = useState(false);
  const [isProductionResetOpen, setIsProductionResetOpen] = useState(false);
  const [isBrandSettingsOpen, setIsBrandSettingsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [demandEmployee, setDemandEmployee] = useState<Employee | null>(null);
  const [demandContract, setDemandContract] = useState<Contract | null>(null);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);

  // Initialize data from localStorage on mount
  useEffect(() => {
    const loadedEmployees = getStoredEmployees();
    const loadedContracts = getStoredContracts();
    const loadedAreas = getStoredAreas();
    const loadedLogs = getStoredDemandLogs();
    const loadedBrand = getStoredBrandConfig();
    const isAuth = isStoredAdminAuthenticated();

    setEmployees(loadedEmployees);
    setContracts(loadedContracts);
    setAreas(loadedAreas);
    setDemandLogs(loadedLogs);
    setBrand(loadedBrand);
    setIsAdminLoggedIn(isAuth);
  }, []);

  // Sync helpers
  const updateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    saveStoredEmployees(newEmployees);
  };

  const updateContracts = (newContracts: Contract[]) => {
    setContracts(newContracts);
    saveStoredContracts(newContracts);
  };

  const updateAreas = (newAreas: AreaResponsavel[]) => {
    setAreas(newAreas);
    saveStoredAreas(newAreas);
  };

  const updateDemandLogs = (newLogs: DemandLog[]) => {
    setDemandLogs(newLogs);
    saveStoredDemandLogs(newLogs);
  };

  const updateBrand = (newBrand: BrandConfig) => {
    setBrand(newBrand);
    saveStoredBrandConfig(newBrand);
  };

  // Admin Auth Handlers
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setStoredAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    setPortalMode('admin');
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setStoredAdminAuthenticated(false);
    setPortalMode('demandados');
  };

  // Handlers for Employees
  const handleSaveEmployee = (savedEmp: Employee) => {
    const calculated = updateEmployeeCalculatedFields(savedEmp);
    const existsIndex = employees.findIndex(
      (e) =>
        e.id === calculated.id ||
        (e.matricula &&
          calculated.matricula &&
          e.matricula.trim().toLowerCase() === calculated.matricula.trim().toLowerCase())
    );

    let nextList: Employee[];
    if (existsIndex >= 0) {
      nextList = [...employees];
      nextList[existsIndex] = calculated;
    } else {
      nextList = [calculated, ...employees];
    }

    updateEmployees(nextList);

    if (detailEmployee && detailEmployee.id === calculated.id) {
      setDetailEmployee(calculated);
    }
  };

  const handleBulkImportEmployees = (importedEmployees: Employee[]) => {
    const existingMap = new Map(employees.map((e) => [e.matricula.toLowerCase().trim(), e]));

    const mergedList = [...employees];

    importedEmployees.forEach((emp) => {
      const calculated = updateEmployeeCalculatedFields(emp);
      const key = (calculated.matricula || '').toLowerCase().trim();

      if (key && existingMap.has(key)) {
        const idx = mergedList.findIndex((e) => e.matricula.toLowerCase().trim() === key);
        if (idx >= 0) mergedList[idx] = calculated;
      } else {
        mergedList.unshift(calculated);
      }
    });

    updateEmployees(mergedList);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
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

    const updatedEmp = updateEmployeeCalculatedFields({
      ...target,
      pendencias: updatedDocs,
    });

    handleSaveEmployee(updatedEmp);

    if (newStatus === 'EM_DIA' && updatedEmp.statusGeral === 'EM_DIA') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}
    }
  };

  // Handlers for Areas
  const handleSaveArea = (savedArea: AreaResponsavel) => {
    const existsIndex = areas.findIndex((a) => a.id === savedArea.id);
    let nextAreas: AreaResponsavel[];
    if (existsIndex >= 0) {
      nextAreas = [...areas];
      nextAreas[existsIndex] = savedArea;
    } else {
      nextAreas = [savedArea, ...areas];
    }
    updateAreas(nextAreas);

    // Update employees assigned to this area
    const updatedEmployees = employees.map((emp) => {
      if (emp.areaId === savedArea.id) {
        return {
          ...emp,
          areaNome: savedArea.nome,
          areaResponsavelNome: savedArea.responsavelNome,
          areaResponsavelEmail: savedArea.responsavelEmail,
          areaResponsavelTelefone: savedArea.responsavelTelefone,
        };
      }
      return emp;
    });
    updateEmployees(updatedEmployees);
  };

  const handleDeleteArea = (areaId: string) => {
    const nextAreas = areas.filter((a) => a.id !== areaId);
    updateAreas(nextAreas);
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

  const handleMassDispatch = (logs: DemandLog[]) => {
    const nextLogs = [...logs, ...demandLogs];
    updateDemandLogs(nextLogs);
  };

  const handleUpdateLogStatus = (
    logId: string,
    newStatus: 'ENVIADO' | 'EM_ANDAMENTO' | 'REGULARIZADO' | 'VENCIDO'
  ) => {
    const nextLogs = demandLogs.map((l) => (l.id === logId ? { ...l, status: newStatus } : l));
    updateDemandLogs(nextLogs);
  };

  const handleDeleteLog = (logId: string) => {
    const nextLogs = demandLogs.filter((l) => l.id !== logId);
    updateDemandLogs(nextLogs);
  };

  // Handlers for System Reset
  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados de demonstração iniciais com a paleta GPA?')) {
      resetDatabaseToDefaults();
      setEmployees(getStoredEmployees());
      setContracts(getStoredContracts());
      setAreas(getStoredAreas());
      setDemandLogs(getStoredDemandLogs());
      setBrand(getStoredBrandConfig());
      setActiveFilter('TODOS');
      setSelectedContractId('');
      setSelectedAreaId('');
      setSearchTerm('');
    }
  };

  const handleConfirmProductionReset = (options: {
    keepContracts: boolean;
    keepAreas: boolean;
    clearEmployees: boolean;
    clearLogs: boolean;
  }) => {
    resetToProductionEmpty(options);
    setEmployees(getStoredEmployees());
    setContracts(getStoredContracts());
    setAreas(getStoredAreas());
    setDemandLogs(getStoredDemandLogs());
    setActiveFilter('TODOS');
    setSelectedContractId('');
    setSelectedAreaId('');
    setSearchTerm('');
  };

  const stats = calculateSystemStats(employees);
  const totalPendingCount = employees.filter((e) => e.statusGeral !== 'EM_DIA').length;
  const totalAVencerCount = stats.totalAVencer30Dias;

  const primaryColor = brand?.primaryColor || '#006837';
  const accentColor = brand?.accentColor || '#f59e0b';
  const companyName = brand?.companyName || 'GPA';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Main Navigation Bar with Master Portals (Demandado vs ADM) */}
      <Navbar
        portalMode={portalMode}
        setPortalMode={(mode) => {
          if (mode === 'admin' && !isAdminLoggedIn) {
            setIsAdminLoginOpen(true);
          } else {
            setPortalMode(mode);
          }
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        onOpenOcrScanner={() => setIsOcrOpen(true)}
        onOpenNewEmployee={() => {
          setEditingEmployee(null);
          setIsManualEmployeeOpen(true);
        }}
        onExportExcel={() => exportEmployeesToExcel(employees, contracts, areas)}
        onExportCsv={() => exportEmployeesToCsv(employees)}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        onResetData={handleResetData}
        onOpenProductionReset={() => setIsProductionResetOpen(true)}
        onOpenBrandSettings={() => setIsBrandSettingsOpen(true)}
        brand={brand}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        totalEmployees={employees.length}
        totalPending={totalPendingCount}
        totalAVencer={totalAVencerCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* ABA 1: PORTAL DO DEMANDADO (Ver e Sanar Pendências)                      */}
        {/* ========================================================================= */}
        {portalMode === 'demandados' && (
          <DemandadoPortal
            employees={employees}
            contracts={contracts}
            areas={areas}
            brand={brand}
            onSaveEmployee={handleSaveEmployee}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            isAdminLoggedIn={isAdminLoggedIn}
            onSwitchToAdminTab={() => setPortalMode('admin')}
          />
        )}

        {/* ========================================================================= */}
        {/* ABA 2: PAINEL ADMINISTRATIVO (Com todas as opções existentes hoje)        */}
        {/* ========================================================================= */}
        {portalMode === 'admin' && isAdminLoggedIn && (
          <>
            {/* Tab 1: Dashboard & Fast Overview */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* GPA Hero Banner */}
                <div
                  style={{
                    backgroundColor: primaryColor,
                  }}
                  className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-md text-white border border-black/5"
                >
                  <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="max-w-2xl space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/15 text-white border border-white/20 backdrop-blur-xs">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        <span>PAINEL DE ADMINISTRAÇÃO - {companyName.toUpperCase()}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Gestão Geral de Contratos, Áreas & Auditoria Completa
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
                        Controle total do quadro de terceiros, cobranças em massa para responsáveis de área, leitor OCR de prints com IA e importação de planilhas oficiais.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
                      <button
                        onClick={() => setIsOcrOpen(true)}
                        style={{ color: primaryColor }}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-black bg-white hover:bg-slate-50 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileScan className="w-4 h-4" />
                        <span>Lançar Print (OCR)</span>
                      </button>

                      <button
                        onClick={() => setIsExcelImportOpen(true)}
                        className="w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" style={{ color: accentColor }} />
                        <span>Importar Planilha</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Cards and Pillar Gauges */}
                <DashboardStats
                  stats={stats}
                  totalContracts={contracts.length}
                  totalAreas={areas.length}
                  onFilterClick={(filterType) => {
                    setActiveFilter(filterType);
                    const tableElem = document.getElementById('employee-table-section');
                    if (tableElem) {
                      tableElem.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  currentFilter={activeFilter}
                  brand={brand}
                />

                {/* Dynamic Employee Table Section */}
                <div id="employee-table-section" className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5" style={{ color: primaryColor }} />
                        <span>Quadro de Colaboradores & Alertas Preventivos</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Itens com alerta piscante vencendo em menos de 30 dias (amarelo) ou vencidos (vermelho)
                      </p>
                    </div>
                  </div>

                  <EmployeeTable
                    employees={employees}
                    contracts={contracts}
                    areas={areas}
                    onOpenDetail={(emp) => setDetailEmployee(emp)}
                    onOpenDemand={(emp) => setDemandEmployee(emp)}
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
                    onOpenExcelImport={() => setIsExcelImportOpen(true)}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    selectedContractId={selectedContractId}
                    setSelectedContractId={setSelectedContractId}
                    selectedAreaId={selectedAreaId}
                    setSelectedAreaId={setSelectedAreaId}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    brand={brand}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Full Employees Module */}
            {activeTab === 'employees' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Base de Colaboradores & Status Documental
                    </h2>
                    <p className="text-xs text-slate-500">
                      Gerencie o quadro de terceiros, vincule às áreas e acompanhe prazos de renovação
                    </p>
                  </div>
                </div>

                <EmployeeTable
                  employees={employees}
                  contracts={contracts}
                  areas={areas}
                  onOpenDetail={(emp) => setDetailEmployee(emp)}
                  onOpenDemand={(emp) => setDemandEmployee(emp)}
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
                  onOpenExcelImport={() => setIsExcelImportOpen(true)}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  selectedContractId={selectedContractId}
                  setSelectedContractId={setSelectedContractId}
                  selectedAreaId={selectedAreaId}
                  setSelectedAreaId={setSelectedAreaId}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  brand={brand}
                />
              </div>
            )}

            {/* Tab 3: Areas & Managers Module */}
            {activeTab === 'areas' && (
              <AreasModule
                areas={areas}
                employees={employees}
                onSaveArea={handleSaveArea}
                onDeleteArea={handleDeleteArea}
                onSelectAreaForDispatch={(area) => {
                  setActiveTab('reports');
                }}
                brand={brand}
              />
            )}

            {/* Tab 4: Contracts Module */}
            {activeTab === 'contracts' && (
              <ContractsModule
                contracts={contracts}
                employees={employees}
                onSaveContract={handleSaveContract}
                onDeleteContract={handleDeleteContract}
                onDemandContract={(contract) => {
                  setDemandContract(contract);
                }}
                onFilterByContract={(contractId) => {
                  setSelectedContractId(contractId);
                  setActiveTab('employees');
                }}
              />
            )}

            {/* Tab 5: Demands & Notification History */}
            {activeTab === 'demands' && (
              <div className="space-y-4">
                <DemandHistory
                  logs={demandLogs}
                  onUpdateStatus={handleUpdateLogStatus}
                  onDeleteLog={handleDeleteLog}
                />
              </div>
            )}

            {/* Tab 6: Audit & Mass Dispatches */}
            {activeTab === 'reports' && (
              <AuditDispatchesTab
                employees={employees}
                contracts={contracts}
                areas={areas}
                stats={stats}
                onExportExcel={() => exportEmployeesToExcel(employees, contracts, areas)}
                onExportCsv={() => exportEmployeesToCsv(employees)}
                onOpenAuditReportModal={() => setIsAuditReportOpen(true)}
                onMassDispatch={handleMassDispatch}
                brand={brand}
              />
            )}
          </>
        )}
      </main>

      {/* MODALS */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        brand={brand}
      />

      <AdminPasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        brand={brand}
      />

      <OcrScannerModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onSaveEmployee={handleSaveEmployee}
        contracts={contracts}
        employees={employees}
        areas={areas}
        brand={brand}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportEmployees={handleBulkImportEmployees}
        areas={areas}
        contracts={contracts}
        brand={brand}
      />

      <ManualEmployeeModal
        isOpen={isManualEmployeeOpen}
        onClose={() => {
          setIsManualEmployeeOpen(false);
          setEditingEmployee(null);
        }}
        onSaveEmployee={handleSaveEmployee}
        editingEmployee={editingEmployee}
        contracts={contracts}
        areas={areas}
        brand={brand}
      />

      <ProductionResetModal
        isOpen={isProductionResetOpen}
        onClose={() => setIsProductionResetOpen(false)}
        onConfirmReset={handleConfirmProductionReset}
        areasCount={areas.length}
        contractsCount={contracts.length}
        employeesCount={employees.length}
        logsCount={demandLogs.length}
      />

      <BrandSettingsModal
        isOpen={isBrandSettingsOpen}
        onClose={() => setIsBrandSettingsOpen(false)}
        currentBrand={brand}
        onSaveBrand={updateBrand}
      />

      {detailEmployee && (
        <EmployeeDetailModal
          isOpen={!!detailEmployee}
          onClose={() => setDetailEmployee(null)}
          employee={detailEmployee}
          contracts={contracts}
          onSaveEmployee={handleSaveEmployee}
          onOpenDemand={() => {
            const emp = detailEmployee;
            setDetailEmployee(null);
            setDemandEmployee(emp);
          }}
        />
      )}

      {demandEmployee && (
        <DemandCenterModal
          isOpen={!!demandEmployee}
          onClose={() => setDemandEmployee(null)}
          employee={demandEmployee}
          onSaveLog={handleSaveDemandLog}
        />
      )}

      {isAuditReportOpen && (
        <AuditReportModal
          isOpen={isAuditReportOpen}
          onClose={() => setIsAuditReportOpen(false)}
          employees={employees}
          contracts={contracts}
          stats={stats}
          brand={brand}
        />
      )}
    </div>
  );
}
