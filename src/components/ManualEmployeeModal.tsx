import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  HeartPulse,
  HardHat,
  Radio,
} from 'lucide-react';
import { Employee, Contract, DocType, DocStatus, PendingDoc } from '../types/index.ts';
import { recalculateEmployeeStatus } from '../utils/storage.ts';

interface ManualEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEmployee: (employee: Employee) => void;
  editingEmployee?: Employee | null;
  contracts: Contract[];
}

export const ManualEmployeeModal: React.FC<ManualEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSaveEmployee,
  editingEmployee,
  contracts,
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    nome: '',
    matricula: '',
    cpf: '',
    cargo: '',
    setor: '',
    empresa: '',
    contratoId: '',
    contratoNome: '',
    resumoGeral: '',
  });

  const [osStatus, setOsStatus] = useState<DocStatus>('EM_DIA');
  const [asoStatus, setAsoStatus] = useState<DocStatus>('EM_DIA');
  const [epiStatus, setEpiStatus] = useState<DocStatus>('EM_DIA');
  const [radioStatus, setRadioStatus] = useState<DocStatus>('NAO_APLICAVEL');

  useEffect(() => {
    if (!isOpen) return;

    if (editingEmployee) {
      setFormData(editingEmployee);
      const os = editingEmployee.pendencias.find((p) => p.tipo === 'ORDEM_DE_SERVICO');
      const aso = editingEmployee.pendencias.find((p) => p.tipo === 'ATESTADO_SAUDE_OCUPACIONAL');
      const epi = editingEmployee.pendencias.find((p) => p.tipo === 'FICHA_EPI');
      const radio = editingEmployee.pendencias.find((p) => p.tipo === 'TREINAMENTO_RADIOPROTECAO');

      if (os) setOsStatus(os.status);
      if (aso) setAsoStatus(aso.status);
      if (epi) setEpiStatus(epi.status);
      if (radio) setRadioStatus(radio.status);
    } else {
      setFormData({
        nome: '',
        matricula: `MAT-${Math.floor(10000 + Math.random() * 90000)}`,
        cpf: '',
        cargo: '',
        setor: '',
        empresa: '',
        contratoId: contracts[0]?.id || '',
        contratoNome: contracts[0] ? `${contracts[0].numero} - ${contracts[0].titulo}` : '',
        resumoGeral: '',
      });
      setOsStatus('EM_DIA');
      setAsoStatus('EM_DIA');
      setEpiStatus('EM_DIA');
      setRadioStatus('NAO_APLICAVEL');
    }
  }, [isOpen, editingEmployee, contracts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.matricula || !formData.cargo) {
      alert('Por favor preencha os campos obrigatórios (Nome, Matrícula e Cargo).');
      return;
    }

    const matchedContract = contracts.find((c) => c.id === formData.contratoId);

    const pendencias: PendingDoc[] = [
      {
        id: `p_man_os_${Date.now()}`,
        tipo: 'ORDEM_DE_SERVICO',
        nomeDocumento: 'Ordem de Serviço de SST (NR-01)',
        status: osStatus,
        obrigatorio: true,
        ultimaAtualizacao: new Date().toISOString().split('T')[0],
      },
      {
        id: `p_man_aso_${Date.now()}`,
        tipo: 'ATESTADO_SAUDE_OCUPACIONAL',
        nomeDocumento: 'Atestado de Saúde Ocupacional - ASO (NR-07)',
        status: asoStatus,
        obrigatorio: true,
        ultimaAtualizacao: new Date().toISOString().split('T')[0],
      },
      {
        id: `p_man_epi_${Date.now()}`,
        tipo: 'FICHA_EPI',
        nomeDocumento: 'Ficha de Distribuição e Controle de EPI (NR-06)',
        status: epiStatus,
        obrigatorio: true,
        ultimaAtualizacao: new Date().toISOString().split('T')[0],
      },
      {
        id: `p_man_rad_${Date.now()}`,
        tipo: 'TREINAMENTO_RADIOPROTECAO',
        nomeDocumento: 'Certificado de Treinamento de Radioproteção (CNEN)',
        status: radioStatus,
        obrigatorio: radioStatus !== 'NAO_APLICAVEL',
        ultimaAtualizacao: new Date().toISOString().split('T')[0],
      },
    ];

    const rawEmployee: Partial<Employee> = {
      id: editingEmployee ? editingEmployee.id : `emp_man_${Date.now()}`,
      nome: formData.nome || '',
      matricula: formData.matricula || '',
      cpf: formData.cpf || '',
      cargo: formData.cargo || '',
      setor: formData.setor || 'Operações',
      empresa: formData.empresa || 'Empresa Prestadora',
      contratoId: formData.contratoId,
      contratoNome: matchedContract ? `${matchedContract.numero} - ${matchedContract.titulo}` : formData.contratoNome,
      pendencias,
      dataCadastro: editingEmployee ? editingEmployee.dataCadastro : new Date().toISOString().split('T')[0],
      dataUltimaLeitura: new Date().toISOString().split('T')[0],
      resumoGeral: formData.resumoGeral || '',
      imagemOrigemUrl: editingEmployee?.imagemOrigemUrl,
    };

    const calculated = recalculateEmployeeStatus(rawEmployee);
    const saved: Employee = {
      ...(rawEmployee as Employee),
      indicadorPercentual: calculated.indicadorPercentual,
      statusGeral: calculated.statusGeral,
    };

    onSaveEmployee(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600 text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {editingEmployee ? 'Editar Dados do Colaborador' : 'Cadastro Manual de Colaborador'}
              </h2>
              <p className="text-xs text-slate-400">
                Preencha os dados e defina a situação dos documentos de SST.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: João da Silva Santos"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Matrícula / ID *</label>
              <input
                type="text"
                required
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                placeholder="Ex: RAD-99201"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">CPF</label>
              <input
                type="text"
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Cargo / Função *</label>
              <input
                type="text"
                required
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Técnico em Radiologia"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Setor / Área</label>
              <input
                type="text"
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                placeholder="Ex: Ensaios Não Destrutivos"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Empresa / Prestadora</label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                placeholder="Ex: GamaTech Inspeções Ltda."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Contrato Vinculado</label>
              <select
                value={formData.contratoId || ''}
                onChange={(e) => setFormData({ ...formData, contratoId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">-- Selecione o Contrato --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} - {c.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Core Pillars Status Configuration */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Status dos 4 Documentos Principais de SST:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pillar 1: OS */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  1. Ordem de Serviço (NR-01)
                </label>
                <select
                  value={osStatus}
                  onChange={(e) => setOsStatus(e.target.value as DocStatus)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-semibold"
                >
                  <option value="EM_DIA">✅ Em Dia</option>
                  <option value="PENDENTE">⚠️ Pendente</option>
                  <option value="VENCIDO">❌ Vencido</option>
                </select>
              </div>

              {/* Pillar 2: ASO */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
                  2. ASO Ocupacional (NR-07)
                </label>
                <select
                  value={asoStatus}
                  onChange={(e) => setAsoStatus(e.target.value as DocStatus)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-semibold"
                >
                  <option value="EM_DIA">✅ Em Dia</option>
                  <option value="PENDENTE">⚠️ Pendente</option>
                  <option value="VENCIDO">❌ Vencido</option>
                </select>
              </div>

              {/* Pillar 3: EPI */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-pink-400" />
                  3. Ficha de EPI (NR-06)
                </label>
                <select
                  value={epiStatus}
                  onChange={(e) => setEpiStatus(e.target.value as DocStatus)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-semibold"
                >
                  <option value="EM_DIA">✅ Em Dia</option>
                  <option value="PENDENTE">⚠️ Pendente</option>
                  <option value="VENCIDO">❌ Vencido</option>
                </select>
              </div>

              {/* Pillar 4: Radioproteção */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  4. Radioproteção (CNEN)
                </label>
                <select
                  value={radioStatus}
                  onChange={(e) => setRadioStatus(e.target.value as DocStatus)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-semibold"
                >
                  <option value="EM_DIA">✅ Em Dia</option>
                  <option value="PENDENTE">⚠️ Pendente</option>
                  <option value="VENCIDO">❌ Vencido</option>
                  <option value="NAO_APLICAVEL">⚪ Não Aplicável</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              value={formData.resumoGeral || ''}
              onChange={(e) => setFormData({ ...formData, resumoGeral: e.target.value })}
              placeholder="Anotações gerais sobre o colaborador..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors cursor-pointer"
            >
              Salvar Colaborador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
