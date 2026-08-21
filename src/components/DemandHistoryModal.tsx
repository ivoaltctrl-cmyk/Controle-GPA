import React from 'react';
import {
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Mail,
  FileText,
  Calendar,
  Building2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DemandLog } from '../types/index.ts';

interface DemandHistoryProps {
  logs: DemandLog[];
  onUpdateLogStatus: (logId: string, newStatus: 'ENVIADO' | 'EM_ANDAMENTO' | 'REGULARIZADO' | 'VENCIDO') => void;
  onDeleteLog: (logId: string) => void;
  onOpenNewDemand: () => void;
}

export const DemandHistory: React.FC<DemandHistoryProps> = ({
  logs,
  onUpdateLogStatus,
  onDeleteLog,
  onOpenNewDemand,
}) => {
  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-cyan-400" />;
      case 'chamado':
        return <FileText className="w-4 h-4 text-amber-400" />;
      default:
        return <Send className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleResolve = (logId: string) => {
    onUpdateLogStatus(logId, 'REGULARIZADO');
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Send className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Centro de Demandas & Cobranças aos Responsáveis
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Histórico completo de notificações e prazos acordados com encarregados, gestores de contratos e RHs para regularização documental.
          </p>
        </div>

        <button
          onClick={onOpenNewDemand}
          className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <Send className="w-4 h-4" />
          <span>+ Nova Notificação / Demanda</span>
        </button>
      </div>

      {/* Logs Table / Cards */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
            <Send className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma demanda enviada até o momento.</p>
            <p className="text-xs text-slate-500 mt-1">
              Selecione um funcionário com pendências ou um contrato para disparar avisos de regularização.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const isRegularizado = log.status === 'REGULARIZADO';
            const isVencido = log.status === 'VENCIDO';

            return (
              <div
                key={log.id}
                className={`p-5 rounded-2xl border transition-all bg-slate-900/80 shadow-md ${
                  isRegularizado
                    ? 'border-emerald-500/30'
                    : isVencido
                    ? 'border-rose-500/40'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {getChannelIcon(log.canal)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{log.funcionarioNome}</h3>
                        <span className="text-xs text-slate-400 font-medium">
                          • {log.contratoNome || 'Geral'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isRegularizado
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                              : isVencido
                              ? 'bg-rose-950 text-rose-300 border-rose-600'
                              : 'bg-amber-950 text-amber-300 border-amber-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1">
                        Destinatário: <strong className="text-cyan-400">{log.destinatario}</strong> via {log.canal.toUpperCase()}
                      </p>

                      {/* Pending items charged */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {log.pendenciasCobradas.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-amber-300"
                          >
                            ⚠️ {p}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Enviado em: {log.dataEnvio}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Calendar className="w-3 h-3 text-cyan-400" /> Prazo Limite: {log.prazoResolucao}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {!isRegularizado ? (
                      <button
                        onClick={() => handleResolve(log.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marcar como Regularizado</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Concluído
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collapsible / preview of message */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <details className="text-xs text-slate-400 cursor-pointer">
                    <summary className="font-semibold text-slate-300 hover:text-cyan-400">
                      Visualizar texto da mensagem enviada
                    </summary>
                    <pre className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 whitespace-pre-wrap font-mono">
                      {log.mensagemTexto}
                    </pre>
                  </details>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
