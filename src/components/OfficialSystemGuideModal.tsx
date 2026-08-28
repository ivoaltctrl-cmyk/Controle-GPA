import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Building2,
  User,
  FileText,
  AlertCircle,
  HelpCircle,
  Clock,
  Send,
  Info,
} from 'lucide-react';
import { Employee, Contract, AreaResponsavel, BrandConfig, DocType } from '../types/index.ts';

interface OfficialSystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  employees?: Employee[];
  employeesWithPending?: Employee[];
  contracts?: Contract[];
  areas?: AreaResponsavel[];
  brand?: BrandConfig;
  officialSystemUrl?: string;
  onOpenDemandCenter?: (emp: Employee) => void;
}

export const OfficialSystemGuideModal: React.FC<OfficialSystemGuideModalProps> = ({
  isOpen,
  onClose,
  employee,
  employees = [],
  employeesWithPending,
  contracts = [],
  areas = [],
  brand,
  officialSystemUrl = 'https://sistema.terceiros.gpa.com.br',
  onOpenDemandCenter,
}) => {
  const pendingList = employeesWithPending || employees.filter((e) => e.pendencias?.some((p) => p.status === 'PENDENTE' || p.status === 'VENCIDO' || p.status === 'A_VENCER'));
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employee?.id || pendingList[0]?.id || employees[0]?.id || '');

  if (!isOpen) return null;

  const currentEmp = employee || pendingList.find((e) => e.id === selectedEmpId) || employees.find((e) => e.id === selectedEmpId) || pendingList[0] || employees[0];
  const primaryColor = brand?.primaryColor || '#E21B23';

  const pendingDocs = currentEmp?.pendencias ? currentEmp.pendencias.filter((p) => p.status === 'PENDENTE' || p.status === 'VENCIDO' || p.status === 'A_VENCER') : [];

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const getFormattedSummary = () => {
    if (!currentEmp) return '';
    const docsStr = pendingDocs
      .map((p) => `- ${p.nomeDocumento || p.tipo}: ${p.status} (Vencimento: ${p.dataVencimento || 'Não informado'})`)
      .join('\n');

    return `[SANEAMENTO NO SISTEMA OFICIAL]\nColaborador: ${currentEmp.nome}\nCPF: ${currentEmp.cpf || 'N/A'}\nMatrícula: ${currentEmp.matricula}\nEmpresa: ${currentEmp.empresa}\nFunção/Cargo: ${currentEmp.cargo}\nContrato: ${currentEmp.contratoId || 'N/A'}\n\nPENDÊNCIAS IDENTIFICADAS:\n${docsStr}\n\nFavor regularizar e anexar a documentação comprobatória no sistema oficial.`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${primaryColor}25` }}
              className="p-2.5 rounded-2xl border border-white/10"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Regularização no Sistema Oficial</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Guia Prático
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Consulte as pendências aqui e realize o saneamento no sistema de origem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Instruction Card */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block font-bold text-amber-950 mb-1">
                Como funciona o fluxo de saneamento:
              </strong>
              Este painel consolida as pendências extraídas do sistema oficial. Os demandados e gestores devem consultar as inconsistências abaixo e realizar o upload/ajuste diretamente no <strong>sistema oficial de cadastro</strong>. Após a sincronização, a conformidade será atualizada automaticamente aqui.
            </div>
          </div>

          {/* Employee Selector if no specific employee was passed */}
          {!employee && pendingList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Selecione o Colaborador com Pendência:
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                {pendingList.map((emp) => {
                  const pCount = emp.pendencias?.filter((p) => p.status === 'PENDENTE' || p.status === 'VENCIDO').length || 0;
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome} ({emp.cpf || emp.matricula}) - {emp.empresa} - {pCount} pendência(s)
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Selected Employee Details Card */}
          {currentEmp && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-black text-slate-700 text-sm">
                    {currentEmp.nome.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{currentEmp.nome}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {currentEmp.cargo} • {currentEmp.empresa}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(currentEmp.cpf, 'cpf')}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    {copiedType === 'cpf' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedType === 'cpf' ? 'Copiado!' : `CPF: ${currentEmp.cpf}`}</span>
                  </button>

                  {currentEmp.matricula && (
                    <button
                      onClick={() => handleCopy(currentEmp.matricula, 'matricula')}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      {copiedType === 'matricula' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>
                        {copiedType === 'matricula' ? 'Copiado!' : `Matrícula: ${currentEmp.matricula}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pendencies list for this employee */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Documentos a sanar no sistema oficial:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentEmp.pendencias.map((doc) => {
                    const isOk = doc.status === 'EM_DIA';
                    const isWarn = doc.status === 'A_VENCER';
                    return (
                      <div
                        key={doc.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isOk
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                            : isWarn
                            ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                            : 'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div>
                          <strong className="font-black block">{doc.tipo}</strong>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {doc.dataVencimento ? `Venc: ${doc.dataVencimento}` : 'Sem data cadastrada'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            isOk
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Saneamento Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Passo a Passo para Regularização</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-2">
                  1
                </span>
                <h5 className="text-xs font-bold text-slate-900">Acesse o Sistema Oficial</h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Entre no portal oficial de gestão de terceiros/SST com suas credenciais.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-2">
                  2
                </span>
                <h5 className="text-xs font-bold text-slate-900">Localize o Cadastro</h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Utilize o CPF ou matrícula copiado para encontrar o colaborador ou contrato.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center mb-2">
                  3
                </span>
                <h5 className="text-xs font-bold text-slate-900">Anexe e Atualize</h5>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Faça o upload do documento válido. O painel sincronizará automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() => handleCopy(getFormattedSummary(), 'summary')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedType === 'summary' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {copiedType === 'summary' ? 'Resumo Copiado com Sucesso!' : 'Copiar Resumo das Pendências'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            {currentEmp && onOpenDemandCenter && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDemandCenter(currentEmp);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Notificar Demandado</span>
              </button>
            )}

            <a
              href={officialSystemUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-xs hover:opacity-95 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <span>Abrir Sistema Oficial</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
