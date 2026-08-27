import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Settings2,
  Layers,
  Database,
  GitMerge,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import {
  DEFAULT_SPREADSHEET_ID,
  getStoredSpreadsheetId,
  saveStoredSpreadsheetId,
  getStoredGoogleToken,
  requestGoogleAccessToken,
  disconnectGoogleAccount,
  getCachedGoogleUser,
  setupSpreadsheetTabs,
  pushAllToSheets,
  pullAllFromSheets,
  smartMergeData,
  SHEET_TABS,
} from '../services/googleSheetsService.ts';
import { Employee, Contract, TrabalhistaEnvio, AreaResponsavel, BrandConfig } from '../types/index.ts';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  contracts: Contract[];
  trabalhistas: TrabalhistaEnvio[];
  areas: AreaResponsavel[];
  onApplyImportedData: (data: {
    employees?: Employee[];
    contracts?: Contract[];
    trabalhistas?: TrabalhistaEnvio[];
    areas?: AreaResponsavel[];
  }) => void;
  brand?: BrandConfig;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  employees,
  contracts,
  trabalhistas,
  areas,
  onApplyImportedData,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(getStoredSpreadsheetId());
  const [hasToken, setHasToken] = useState(!!getStoredGoogleToken());
  const [currentUser, setCurrentUser] = useState(getCachedGoogleUser());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'sst' | 'trabalhistas' | 'contratuais'>('sst');

  useEffect(() => {
    setHasToken(!!getStoredGoogleToken());
    setCurrentUser(getCachedGoogleUser());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setLoadingAction('connect');
    setStatusMessage(null);
    try {
      const res = await requestGoogleAccessToken();
      setHasToken(true);
      setCurrentUser(res.user);
      setStatusMessage({
        type: 'success',
        text: `Conta Google (${res.user.email || 'Conectada'}) autorizada com sucesso!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Não foi possível autorizar o acesso ao Google Sheets.',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnectGoogle = async () => {
    await disconnectGoogleAccount();
    setHasToken(false);
    setCurrentUser(null);
    setStatusMessage({ type: 'info', text: 'Conta Google desconectada.' });
  };

  const handleSaveSpreadsheetId = () => {
    saveStoredSpreadsheetId(spreadsheetId);
    setStatusMessage({ type: 'success', text: 'ID da Planilha GPA_BD salvo com sucesso!' });
  };

  const handleSetupStructure = async () => {
    setLoadingAction('setup');
    setStatusMessage(null);
    try {
      let token = getStoredGoogleToken();
      if (!token) {
        const authRes = await requestGoogleAccessToken();
        token = authRes.token;
        setHasToken(true);
        setCurrentUser(authRes.user);
      }
      await setupSpreadsheetTabs(spreadsheetId, token);
      setStatusMessage({
        type: 'success',
        text: 'Estrutura das abas ("Pendências SST", "Pendências trabalhistas", "Pendências Contratuais") atualizada e formatada!',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao estruturar planilha.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportToSheets = async () => {
    setLoadingAction('export');
    setStatusMessage(null);
    try {
      let token = getStoredGoogleToken();
      if (!token) {
        const authRes = await requestGoogleAccessToken();
        token = authRes.token;
        setHasToken(true);
        setCurrentUser(authRes.user);
      }

      saveStoredSpreadsheetId(spreadsheetId);
      const res = await pushAllToSheets(
        {
          employees,
          trabalhistas,
          contracts,
        },
        spreadsheetId,
        token
      );

      setStatusMessage({
        type: 'success',
        text: `Exportação concluída! ${res.updatedCells} células sincronizadas nas abas oficiais da planilha GPA_BD.`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao enviar dados para a planilha.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleImportMergeFromSheets = async () => {
    setLoadingAction('merge');
    setStatusMessage(null);
    try {
      let token = getStoredGoogleToken();
      if (!token) {
        const authRes = await requestGoogleAccessToken();
        token = authRes.token;
        setHasToken(true);
        setCurrentUser(authRes.user);
      }

      const imported = await pullAllFromSheets(spreadsheetId, token);

      if (imported.employees.length === 0 && imported.contracts.length === 0 && imported.trabalhistas.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'A planilha ainda não possui registros preenchidos abaixo dos cabeçalhos. Clique em "Enviar Dados Atuais para a Planilha" para popular!',
        });
        return;
      }

      // Mesclagem Inteligente (Sem Conflito)
      const merged = smartMergeData(
        { employees, trabalhistas, contracts },
        imported
      );

      onApplyImportedData({
        employees: merged.employees,
        contracts: merged.contracts,
        trabalhistas: merged.trabalhistas,
      });

      setStatusMessage({
        type: 'success',
        text: `Sincronização sem conflitos concluída: ${merged.stats.newEmployees} novos colaboradores adicionados, ${merged.stats.updatedEmployees} atualizados, ${merged.stats.newContracts} contratos e ${merged.stats.newTrabalhistas} envios trabalhistas mesclados!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao ler dados da planilha.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Backend Oficial Google Sheets
                </span>
                <span className="text-[10px] font-mono text-slate-400">GPA_BD</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Sincronização Bidirecional com Planilha GPA_BD
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {statusMessage.type === 'info' && <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Informação sobre acesso livre */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>Sincronização Direta sem Senha de Administrador</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Qualquer operador ou demandado pode sincronizar os dados clicando no botão <strong>"GPA_BD Sheets"</strong> no topo da página. Basta conectar a conta Google autorizada para ler ou salvar alterações na planilha oficial.
          </p>
        </div>

        {/* 1. Connection Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Autenticação Google Workspace</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentUser?.email
                  ? `Conectado como ${currentUser.email}`
                  : 'Conexão segura com sua conta Google.'}
              </p>
            </div>

            {hasToken || currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {currentUser?.email ? currentUser.email.split('@')[0] : 'Conectado'}
                </span>
                <button
                  onClick={handleDisconnectGoogle}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={loadingAction === 'connect'}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loadingAction === 'connect' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Conectar Conta Google</span>
              </button>
            )}
          </div>

          {/* Spreadsheet link & ID input */}
          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Planilha Vinculada
              </label>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Abrir Planilha GPA_BD no Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="ID da Planilha Google"
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleSaveSpreadsheetId}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Salvar ID
              </button>
            </div>
          </div>
        </div>

        {/* 2. Structured Tabs Guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Abas e Colunas Oficiais Mapeadas:</span>
            </h4>
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTabPreview('sst')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTabPreview === 'sst' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pendências SST
              </button>
              <button
                onClick={() => setActiveTabPreview('trabalhistas')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTabPreview === 'trabalhistas' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pendências trabalhistas
              </button>
              <button
                onClick={() => setActiveTabPreview('contratuais')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTabPreview === 'contratuais' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pendências Contratuais
              </button>
            </div>
          </div>

          {activeTabPreview === 'sst' && (
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-emerald-900 block">Colunas da Aba "Pendências SST":</span>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                A: Documento | B: Nome do Colaborador * | C: Cargo / Função * | D: Área / Setor * | E: STATUS | F: Contrato | G: CNPJ | H: Ordem de Serviço (NR-01) | I: Validade OS | J: ASO Ocupacional (NR-07) | K: Validade ASO | L: Ficha de EPI (NR-06) | M: Validade Ficha EPI | N: Treinamento / Certificação Técnica | O: Validade Certificado | P: Observações
              </p>
            </div>
          )}

          {activeTabPreview === 'trabalhistas' && (
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-emerald-900 block">Colunas da Aba "Pendências trabalhistas":</span>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                A: Mês | B: Ano | C: Envio (Data e Hora) | D: Status (Validado / Reprovado / Em Análise)
              </p>
            </div>
          )}

          {activeTabPreview === 'contratuais' && (
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-emerald-900 block">Colunas da Aba "Pendências Contratuais":</span>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                A: Contrato | B: Objeto do Contrato | C: Categoria | D: Início | E: Término | F: Status | G: Documentos
              </p>
            </div>
          )}
        </div>

        {/* 3. Sync Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Push to sheets */}
            <button
              onClick={handleExportToSheets}
              disabled={loadingAction === 'export'}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-start justify-between gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-200" />
                  <span className="text-sm font-black">Enviar para a Planilha</span>
                </div>
                {loadingAction === 'export' && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
              </div>
              <p className="text-[11px] text-emerald-100 font-normal text-left">
                Exporta dados do aplicativo para o Google Sheets GPA_BD ({employees.length} SST, {contracts.length} Contratos, {trabalhistas.length} Trabalhistas).
              </p>
            </button>

            {/* Smart Merge Pull from sheets */}
            <button
              onClick={handleImportMergeFromSheets}
              disabled={loadingAction === 'merge'}
              className="p-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex flex-col items-start justify-between gap-3 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-200" />
                  <span className="text-sm font-black">Importar e Mesclar Dados</span>
                </div>
                {loadingAction === 'merge' && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
              </div>
              <p className="text-[11px] text-blue-100 font-normal text-left">
                Lê a planilha GPA_BD, importa novos lançamentos manuais e atualiza o painel sem conflito de dados.
              </p>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSetupStructure}
              disabled={loadingAction === 'setup'}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer underline"
            >
              {loadingAction === 'setup' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Settings2 className="w-3.5 h-3.5" />}
              <span>Ajustar / Formatar Cabeçalhos na Planilha</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
