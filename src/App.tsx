import React, { useState, useEffect, useMemo } from 'react';
import {
  Employee,
  Contract,
  AreaResponsavel,
  DemandLog,
  DocType,
  DocStatus,
  BrandConfig,
  TrabalhistaEnvio,
} from './types/index.ts';
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
  getStoredTrabalhistaEnvios,
  saveStoredTrabalhistaEnvios,
  isStoredAdminAuthenticated,
  setStoredAdminAuthenticated,
  getStoredAdminCredentials,
  saveStoredAdminCredentials,
  getStoredBlinkingAlerts,
  saveStoredBlinkingAlerts,
  calculateSystemStats,
  updateEmployeeCalculatedFields,
  exportEmployeesToExcel,
  exportEmployeesToCsv,
} from './utils/storage.ts';
import { Navbar, MainPortalMode, AdminTabType } from './components/Navbar.tsx';
import { DashboardStats } from './components/DashboardStats.tsx';
import { EmployeeTable } from './components/EmployeeTable.tsx';
import { DemandadoPortal } from './components/DemandadoPortal.tsx';
import { TrabalhistaModule } from './components/TrabalhistaModule.tsx';
import { AreasModule } from './components/AreasModule.tsx';
import { AuditDispatchesTab } from './components/AuditDispatchesTab.tsx';
import { SettingsModule } from './components/SettingsModule.tsx';
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
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminPasswordModal } from './components/AdminPasswordModal.tsx';
import { OfficialSystemGuideModal } from './components/OfficialSystemGuideModal.tsx';
import {
  pullAllFromSheets,
  smartMergeData,
  getStoredSpreadsheetId,
  getStoredWebhookUrl,
} from './services/googleSheetsService.ts';
import {
  fetchAllDataFromServer,
  syncCollectionToBackend,
  saveAdminCredentialsToServer,
} from './services/backendSyncService.ts';
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
  const [trabalhistaEnvios, setTrabalhistaEnvios] = useState<TrabalhistaEnvio[]>([]);
  const [brand, setBrand] = useState<BrandConfig>(getStoredBrandConfig());
  const [resumoConfig, setResumoConfig] = useState<{
    validos: number;
    pendentes: number;
    lastUpdated?: string;
  } | null>(null);

  // Master Portal Mode: 'areas' (Resumo Geral - Primeira Tela Padrão), 'pendencias', 'demands'
  const [portalMode, setPortalMode] = useState<MainPortalMode>('areas');
  const [targetAdminMode, setTargetAdminMode] = useState<MainPortalMode>('demands');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [blinkingAlerts, setBlinkingAlerts] = useState<boolean>(getStoredBlinkingAlerts());

  const handleToggleBlinkingAlerts = () => {
    setBlinkingAlerts((prev) => {
      const next = !prev;
      saveStoredBlinkingAlerts(next);
      return next;
    });
  };

  const handleOpenAdminLoginForTarget = (target: MainPortalMode = 'demands') => {
    setTargetAdminMode(target);
    setIsAdminLoginOpen(true);
  };

  // Admin Sub Navigation & Filtering
  const [activeTab, setActiveTab] = useState<AdminTabType>('dashboard');
  const [activeFilter, setActiveFilter] = useState<string>('TODOS');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isOfficialGuideOpen, setIsOfficialGuideOpen] = useState(false);
  const [officialGuideEmployee, setOfficialGuideEmployee] = useState<Employee | null>(null);
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
  const [isSheetsSyncOpen, setIsSheetsSyncOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'synced' | 'error';
    lastSynced?: string;
    message?: string;
  }>({ status: 'idle' });

  // Function to pull and smart-merge from GPA_BD Sheets (background)
  const refreshFromGoogleSheets = async (silent = false) => {
    try {
      setSyncStatus((prev) => ({ ...prev, status: 'syncing' }));
      const spreadsheetId = getStoredSpreadsheetId();
      const webhookUrl = getStoredWebhookUrl();
      const imported = await pullAllFromSheets(spreadsheetId, undefined, webhookUrl);

      if (imported && (imported.employees.length > 0 || imported.contracts.length > 0 || imported.trabalhistas.length > 0 || imported.areas.length > 0)) {
        const currentEmployees = getStoredEmployees();
        const currentContracts = getStoredContracts();
        const currentTrabalhistas = getStoredTrabalhistaEnvios();
        const currentAreas = getStoredAreas();

        const merged = smartMergeData(
          {
            employees: currentEmployees,
            contracts: currentContracts,
            trabalhistas: currentTrabalhistas,
            areas: currentAreas,
          },
          {
            employees: imported.employees,
            contracts: imported.contracts,
            trabalhistas: imported.trabalhistas,
            areas: imported.areas,
          }
        );

        updateEmployees(merged.employees);
        updateContracts(merged.contracts);
        updateTrabalhistaEnvios(merged.trabalhistas);
        if (merged.areas && merged.areas.length > 0) {
          updateAreas(merged.areas);
        }
      }

      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setSyncStatus({
        status: 'synced',
        lastSynced: nowTime,
        message: `Planilha GPA_BD sincronizada (${imported.employees.length} CADIM, ${imported.contracts.length} Contratos)`,
      });
    } catch (err: any) {
      console.info('Auto-sync background status:', err);
      setSyncStatus({
        status: 'idle',
        lastSynced: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        message: 'Planilha GPA_BD local pronta',
      });
    }
  };

  // Real-time direct mirror sync (substituição fiel on-time do que está na planilha)
  const handleMirrorSyncDirect = async () => {
    try {
      setSyncStatus({ status: 'syncing', message: 'Sincronizando com Google Sheets...' });
      const spreadsheetId = getStoredSpreadsheetId();
      const webhookUrl = getStoredWebhookUrl();
      const imported = await pullAllFromSheets(spreadsheetId, undefined, webhookUrl);

      updateEmployees(imported.employees);
      updateContracts(imported.contracts);
      updateTrabalhistaEnvios(imported.trabalhistas);
      if (imported.areas && imported.areas.length > 0) {
        updateAreas(imported.areas);
      }

      const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setSyncStatus({
        status: 'synced',
        lastSynced: nowTime,
        message: `Planilha sincronizada: ${imported.employees.length} colaboradores`,
      });
      return imported;
    } catch (err: any) {
      console.error('Erro na sincronização direta:', err);
      setSyncStatus({
        status: 'error',
        lastSynced: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        message: err.message || 'Erro ao sincronizar com Google Sheets',
      });
      throw err;
    }
  };

  // Initialize data from server or localStorage on mount and auto-sync with Google Sheets
  useEffect(() => {
    async function initData() {
      // First load from local storage
      let loadedEmployees = getStoredEmployees();
      let loadedContracts = getStoredContracts();
      let loadedAreas = getStoredAreas();
      let loadedLogs = getStoredDemandLogs();
      let loadedTrabalhista = getStoredTrabalhistaEnvios();
      let loadedBrand = getStoredBrandConfig();
      const isAuth = isStoredAdminAuthenticated();

      // Check if backend server has centralized data stored
      const serverData = await fetchAllDataFromServer();
      if (serverData) {
        if (serverData.employees && serverData.employees.length > 0) {
          loadedEmployees = serverData.employees;
          saveStoredEmployees(loadedEmployees);
        }
        if (serverData.contracts && serverData.contracts.length > 0) {
          loadedContracts = serverData.contracts;
          saveStoredContracts(loadedContracts);
        }
        if (serverData.areas && serverData.areas.length > 0) {
          loadedAreas = serverData.areas;
          saveStoredAreas(loadedAreas);
        }
        if (serverData.trabalhistas && serverData.trabalhistas.length > 0) {
          loadedTrabalhista = serverData.trabalhistas;
          saveStoredTrabalhistaEnvios(loadedTrabalhista);
        }
        if (serverData.demandLogs && serverData.demandLogs.length > 0) {
          loadedLogs = serverData.demandLogs;
          saveStoredDemandLogs(loadedLogs);
        }
        if (serverData.brandConfig) {
          loadedBrand = serverData.brandConfig;
          saveStoredBrandConfig(loadedBrand);
        }
        if (serverData.resumoConfig) {
          setResumoConfig(serverData.resumoConfig);
        }
        if (serverData.adminCredentials?.password) {
          saveStoredAdminCredentials(
            serverData.adminCredentials.username || 'admin',
            serverData.adminCredentials.password
          );
        }
      }

      setEmployees(loadedEmployees);
      setContracts(loadedContracts);
      setAreas(loadedAreas);
      setDemandLogs(loadedLogs);
      setTrabalhistaEnvios(loadedTrabalhista);
      setBrand(loadedBrand);
      setIsAdminLoggedIn(isAuth);

      // Auto-fetch from Google Sheets in background
      refreshFromGoogleSheets(true);
    }

    initData();

    // Sincronização periódica entre múltiplos computadores (polling suave a cada 20 segundos)
    const syncInterval = setInterval(async () => {
      const liveData = await fetchAllDataFromServer();
      if (liveData) {
        if (liveData.resumoConfig) {
          setResumoConfig((prev) => {
            if (!prev || prev.lastUpdated !== liveData.resumoConfig?.lastUpdated) {
              return liveData.resumoConfig || prev;
            }
            return prev;
          });
        }
        if (liveData.adminCredentials?.password) {
          const currentCreds = getStoredAdminCredentials();
          if (
            currentCreds.password !== liveData.adminCredentials.password ||
            currentCreds.username !== liveData.adminCredentials.username
          ) {
            saveStoredAdminCredentials(
              liveData.adminCredentials.username || 'admin',
              liveData.adminCredentials.password
            );
          }
        }
      }
    }, 20000);

    return () => clearInterval(syncInterval);
  }, []);

  // Sync helpers with automatic backend server reflection
  const updateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    saveStoredEmployees(newEmployees);
    syncCollectionToBackend('employees', newEmployees);
  };

  const updateTrabalhistaEnvios = (newEnvios: TrabalhistaEnvio[]) => {
    setTrabalhistaEnvios(newEnvios);
    saveStoredTrabalhistaEnvios(newEnvios);
    syncCollectionToBackend('trabalhistas', newEnvios);
  };

  const updateContracts = (newContracts: Contract[]) => {
    setContracts(newContracts);
    saveStoredContracts(newContracts);
    syncCollectionToBackend('contracts', newContracts);
  };

  const updateAreas = (newAreas: AreaResponsavel[]) => {
    setAreas(newAreas);
    saveStoredAreas(newAreas);
    syncCollectionToBackend('areas', newAreas);
  };

  const updateDemandLogs = (newLogs: DemandLog[]) => {
    setDemandLogs(newLogs);
    saveStoredDemandLogs(newLogs);
    syncCollectionToBackend('demandLogs', newLogs);
  };

  const updateResumoConfig = (newConfig: { validos: number; pendentes: number }) => {
    const configWithTimestamp = { ...newConfig, lastUpdated: new Date().toISOString() };
    setResumoConfig(configWithTimestamp);
    syncCollectionToBackend('resumoConfig', configWithTimestamp);
  };

  const handleSaveAdminCredentials = async (username: string, password: string) => {
    saveStoredAdminCredentials(username, password);
    try {
      await saveAdminCredentialsToServer(username, password);
    } catch (e) {
      console.warn('Erro ao salvar credenciais diretamente:', e);
    }
    syncCollectionToBackend('adminCredentials', {
      username,
      password,
      lastUpdated: new Date().toISOString(),
    });
  };

  const updateBrand = (newBrand: BrandConfig) => {
    setBrand(newBrand);
    saveStoredBrandConfig(newBrand);
    syncCollectionToBackend('brandConfig', newBrand);
  };

  // Admin Auth Handlers
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setStoredAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    setPortalMode(targetAdminMode || 'demands');
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
    if (portalMode === 'demands' || portalMode === 'settings') {
      setPortalMode('pendencias');
    }
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

  // Handlers for Demand Logs
  const handleSaveDemandLog = (newLog: DemandLog) => {
    const nextLogs = [newLog, ...demandLogs];
    updateDemandLogs(nextLogs);
  };

  const handleUpdateLogStatus = (logId: string, newStatus: any) => {
    const nextLogs = demandLogs.map((l) => (l.id === logId ? { ...l, status: newStatus } : l));
    updateDemandLogs(nextLogs);
  };

  const handleDeleteLog = (logId: string) => {
    const nextLogs = demandLogs.filter((l) => l.id !== logId);
    updateDemandLogs(nextLogs);
  };

  const handleMassDispatch = (newLogs: DemandLog[]) => {
    const nextLogs = [...newLogs, ...demandLogs];
    updateDemandLogs(nextLogs);
  };

  // Reset entire database to blank state for production
  const handleExecuteProductionReset = () => {
    updateEmployees([]);
    updateContracts([]);
    updateAreas([]);
    updateTrabalhistaEnvios([]);
    updateDemandLogs([]);
    setIsProductionResetOpen(false);
  };

  // Reset to initial rich mock dataset
  const handleResetData = () => {
    if (window.confirm('Deseja recarregar os dados de exemplo padrão do sistema?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateSystemStats(employees);
  }, [employees]);

  const primaryColor = brand?.primaryColor || '#E21B23';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-rose-100 selection:text-rose-900">
      {/* NAVBAR WITH PORTAL MODE SWITCHER & SECURE ROUTING */}
      <Navbar
        portalMode={portalMode}
        setPortalMode={(mode) => {
          if ((mode === 'settings' || mode === 'demands') && !isAdminLoggedIn) {
            handleOpenAdminLoginForTarget(mode);
          } else {
            setPortalMode(mode);
          }
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        onOpenAdminLogin={(target) => handleOpenAdminLoginForTarget(target || 'demands')}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenOfficialGuide={() => {
          setOfficialGuideEmployee(null);
          setIsOfficialGuideOpen(true);
        }}
        onOpenGoogleSheetsSync={() => setIsSheetsSyncOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
        totalPending={stats.totalComPendencia}
        totalAVencer={stats.totalAVencer30Dias}
        blinkingAlerts={blinkingAlerts}
        onToggleBlinkingAlerts={handleToggleBlinkingAlerts}
        syncStatus={syncStatus}
        onRefreshSheets={() => refreshFromGoogleSheets(false)}
      />

      {/* MAIN BODY: PAINEL DE PENDÊNCIAS UNIFICADO | ÁREAS & GESTORES | AUDITORIA | CONFIGURAÇÃO */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* 1. PAINEL DE PENDÊNCIAS & CONFORMIDADE (Hub Unificado de Consulta)        */}
        {/* ========================================================================= */}
        {(portalMode === 'pendencias' || portalMode === 'demandados' || portalMode === 'admin') && (
          <DemandadoPortal
            employees={employees}
            contracts={contracts}
            areas={areas}
            brand={brand}
            onSaveEmployee={handleSaveEmployee}
            onSaveContract={handleSaveContract}
            onDeleteContract={handleDeleteContract}
            onOpenAdminLogin={() => handleOpenAdminLoginForTarget('demands')}
            isAdminLoggedIn={isAdminLoggedIn}
            onResetData={handleResetData}
            blinkingAlerts={blinkingAlerts}
            trabalhistaEnvios={trabalhistaEnvios}
            onSaveTrabalhistaEnvios={updateTrabalhistaEnvios}
            onOpenGoogleSheetsSync={() => setIsSheetsSyncOpen(true)}
            onDirectSync={handleMirrorSyncDirect}
            onOpenOfficialGuide={(emp) => {
              setOfficialGuideEmployee(emp || null);
              setIsOfficialGuideOpen(true);
            }}
            onOpenEmployeeDetail={(emp) => setDetailEmployee(emp)}
            onOpenDemandCenter={(emp) => setDemandEmployee(emp)}
          />
        )}

        {/* ========================================================================= */}
        {/* 2. ÁREAS & GESTORES (ABA RESUMO)                                          */}
        {/* ========================================================================= */}
        {portalMode === 'areas' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <AreasModule
              areas={areas}
              employees={employees}
              contracts={contracts}
              trabalhistaEnvios={trabalhistaEnvios}
              stats={stats}
              resumoConfig={resumoConfig}
              onSaveResumoConfig={updateResumoConfig}
              onSaveArea={handleSaveArea}
              onDeleteArea={handleDeleteArea}
              onSelectAreaForDispatch={(area) => {
                if (!isAdminLoggedIn) {
                  handleOpenAdminLoginForTarget('demands');
                } else {
                  setPortalMode('demands');
                }
              }}
              brand={brand}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. AUDITORIA & DISPAROS (PROTEGIDA POR SENHA)                             */}
        {/* ========================================================================= */}
        {portalMode === 'demands' && (
          isAdminLoggedIn ? (
            <div className="space-y-6 animate-in fade-in duration-200">
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
                onLockGestao={handleAdminLogout}
              />

              <DemandHistory
                logs={demandLogs}
                onUpdateLogStatus={handleUpdateLogStatus}
                onDeleteLog={handleDeleteLog}
                onOpenNewDemand={() => {
                  if (employees.length > 0) {
                    setDemandEmployee(employees[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Acesso Restrito: Gestão GRU</h3>
                <p className="text-xs text-slate-500 mt-2">
                  Esta aba de auditoria, disparos em massa e histórico é restrita. Digite a senha para desbloquear.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleOpenAdminLoginForTarget('demands')}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  Entrar com Senha
                </button>
                <button
                  onClick={() => setPortalMode('pendencias')}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold text-xs transition-all cursor-pointer"
                >
                  Voltar ao Painel de Pendências
                </button>
              </div>
            </div>
          )
        )}

        {/* ========================================================================= */}
        {/* 4. GUIA DE CONFIGURAÇÃO (Protegido com Senha)                             */}
        {/* ========================================================================= */}
        {portalMode === 'settings' && (
          <SettingsModule
            onOpenSheetsSync={() => setIsSheetsSyncOpen(true)}
            onOpenOcrScanner={() => setIsOcrOpen(true)}
            onOpenProductionReset={() => setIsProductionResetOpen(true)}
            onOpenBrandSettings={() => setIsBrandSettingsOpen(true)}
            blinkingAlerts={blinkingAlerts}
            onToggleBlinkingAlerts={handleToggleBlinkingAlerts}
            brand={brand}
            employees={employees}
            contracts={contracts}
            trabalhistas={trabalhistaEnvios}
            areas={areas}
            syncStatus={syncStatus}
            onRefreshSheets={() => refreshFromGoogleSheets(false)}
            onGoToDemandado={() => setPortalMode('pendencias')}
            resumoConfig={resumoConfig}
            onSaveResumoConfig={updateResumoConfig}
            onSaveAdminCredentials={handleSaveAdminCredentials}
          />
        )}
      </main>

      {/* MODALS */}
      <OfficialSystemGuideModal
        isOpen={isOfficialGuideOpen}
        onClose={() => {
          setIsOfficialGuideOpen(false);
          setOfficialGuideEmployee(null);
        }}
        employee={officialGuideEmployee}
        employees={employees}
        contracts={contracts}
        areas={areas}
        brand={brand}
        onOpenDemandCenter={(emp) => setDemandEmployee(emp)}
      />

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
        onSaveAdminCredentials={handleSaveAdminCredentials}
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

      <DemandCenterModal
        isOpen={!!demandEmployee}
        onClose={() => setDemandEmployee(null)}
        employee={demandEmployee}
        contracts={contracts}
        onSaveDemandLog={handleSaveDemandLog}
      />

      <EmployeeDetailModal
        isOpen={!!detailEmployee}
        onClose={() => setDetailEmployee(null)}
        employee={detailEmployee}
        onSaveEmployee={handleSaveEmployee}
        onOpenDemand={(emp) => setDemandEmployee(emp)}
      />

      <AuditReportModal
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
        stats={stats}
        employees={employees}
        contracts={contracts}
        brand={brand}
      />

      <ProductionResetModal
        isOpen={isProductionResetOpen}
        onClose={() => setIsProductionResetOpen(false)}
        onConfirmReset={handleExecuteProductionReset}
        onExportExcel={() => exportEmployeesToExcel(employees, contracts, areas)}
        totalEmployees={employees.length}
        totalContracts={contracts.length}
      />

      <BrandSettingsModal
        isOpen={isBrandSettingsOpen}
        onClose={() => setIsBrandSettingsOpen(false)}
        brand={brand}
        onSaveBrand={updateBrand}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsSyncOpen}
        onClose={() => setIsSheetsSyncOpen(false)}
        employees={employees}
        contracts={contracts}
        trabalhistas={trabalhistaEnvios}
        areas={areas}
        onApplyImportedData={({ employees: emps, contracts: cts, trabalhistas: tbs, areas: ars }) => {
          if (emps) updateEmployees(emps);
          if (cts) updateContracts(cts);
          if (tbs) updateTrabalhistaEnvios(tbs);
          if (ars) updateAreas(ars);
          setSyncStatus({
            status: 'synced',
            lastSynced: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            message: 'Dados do Google Sheets integrados com sucesso.',
          });
        }}
        brand={brand}
      />
    </div>
  );
}
