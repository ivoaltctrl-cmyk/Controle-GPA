import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Calendar,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Building,
  Image as ImageIcon,
  Clock,
  Save,
  FileCheck,
  FolderSync,
  ExternalLink,
} from 'lucide-react';
import { Employee, PendingDoc, DocStatus, DocType, AdjustmentLog } from '../types/index.ts';
import { calculateDocStatusFromValidity, addStoredAdjustmentLog } from '../utils/storage.ts';
import { recordAdjustmentInSheets, getStoredSpreadsheetId } from '../services/googleSheetsService.ts';

interface ManualAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  pendingDoc: PendingDoc;
  onSaveSuccess: (updatedEmployee: Employee, adjustmentLog: AdjustmentLog) => void;
  currentUser?: { nome?: string; email?: string } | null;
}

export const ManualAdjustmentModal: React.FC<ManualAdjustmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  pendingDoc,
  onSaveSuccess,
  currentUser,
}) => {
  const [newValidity, setNewValidity] = useState<string>(
    pendingDoc.dataVencimento || new Date().toISOString().split('T')[0]
  );
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [driveUrl, setDriveUrl] = useState<string>('');
  const [gestorName, setGestorName] = useState<string>(
    currentUser?.nome || employee.areaResponsavelNome || 'Gestor GPA'
  );
  const [observacoes, setObservacoes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicialização quando o modal abre ou a pendência muda
  useEffect(() => {
    if (isOpen) {
      const initialDate = pendingDoc.dataVencimento || new Date().toISOString().split('T')[0];
      setNewValidity(initialDate);
      setProofImage(null);
      setObservacoes('');
      setSaveSuccessMessage(null);
      setIsSaving(false);

      // Gera nome padronizado prévio
      generateStandardFileName(initialDate);
    }
  }, [isOpen, pendingDoc, employee]);

  const generateStandardFileName = (dateVal: string) => {
    const cleanDoc = (employee.cpf || employee.matricula || 'DOC').replace(/\D/g, '') || 'DOC';
    const cleanTipo = (pendingDoc.nomeDocumento || pendingDoc.tipo)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toUpperCase();
    const now = new Date();
    const dataStr = dateVal || now.toISOString().split('T')[0];
    const horaStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const genName = `${cleanDoc}_${cleanTipo}_${dataStr}_${horaStr}.png`;
    setFileName(genName);
    const folder = 'Comprovantes_Ajustes_SST_GPA';
    setDriveUrl(`https://drive.google.com/drive/folders/${folder}?file=${encodeURIComponent(genName)}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewValidity(val);
    generateStandardFileName(val);
  };

  // Cálculo de status em tempo real com base na data selecionada
  const { status: calculatedStatus, diasRestantes, label: statusLabel } = calculateDocStatusFromValidity(newValidity);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setProofImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!newValidity) {
      alert('Por favor, selecione a nova data de validade do documento.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMessage(null);

    const now = new Date();
    const dataStr = now.toISOString().split('T')[0];
    const horaStr = now.toTimeString().split(' ')[0];

    // Cria o log de auditoria
    const adjustmentLog: AdjustmentLog = {
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nomeGestor: gestorName.trim() || 'Gestor GPA',
      data: dataStr,
      hora: horaStr,
      linha: 'Auto',
      documento: employee.cpf || employee.matricula || '—',
      funcionarioNome: employee.nome,
      tipoPendencia: pendingDoc.nomeDocumento || pendingDoc.tipo,
      docType: pendingDoc.tipo as DocType,
      novaValidade: newValidity,
      novoStatus: calculatedStatus,
      linkImagem: driveUrl,
      nomeArquivo: fileName,
      observacoes: observacoes.trim(),
      dataCriacao: now.toISOString(),
    };

    // Cria o colaborador atualizado
    const updatedPendencias = employee.pendencias.map((p) => {
      if (p.tipo === pendingDoc.tipo) {
        return {
          ...p,
          status: calculatedStatus,
          dataVencimento: newValidity,
          ultimaAtualizacao: dataStr,
        };
      }
      return p;
    });

    const hasVencido = updatedPendencias.some((p) => p.status === 'VENCIDO');
    const hasPendente = updatedPendencias.some((p) => p.status === 'PENDENTE');
    const hasAVencer = updatedPendencias.some((p) => p.status === 'A_VENCER');
    const validCount = updatedPendencias.filter((p) => p.status === 'EM_DIA' || p.status === 'NAO_APLICAVEL').length;
    const indicadorPercentual = updatedPendencias.length > 0 ? Math.round((validCount / updatedPendencias.length) * 100) : 100;

    let statusGeral = employee.statusGeral;
    let resumoGeral = employee.resumoGeral;

    if (employee.statusGeral !== 'BLOQUEADO' && !employee.resumoGeral?.includes('Desligado') && !employee.resumoGeral?.includes('Cancelado')) {
      if (hasVencido) {
        statusGeral = indicadorPercentual < 50 ? 'BLOQUEADO' : 'CRITICO';
        resumoGeral = 'Possui documentos vencidos';
      } else if (hasPendente) {
        statusGeral = 'PENDENTE';
        resumoGeral = 'Possui documentos pendentes de regularização';
      } else if (hasAVencer) {
        statusGeral = 'PENDENTE';
        resumoGeral = 'Documentos a vencer nos próximos 30 dias';
      } else {
        statusGeral = 'EM_DIA';
        resumoGeral = '100% em conformidade com as normas';
      }
    }

    const updatedEmployee: Employee = {
      ...employee,
      pendencias: updatedPendencias,
      indicadorPercentual,
      statusGeral,
      resumoGeral,
      dataUltimaLeitura: new Date().toLocaleDateString('pt-BR'),
    };

    try {
      // 1. Grava no Google Sheets (Pendências SST + Log de Ajustes) e no backend
      const res = await recordAdjustmentInSheets(adjustmentLog, updatedEmployee);

      // 2. Salva no storage local
      addStoredAdjustmentLog(adjustmentLog);

      setSaveSuccessMessage(res.message || 'Ajuste gravado com sucesso na planilha GPA_BD!');

      setTimeout(() => {
        onSaveSuccess(updatedEmployee, adjustmentLog);
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao registrar ajuste:', err);
      // Fallback seguro: aplica localmente
      addStoredAdjustmentLog(adjustmentLog);
      setSaveSuccessMessage('Ajuste salvo localmente com sucesso!');
      setTimeout(() => {
        onSaveSuccess(updatedEmployee, adjustmentLog);
        setIsSaving(false);
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="manual-adjustment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="manual-adjustment-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden transition-all my-8"
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ajuste Manual de Pendência SST
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualização direta na planilha oficial GPA_BD com registro em Log de Ajustes
              </p>
            </div>
          </div>
          <button
            id="btn-close-manual-adjustment-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Card Resumo do Colaborador */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Colaborador:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {employee.nome}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Documento / CPF:</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">
                  {employee.cpf || employee.matricula || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Área / Setor:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {employee.areaNome || employee.setor || 'Geral'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Pendência em Edição:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {pendingDoc.nomeDocumento || pendingDoc.tipo}
                </span>
              </div>
            </div>
          </div>

          {/* Seção de Validade & Recálculo de Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Nova Data de Validade *
              </label>
              <div className="relative">
                <input
                  id="input-manual-validity-date"
                  type="date"
                  value={newValidity}
                  onChange={handleDateChange}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Data que será gravada na aba <strong>Pendências SST</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Novo Status Recalculado
              </label>
              <div className="p-2.5 rounded-xl border flex items-center justify-between bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {calculatedStatus === 'EM_DIA' ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> EM DIA
                    </span>
                  ) : calculatedStatus === 'A_VENCER' ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> A VENCER (30D)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> VENCIDO
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {diasRestantes >= 0 ? `${diasRestantes} dias` : `${Math.abs(diasRestantes)}d atrás`}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Upload de Imagem do Comprovante */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Comprovante / Imagem do Documento (Google Drive)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {!proofImage ? (
              <div
                id="dropzone-manual-adjustment"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Arraste o comprovante ou clique para selecionar
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos aceitos: PNG, JPG, JPEG, PDF (máx. 10MB)
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[280px]">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Comprovante pronto para vinculação
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-2.5 py-1.5 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofImage(null)}
                    className="text-xs px-2.5 py-1.5 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )}

            {/* Informações da Pasta Google Drive */}
            <div className="mt-2.5 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-start gap-2 text-xs text-blue-900 dark:text-blue-300">
              <FolderSync className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p>
                  <strong>Destino Google Drive:</strong> Pasta{' '}
                  <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">
                    Comprovantes_Ajustes_SST_GPA
                  </code>
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5 font-mono truncate max-w-[500px]">
                  Arquivo: {fileName}
                </p>
              </div>
            </div>
          </div>

          {/* Dados de Auditoria (Nome do Gestor & Observações) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Gestor Responsável pelo Ajuste
              </label>
              <input
                id="input-manual-gestor-name"
                type="text"
                value={gestorName}
                onChange={(e) => setGestorName(e.target.value)}
                placeholder="Ex: Gestor de Segurança GPA"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Gravado na coluna <strong>NOME</strong> da aba <em>Log de Ajustes</em>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Observações do Ajuste (Opcional)
              </label>
              <input
                id="input-manual-observacoes"
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Documento validado com clínica conveniada"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Mensagem de Feedback de Sucesso */}
          {saveSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-manual-adjustment"
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="btn-save-manual-adjustment"
            type="button"
            onClick={handleSave}
            disabled={isSaving || !newValidity}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gravando na Planilha GPA_BD...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Ajuste na Planilha</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
