# Deploy na Vercel

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

### 3. Configurar Variaveis de Ambiente

Na aba "Environment Variables" do projeto na Vercel, adicione:

| Nome | Valor |
|------|-------|
| `SUPABASE_DATABASE_URL` | URL de conexao do seu banco Supabase |
| `SUPABASE_URL` | URL do projeto Supabase (ex: https://xxx.supabase.co) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase |

### 4. Deploy

Clique em "Deploy" e aguarde o build completar.

## Estrutura do Projeto para Vercel

- `/api/index.ts` - API Routes (Serverless Functions)
- `/client` - Frontend React (Vite)
- `/dist/public` - Build output do frontend

## Notas Importantes

1. **SSE (Server-Sent Events)**: A funcionalidade de atualizacoes em tempo real via SSE nao funciona em serverless. Para tempo real na Vercel, considere usar Supabase Realtime ou Pusher.

2. **Cold Starts**: Serverless functions podem ter latencia inicial. O primeiro request apos inatividade pode demorar mais.

3. **Database**: Continue usando o Supabase PostgreSQL. As variaveis de ambiente configuram a conexao.

4. **Upload de Arquivos**: O Supabase Storage continua funcionando normalmente.

## Comandos Uteis

```bash
# Build local para testar
npm run build

# Verificar tipos
npm run check
```

## Troubleshooting

### Erro de conexao com banco
- Verifique se `SUPABASE_DATABASE_URL` esta correto
- Confirme que o IP da Vercel nao esta bloqueado no Supabase

### API nao responde
- Verifique os logs na aba "Functions" do dashboard Vercel
- Confirme que todas as variaveis de ambiente estao configuradas

### Frontend nao carrega
- Verifique se o build esta passando sem erros
- Confirme que os paths de import estao corretos
