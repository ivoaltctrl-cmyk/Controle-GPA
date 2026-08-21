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
      numero: `CTR-2026/${Math.floor(10 + Math.random() * 89)}`,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Monitoramento e Gestão de Contratos (Passo 2)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Acompanhe o índice de conformidade global de cada contrato, identifique riscos de paralisação e envie cobranças consolidadas diretamente aos encarregados.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
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
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <span className="text-xs text-slate-400">
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
              className={`rounded-2xl border p-5 transition-all relative overflow-hidden bg-slate-900/80 hover:border-slate-700 shadow-lg flex flex-col justify-between ${
                hasRisk ? 'border-amber-500/40' : 'border-slate-800'
              }`}
            >
              {/* Top Card Info */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-extrabold px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                      {c.numero}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2 leading-tight">
                      {c.titulo}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Cliente: <strong className="text-white">{c.cliente}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">{c.unidade}</p>
                  </div>

                  {/* Compliance Score Gauge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold block">CONFORMIDADE</span>
                    <span
                      className={`text-2xl font-black ${
                        metrics.taxaConformidade >= 85
                          ? 'text-emerald-400'
                          : metrics.taxaConformidade >= 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {metrics.taxaConformidade}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all duration-500 ${
                      metrics.taxaConformidade >= 85
                        ? 'bg-emerald-400'
                        : metrics.taxaConformidade >= 60
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${metrics.taxaConformidade}%` }}
                  />
                </div>

                {/* Metrics Breakdown row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Alocados</span>
                    <span className="text-sm font-bold text-white">{metrics.totalColaboradores}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">100% Em Dia</span>
                    <span className="text-sm font-bold text-emerald-400">{metrics.emDia}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Pendências</span>
                    <span
                      className={`text-sm font-bold ${
                        metrics.comPendencias > 0 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {metrics.comPendencias}
                    </span>
                  </div>
                </div>

                {/* Manager & Contact details */}
                <div className="space-y-1 text-xs text-slate-300 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Gestor Responsável:</span>
                    <strong className="text-white">{c.gestorResponsavel}</strong>
                  </div>
                  {c.emailContato && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>{c.emailContato}</span>
                    </div>
                  )}
                  {c.telefoneContato && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{c.telefoneContato}</span>
                    </div>
                  )}
                </div>

                {/* Observations / Risk Notice */}
                {c.observacoes && (
                  <p className="text-[11px] text-amber-300/80 p-2 rounded-lg bg-amber-950/20 border border-amber-800/30 mb-4">
                    ⚠️ {c.observacoes}
                  </p>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectContractToFilter(c.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Ver Colaboradores ({metrics.totalColaboradores})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDemandContract(c)}
                    title="Enviar Cobrança Consolidada ao Gestor"
                    className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    title="Editar Contrato"
                    className="p-1.5 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
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
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingContract ? 'Editar Contrato' : 'Cadastrar Novo Contrato'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Número do Contrato *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="CTR-2026/01"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Cliente / Unidade Contratante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    placeholder="Ex: Petrobras REDUC"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Título / Objeto do Contrato *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Ensaios Não Destrutivos & Radioproteção"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Local / Endereço da Unidade
                </label>
                <input
                  type="text"
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  placeholder="Ex: Polo Industrial de Duque de Caxias - RJ"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Gestor Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.gestorResponsavel}
                    onChange={(e) => setFormData({ ...formData, gestorResponsavel: e.target.value })}
                    placeholder="Nome do Encarregado"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    E-mail do Gestor
                  </label>
                  <input
                    type="email"
                    value={formData.emailContato}
                    onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                    placeholder="gestor@empresa.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefoneContato}
                    onChange={(e) => setFormData({ ...formData, telefoneContato: e.target.value })}
                    placeholder="(21) 98765-4321"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Vigência Início
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaInicio}
                    onChange={(e) => setFormData({ ...formData, vigenciaInicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Vigência Fim
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaFim}
                    onChange={(e) => setFormData({ ...formData, vigenciaFim: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Observações e Exigências Específicas do Contrato
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Ex: Auditoria mensal de dosímetros e certificação CNEN obrigatória."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors cursor-pointer"
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
