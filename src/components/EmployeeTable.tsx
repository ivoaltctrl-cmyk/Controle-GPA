import React, { useState } from 'react';
import {
  Search,
  Filter,
  Users,
  Send,
  Eye,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Radio,
  FileText,
  HeartPulse,
  HardHat,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { Employee, Contract, DocType, DocStatus } from '../types/index.ts';

interface EmployeeTableProps {
  employees: Employee[];
  contracts: Contract[];
  onOpenDetail: (employee: Employee) => void;
  onOpenDemand: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onQuickToggleDoc: (employeeId: string, docType: DocType, newStatus: DocStatus) => void;
  onOpenNewEmployee: () => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  selectedContractId: string;
  setSelectedContractId: (contractId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  contracts,
  onOpenDetail,
  onOpenDemand,
  onEditEmployee,
  onDeleteEmployee,
  onQuickToggleDoc,
  onOpenNewEmployee,
  activeFilter,
  setActiveFilter,
  selectedContractId,
  setSelectedContractId,
  searchTerm,
  setSearchTerm,
}) => {
  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    // Search match
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      emp.nome.toLowerCase().includes(query) ||
      emp.matricula.toLowerCase().includes(query) ||
      (emp.cpf && emp.cpf.toLowerCase().includes(query)) ||
      emp.cargo.toLowerCase().includes(query) ||
      emp.setor.toLowerCase().includes(query) ||
      emp.empresa.toLowerCase().includes(query) ||
      (emp.contratoNome && emp.contratoNome.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // Contract filter
    if (selectedContractId && emp.contratoId !== selectedContractId) {
      return false;
    }

    // Specific Status Filters
    if (activeFilter === 'EM_DIA') {
      return emp.statusGeral === 'EM_DIA';
    }
    if (activeFilter === 'COM_PENDENCIA') {
      return emp.statusGeral !== 'EM_DIA';
    }
    if (activeFilter === 'CRITICO') {
      return emp.statusGeral === 'CRITICO' || emp.statusGeral === 'BLOQUEADO';
    }
    if (activeFilter === 'BLOQUEADO') {
      return emp.statusGeral === 'BLOQUEADO';
    }

    // Specific Document filters
    if (activeFilter === 'FILTRO_OS') {
      const doc = emp.pendencias.find((p) => p.tipo === 'ORDEM_DE_SERVICO');
      return doc && (doc.status === 'PENDENTE' || doc.status === 'VENCIDO');
    }
    if (activeFilter === 'FILTRO_ASO') {
      const doc = emp.pendencias.find((p) => p.tipo === 'ATESTADO_SAUDE_OCUPACIONAL');
      return doc && (doc.status === 'PENDENTE' || doc.status === 'VENCIDO');
    }
    if (activeFilter === 'FILTRO_EPI') {
      const doc = emp.pendencias.find((p) => p.tipo === 'FICHA_EPI');
      return doc && (doc.status === 'PENDENTE' || doc.status === 'VENCIDO');
    }
    if (activeFilter === 'FILTRO_RADIO') {
      const doc = emp.pendencias.find((p) => p.tipo === 'TREINAMENTO_RADIOPROTECAO');
      return doc && (doc.status === 'PENDENTE' || doc.status === 'VENCIDO');
    }

    return true;
  });

  const getDocBadge = (emp: Employee, tipo: DocType, label: string) => {
    const doc = emp.pendencias.find((p) => p.tipo === tipo);

    if (!doc || doc.status === 'NAO_APLICAVEL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
          N/A
        </span>
      );
    }

    const isOk = doc.status === 'EM_DIA';
    const isVencido = doc.status === 'VENCIDO';
    const isPendente = doc.status === 'PENDENTE' || doc.status === 'EM_ANALISE';

    let colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    let text = 'OK';

    if (isOk) {
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
      text = 'EM DIA';
    } else if (isVencido) {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 font-extrabold';
      text = 'VENCIDO';
    } else if (isPendente) {
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 font-bold';
      text = 'PENDENTE';
    }

    return (
      <button
        onClick={() => {
          const nextStatus: DocStatus = isOk ? 'PENDENTE' : 'EM_DIA';
          onQuickToggleDoc(emp.id, tipo, nextStatus);
        }}
        title={`${label}: ${doc.nomeDocumento} - ${doc.status} (Clique para alternar status)`}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] border transition-all cursor-pointer font-semibold shadow-2xs ${colorClasses}`}
      >
        {isOk && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
        {isVencido && <AlertTriangle className="w-3 h-3 text-rose-600" />}
        {isPendente && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
        <span>{text}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Contract Filter & Add Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por colaborador, matrícula, CPF, cargo, setor, empresa..."
            className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#002D62] focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Contract Filter Selector */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#002D62] focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">Todos os Contratos ({contracts.length})</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.numero} - {c.cliente.substring(0, 20)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Manual Employee Button */}
          <button
            onClick={onOpenNewEmployee}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#002D62]" />
            <span>+ Novo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Tags Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-bold text-[11px] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#002D62]" /> Filtrar:
        </span>

        {[
          { id: 'TODOS', label: `Todos (${employees.length})` },
          { id: 'COM_PENDENCIA', label: 'Com Pendências' },
          { id: 'EM_DIA', label: '100% Em Dia' },
          { id: 'CRITICO', label: 'Críticos & Vencidos' },
          { id: 'BLOQUEADO', label: 'Acesso Bloqueado' },
          { id: 'FILTRO_OS', label: 'Sem OS (NR-01)' },
          { id: 'FILTRO_ASO', label: 'Sem ASO (NR-07)' },
          { id: 'FILTRO_EPI', label: 'Sem Ficha EPI (NR-06)' },
          { id: 'FILTRO_RADIO', label: 'Sem Radioproteção' },
        ].map((tag) => (
          <button
            key={tag.id}
            onClick={() => setActiveFilter(tag.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === tag.id
                ? 'bg-[#002D62] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Colaborador / Função</th>
                <th className="py-3.5 px-3">Contrato & Empresa</th>
                <th className="py-3.5 px-3 text-center">Índice</th>
                <th className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3 text-sky-600" />
                    <span>OS (NR-01)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <HeartPulse className="w-3 h-3 text-purple-600" />
                    <span>ASO (NR-07)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <HardHat className="w-3 h-3 text-indigo-600" />
                    <span>EPI (NR-06)</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Radio className="w-3 h-3 text-amber-600" />
                    <span>Radioproteção</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">Nenhum colaborador encontrado com os filtros atuais.</p>
                      <p className="text-xs text-slate-400">Tente ajustar a busca ou carregue novos prints com o leitor OCR.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isEmDia = emp.statusGeral === 'EM_DIA';
                  const isBloqueado = emp.statusGeral === 'BLOQUEADO';
                  const isCritico = emp.statusGeral === 'CRITICO';

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Colaborador info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                              isEmDia
                                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                                : isBloqueado
                                ? 'bg-rose-100 border border-rose-300 text-rose-800'
                                : 'bg-amber-100 border border-amber-300 text-amber-800'
                            }`}
                          >
                            {emp.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => onOpenDetail(emp)}
                              className="font-bold text-slate-900 hover:text-[#002D62] transition-colors truncate block text-left text-xs sm:text-sm cursor-pointer"
                            >
                              {emp.nome}
                            </button>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>Mat: <strong className="text-slate-700">{emp.matricula}</strong></span>
                              {emp.cpf && <span>• CPF: {emp.cpf}</span>}
                              <span>• {emp.cargo}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contrato & Empresa */}
                      <td className="py-3.5 px-3">
                        <div className="max-w-[220px]">
                          <span className="font-bold text-slate-800 truncate block">
                            {emp.contratoNome || 'Sem Contrato Vinculado'}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                            {emp.empresa} • {emp.setor}
                          </span>
                        </div>
                      </td>

                      {/* Indicador % & General Status */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`font-black text-xs ${
                              emp.indicadorPercentual >= 85
                                ? 'text-emerald-700'
                                : emp.indicadorPercentual >= 60
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {emp.indicadorPercentual}%
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border mt-0.5 ${
                              isEmDia
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : isBloqueado
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                            }`}
                          >
                            {isEmDia ? 'REGULAR' : isBloqueado ? 'BLOQUEADO' : 'PENDENTE'}
                          </span>
                        </div>
                      </td>

                      {/* Pillar 1: OS */}
                      <td className="py-3.5 px-3 text-center">
                        {getDocBadge(emp, 'ORDEM_DE_SERVICO', 'Ordem de Serviço')}
                      </td>

                      {/* Pillar 2: ASO */}
                      <td className="py-3.5 px-3 text-center">
                        {getDocBadge(emp, 'ATESTADO_SAUDE_OCUPACIONAL', 'ASO Ocupacional')}
                      </td>

                      {/* Pillar 3: EPI */}
                      <td className="py-3.5 px-3 text-center">
                        {getDocBadge(emp, 'FICHA_EPI', 'Ficha de EPI')}
                      </td>

                      {/* Pillar 4: Radioproteção */}
                      <td className="py-3.5 px-3 text-center">
                        {getDocBadge(emp, 'TREINAMENTO_RADIOPROTECAO', 'Radioproteção')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Primary Demand / Cobrar Button */}
                          <button
                            onClick={() => onOpenDemand(emp)}
                            title="Demandar / Notificar Responsável via WhatsApp ou E-mail"
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              !isEmDia
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Send className="w-3 h-3" />
                            <span className="hidden xl:inline">Demandar</span>
                          </button>

                          {/* Detail */}
                          <button
                            onClick={() => onOpenDetail(emp)}
                            title="Ver Ficha Completa"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#002D62] hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditEmployee(emp)}
                            title="Editar Dados"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o colaborador ${emp.nome} da base?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            title="Excluir Colaborador"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Exibindo <strong>{filteredEmployees.length}</strong> de <strong>{employees.length}</strong> colaboradores cadastrados
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            💡 Dica: Clique nos botões de status (EM DIA / PENDENTE / VENCIDO) para atualizar com 1 clique.
          </span>
        </div>
      </div>
    </div>
  );
};
