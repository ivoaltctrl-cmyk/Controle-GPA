import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React lifecycle:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Falha ao carregar a interface
              </h2>
              <p className="text-xs text-slate-400">
                Ocorreu uma inconsistência temporária de dados no navegador. Você pode recarregar ou restaurar o cache local.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-xl text-left font-mono text-[11px] text-rose-300 border border-slate-700/50 break-words max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-900/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Padrões</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
