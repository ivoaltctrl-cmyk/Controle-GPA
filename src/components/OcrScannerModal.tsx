import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileScan,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Check,
  Save,
  Building2,
  Trash2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Employee, Contract, PendingDoc, DocType, DocStatus } from '../types/index.ts';
import { SAMPLE_OCR_IMAGES, SAMPLE_OCR_RESULTS } from '../data/mockData.ts';
import { recalculateEmployeeStatus } from '../utils/storage.ts';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEmployee: (employee: Employee) => void;
  contracts: Contract[];
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveEmployee,
  contracts,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<Employee> | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default contract when modal opens
  useEffect(() => {
    if (isOpen && contracts.length > 0 && !selectedContractId) {
      setSelectedContractId(contracts[0].id);
    }
    if (!isOpen) {
      // Reset states
      setSelectedImage(null);
      setImageFile(null);
      setExtractedData(null);
      setErrorMsg(null);
      setIsProcessing(false);
      setSuccessSaved(false);
    }
  }, [isOpen, contracts]);

  // Handle global paste event (Ctrl+V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileSelect(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    setErrorMsg(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      processOcrImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sampleKey: keyof typeof SAMPLE_OCR_IMAGES) => {
    const imgData = SAMPLE_OCR_IMAGES[sampleKey];
    setSelectedImage(imgData);
    processOcrImage(imgData, sampleKey);
  };

  const processOcrImage = async (
    imageBase64: string,
    sampleKey?: keyof typeof SAMPLE_OCR_IMAGES
  ) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessSaved(false);

    try {
      // Call Gemini Vision API server route
      const response = await fetch('/api/parse-sst-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          sampleKey: sampleKey || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao processar imagem via OCR Gemini.');
      }

      // Map parsed data
      const parsedData = result.data;
      const matchedContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];

      const newEmployeeDraft: Partial<Employee> = {
        nome: parsedData.nome || 'Colaborador Identificado',
        matricula: parsedData.matricula || `MAT-${Math.floor(10000 + Math.random() * 90000)}`,
        cpf: parsedData.cpf || '',
        cargo: parsedData.cargo || 'Operador Especializado',
        setor: parsedData.setor || 'Operações de Campo',
        empresa: parsedData.empresa || 'Prestadora de Serviços',
        contratoId: matchedContract?.id,
        contratoNome: matchedContract ? `${matchedContract.numero} - ${matchedContract.titulo}` : '',
        resumoGeral: parsedData.resumoGeral || '',
        imagemOrigemUrl: imageBase64.length < 500000 ? imageBase64 : undefined,
        dataCadastro: new Date().toISOString().split('T')[0],
        dataUltimaLeitura: new Date().toISOString().split('T')[0],
        pendencias: (parsedData.pendencias || []).map((p: any, idx: number) => ({
          id: `p_ocr_${Date.now()}_${idx}`,
          tipo: p.tipo as DocType,
          nomeDocumento: p.nomeDocumento || p.tipo,
          status: (p.status as DocStatus) || 'PENDENTE',
          dataEmissao: p.dataEmissao,
          dataVencimento: p.dataVencimento,
          obrigatorio: p.obrigatorio !== false,
          observacoes: p.observacoes || '',
          ultimaAtualizacao: new Date().toISOString().split('T')[0],
        })),
      };

      // Recalculate compliance indicator
      const evaluated = recalculateEmployeeStatus(newEmployeeDraft);
      newEmployeeDraft.indicadorPercentual = evaluated.indicadorPercentual;
      newEmployeeDraft.statusGeral = evaluated.statusGeral;

      setExtractedData(newEmployeeDraft);

      // Trigger celebrate sound/confetti
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    } catch (err: any) {
      console.error('OCR Error:', err);
      // Fallback to sample if offline / API issue
      if (sampleKey && SAMPLE_OCR_RESULTS[sampleKey]) {
        const fallback = SAMPLE_OCR_RESULTS[sampleKey];
        setExtractedData(fallback);
      } else {
        setErrorMsg(
          err.message ||
            'Falha na leitura via IA. Tente novamente ou use uma das amostras pré-carregadas.'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (!extractedData || !extractedData.nome) return;

    const matchedContract = contracts.find((c) => c.id === selectedContractId);

    const fullEmployee: Employee = {
      id: `emp_${Date.now()}`,
      nome: extractedData.nome || 'Colaborador',
      matricula: extractedData.matricula || `MAT-${Math.floor(10000 + Math.random() * 90000)}`,
      cpf: extractedData.cpf || '',
      cargo: extractedData.cargo || 'Colaborador',
      setor: extractedData.setor || 'Operações',
      empresa: extractedData.empresa || 'Empresa Prestadora',
      contratoId: selectedContractId || extractedData.contratoId,
      contratoNome: matchedContract
        ? `${matchedContract.numero} - ${matchedContract.titulo}`
        : extractedData.contratoNome,
      indicadorPercentual: extractedData.indicadorPercentual ?? 80,
      statusGeral: extractedData.statusGeral || 'PENDENTE',
      pendencias: extractedData.pendencias || [],
      dataCadastro: new Date().toISOString().split('T')[0],
      dataUltimaLeitura: new Date().toISOString().split('T')[0],
      imagemOrigemUrl: selectedImage || undefined,
      resumoGeral: extractedData.resumoGeral,
    };

    onSaveEmployee(fullEmployee);
    setSuccessSaved(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#002D62] to-[#00A3E0] text-white shadow-xs">
              <FileScan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Leitor Inteligente de Prints de SST (OCR IA)
              </h2>
              <p className="text-xs text-slate-500">
                Cole o print com <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono font-bold">Ctrl + V</kbd> ou envie a foto da tela do colaborador.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Quick Samples */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Ou teste com amostras simuladas de telas do sistema:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectSample('print1')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#002D62] block">
                      Amostra 1: Carlos Eduardo
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Téc. Radiologia (Pendente OS + Treinamento)
                    </span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectSample('print2')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#002D62] block">
                      Amostra 2: Juliana Mendes
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Engenheira SST (100% Em Dia - 100%)
                    </span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectSample('print3')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#002D62] block">
                      Amostra 3: Rodrigo Lima
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Inspetor END (Crítico - ASO Vencido)
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Upload / Paste Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-[#002D62] bg-blue-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#002D62] flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Arraste ou clique para selecionar o print da tela
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ou simplesmente tire um print da tela e pressione <strong className="text-slate-800">Ctrl + V</strong> em qualquer lugar desta janela.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#002D62] text-white animate-bounce shadow-md">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Lendo e Extraindo Pendências com Gemini Multimodal...
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Identificando Nome, Matrícula, Cargo, Empresa, Ordem de Serviço, ASO, Ficha de EPI e Radioproteção.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Data Form & Validation Panel */}
          {extractedData && !isProcessing && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dados Extraídos com Sucesso (Revise ou Edite Antes de Salvar):</span>
                </h3>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                    (extractedData.indicadorPercentual ?? 0) >= 85
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  Conformidade: {extractedData.indicadorPercentual}%
                </span>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nome do Colaborador</label>
                  <input
                    type="text"
                    value={extractedData.nome || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, nome: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Matrícula / ID</label>
                  <input
                    type="text"
                    value={extractedData.matricula || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, matricula: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">CPF</label>
                  <input
                    type="text"
                    value={extractedData.cpf || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, cpf: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={extractedData.cargo || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, cargo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Empresa Prestadora</label>
                  <input
                    type="text"
                    value={extractedData.empresa || ''}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, empresa: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Vincular ao Contrato</label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:border-[#002D62] focus:bg-white focus:outline-none"
                  >
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.numero} - {c.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 Core Documents Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Status Identificado dos 4 Documentos de SST:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {extractedData.pendencias?.map((doc, idx) => {
                    const isOk = doc.status === 'EM_DIA';
                    const isVencido = doc.status === 'VENCIDO';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between bg-white ${
                          isOk
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : isVencido
                            ? 'border-rose-200 bg-rose-50/40'
                            : 'border-amber-200 bg-amber-50/40'
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {doc.nomeDocumento}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {doc.observacoes || (isOk ? 'Documento Conforme' : 'Ação requerida')}
                          </span>
                        </div>

                        <select
                          value={doc.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as DocStatus;
                            const updatedDocs = [...(extractedData.pendencias || [])];
                            updatedDocs[idx] = { ...updatedDocs[idx], status: newStatus };
                            const recalculated = recalculateEmployeeStatus({
                              ...extractedData,
                              pendencias: updatedDocs,
                            });
                            setExtractedData({
                              ...extractedData,
                              pendencias: updatedDocs,
                              indicadorPercentual: recalculated.indicadorPercentual,
                              statusGeral: recalculated.statusGeral,
                            });
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                            isOk
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isVencido
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="EM_DIA">EM DIA</option>
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="VENCIDO">VENCIDO</option>
                          <option value="NAO_APLICAVEL">N/A</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {extractedData && (
            <button
              onClick={handleSaveToDatabase}
              disabled={successSaved}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                successSaved
                  ? 'bg-emerald-600'
                  : 'bg-[#002D62] hover:bg-[#001f44]'
              }`}
            >
              {successSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo na Base com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar na Base de Dados</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
