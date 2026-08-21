import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Send,
  Edit3,
  FileText,
  HeartPulse,
  HardHat,
  Radio,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Employee, PendingDoc, DocType, DocStatus } from '../types/index.ts';
import { recalculateEmployeeStatus } from '../utils/storage.ts';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSaveEmployee: (updated: Employee) => void;
  onOpenDemand: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSaveEmployee,
  onOpenDemand,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'screenshot'>('docs');
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocData, setNewDocData] = useState<{
    tipo: DocType;
    nomeDocumento: string;
    status: DocStatus;
    dataVencimento?: string;
    observacoes?: string;
  }>({
    tipo: 'ORDEM_DE_SERVICO',
    nomeDocumento: '',
    status: 'EM_DIA',
    dataVencimento: '',
    observacoes: '',
  });

  if (!isOpen || !employee) return null;

  const handleUpdateDocStatus = (docId: string, newStatus: DocStatus) => {
    const updatedDocs = employee.pendencias.map((d) =>
      d.id === docId ? { ...d, status: newStatus, ultimaAtualizacao: new Date().toISOString().split('T')[0] } : d
    );
    const recalculated = recalculateEmployeeStatus({ ...employee, pendencias: updatedDocs });
    onSaveEmployee({
      ...employee,
      pendencias: updatedDocs,
      indicadorPercentual: recalculated.indicadorPercentual,
      statusGeral: recalculated.statusGeral,
    });
  };

  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.nomeDocumento) return;

    const newDoc: PendingDoc = {
      id: `p_cust_${Date.now()}`,
      tipo: newDocData.tipo,
      nomeDocumento: newDocData.nomeDocumento,
      status: newDocData.status,
      dataVencimento: newDocData.dataVencimento || undefined,
      observacoes: newDocData.observacoes || undefined,
      obrigatorio: true,
      ultimaAtualizacao: new Date().toISOString().split('T')[0],
    };

    const updatedDocs = [...employee.pendencias, newDoc];
    const recalculated = recalculateEmployeeStatus({ ...employee, pendencias: updatedDocs });
    onSaveEmployee({
      ...employee,
      pendencias: updatedDocs,
      indicadorPercentual: recalculated.indicadorPercentual,
      statusGeral: recalculated.statusGeral,
    });

    setIsAddingDoc(false);
    setNewDocData({
      tipo: 'ORDEM_DE_SERVICO',
      nomeDocumento: '',
      status: 'EM_DIA',
      dataVencimento: '',
      observacoes: '',
    });
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
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-500/20">
              {employee.nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{employee.nome}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    employee.statusGeral === 'EM_DIA'
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                      : employee.statusGeral === 'BLOQUEADO'
                      ? 'bg-rose-950 border-rose-500/40 text-rose-300'
                      : 'bg-amber-950 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {employee.statusGeral === 'EM_DIA'
                    ? '100% REGULAR'
                    : employee.statusGeral === 'BLOQUEADO'
                    ? 'ACESSO BLOQUEADO'
                    : 'PENDÊNCIAS ATIVAS'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Matrícula: <strong className="text-cyan-400">{employee.matricula}</strong> • Cargo: {employee.cargo} • {employee.empresa}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDemand(employee)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Demandar</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch bar */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'docs'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Quadro de Pendências & Documentos ({employee.pendencias.length})
          </button>
          {employee.imagemOrigemUrl && (
            <button
              onClick={() => setActiveTab('screenshot')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'screenshot'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Print Original do Sistema</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'docs' ? (
            <div className="space-y-5">
              {/* Profile Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Setor / Departamento</span>
                  <span className="text-white font-bold">{employee.setor}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Contrato Vinculado</span>
                  <span className="text-cyan-400 font-bold">{employee.contratoNome || 'Geral'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Taxa de Conformidade</span>
                  <span className="text-emerald-400 font-extrabold text-sm">{employee.indicadorPercentual}%</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Última Leitura OCR</span>
                  <span className="text-slate-300">{employee.dataUltimaLeitura || employee.dataCadastro}</span>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Documentos de SST e Treinamentos Avaliados:
                  </h3>

                  <button
                    onClick={() => setIsAddingDoc(!isAddingDoc)}
                    className="px-2.5 py-1 rounded text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Documento</span>
                  </button>
                </div>

                {/* Add Document Form */}
                {isAddingDoc && (
                  <form onSubmit={handleAddCustomDoc} className="p-4 rounded-xl bg-slate-950 border border-cyan-800/80 space-y-3 text-xs">
                    <h4 className="font-bold text-white">Adicionar Novo Documento de SST</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1">Tipo de Documento</label>
                        <select
                          value={newDocData.tipo}
                          onChange={(e) => setNewDocData({ ...newDocData, tipo: e.target.value as DocType })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="ORDEM_DE_SERVICO">Ordem de Serviço (NR-01)</option>
                          <option value="ATESTADO_SAUDE_OCUPACIONAL">ASO Médico (NR-07)</option>
                          <option value="FICHA_EPI">Ficha de EPI (NR-06)</option>
                          <option value="TREINAMENTO_RADIOPROTECAO">Treinamento de Radioproteção</option>
                          <option value="OUTRO">Outro Treinamento / Certificado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Nome do Documento / Curso</label>
                        <input
                          type="text"
                          required
                          value={newDocData.nomeDocumento}
                          onChange={(e) => setNewDocData({ ...newDocData, nomeDocumento: e.target.value })}
                          placeholder="Ex: Treinamento NR-35 Trabalho em Altura"
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Status Atual</label>
                        <select
                          value={newDocData.status}
                          onChange={(e) => setNewDocData({ ...newDocData, status: e.target.value as DocStatus })}
                          className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="EM_DIA">✅ Em Dia</option>
                          <option value="PENDENTE">⚠️ Pendente</option>
                          <option value="VENCIDO">❌ Vencido</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingDoc(false)}
                        className="px-3 py-1 rounded text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded font-bold text-white bg-cyan-600 hover:bg-cyan-500"
                      >
                        Salvar Item
                      </button>
                    </div>
                  </form>
                )}

                {/* Docs list items */}
                <div className="space-y-2.5">
                  {employee.pendencias.map((doc) => {
                    const isOk = doc.status === 'EM_DIA';
                    const isVencido = doc.status === 'VENCIDO';
                    const isPendente = doc.status === 'PENDENTE' || doc.status === 'EM_ANALISE';

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                            {getDocIcon(doc.tipo)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{doc.nomeDocumento}</h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isOk
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                    : isVencido
                                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                                    : isPendente
                                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </div>

                            {doc.observacoes && (
                              <p className="text-xs text-amber-300/90 mt-1">{doc.observacoes}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                              {doc.dataEmissao && <span>Emissão: {doc.dataEmissao}</span>}
                              {doc.dataVencimento && (
                                <span className="font-semibold text-slate-300">
                                  Vencimento: {doc.dataVencimento}
                                </span>
                              )}
                              {doc.ultimaAtualizacao && (
                                <span className="text-slate-500">
                                  Atualizado em: {doc.ultimaAtualizacao}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Switch Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, 'EM_DIA')}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              isOk
                                ? 'bg-emerald-600 text-white shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
                            }`}
                          >
                            Em Dia
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, 'PENDENTE')}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              isPendente
                                ? 'bg-amber-600 text-white shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                            }`}
                          >
                            Pendente
                          </button>
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, 'VENCIDO')}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              isVencido
                                ? 'bg-rose-600 text-white shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-rose-300 hover:bg-slate-800'
                            }`}
                          >
                            Vencido
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Screenshot preview tab */
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Imagem original capturada do sistema legado que gerou esta leitura:
              </p>
              {employee.imagemOrigemUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                  <img
                    src={employee.imagemOrigemUrl}
                    alt="Print de Origem"
                    className="w-full h-auto rounded-lg object-contain max-h-[500px]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
