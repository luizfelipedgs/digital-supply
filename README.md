# Digital Supply (DGS) — área de membros

Projeto base da área de membros da Comunidade DGS: cadastro, planos, liberação
automática de acesso via webhook da Cakto e dashboard do aluno.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase**: autenticação, banco de dados (Postgres) e Row Level Security
- **Vercel**: hospedagem
- **Cakto**: checkout e webhooks de pagamento

## O que já está pronto

- Telas: login, cadastro, planos (com os 3 links reais da Cakto), aguardando aprovação, e um dashboard inicial
- Schema completo do banco (`supabase/schema.sql`): perfis, faturamento, metas, tarefas e log de eventos da Cakto
- Endpoint `/api/webhooks/cakto` que recebe o webhook, identifica o plano comprado, casa com o aluno pelo e-mail e libera o acesso automaticamente

## Como colocar pra rodar

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
3. Vá em **Project Settings > API** e copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (fica só no servidor, nunca exponha no navegador)

### 3. Configurar as variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha com os valores do Supabase e da Cakto (veja os próximos passos).

### 4. Configurar o webhook na Cakto

Para cada um dos 3 produtos (mensal, trimestral, anual):

1. No painel da Cakto, entre no produto e copie o **ID do produto** (não o link curto de checkout) — normalmente aparece na URL do produto no formato `xxxxxxxx-xxxx-...`.
2. Cole esse ID na variável correspondente no `.env.local` (`CAKTO_PRODUCT_ID_MENSAL`, etc.)

Depois, em **Integrações > Webhooks > Adicionar**:

1. Nome: algo como "Liberação de acesso DGS"
2. URL: `https://digitalsupply.pro/api/webhooks/cakto` (depois que o site estiver publicado)
3. Chave secreta: crie uma senha forte qualquer e cole também em `CAKTO_WEBHOOK_SECRET`
4. Produtos: selecione os 3 planos
5. Eventos: marque pelo menos **Compra aprovada**; se for assinatura recorrente, marque também os eventos de renovação e cancelamento

⚠️ **Importante**: o payload de exemplo usado neste código foi baseado na documentação oficial da Cakto para pagamento único. Como os planos são recorrentes (assinatura), os nomes exatos dos eventos de renovação/cancelamento podem ter uma variação — depois de configurar o webhook, faça uma compra de teste (ou peça um evento de teste no painel da Cakto) e confira o payload recebido na tabela `cakto_events` do Supabase para confirmar os nomes exatos. Ajuste as listas `GRANT_ACCESS_EVENTS` e `REVOKE_ACCESS_EVENTS` em `app/api/webhooks/cakto/route.ts` se precisar.

### 4.1 Configurar o agente "Mestre das Legendas"

A seção `/dashboard/legendas` é um chat de IA disponível pra qualquer aluno com assinatura ativa. Ele aceita **vídeo
e texto** (upload de foto avulsa foi removido de propósito, pra manter o uso focado e o custo previsível). Usa a API
de chat completions da OpenAI (modelo `gpt-5.6-luna` por padrão — o mais barato da OpenAI atualmente, com suporte a
texto e imagem/vídeo).

1. Crie uma chave em [platform.openai.com](https://platform.openai.com/api-keys) e coloque em `OPENAI_API_KEY`
   (no `.env.local` e depois nas variáveis de ambiente da Vercel). **Não existe um plano gratuito permanente pra
   API da OpenAI** — é pago por uso (algumas contas novas ganham um crédito inicial pequeno que expira em ~3
   meses). Cadastre um cartão e, se quiser, defina um limite mensal de gastos em Billing pra evitar surpresa.
2. Opcional: defina `OPENAI_MODEL` pra trocar o modelo (ex: `gpt-5.6-terra` pra mais qualidade, com custo maior).
3. A personalidade e as regras editoriais do agente ficam em `lib/legendas-prompt.ts` — edite esse arquivo pra
   ajustar tom, regras ou estilo sem mexer no resto do código.
4. **Rode `supabase/legendas_video_usage.sql` no SQL Editor do Supabase** (projeto já existente — não precisa rodar
   o `schema.sql` inteiro de novo). Isso cria a tabela e a função que controlam o limite diário de vídeos por
   aluno. Sem esse passo, qualquer envio de vídeo retorna erro.

**Limite diário de vídeos**: cada aluno pode analisar até **5 vídeos por dia** (reseta à meia-noite no horário de
Brasília). O limite é aplicado no servidor (não dá pra burlar recarregando a página) e é mostrado na tela antes de
cada envio. Depois de enviar um vídeo, o aluno pode continuar a conversa em texto à vontade (pedir pra encurtar,
mudar o tom, gerar variação) sem gastar cota — só o envio de um vídeo novo consome. Pra mudar o número 5, altere a
constante `DAILY_VIDEO_LIMIT` em `lib/legendas-config.ts` (um único lugar, usado tanto pela rota quanto pela tela).

Como funciona o envio de vídeo: o navegador extrai automaticamente ~6 frames (imagens) do vídeo selecionado e
envia esses frames pro modelo — não há transcrição de áudio/narração nesta versão. Pra a maioria dos vídeos de
curiosidade/fato visual isso é suficiente, mas se o conteúdo depender de algo só falado (sem aparecer na tela), o
agente avisa que não tem essa informação em vez de inventar. Se no futuro você quiser transcrição de áudio, dá pra
acrescentar uma chamada à API de transcrição da OpenAI (Whisper) nesse mesmo fluxo.

O histórico da conversa não é salvo no banco — cada aluno começa do zero ao recarregar a página (só o *contador* de
vídeos do dia é salvo, pra valer o limite). Se depois vocês quiserem manter histórico completo por aluno, dá pra
criar uma tabela `legendas_messages` (mesmo padrão de RLS das outras tabelas do schema) e persistir ali.

**Custo estimado**: com o limite de 5 vídeos/dia por aluno e o modelo `gpt-5.6-luna`, uma simulação com 20 alunos
usando o máximo todo santo dia (incluindo conversa de ajuste por texto depois de cada vídeo) fica em torno de
**US$ 3 a 15/mês** — algo como **R$ 15 a R$ 80/mês** no câmbio atual. Essa conta usa os preços públicos listados
pela OpenAI no momento em que foi feita e uma estimativa de tokens por frame de vídeo; pode variar. Recomendado:
cadastrar o cartão, definir um limite de gastos mensal em Billing bem acima disso como margem de segurança (ex:
R$ 100–150), e depois de a primeira semana no ar, conferir o consumo real no painel da OpenAI e ajustar o limite
pra baixo se quiser mais aperto.

### 5. Rodar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### 6. Publicar na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Importe o repositório na Vercel.
3. Em **Settings > Environment Variables**, cole as mesmas variáveis do `.env.local`.
4. Em **Settings > Domains**, adicione `digitalsupply.pro` e siga as instruções de DNS na Hostinger (documentamos o passo a passo completo na conversa).
5. No Supabase, em **Authentication > URL Configuration**, atualize a Site URL e as Redirect URLs para `https://digitalsupply.pro`.

## Próximos passos sugeridos

- Dashboard de faturamento (lançamentos por plataforma, gráficos, ranking)
- Área de conteúdos (texto, áudio, vídeo)
- Metas e tarefas (as tabelas já existem no schema, faltam as telas)
- Painel admin (aprovação manual de fallback, gestão de conteúdo)

## Manutenção e segurança

Rode `npm audit` periodicamente e mantenha o Next.js atualizado dentro da mesma linha major (ex: 14.2.x). Antes de migrar para uma versão major nova (15 ou 16), atenção: a partir do Next.js 15, a função `cookies()` de `next/headers` passou a ser assíncrona — isso exige ajustar `lib/supabase/server.ts`.
