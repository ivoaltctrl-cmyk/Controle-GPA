import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  User,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { BrandConfig } from '../types/index.ts';
import { getStoredAdminCredentials, saveStoredAdminCredentials, setStoredAdminAuthenticated } from '../utils/storage.ts';
import { authenticateAdminOnServer, saveAdminCredentialsToServer } from '../services/backendSyncService.ts';
import { WfsLogo } from './WfsLogo.tsx';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  brand: BrandConfig;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  brand,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const primaryColor = brand?.primaryColor || '#E21B23';
  const companyName = brand?.companyName || 'GPA';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    try {
      // 1. Tenta autenticação direta no servidor central para garantir paridade em tempo real
      const serverAuth = await authenticateAdminOnServer(cleanUser, cleanPass);

      if (serverAuth.success) {
        saveStoredAdminCredentials(cleanUser, cleanPass);
        setStoredAdminAuthenticated(true);
        setIsSubmitting(false);
        onLoginSuccess();
        return;
      }

      // 2. Verificação de contingência local ou senha mestre de recuperação (admin / gpa)
      const localCreds = getStoredAdminCredentials();
      const isLocalMatch = cleanUser.toLowerCase() === localCreds.username.toLowerCase() && cleanPass === localCreds.password;
      const isMasterMatch = (cleanUser.toLowerCase() === 'admin' || cleanUser.toLowerCase() === localCreds.username.toLowerCase()) && cleanPass === 'gpa';

      if (isLocalMatch || isMasterMatch) {
        // Auto-cura do servidor: sincroniza a credencial válida para o backend imediatamente
        try {
          await saveAdminCredentialsToServer(cleanUser, cleanPass);
        } catch (err) {
          console.info('Auto-sincronização de credenciais para o backend:', err);
        }
        saveStoredAdminCredentials(cleanUser, cleanPass);
        setStoredAdminAuthenticated(true);
        setIsSubmitting(false);
        onLoginSuccess();
        return;
      }

      setErrorMsg('Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.');
    } catch {
      // Em caso de falha de rede, valida localmente
      const localCreds = getStoredAdminCredentials();
      if (
        (cleanUser.toLowerCase() === localCreds.username.toLowerCase() && cleanPass === localCreds.password) ||
        (cleanUser.toLowerCase() === 'admin' && cleanPass === 'gpa')
      ) {
        setStoredAdminAuthenticated(true);
        setIsSubmitting(false);
        onLoginSuccess();
        return;
      }
      setErrorMsg('Usuário ou senha incorretos. Tente novamente ou use a recuperação de acesso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToDefault = async () => {
    setErrorMsg('');
    setUsername('admin');
    setPassword('gpa');
    setIsSubmitting(true);
    try {
      saveStoredAdminCredentials('admin', 'gpa');
      await saveAdminCredentialsToServer('admin', 'gpa');
      setInfoMsg('Credenciais redefinidas para o padrão: Usuário "admin" e Senha "gpa". Clique em Entrar.');
    } catch {
      setInfoMsg('Credenciais locais redefinidas para "admin" / "gpa".');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Decorator */}
        <div
          style={{ backgroundColor: primaryColor }}
          className="p-6 text-white text-center relative overflow-hidden flex flex-col items-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="bg-white px-4 py-2 rounded-2xl shadow-md mb-3 inline-flex items-center justify-center">
            <WfsLogo brand={brand} size="md" showSubtitle={false} />
          </div>

          <h2 className="text-xl font-black tracking-tight">Área Administrativa</h2>
          <p className="text-xs text-white/90 mt-1 max-w-xs mx-auto">
            Acesso restrito para gestão completa de contratos, auditoria, OCR e configurações {companyName}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                <div className="mt-1.5 pt-1.5 border-t border-rose-200/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="text-[11px] font-bold text-rose-900 underline hover:text-rose-700 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restaurar acesso padrão (admin / gpa)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Usuário Administrador</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Senha de Acesso</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver senha</span>
                  </>
                )}
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando Acesso...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar no Painel Administrativo</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Voltar ao Portal do Demandado
            </button>
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Acesso padrão: Usuário <strong className="text-slate-600">admin</strong> / Senha <strong className="text-slate-600">gpa</strong>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
