# Trilha em Massa — Desktop

Versão desktop (Windows, `.exe`) da Trilha em Massa. Mesma ideia da versão web
(`/dashboard/trilha`): escolhe uma música, escolhe vários vídeos, e o programa
troca o áudio de cada um pela música escolhida — mas processando tudo **no
computador do próprio aluno** (sem servidor, sem créditos, sem limite de
vídeos). Vendida como pagamento único, separado da assinatura da comunidade.

Não faz parte do site Next.js — é um programa Electron independente, que só
mora dentro desta pasta do repositório. O site nunca tenta compilar nem rodar
nada daqui.

## Como funciona o acesso

O programa pede login (mesmo e-mail/senha da conta em digitalsupply.pro). Ele
confere direto no Supabase se `profiles.desktop_app_purchased` está marcado
como verdadeiro (ou se a conta é admin) — sem isso, mostra uma tela pedindo
pra comprar o acesso, com um botão que abre a página de compra no navegador.

## Testar localmente (opcional)

Só é necessário se você quiser rodar o programa na sua própria máquina antes
de publicar. Precisa do Node.js instalado.

```bash
cd desktop/trilha-desktop
npm install
cp src/env.example.js src/env.js
# edite src/env.js com a URL e a anon key do seu projeto Supabase
# (os mesmos valores de NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)
npm start
```

## Como o instalador (.exe) é gerado

Você **não precisa ter Windows nem rodar nada manualmente**. O GitHub Actions
(`.github/workflows/build-desktop.yml`, na raiz do repositório) builda o
instalador automaticamente sempre que algo muda em `desktop/trilha-desktop`
na branch `main`, usando uma máquina Windows do próprio GitHub.

**Configuração única, antes do primeiro build** — no GitHub, vá em
**Settings > Secrets and variables > Actions > New repository secret** e
crie 3 segredos (os valores são os mesmos que você já usa na Vercel):

| Nome do Secret | Valor |
|---|---|
| `SUPABASE_URL` | mesmo valor de `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | mesmo valor de `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | mesmo valor já usado na Vercel |

Depois disso, todo push que mexer nessa pasta (ou rodar manualmente em
**Actions > Build desktop app (Trilha em Massa) > Run workflow**) builda o
`.exe` e:

1. deixa ele disponível como "artefato" do próprio GitHub Actions (aba
   **Actions**, dentro da execução, seção **Artifacts**) — útil pra você
   testar antes de divulgar;
2. sobe automaticamente pro bucket `desktop-app` do Supabase Storage — é de
   lá que o botão "Baixar programa" da página `/dashboard/desktop` do site
   pega o arquivo. Não precisa fazer mais nada manual depois disso.

Um build no GitHub Actions demora alguns minutos (baixa o Electron, compila,
empacota). Acompanhe em **Actions** no GitHub.

## Sem assinatura de código (por enquanto)

O instalador não é assinado digitalmente — isso é normal pra um app pequeno
de comunidade (assinatura de código custa uma mensalidade e exige verificação
de empresa). Na prática, o Windows vai mostrar um aviso ("Windows protegeu
seu PC") a primeira vez que o aluno abrir o instalador. Ele resolve clicando
em **Mais informações > Executar assim mesmo**. Vale avisar os alunos disso
de antemão (ex: um parágrafo na página de compra) pra ninguém achar que é
vírus.

## Limites conhecidos desta primeira versão

- Só Windows. Sem versão Mac/Linux.
- Sem atualização automática — quando você mudar o programa, os alunos que já
  baixaram precisam baixar o instalador novo manualmente (o link de download
  do site sempre aponta pra versão mais recente).
- O acesso é vitalício por padrão (não expira) — não há como hoje "revogar"
  o acesso de alguém individualmente pela tela do admin; se precisar disso,
  me avise que eu construo.
