import { BrandConfig, ThemePaletteId } from '../types/index.ts';

export interface PalettePreset {
  id: ThemePaletteId;
  name: string;
  category: string;
  description: string;
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
  accentTextColor: string;
  previewBg: string;
}

export const THEME_PALETTES: PalettePreset[] = [
  {
    id: 'industrial-amber',
    name: 'Grafite & Âmbar Industrial',
    category: 'Indústria & Engenharia',
    description: 'Tons neutros de grafite escuro com destaque âmbar dourado de alta legibilidade.',
    primaryColor: '#1e293b', // slate-800
    primaryHoverColor: '#0f172a', // slate-900
    accentColor: '#f59e0b', // amber-500
    accentTextColor: '#0f172a',
    previewBg: 'from-slate-800 to-amber-500',
  },
  {
    id: 'safety-orange',
    name: 'Carvão & Laranja Segurança SST',
    category: 'Segurança do Trabalho (NRs)',
    description: 'Preto carvão com laranja sinalizador padrão normas de segurança e EPI.',
    primaryColor: '#18181b', // zinc-900
    primaryHoverColor: '#09090b', // zinc-950
    accentColor: '#ea580c', // orange-600
    accentTextColor: '#ffffff',
    previewBg: 'from-zinc-900 to-orange-600',
  },
  {
    id: 'hse-emerald',
    name: 'Grafite & Verde Esmeralda HSE',
    category: 'Saúde & Meio Ambiente',
    description: 'Combinação clássica de conformidade, saúde ocupacional e sustentabilidade.',
    primaryColor: '#0f172a', // slate-900
    primaryHoverColor: '#020617', // slate-950
    accentColor: '#059669', // emerald-600
    accentTextColor: '#ffffff',
    previewBg: 'from-slate-900 to-emerald-600',
  },
  {
    id: 'corporate-red',
    name: 'Bordô & Vermelho Corporativo',
    category: 'Corporativo & Auditoria',
    description: 'Elegante tom bordô escuro com acentos em carmim para inspeções rigorosas.',
    primaryColor: '#881337', // rose-900
    primaryHoverColor: '#4c0519', // rose-950
    accentColor: '#e11d48', // rose-600
    accentTextColor: '#ffffff',
    previewBg: 'from-rose-900 to-rose-600',
  },
  {
    id: 'neutral-graphite',
    name: 'Neutro Minimalista (Preto & Branco)',
    category: 'Minimalista & Técnico',
    description: 'Design sóbrio e técnico em tons de preto, grafite e cinza suave.',
    primaryColor: '#09090b', // zinc-950
    primaryHoverColor: '#18181b', // zinc-900
    accentColor: '#52525b', // zinc-600
    accentTextColor: '#ffffff',
    previewBg: 'from-zinc-950 to-zinc-600',
  },
  {
    id: 'wfs-navy',
    name: 'Azul Marinho & Ciano',
    category: 'Institucional',
    description: 'Azul marinho clássico corporativo.',
    primaryColor: '#002D62',
    primaryHoverColor: '#001f44',
    accentColor: '#00A3E0',
    accentTextColor: '#ffffff',
    previewBg: 'from-[#002D62] to-[#00A3E0]',
  },
];

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  companyName: 'WFS',
  companySubtitle: 'Gestão de SST, Conformidade & Contratos',
  badgeText: 'SST & Compliance',
  logoType: 'styled_wfs',
  paletteId: 'industrial-amber',
  primaryColor: '#1e293b',
  primaryHoverColor: '#0f172a',
  accentColor: '#f59e0b',
  accentTextColor: '#0f172a',
};

/**
 * Injects CSS variables onto document root so styles can reference var(--brand-primary), etc.
 */
export function applyBrandThemeToCss(brand: BrandConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand.primaryColor);
  root.style.setProperty('--brand-primary-hover', brand.primaryHoverColor);
  root.style.setProperty('--brand-accent', brand.accentColor);
  root.style.setProperty('--brand-accent-text', brand.accentTextColor);
}
