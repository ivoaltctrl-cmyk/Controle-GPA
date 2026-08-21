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
import { WfsLogo } from './WfsLogo.tsx';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#002D62] text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Relatório Executivo de Auditoria & Conformidade SST
              </h2>
              <p className="text-xs text-slate-500">
                Documento formal para emissão, assinatura e apresentação à gerência ou fiscalização.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#002D62] hover:bg-[#001f44] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-800 print:text-black print:p-0 print:space-y-4 bg-white">
          {/* Report Document Header */}
          <div className="border-b-2 border-slate-200 pb-4 print:border-black flex items-start justify-between">
            <div>
              <div className="mb-2">
                <WfsLogo size="lg" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 print:text-black">
                RELATÓRIO DE CONFORMIDADE E AUDITORIA DE SST
              </h1>
              <p className="text-xs text-slate-500 print:text-gray-600 mt-0.5">
                Controle de Ordem de Serviço (NR-01), ASO (NR-07), Ficha de EPI (NR-06) e Radioproteção (CNEN)
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 print:text-gray-600">
              <p>Data de Emissão: <strong className="text-slate-800">{todayFormatted}</strong></p>
              <p>Emissor: Coordenação Geral de SST / Terceiros</p>
            </div>
          </div>

          {/* KPI Dashboard Summary */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-600 block">
                Total Funcionários
              </span>
              <span className="text-xl font-black text-slate-900 print:text-black">
                {stats.totalFuncionarios}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-600 block">
                100% Em Dia
              </span>
              <span className="text-xl font-black text-emerald-600 print:text-green-700">
                {stats.totalEmDia}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-600 block">
                Com Pendência
              </span>
              <span className="text-xl font-black text-amber-600 print:text-amber-700">
                {stats.totalComPendencia}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 print:bg-gray-100 print:border-gray-300">
              <span className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-600 block">
                Taxa Geral
              </span>
              <span className="text-xl font-black text-[#002D62] print:text-black">
                {stats.taxaConformidadeGeral}%
              </span>
            </div>
          </div>

          {/* 4 Pillars Summary Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 print:text-gray-800 mb-2">
              Índice por Norma e Exigência Legal de SST:
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-200 print:border-gray-300">
              <thead>
                <tr className="bg-slate-100 print:bg-gray-200 text-slate-800 print:text-black font-bold">
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-left">Documento / Treinamento</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-center">Em Dia</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-center">Pendentes</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-center">Vencidos</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-center">Conformidade (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 print:border-gray-300 p-2 font-semibold">Ordem de Serviço (NR-01)</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-emerald-700 font-bold">{stats.ordemServico.emDia}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-amber-700 font-medium">{stats.ordemServico.pendente}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-rose-700 font-bold">{stats.ordemServico.vencido}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center font-black">{stats.ordemServico.taxa}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 print:border-gray-300 p-2 font-semibold">ASO - Saúde Ocupacional (NR-07)</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-emerald-700 font-bold">{stats.aso.emDia}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-amber-700 font-medium">{stats.aso.pendente}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-rose-700 font-bold">{stats.aso.vencido}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center font-black">{stats.aso.taxa}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 print:border-gray-300 p-2 font-semibold">Ficha de Distribuição de EPI (NR-06)</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-emerald-700 font-bold">{stats.fichaEpi.emDia}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-amber-700 font-medium">{stats.fichaEpi.pendente}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-rose-700 font-bold">{stats.fichaEpi.vencido}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center font-black">{stats.fichaEpi.taxa}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 print:border-gray-300 p-2 font-semibold">Treinamento de Radioproteção (CNEN / NR-32)</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-emerald-700 font-bold">{stats.radioprotecao.emDia}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-amber-700 font-medium">{stats.radioprotecao.pendente}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center text-rose-700 font-bold">{stats.radioprotecao.vencido}</td>
                  <td className="border border-slate-200 print:border-gray-300 p-2 text-center font-black">{stats.radioprotecao.taxa}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* List of Non-Conformities & Critical Employees */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 print:text-gray-800 mb-2">
              Quadro Geral de Colaboradores e Pendências Ativas:
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-200 print:border-gray-300">
              <thead>
                <tr className="bg-slate-100 print:bg-gray-200 text-slate-800 print:text-black font-bold text-[11px]">
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-left">Colaborador / Matrícula</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-left">Cargo / Função</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-left">Contrato</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-center">Status</th>
                  <th className="border border-slate-200 print:border-gray-300 p-2 text-left">Pendências Detectadas</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const pendingDocs = emp.pendencias.filter((p) => p.status !== 'EM_DIA' && p.status !== 'NAO_APLICAVEL');

                  return (
                    <tr key={emp.id} className="border-b border-slate-200 print:border-gray-300">
                      <td className="p-2 border border-slate-200 print:border-gray-300 font-bold">
                        {emp.nome} <span className="font-normal text-slate-500 print:text-gray-600 block text-[10px]">{emp.matricula}</span>
                      </td>
                      <td className="p-2 border border-slate-200 print:border-gray-300">{emp.cargo}</td>
                      <td className="p-2 border border-slate-200 print:border-gray-300">{emp.contratoNome || 'Geral'}</td>
                      <td className="p-2 border border-slate-200 print:border-gray-300 text-center font-bold">
                        {emp.statusGeral} ({emp.indicadorPercentual}%)
                      </td>
                      <td className="p-2 border border-slate-200 print:border-gray-300 text-[11px]">
                        {pendingDocs.length === 0 ? (
                          <span className="text-emerald-600 print:text-green-700 font-bold">100% Em Dia</span>
                        ) : (
                          pendingDocs.map((d, i) => (
                            <div key={i} className="text-amber-800 print:text-amber-800">
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
          <div className="pt-8 border-t border-slate-200 print:border-black grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 print:border-black mb-2 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-900 print:text-black">Responsável Técnico / SESMT WFS</p>
              <p className="text-slate-500 print:text-gray-600 text-[10px]">Engenharia / Técnico de Segurança do Trabalho</p>
            </div>
            <div>
              <div className="border-b border-slate-400 print:border-black mb-2 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-900 print:text-black">Gestor do Contrato / Unidade</p>
              <p className="text-slate-500 print:text-gray-600 text-[10px]">Recebido e Ciente dos Prazos</p>
            </div>
          </div>
        </div>

        {/* Footer (hidden in print) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Baixar Excel (.xlsx)</span>
            </button>
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar CSV</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
