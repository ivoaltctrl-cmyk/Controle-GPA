import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  FileScan,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Trash2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Radio,
  FileText,
  HeartPulse,
  HardHat,
  Eye,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Contract, Employee, PendingDoc } from '../types/index.ts';
import { recalculateEmployeeStatus } from '../utils/storage.ts';
import { generateSampleScreenshotBase64, SAMPLE_TEMPLATES } from '../utils/sampleImageGenerator.ts';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEmployee: (employee: Employee) => void;
  contracts: Contract[];
}

interface QueueItem {
  id: string;
  file?: File;
  previewUrl: string;
  base64Data: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  extractedData?: Employee;
  errorMessage?: string;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveEmployee,
  contracts,
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to Global Paste (Ctrl+V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            addImageToQueue(blob, `print_colado_${Date.now()}.png`);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItem = queue[activeItemIndex];

  const addImageToQueue = (fileOrBlob: Blob | File, filename?: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const newItem: QueueItem = {
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        file: fileOrBlob instanceof File ? fileOrBlob : undefined,
        previewUrl: URL.createObjectURL(fileOrBlob),
        base64Data,
        name: filename || (fileOrBlob instanceof File ? fileOrBlob.name : 'captura_tela.png'),
        status: 'pending',
      };

      setQueue((prev) => {
        const next = [...prev, newItem];
        if (prev.length === 0) {
          setActiveItemIndex(0);
        }
        return next;
      });

      // Auto trigger processing for single added item
      processSingleItem(newItem);
    };
    reader.readAsDataURL(fileOrBlob);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      addImageToQueue(files[i], files[i].name);
    }
  };

  const handleSampleClick = (templateIndex: number = 0) => {
    const base64 = generateSampleScreenshotBase64(templateIndex);
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/png' });
    addImageToQueue(blob, `exemplo_sistema_${SAMPLE_TEMPLATES[templateIndex % SAMPLE_TEMPLATES.length].cargo.substring(0, 15)}.png`);
  };

  const processSingleItem = async (item: QueueItem) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'processing', errorMessage: undefined } : q))
    );

    try {
      const res = await fetch('/api/scan-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: item.base64Data,
          mimeType: 'image/png',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Falha na leitura visual da imagem.');
      }

      const extracted = json.data;

      // Match or assign contract if available
      let matchedContractId: string | undefined;
      let matchedContractNome = extracted.contrato || '';

      if (extracted.contrato) {
        const found = contracts.find(
          (c) =>
            c.numero.toLowerCase().includes(extracted.contrato.toLowerCase()) ||
            extracted.contrato.toLowerCase().includes(c.numero.toLowerCase()) ||
            c.titulo.toLowerCase().includes(extracted.contrato.toLowerCase())
        );
        if (found) {
          matchedContractId = found.id;
          matchedContractNome = `${found.numero} - ${found.titulo}`;
        }
      }

      // Format documents to PendingDoc
      const formattedDocs: PendingDoc[] = (extracted.pendencias || []).map(
        (p: any, idx: number) => ({
          id: `p_ocr_${Date.now()}_${idx}`,
          tipo: p.tipo || 'OUTRO',
          nomeDocumento: p.nomeDocumento || 'Documento SST',
          status: p.status || 'PENDENTE',
          dataEmissao: p.dataEmissao || undefined,
          dataVencimento: p.dataVencimento || undefined,
          observacoes: p.observacoes || undefined,
          obrigatorio: p.obrigatorio !== false,
          ultimaAtualizacao: new Date().toISOString().split('T')[0],
        })
      );

      // Ensure the 4 key document pillars exist if not present in the extracted list
      const coreTypes: ('ORDEM_DE_SERVICO' | 'ATESTADO_SAUDE_OCUPACIONAL' | 'FICHA_EPI' | 'TREINAMENTO_RADIOPROTECAO')[] = [
        'ORDEM_DE_SERVICO',
        'ATESTADO_SAUDE_OCUPACIONAL',
        'FICHA_EPI',
        'TREINAMENTO_RADIOPROTECAO',
      ];

      for (const coreType of coreTypes) {
        if (!formattedDocs.some((d) => d.tipo === coreType)) {
          let name = 'Documento';
          if (coreType === 'ORDEM_DE_SERVICO') name = 'Ordem de Serviço (NR-01)';
          if (coreType === 'ATESTADO_SAUDE_OCUPACIONAL') name = 'Atestado de Saúde Ocupacional - ASO (NR-07)';
          if (coreType === 'FICHA_EPI') name = 'Ficha de Distribuição e Controle de EPI (NR-06)';
          if (coreType === 'TREINAMENTO_RADIOPROTECAO') name = 'Certificado de Treinamento de Radioproteção (CNEN)';

          formattedDocs.push({
            id: `p_core_${Date.now()}_${coreType}`,
            tipo: coreType,
            nomeDocumento: name,
            status: coreType === 'TREINAMENTO_RADIOPROTECAO' ? 'NAO_APLICAVEL' : 'PENDENTE',
            obrigatorio: coreType !== 'TREINAMENTO_RADIOPROTECAO',
            ultimaAtualizacao: new Date().toISOString().split('T')[0],
          });
        }
      }

      const rawEmployee: Partial<Employee> = {
        id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        nome: extracted.nome || 'Colaborador sem nome',
        matricula: extracted.matricula || `MAT-${Math.floor(10000 + Math.random() * 90000)}`,
        cpf: extracted.cpf || '',
        cargo: extracted.cargo || 'Função Operacional',
        setor: extracted.setor || 'Operações',
        empresa: extracted.empresa || 'Empresa Contratada',
        contratoId: matchedContractId,
        contratoNome: matchedContractNome,
        resumoGeral: extracted.resumoGeral || '',
        pendencias: formattedDocs,
        dataCadastro: new Date().toISOString().split('T')[0],
        dataUltimaLeitura: new Date().toISOString().split('T')[0],
        imagemOrigemUrl: item.base64Data,
      };

      const calculated = recalculateEmployeeStatus(rawEmployee);
      const fullEmployee: Employee = {
        ...(rawEmployee as Employee),
        indicadorPercentual: extracted.indicadorPercentual ?? calculated.indicadorPercentual,
        statusGeral: (extracted.statusGeral as any) || calculated.statusGeral,
      };

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'success', extractedData: fullEmployee }
            : q
        )
      );
    } catch (err: any) {
      console.error('Erro ao processar item:', err);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', errorMessage: err.message || 'Erro no processamento' }
            : q
        )
      );
    }
  };

  const handleUpdateExtractedField = (field: keyof Employee, value: any) => {
    if (!currentItem || !currentItem.extractedData) return;
    const updated = {
      ...currentItem.extractedData,
      [field]: value,
    };
    const recalculated = recalculateEmployeeStatus(updated);
    const final = {
      ...updated,
      indicadorPercentual: recalculated.indicadorPercentual,
      statusGeral: recalculated.statusGeral,
    };

    setQueue((prev) =>
      prev.map((q, idx) => (idx === activeItemIndex ? { ...q, extractedData: final } : q))
    );
  };

  const handleUpdateDocStatus = (docId: string, newStatus: any) => {
    if (!currentItem || !currentItem.extractedData) return;
    const updatedDocs = currentItem.extractedData.pendencias.map((d) =>
      d.id === docId ? { ...d, status: newStatus } : d
    );
    const updated = {
      ...currentItem.extractedData,
      pendencias: updatedDocs,
    };
    const recalculated = recalculateEmployeeStatus(updated);
    const final = {
      ...updated,
      indicadorPercentual: recalculated.indicadorPercentual,
      statusGeral: recalculated.statusGeral,
    };

    setQueue((prev) =>
      prev.map((q, idx) => (idx === activeItemIndex ? { ...q, extractedData: final } : q))
    );
  };

  const handleSaveCurrent = () => {
    if (!currentItem || !currentItem.extractedData) return;

    onSaveEmployee(currentItem.extractedData);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {}

    // Remove from queue or advance
    const remaining = queue.filter((_, idx) => idx !== activeItemIndex);
    setQueue(remaining);
    if (remaining.length > 0) {
      setActiveItemIndex(Math.min(activeItemIndex, remaining.length - 1));
    } else {
      onClose();
    }
  };

  const handleSaveAllReady = () => {
    const readyItems = queue.filter((q) => q.status === 'success' && q.extractedData);
    if (readyItems.length === 0) return;

    for (const item of readyItems) {
      if (item.extractedData) {
        onSaveEmployee(item.extractedData);
      }
    }

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    onClose();
  };

  const getDocIcon = (tipo: string) => {
    switch (tipo) {
      case 'ORDEM_DE_SERVICO':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'ATESTADO_SAUDE_OCUPACIONAL':
        return <HeartPulse className="w-4 h-4 text-purple-400" />;
      case 'FICHA_EPI':
        return <HardHat className="w-4 h-4 text-pink-400" />;
      case 'TREINAMENTO_RADIOPROTECAO':
        return <Radio className="w-4 h-4 text-amber-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <FileScan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Leitor Inteligente de Imagens & Prints SST
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Gemini Vision AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Arraste imagens, cole prints (<kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Ctrl + V</kbd>) ou teste com prints de exemplo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Drop & Paste Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/30 shadow-inner'
                : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-sm font-bold text-white">
                Clique para selecionar imagens ou arraste prints aqui
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                Dica: você também pode tirar um print (<kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">PrintScreen</kbd>) da tela do seu sistema e simplesmente pressionar <strong className="text-cyan-300">Ctrl + V</strong> em qualquer lugar!
              </p>
            </div>

            {/* Quick Demo Templates */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Testar com telas simuladas:
              </span>
              <button
                type="button"
                onClick={() => handleSampleClick(0)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Print: Técnico Radiologia (Vencido)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSampleClick(1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Print: Técnica Tomografia (OS Pendente)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSampleClick(2)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Print: Caldeireiro (ASO Vencido / Bloqueado)</span>
              </button>
            </div>
          </div>

          {/* Queue & Processed Result Section */}
          {queue.length > 0 && (
            <div className="space-y-4">
              {/* Queue Header & Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">
                    Fila de Leitura ({queue.length} {queue.length === 1 ? 'imagem' : 'imagens'})
                  </h3>
                </div>

                {queue.some((q) => q.status === 'success') && (
                  <button
                    onClick={handleSaveAllReady}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Todos Prontos ({queue.filter((q) => q.status === 'success').length})</span>
                  </button>
                )}
              </div>

              {/* Queue Thumbnails bar */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {queue.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemIndex(idx)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left min-w-[200px] transition-all cursor-pointer ${
                      activeItemIndex === idx
                        ? 'border-cyan-500 bg-slate-800/90 shadow-md shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900'
                    }`}
                  >
                    <img
                      src={item.previewUrl}
                      alt="Thumbnail"
                      className="w-10 h-10 rounded object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {item.extractedData?.nome || item.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {item.status === 'processing' && (
                          <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Lendo IA...
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Lido ({item.extractedData?.indicadorPercentual}%)
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[10px] text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Erro na leitura
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Na fila
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQueue((prev) => prev.filter((_, i) => i !== idx));
                        if (activeItemIndex >= queue.length - 1) {
                          setActiveItemIndex(Math.max(0, queue.length - 2));
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
              </div>

              {/* Active Item View & Extracted Details Review */}
              {currentItem && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-5">
                  {currentItem.status === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                        <Sparkles className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Analisando Imagem com Gemini Vision...</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Lendo campos de nome, matrícula, OS, ASO, Ficha de EPI, Radioproteção e indicador de conformidade.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentItem.status === 'error' && (
                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                        <span>Não foi possível extrair os dados da imagem</span>
                      </div>
                      <p className="text-xs text-rose-200/80">{currentItem.errorMessage}</p>
                      <button
                        onClick={() => processSingleItem(currentItem)}
                        className="px-3 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  )}

                  {currentItem.status === 'success' && currentItem.extractedData && (
                    <div className="space-y-5">
                      {/* Top Preview Card */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                            {currentItem.extractedData.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">
                                {currentItem.extractedData.nome}
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  currentItem.extractedData.statusGeral === 'EM_DIA'
                                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                    : currentItem.extractedData.statusGeral === 'BLOQUEADO'
                                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                                    : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                                }`}
                              >
                                {currentItem.extractedData.statusGeral === 'EM_DIA'
                                  ? '100% REGULAR'
                                  : currentItem.extractedData.statusGeral === 'BLOQUEADO'
                                  ? 'ACESSO BLOQUEADO'
                                  : 'COM PENDÊNCIAS'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Matrícula: <strong className="text-cyan-400">{currentItem.extractedData.matricula}</strong> | Cargo: {currentItem.extractedData.cargo}
                            </p>
                          </div>
                        </div>

                        {/* Indicator Score */}
                        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              INDICADOR EXTRAÍDO
                            </span>
                            <span className="text-lg font-extrabold text-cyan-400">
                              {currentItem.extractedData.indicadorPercentual}%
                            </span>
                          </div>
                          <div className="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                currentItem.extractedData.indicadorPercentual >= 80
                                  ? 'bg-emerald-400'
                                  : currentItem.extractedData.indicadorPercentual >= 50
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${currentItem.extractedData.indicadorPercentual}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Editable Form Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={currentItem.extractedData.nome}
                            onChange={(e) => handleUpdateExtractedField('nome', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Matrícula / ID
                          </label>
                          <input
                            type="text"
                            value={currentItem.extractedData.matricula}
                            onChange={(e) => handleUpdateExtractedField('matricula', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={currentItem.extractedData.cpf || ''}
                            onChange={(e) => handleUpdateExtractedField('cpf', e.target.value)}
                            placeholder="000.000.000-00"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Cargo / Função
                          </label>
                          <input
                            type="text"
                            value={currentItem.extractedData.cargo}
                            onChange={(e) => handleUpdateExtractedField('cargo', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Setor / Área
                          </label>
                          <input
                            type="text"
                            value={currentItem.extractedData.setor}
                            onChange={(e) => handleUpdateExtractedField('setor', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">
                            Empresa / Prestadora
                          </label>
                          <input
                            type="text"
                            value={currentItem.extractedData.empresa}
                            onChange={(e) => handleUpdateExtractedField('empresa', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        {/* Contract Selection */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                            Vincular ao Contrato Monitorado
                          </label>
                          <select
                            value={currentItem.extractedData.contratoId || ''}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const found = contracts.find((c) => c.id === selectedId);
                              handleUpdateExtractedField('contratoId', selectedId || undefined);
                              handleUpdateExtractedField(
                                'contratoNome',
                                found ? `${found.numero} - ${found.titulo}` : currentItem.extractedData?.contratoNome
                              );
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-cyan-400 focus:outline-none"
                          >
                            <option value="">-- Selecione um Contrato ou Mantenha Geral --</option>
                            {contracts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.numero} - {c.titulo} ({c.cliente})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Checklist of Detected Documents */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          Conformidade dos Documentos de SST Detectados:
                        </h4>

                        <div className="space-y-2">
                          {currentItem.extractedData.pendencias.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-800">
                                  {getDocIcon(doc.tipo)}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    {doc.nomeDocumento}
                                  </span>
                                  {doc.observacoes && (
                                    <span className="text-[11px] text-amber-300/80 block mt-0.5">
                                      {doc.observacoes}
                                    </span>
                                  )}
                                  {doc.dataVencimento && (
                                    <span className="text-[10px] text-slate-400 block">
                                      Validade: {doc.dataVencimento}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Status Selector */}
                              <div className="flex items-center gap-2">
                                <select
                                  value={doc.status}
                                  onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none ${
                                    doc.status === 'EM_DIA'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                      : doc.status === 'VENCIDO'
                                      ? 'bg-rose-950 text-rose-300 border-rose-600'
                                      : doc.status === 'PENDENTE'
                                      ? 'bg-amber-950 text-amber-300 border-amber-600'
                                      : 'bg-slate-800 text-slate-300 border-slate-600'
                                  }`}
                                >
                                  <option value="EM_DIA">✅ Em Dia (Conforme)</option>
                                  <option value="PENDENTE">⚠️ Pendente (Ausente/Falta)</option>
                                  <option value="VENCIDO">❌ Vencido (Expirado)</option>
                                  <option value="EM_ANALISE">⏳ Em Análise</option>
                                  <option value="NAO_APLICAVEL">⚪ Não Aplicável</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Summary note */}
                      {currentItem.extractedData.resumoGeral && (
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                          <span className="font-bold text-amber-400 block mb-1">
                            📋 Parecer da Leitura:
                          </span>
                          {currentItem.extractedData.resumoGeral}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                          onClick={handleSaveCurrent}
                          className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Salvar este Colaborador na Base de Dados</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
