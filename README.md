# Painel de Pendências CADIM & Contratos (GPA / WFS)

Aplicação corporativa para consulta, gestão e regularização de pendências documentais (CADIM/SST, Obrigações Trabalhistas e Contratos) com atualização e sincronização em tempo real.

## Funcionalidades Principais

- **Portal de Pendências & Conformidade**: Visão detalhada com filtros dinâmicos por categoria (CADIM, Trabalhista, Demais), status de conformidade, busca em tempo real e saneamento de pendências.
- **Aba de Resumo (Áreas & Gestores)**: Visão consolidada por áreas operacionais com indicadores gráficos e percentuais de conformidade.
- **Gestão & Auditoria**: Painel com autenticação para controle de contratos, auditoria de envios e disparos de notificações.
- **Integração Google Sheets**: Sincronização direta e bidirecional de dados com a planilha mestre GPA_BD.

## Instalação e Execução

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente necessárias (como `GEMINI_API_KEY`) no arquivo `.env` a partir do `.env.example`.

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
