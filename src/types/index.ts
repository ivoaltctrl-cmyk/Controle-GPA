export type ThemePaletteId =
  | 'industrial-amber'
  | 'safety-orange'
  | 'hse-emerald'
  | 'corporate-red'
  | 'neutral-graphite'
  | 'wfs-navy'
  | 'custom';

export interface BrandConfig {
  companyName: string;
  companySubtitle: string;
  badgeText: string;
  logoType: 'custom_image' | 'styled_wfs' | 'initials_badge' | 'text_only';
  customLogoUrl?: string;
  paletteId: ThemePaletteId;
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
  accentTextColor: string;
}

export type DocType =
  | 'ORDEM_DE_SERVICO'
  | 'ATESTADO_SAUDE_OCUPACIONAL'
  | 'FICHA_EPI'
  | 'TREINAMENTO_RADIOPROTECAO'
  | 'OUTRO';

export type DocStatus =
  | 'EM_DIA'
  | 'PENDENTE'
  | 'VENCIDO'
  | 'EM_ANALISE'
  | 'NAO_APLICAVEL';

export type EmployeeStatus = 'EM_DIA' | 'PENDENTE' | 'CRITICO' | 'BLOQUEADO';

export interface PendingDoc {
  id: string;
  tipo: DocType;
  nomeDocumento: string;
  status: DocStatus;
  dataEmissao?: string;
  dataVencimento?: string;
  diasRestantes?: number;
  observacoes?: string;
  obrigatorio: boolean;
  ultimaAtualizacao?: string;
}

export interface Employee {
  id: string;
  nome: string;
  matricula: string;
  cpf?: string;
  cargo: string;
  setor: string;
  empresa: string;
  contratoId?: string;
  contratoNome?: string;
  statusGeral: EmployeeStatus;
  indicadorPercentual: number; // 0 to 100
  resumoGeral?: string;
  pendencias: PendingDoc[];
  dataCadastro: string;
  dataUltimaLeitura: string;
  imagemOrigemUrl?: string;
}

export interface Contract {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  unidade: string;
  gestorResponsavel: string;
  emailContato?: string;
  telefoneContato?: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: 'ATIVO' | 'ALERTA' | 'BLOQUEADO' | 'ENCERRADO';
  limiteBloqueioConformidade: number; // e.g. 80%
  observacoes?: string;
}

export interface DemandLog {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  contratoId?: string;
  contratoNome?: string;
  canal: 'whatsapp' | 'email' | 'chamado';
  destinatario: string;
  dataEnvio: string;
  prazoResolucao: string;
  status: 'ENVIADO' | 'EM_ANDAMENTO' | 'REGULARIZADO' | 'VENCIDO';
  pendenciasCobradas: string[];
  mensagemTexto: string;
  assunto?: string;
}

export interface SystemStats {
  totalFuncionarios: number;
  totalEmDia: number;
  totalComPendencia: number;
  totalCriticos: number;
  totalBloqueados: number;
  taxaConformidadeGeral: number;
  // Stats by core SST document
  ordemServico: {
    total: number;
    emDia: number;
    pendente: number;
    vencido: number;
    taxa: number;
  };
  aso: {
    total: number;
    emDia: number;
    pendente: number;
    vencido: number;
    taxa: number;
  };
  fichaEpi: {
    total: number;
    emDia: number;
    pendente: number;
    vencido: number;
    taxa: number;
  };
  radioprotecao: {
    total: number;
    emDia: number;
    pendente: number;
    vencido: number;
    taxa: number;
  };
}
