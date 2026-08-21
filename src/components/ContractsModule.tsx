import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Users,
  Send,
  Calendar,
  Phone,
  Mail,
  Edit3,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Contract, Employee } from '../types/index.ts';
import { calculateContractMetrics } from '../utils/storage.ts';

interface ContractsModuleProps {
  contracts: Contract[];
  employees: Employee[];
  onSelectContractToFilter: (contractId: string) => void;
  onSaveContract: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
  onDemandContract: (contract: Contract) => void;
}

export const ContractsModule: React.FC<ContractsModuleProps> = ({
  contracts,
  employees,
  onSelectContractToFilter,
  onSaveContract,
  onDeleteContract,
  onDemandContract,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Contract>>({
    numero: '',
    titulo: '',
    cliente: '',
    unidade: '',
    gestorResponsavel: '',
    emailContato: '',
    telefoneContato: '',
    vigenciaInicio: new Date().toISOString().split('T')[0],
    vigenciaFim: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    limiteBloqueioConformidade: 85,
    status: 'ATIVO',
    observacoes: '',
  });

  const handleOpenNew = () => {
    setEditingContract(null);
    setFormData({
      numero: `CTR-WFS/${Math.floor(10 + Math.random() * 89)}`,
      titulo: '',
      cliente: '',
      unidade: '',
      gestorResponsavel: '',
      emailContato: '',
      telefoneContato: '',
      vigenciaInicio: new Date().toISOString().split('T')[0],
      vigenciaFim: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      limiteBloqueioConformidade: 85,
      status: 'ATIVO',
      observacoes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Contract) => {
    setEditingContract(c);
    setFormData(c);
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero || !formData.titulo || !formData.cliente) {
      alert('Preencha os campos obrigatórios (Número, Título e Cliente).');
      return;
    }

    const saved: Contract = {
      id: editingContract ? editingContract.id : `ctr_${Date.now()}`,
      numero: formData.numero || '',
      titulo: formData.titulo || '',
      cliente: formData.cliente || '',
      unidade: formData.unidade || '',
      gestorResponsavel: formData.gestorResponsavel || 'Gestor Responsável',
      emailContato: formData.emailContato || '',
      telefoneContato: formData.telefoneContato || '',
      vigenciaInicio: formData.vigenciaInicio || '',
      vigenciaFim: formData.vigenciaFim || '',
      status: (formData.status as any) || 'ATIVO',
      limiteBloqueioConformidade: formData.limiteBloqueioConformidade || 85,
      observacoes: formData.observacoes || '',
    };

    onSaveContract(saved);
    setIsFormOpen(false);
  };

  const filteredContracts = contracts.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.numero.toLowerCase().includes(q) ||
      c.titulo.toLowerCase().includes(q) ||
      c.cliente.toLowerCase().includes(q) ||
      c.gestorResponsavel.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#002D62]">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Monitoramento e Gestão de Contratos WFS
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Acompanhe o índice de conformidade global por contrato, previna bloqueios e envie cobranças consolidadas diretamente aos encarregados.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#002D62] hover:bg-[#001f44] shadow-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Novo Contrato</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código do contrato, título ou cliente..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#002D62]"
          />
        </div>
        <span className="text-xs text-slate-500">
          <strong>{filteredContracts.length}</strong> contratos cadastrados
        </span>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredContracts.map((c) => {
          const metrics = calculateContractMetrics(c.id, employees);
          const hasRisk = metrics.temBloqueio || metrics.criticos > 0;

          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden bg-white hover:border-slate-300 shadow-xs flex flex-col justify-between ${
                hasRisk ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Top Card Info */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-md bg-blue-50 text-[#002D62] border border-blue-200">
                      {c.numero}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-tight">
                      {c.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Cliente: <strong className="text-slate-800">{c.cliente}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">{c.unidade}</p>
                  </div>

                  {/* Compliance Score Gauge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold block">CONFORMIDADE</span>
                    <span
                      className={`text-2xl font-black ${
                        metrics.taxaConformidade >= 85
                          ? 'text-emerald-600'
                          : metrics.taxaConformidade >= 60
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {metrics.taxaConformidade}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-4 border border-slate-200/50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      metrics.taxaConformidade >= 85
                        ? 'bg-emerald-500'
                        : metrics.taxaConformidade >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${metrics.taxaConformidade}%` }}
                  />
                </div>

                {/* Metrics Breakdown row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Alocados</span>
                    <span className="text-sm font-bold text-slate-900">{metrics.totalColaboradores}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">100% Em Dia</span>
                    <span className="text-sm font-bold text-emerald-600">{metrics.emDia}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Pendências</span>
                    <span
                      className={`text-sm font-bold ${
                        metrics.comPendencias > 0 ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    >
                      {metrics.comPendencias}
                    </span>
                  </div>
                </div>

                {/* Manager & Contact details */}
                <div className="space-y-1 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Gestor Responsável:</span>
                    <strong className="text-slate-900">{c.gestorResponsavel}</strong>
                  </div>
                  {c.emailContato && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3 h-3 text-[#002D62]" />
                      <span>{c.emailContato}</span>
                    </div>
                  )}
                  {c.telefoneContato && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{c.telefoneContato}</span>
                    </div>
                  )}
                </div>

                {/* Observations / Risk Notice */}
                {c.observacoes && (
                  <p className="text-[11px] text-amber-800 p-2 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                    ⚠️ {c.observacoes}
                  </p>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectContractToFilter(c.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#002D62] bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Ver Colaboradores ({metrics.totalColaboradores})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDemandContract(c)}
                    title="Enviar Cobrança Consolidada ao Gestor"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    title="Editar Contrato"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-[#002D62] hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja excluir o contrato ${c.numero}?`)) {
                        onDeleteContract(c.id);
                      }
                    }}
                    title="Excluir Contrato"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New / Edit Contract */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingContract ? 'Editar Contrato' : 'Cadastrar Novo Contrato'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Número do Contrato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="CTR-WFS/01"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Cliente / Unidade Contratante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Ex: Petrobras REDUC"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Título / Objeto do Contrato *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Ensaios Não Destrutivos & Radioproteção"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Local / Endereço da Unidade
                </label>
                <input
                  type="text"
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  placeholder="Ex: Polo Industrial de Duque de Caxias - RJ"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Gestor Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.gestorResponsavel}
                    onChange={(e) => setFormData({ ...formData, gestorResponsavel: e.target.value })}
                    placeholder="Nome do Encarregado"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    E-mail do Gestor
                  </label>
                  <input
                    type="email"
                    value={formData.emailContato}
                    onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                    placeholder="gestor@wfs.com.br"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefoneContato}
                    onChange={(e) => setFormData({ ...formData, telefoneContato: e.target.value })}
                    placeholder="(21) 98765-4321"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Vigência Início
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaInicio}
                    onChange={(e) => setFormData({ ...formData, vigenciaInicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Vigência Fim
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaFim}
                    onChange={(e) => setFormData({ ...formData, vigenciaFim: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Observações e Exigências Específicas
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Ex: Auditoria mensal de dosímetros e certificação CNEN obrigatória."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#002D62] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-[#002D62] hover:bg-[#001f44] transition-colors cursor-pointer"
                >
                  Salvar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
