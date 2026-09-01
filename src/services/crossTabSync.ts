/**
 * Cross-Tab Realtime Synchronization Service
 * Permite que qualquer alteração realizada em uma aba seja refletida
 * instantaneamente (0ms) em todas as outras abas abertas no navegador,
 * sem necessidade de recarregar ou clicar em botões.
 */

type SyncEventType =
  | 'EMPLOYEES_UPDATED'
  | 'CONTRACTS_UPDATED'
  | 'AREAS_UPDATED'
  | 'TRABALHISTAS_UPDATED'
  | 'DEMAND_LOGS_UPDATED'
  | 'BRAND_UPDATED'
  | 'RESUMO_CONFIG_UPDATED'
  | 'ADMIN_CREDENTIALS_UPDATED'
  | 'ALL_DATA_UPDATED';

export interface CrossTabMessage {
  type: SyncEventType;
  payload: any;
  timestamp: string;
  senderTabId: string;
}

const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('cadim_portal_sync_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel não disponível:', e);
}

// Registro de callbacks
type ListenerCallback = (message: CrossTabMessage) => void;
const listeners = new Set<ListenerCallback>();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event: MessageEvent<CrossTabMessage>) => {
    if (event.data && event.data.senderTabId !== TAB_ID) {
      listeners.forEach((callback) => {
        try {
          callback(event.data);
        } catch (err) {
          console.error('Erro no listener de cross-tab sync:', err);
        }
      });
    }
  };
}

/**
 * Inscreve um ouvinte para receber atualizações de outras abas
 */
export function subscribeCrossTabSync(callback: ListenerCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notifica todas as outras abas sobre uma atualização
 */
export function notifyOtherTabs(type: SyncEventType, payload: any): void {
  const message: CrossTabMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    senderTabId: TAB_ID,
  };

  // 1. Envia via BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (e) {
      console.warn('Erro ao postar mensagem no BroadcastChannel:', e);
    }
  }

  // 2. Dispara CustomEvent local
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('cadim_local_sync', {
          detail: message,
        })
      );
    } catch {}
  }
}
