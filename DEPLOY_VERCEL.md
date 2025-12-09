# Deploy na Vercel

Este guia explica como fazer deploy do app de delivery na Vercel.

## Passo a Passo

### 1. Preparar o Repositorio

Certifique-se de que o codigo esta em um repositorio Git (GitHub, GitLab ou Bitbucket).

### 2. Configurar na Vercel

1. Acesse [vercel.com](https://vercel.com) e faca login
2. Clique em "Add New" > "Project"
3. Importe o repositorio do seu app
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
   - **Node.js Version**: 20.x (recomendado)

### 3. Configurar Variaveis de Ambiente

Na aba "Environment Variables" do projeto na Vercel, adicione:

| Nome | Obrigatorio | Descricao |
|------|-------------|-----------|
| `SUPABASE_DATABASE_URL` | Sim | URL de conexao do banco Supabase |
| `SUPABASE_URL` | Sim | URL do projeto (ex: https://xxx.supabase.co) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Service Role Key do Supabase |
| `SUPABASE_ANON_KEY` | Sim | Anon Key para o frontend |
| `SUPABASE_STORAGE_BUCKET` | Nao | Nome do bucket (default: products) |

### 4. Deploy

Clique em "Deploy" e aguarde o build completar.

## Estrutura do Projeto para Vercel

```
/api/index.ts      # API Routes (Serverless Functions)
/client            # Frontend React (Vite)
/dist/public       # Build output do frontend
/server            # Codigo compartilhado (storage, supabase)
```

## Limitacoes do Ambiente Serverless

### SSE (Server-Sent Events) Nao Funciona

A funcionalidade de atualizacoes em tempo real via SSE (usada para notificar sobre novos pedidos) **nao funciona em serverless**. 

**Alternativas para tempo real na Vercel:**
1. **Supabase Realtime** - Subscribe nos eventos do banco diretamente no frontend
2. **Pusher/Ably** - Servicos de WebSocket gerenciados
3. **Polling** - Fazer requisicoes periodicas (menos eficiente)

### Cold Starts

Serverless functions podem ter latencia inicial. O primeiro request apos inatividade pode demorar 1-3 segundos.

### Timeout

O timeout maximo configurado e 30 segundos por request.

## Database

Continue usando o Supabase PostgreSQL. O banco ja existe e esta configurado. Apenas conecte usando as variaveis de ambiente.

**Importante:** Certifique-se de que o IP da Vercel nao esta bloqueado nas configuracoes de seguranca do Supabase (Database > Settings > Network).

## Upload de Arquivos

O Supabase Storage continua funcionando normalmente atraves da rota `/api/storage/upload`.

## Comandos Uteis

```bash
# Build local para testar
npm run build

# Verificar tipos
npm run check

# Rodar localmente (usa servidor Express, nao serverless)
npm run dev
```

## Troubleshooting

### Erro de conexao com banco
- Verifique se `SUPABASE_DATABASE_URL` esta correto
- Confirme que o pool mode esta correto (use `?pgbouncer=true` se necessario)
- Verifique se o IP da Vercel nao esta bloqueado

### API nao responde
- Verifique os logs na aba "Functions" do dashboard Vercel
- Confirme que todas as variaveis de ambiente estao configuradas
- Verifique se nao ha erros de import no api/index.ts

### Frontend nao carrega
- Verifique se o build esta passando sem erros
- Confirme que o `outputDirectory` esta correto (`dist/public`)

### CORS errors
- Os headers CORS ja estao configurados no vercel.json
- Se precisar de origins especificos, edite o vercel.json

## Diferancas do Ambiente Replit

| Funcionalidade | Replit | Vercel |
|----------------|--------|--------|
| SSE (tempo real) | Funciona | Nao funciona |
| Cold start | Nao tem | 1-3s |
| Logs | Console | Dashboard Functions |
| Deploy | Automatico | Push no Git |
