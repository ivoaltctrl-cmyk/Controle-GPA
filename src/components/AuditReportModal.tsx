import React from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
} from 'lucide-react';
import { Employee, Contract, SystemStats } from '../types/index.ts';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  contracts: Contract[];
  stats: SystemStats;
  onExportExcel: () => void;
  onExportCsv: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  employees,
  contracts,
  stats,
  onExportExcel,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Relatório Executivo de Auditoria & Conformidade SST
              </h2>
              <p className="text-xs text-slate-400">
                Documento formal para emissão, assinatura e apresentação à gerência ou fiscalização.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-200 print:text-black print:p-0 print:space-y-4">
          {/* Report Document Header */}
          <div className="border-b border-slate-700 pb-4 print:border-black flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-cyan-400 print:text-black" />
                <h1 className="text-xl font-bold tracking-tight text-white print:text-black">
                  RELATÓRIO DE CONFORMIDADE E AUDITORIA DE SST
                </h1>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                Controle de Ordem de Serviço, ASO, Ficha de EPI e Treinamento de Radioproteção
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-gray-600">
              <p>Data de Emissão: <strong>{todayFormatted}</strong></p>
              <p>Emissor: Coordenação Geral de SST / Terceiros</p>
            </div>
          </div>

          {/* KPI Dashboard Summary */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 block">
                Total Funcionários
              </span>
              <span className="text-xl font-bold text-white print:text-black">
                {stats.totalFuncionarios}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 block">
                100% Em Dia
              </span>
              <span className="text-xl font-bold text-emerald-400 print:text-green-700">
                {stats.totalEmDia}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 block">
                Com Pendência
              </span>
              <span className="text-xl font-bold text-amber-400 print:text-amber-700">
                {stats.totalComPendencia}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600 block">
                Taxa Geral
              </span>
              <span className="text-xl font-bold text-cyan-400 print:text-black">
                {stats.taxaConformidadeGeral}%
              </span>
            </div>
          </div>

          {/* 4 Pillars Summary Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-800 mb-2">
              Índice por Norma e Exigência Legal de SST:
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-800 print:border-gray-300">
              <thead>
                <tr className="bg-slate-950 print:bg-gray-200 text-slate-300 print:text-black font-bold">
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-left">Documento / Treinamento</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-center">Em Dia</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-center">Pendentes</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-center">Vencidos</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-center">Conformidade (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-800 print:border-gray-300 p-2 font-semibold">Ordem de Serviço (NR-01)</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.ordemServico.emDia}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.ordemServico.pendente}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.ordemServico.vencido}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center font-bold">{stats.ordemServico.taxa}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 print:border-gray-300 p-2 font-semibold">ASO - Saúde Ocupacional (NR-07)</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.aso.emDia}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.aso.pendente}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.aso.vencido}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center font-bold">{stats.aso.taxa}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 print:border-gray-300 p-2 font-semibold">Ficha de Distribuição de EPI (NR-06)</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.fichaEpi.emDia}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.fichaEpi.pendente}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.fichaEpi.vencido}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center font-bold">{stats.fichaEpi.taxa}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-800 print:border-gray-300 p-2 font-semibold">Treinamento de Radioproteção (CNEN / NR-32)</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.radioprotecao.emDia}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.radioprotecao.pendente}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center">{stats.radioprotecao.vencido}</td>
                  <td className="border border-slate-800 print:border-gray-300 p-2 text-center font-bold">{stats.radioprotecao.taxa}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* List of Non-Conformities & Critical Employees */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-800 mb-2">
              Quadro Geral de Colaboradores e Pendências Ativas:
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-800 print:border-gray-300">
              <thead>
                <tr className="bg-slate-950 print:bg-gray-200 text-slate-300 print:text-black font-bold text-[11px]">
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-left">Colaborador / Matrícula</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-left">Cargo / Função</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-left">Contrato</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-center">Status</th>
                  <th className="border border-slate-800 print:border-gray-300 p-2 text-left">Pendências Detectadas</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const pendingDocs = emp.pendencias.filter((p) => p.status !== 'EM_DIA' && p.status !== 'NAO_APLICAVEL');

                  return (
                    <tr key={emp.id} className="border-b border-slate-800 print:border-gray-300">
                      <td className="p-2 border border-slate-800 print:border-gray-300 font-bold">
                        {emp.nome} <span className="font-normal text-slate-400 print:text-gray-600 block text-[10px]">{emp.matricula}</span>
                      </td>
                      <td className="p-2 border border-slate-800 print:border-gray-300">{emp.cargo}</td>
                      <td className="p-2 border border-slate-800 print:border-gray-300">{emp.contratoNome || 'Geral'}</td>
                      <td className="p-2 border border-slate-800 print:border-gray-300 text-center font-bold">
                        {emp.statusGeral} ({emp.indicadorPercentual}%)
                      </td>
                      <td className="p-2 border border-slate-800 print:border-gray-300 text-[11px]">
                        {pendingDocs.length === 0 ? (
                          <span className="text-emerald-400 print:text-green-700 font-semibold">100% Em Dia</span>
                        ) : (
                          pendingDocs.map((d, i) => (
                            <div key={i} className="text-amber-300 print:text-amber-800">
                              • {d.nomeDocumento} ({d.status})
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures section */}
          <div className="pt-8 border-t border-slate-800 print:border-black grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-600 print:border-black mb-2 w-3/4 mx-auto"></div>
              <p className="font-bold text-white print:text-black">Responsável Técnico / SESMT</p>
              <p className="text-slate-400 print:text-gray-600 text-[10px]">Engenheiro / Técnico de Segurança do Trabalho</p>
            </div>
            <div>
              <div className="border-b border-slate-600 print:border-black mb-2 w-3/4 mx-auto"></div>
              <p className="font-bold text-white print:text-black">Gestor do Contrato / Unidade</p>
              <p className="text-slate-400 print:text-gray-600 text-[10px]">Recebido e Ciente dos Prazos</p>
            </div>
          </div>
        </div>

        {/* Footer (hidden in print) */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar CSV</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
