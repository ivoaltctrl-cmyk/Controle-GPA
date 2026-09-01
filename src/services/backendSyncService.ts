/**
 * Backend Data Sync Service
 * Sincroniza todas as alterações do frontend (colaboradores, contratos, trabalhistas, áreas, etc)
 * diretamente com o backend do servidor Node/Express para persistência centralizada.
 */

import { Employee, Contract, AreaResponsavel, TrabalhistaEnvio, DemandLog, BrandConfig } from '../types/index.ts';

export interface ServerSyncData {
  employees?: Employee[];
  contracts?: Contract[];
  areas?: AreaResponsavel[];
  trabalhistas?: TrabalhistaEnvio[];
  demandLogs?: DemandLog[];
  brandConfig?: BrandConfig;
  adminCredentials?: {
    username: string;
    password: string;
    lastUpdated?: string;
  };
  resumoConfig?: {
    validos: number;
    pendentes: number;
    lastUpdated?: string;
  };
}

export async function fetchAllDataFromServer(): Promise<{
  employees?: Employee[];
  contracts?: Contract[];
  areas?: AreaResponsavel[];
  trabalhistas?: TrabalhistaEnvio[];
  demandLogs?: DemandLog[];
  brandConfig?: BrandConfig;
  adminCredentials?: {
    username: string;
    password: string;
    lastUpdated?: string;
  };
  resumoConfig?: {
    validos: number;
    pendentes: number;
    lastUpdated?: string;
  };
  lastUpdated?: string;
} | null> {
  try {
    const res = await fetch('/api/data', {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (e) {
    console.info('Backend fetch skipped (offline or initial):', e);
    return null;
  }
}

export async function syncDataToBackend(payload: ServerSyncData): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn('Falha ao sincronizar com backend:', e);
    return false;
  }
}

export async function syncCollectionToBackend(collectionName: string, data: any): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/${collectionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    return res.ok;
  } catch (e) {
    console.warn(`Falha ao sincronizar coleção ${collectionName} com backend:`, e);
    return false;
  }
}

export async function authenticateAdminOnServer(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Usuário ou senha incorretos.' };
  } catch (e: any) {
    console.warn('Erro ao autenticar com o servidor:', e);
    return { success: false, error: 'Falha de conexão com o servidor.' };
  }
}

export async function saveAdminCredentialsToServer(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Erro ao salvar credenciais no servidor.' };
  } catch (e: any) {
    console.warn('Erro ao atualizar credenciais no servidor:', e);
    return { success: false, error: 'Falha de conexão com o servidor.' };
  }
}

export async function checkBackendHealth(): Promise<{
  status: string;
  backend?: string;
  counts?: {
    employees: number;
    contracts: number;
    areas: number;
    trabalhistas: number;
    demandLogs: number;
  };
  lastUpdated?: string;
} | null> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.info('Backend health check skipped:', e);
    return null;
  }
}


