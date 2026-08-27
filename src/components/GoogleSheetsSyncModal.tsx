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
  Copy,
  Code2,
  FileText,
  Upload,
} from 'lucide-react';
import {
  DEFAULT_SPREADSHEET_ID,
  getStoredSpreadsheetId,
  saveStoredSpreadsheetId,
  getStoredWebhookUrl,
  saveStoredWebhookUrl,
  pullAllFromSheets,
  pushAllToSheets,
  smartMergeData,
  parseCsvRows,
  convertSstRowsToEmployees,
  convertTrabRowsToTrabalhistas,
  convertContractRowsToContracts,
  APPS_SCRIPT_CODE_TEMPLATE,
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
  const [webhookUrl, setWebhookUrl] = useState(getStoredWebhookUrl());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'sst' | 'trabalhistas' | 'contratuais'>('sst');
  const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    setSpreadsheetId(getStoredSpreadsheetId());
    setWebhookUrl(getStoredWebhookUrl());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveStoredSpreadsheetId(spreadsheetId);
    saveStoredWebhookUrl(webhookUrl);
    setStatusMessage({ type: 'success', text: 'Configurações de conexão salvas com sucesso!' });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  /**
   * Importação e Mesclagem Inteligente (Sem popup de login e sem erro de domínio)
   */
  const handleImportMergeFromSheets = async () => {
    setLoadingAction('merge');
    setStatusMessage(null);
    try {
      saveStoredSpreadsheetId(spreadsheetId);
      saveStoredWebhookUrl(webhookUrl);

      const imported = await pullAllFromSheets(spreadsheetId, undefined, webhookUrl);

      if (imported.employees.length === 0 && imported.contracts.length === 0 && imported.trabalhistas.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'A planilha foi conectada, mas não possui registros de colaboradores preenchidos abaixo dos cabeçalhos.',
        });
        return;
      }

      // Mesclagem Inteligente (Sem Conflito de IDs / Upsert)
      const merged = smartMergeData(
        { employees, trabalhistas, contracts },
        imported
      );

      onApplyImportedData({
        employees: merged.employees,
        contracts: merged.contracts,
        trabalhistas: merged.trabalhistas,
      });

      const sourceLabel =
        imported.source === 'direct_link'
          ? 'Link Oficial da Planilha (GViz)'
          : imported.source === 'apps_script'
          ? 'Webhook Google Apps Script'
          : 'API Google Sheets';

      setStatusMessage({
        type: 'success',
        text: `Sincronização concluída via ${sourceLabel}! +${merged.stats.newEmployees} novos colaboradores, ${merged.stats.updatedEmployees} atualizados, ${merged.stats.newContracts} contratos e ${merged.stats.newTrabalhistas} envios trabalhistas mesclados sem perdas!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro ao importar dados da planilha.',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Exportar dados do aplicativo para o Google Sheets
   */
  const handleExportToSheets = async () => {
    setLoadingAction('export');
    setStatusMessage(null);
    try {
      saveStoredSpreadsheetId(spreadsheetId);
      saveStoredWebhookUrl(webhookUrl);

      if (!webhookUrl) {
        setStatusMessage({
          type: 'info',
          text: 'Para gravar dados diretamente na planilha sem erro de login/domínio, configure o Webhook do Google Apps Script abaixo (leva 30 segundos) ou clique em "Exportar CSV/Excel" no portal.',
        });
        setShowAppsScriptGuide(true);
        return;
      }

      const res = await pushAllToSheets(
        { employees, trabalhistas, contracts },
        spreadsheetId,
        undefined,
        webhookUrl
      );

      setStatusMessage({
        type: 'success',
        text: `Exportação concluída com sucesso! ${res.updatedCells} dados atualizados nas abas oficiais da planilha GPA_BD.`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao enviar dados para a planilha.' });
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Importação Manual por Arquivo CSV (Fallback 100% offline/local)
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const rows = parseCsvRows(text);

        if (rows.length < 2) {
          setStatusMessage({ type: 'error', text: 'O arquivo CSV selecionado está vazio ou sem linhas de dados.' });
          return;
        }

        // Tenta detectar o tipo pelo cabeçalho
        const headerStr = rows[0].join(' ').toLowerCase();
        if (headerStr.includes('nome') || headerStr.includes('aso') || headerStr.includes('epi') || headerStr.includes('documento')) {
          const importedEmps = convertSstRowsToEmployees(rows);
          const merged = smartMergeData({ employees, trabalhistas, contracts }, { employees: importedEmps, trabalhistas: [], contracts: [] });
          onApplyImportedData({ employees: merged.employees });
          setStatusMessage({
            type: 'success',
            text: `Arquivo CSV de SST importado com sucesso! ${importedEmps.length} colaboradores processados.`,
          });
        } else if (headerStr.includes('contrato') || headerStr.includes('objeto')) {
          const importedCtrs = convertContractRowsToContracts(rows);
          const merged = smartMergeData({ employees, trabalhistas, contracts }, { employees: [], trabalhistas: [], contracts: importedCtrs });
          onApplyImportedData({ contracts: merged.contracts });
          setStatusMessage({
            type: 'success',
            text: `Arquivo CSV de Contratos importado com sucesso! ${importedCtrs.length} contratos processados.`,
          });
        } else {
          // Trata como SST por padrão
          const importedEmps = convertSstRowsToEmployees(rows);
          const merged = smartMergeData({ employees, trabalhistas, contracts }, { employees: importedEmps, trabalhistas: [], contracts: [] });
          onApplyImportedData({ employees: merged.employees });
          setStatusMessage({
            type: 'success',
            text: `CSV importado: ${importedEmps.length} colaboradores mesclados com sucesso!`,
          });
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Erro ao processar CSV: ${err.message}` });
      }
    };
    reader.readAsText(file);
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
                  Backend GPA_BD
                </span>
                <span className="text-[10px] font-mono text-slate-400">Google Sheets Sync</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Sincronização com Planilha GPA_BD
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

        {/* 1. Spreadsheet Connection Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Identificação da Planilha Google (ID)</span>
            </span>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Abrir no Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="ID da Planilha Google (Ex: 1eiiiADFvTgdKFp37zwWU5r5iJktZSdsr5BlFVAXZKIc)"
              className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              Salvar
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Para leitura direta com 1 clique, certifique-se de que a planilha possui <strong>compartilhamento por link</strong> ativado.</span>
          </div>
        </div>

        {/* 2. Webhook Apps Script Option */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Webhook Apps Script (Opcional - Para gravação bidirecional direta)</span>
            </span>
            <button
              onClick={() => setShowAppsScriptGuide(!showAppsScriptGuide)}
              className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showAppsScriptGuide ? 'Ocultar Código' : 'Ver Código do Webhook'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="URL do Webhook (https://script.google.com/macros/s/.../exec)"
              className="flex-1 px-3.5 py-2 text-xs font-mono bg-white border border-emerald-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
            <button
              onClick={handleSaveConfig}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              Salvar URL
            </button>
          </div>

          {/* Apps Script Guide Accordion */}
          {showAppsScriptGuide && (
            <div className="mt-3 p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Instruções em 3 passos (leva 30 segundos):</span>
                <button
                  onClick={handleCopyScript}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedScript ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                <li>Na sua planilha GPA_BD, vá em <strong>Extensões → Apps Script</strong>.</li>
                <li>Cole o código copiado e clique em <strong>Salvar (Ícone de disquete)</strong>.</li>
                <li>Clique em <strong>Implantar → Nova Implantação → Tipo: Aplicativo da Web</strong> (Executar como: <em>Eu</em> | Quem tem acesso: <em>Qualquer pessoa</em>) e cole a URL gerada acima!</li>
              </ol>
            </div>
          )}
        </div>

        {/* 3. Structured Tabs Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Abas Oficiais da Planilha GPA_BD:</span>
            </h4>
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTabPreview('sst')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTabPreview === 'sst' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pendências SST
              </button>
              <button
                onClick={() => setActiveTabPreview('trabalhistas')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTabPreview === 'trabalhistas' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pendências trabalhistas
              </button>
              <button
                onClick={() => setActiveTabPreview('contratuais')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTabPreview === 'contratuais' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Pendências Contratuais
              </button>
            </div>
          </div>

          {activeTabPreview === 'sst' && (
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-900 block mb-0.5">Colunas da Aba "Pendências SST":</span>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                A: Documento | B: Nome do Colaborador * | C: Cargo / Função * | D: Área / Setor * | E: STATUS | F: Contrato | G: CNPJ | H: Ordem de Serviço | I: Validade OS | J: ASO | K: Validade ASO | L: EPI | M: Validade EPI | N: Treinamento | O: Validade Certificado | P: Observações
              </p>
            </div>
          )}

          {activeTabPreview === 'trabalhistas' && (
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-900 block mb-0.5">Colunas da Aba "Pendências trabalhistas":</span>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                A: Mês | B: Ano | C: Envio (Data e Hora) | D: Status (Validado / Reprovado / Em Análise)
              </p>
            </div>
          )}

          {activeTabPreview === 'contratuais' && (
            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-emerald-900 block mb-0.5">Colunas da Aba "Pendências Contratuais":</span>
              <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
                A: Contrato | B: Objeto do Contrato | C: Categoria | D: Início | E: Término | F: Status | G: Documentos
              </p>
            </div>
          )}
        </div>

        {/* 4. Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Import / Merge from Sheets */}
            <button
              onClick={handleImportMergeFromSheets}
              disabled={loadingAction === 'merge'}
              className="p-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex flex-col items-start justify-between gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-200" />
                  <span className="text-sm font-black">Importar e Mesclar Dados</span>
                </div>
                {loadingAction === 'merge' && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
              </div>
              <p className="text-[11px] text-blue-100 font-normal text-left">
                Lê a planilha GPA_BD instantaneamente e mescla colaboradores e contratos sem conflito e sem perdas.
              </p>
            </button>

            {/* Push to sheets */}
            <button
              onClick={handleExportToSheets}
              disabled={loadingAction === 'export'}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-start justify-between gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-emerald-200" />
                  <span className="text-sm font-black">Enviar para a Planilha</span>
                </div>
                {loadingAction === 'export' && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
              </div>
              <p className="text-[11px] text-emerald-100 font-normal text-left">
                Exporta dados do aplicativo para o Google Sheets GPA_BD ({employees.length} SST, {contracts.length} Contratos).
              </p>
            </button>
          </div>

          {/* Secondary Options: File Upload Fallback & Close */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar Arquivo CSV Local (.csv)</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
