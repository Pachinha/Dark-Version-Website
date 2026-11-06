# Lareiras Pachinha — site, área de cliente e backoffice

Documentação completa do projeto: o que é, onde corre, quanto custa, que limites tem, o que fazer
quando um limite for ultrapassado, como se publica, como se fazem e repõem cópias de segurança, e
porque é que cada decisão foi tomada.

> **Regra deste documento:** nunca colocar aqui palavras-passe, chaves, tokens, o endereço secreto
> do painel ou dados de clientes. Este ficheiro diz **onde** estão e **como** se obtêm — nunca **o quê**.
> Os valores vivem em `.env.local` (no computador de quem desenvolve, fora do git), nos segredos da
> Cloudflare e nos segredos do GitHub.

Última revisão: **2026-11-05**. Valores de preços e limites dos serviços são os desta data —
confirme sempre nos links da [secção 15](#15-links-úteis) antes de decidir pagar.

---

## Índice

1. [Resumo em 30 segundos](#1-resumo-em-30-segundos)
2. [Arquitetura](#2-arquitetura)
3. [Serviços, contas e quem é dono](#3-serviços-contas-e-quem-é-dono)
4. [Custos, limites e o que fazer quando se excede](#4-custos-limites-e-o-que-fazer-quando-se-excede)
5. [Decisões tomadas e porquê](#5-decisões-tomadas-e-porquê)
6. [Domínio e email (pachinha.com)](#6-domínio-e-email-pachinhacom)
7. [Desenvolvimento local](#7-desenvolvimento-local)
8. [Variáveis de ambiente](#8-variáveis-de-ambiente)
9. [Publicar na Cloudflare](#9-publicar-na-cloudflare)
10. [Base de dados (Supabase)](#10-base-de-dados-supabase)
11. [Cópias de segurança e reposição](#11-cópias-de-segurança-e-reposição)
12. [Funcionalidades e onde está o código](#12-funcionalidades-e-onde-está-o-código)
13. [Resolução de problemas](#13-resolução-de-problemas)
14. [Estado atual e próximos passos](#14-estado-atual-e-próximos-passos)
15. [Links úteis](#15-links-úteis)

---

## 1. Resumo em 30 segundos

| O quê | Onde | Custo hoje |
|---|---|---|
| Site + painel (código Next.js) | **Cloudflare Workers** | 0 € |
| Base de dados, contas, fotos | **Supabase** (Postgres, região UE) | 0 € |
| Emails automáticos aos clientes | **Resend** (enviados como `info@pachinha.com`) | 0 € |
| Avisos à equipa | **Telegram** (bot) + cópia por email | 0 € |
| Cópias de segurança diárias | **Cloudflare R2**, feitas pelo **GitHub Actions** | 0 € |
| Domínio `pachinha.com` + caixas de email | **webserver.pt** (gerido pelo Pascoal) | o que a Sandra já paga |
| Código-fonte | GitHub `Pachinha/Dark-Version-Website` (privado) | 0 € |

Tudo corre sozinho. A Sandra gere conteúdos (catálogo, pedidos, orçamentos, obras) no backoffice
sem precisar de ninguém. O primeiro custo provável, se o site crescer, é **5 $/mês** (Cloudflare
Workers Paid) — ver [secção 4](#4-custos-limites-e-o-que-fazer-quando-se-excede).

---

## 2. Arquitetura

```
                 Visitante / cliente / equipa (browser)
                                │
                        pachinha.com (DNS na webserver.pt)
                                │  registo A/CNAME do site → Cloudflare
                                ▼
                 ┌──────────────────────────────┐
                 │  Cloudflare Workers          │  Next.js 16 adaptado com OpenNext
                 │  worker "pachinha"           │  (páginas, painel, PDF, ações)
                 │  + ficheiros estáticos       │
                 └──────┬───────────┬───────────┘
                        │           │
        HTTPS (API)     │           │ HTTPS (API)
                        ▼           ▼
          ┌────────────────┐   ┌──────────────┐     ┌────────────┐
          │ Supabase       │   │ Resend       │────▶│ caixa do   │
          │ - Postgres     │   │ (emails)     │     │ cliente    │
          │ - Auth + 2FA   │   └──────────────┘     └────────────┘
          │ - Storage      │   ┌──────────────┐
          │   (fotos)      │   │ Telegram API │──▶ telemóveis da equipa
          └───────┬────────┘   └──────────────┘
                  │
                  │ todas as noites (GitHub Actions)
                  ▼
          ┌────────────────────────────┐
          │ Cloudflare R2              │  cópia cifrada: base de dados + fotos
          │ (30 diárias + 12 mensais)  │
          └────────────────────────────┘

  Email "normal" (info@, sandra.oliveira@): continua 100% na webserver.pt
  (MX → cleanmx.pt). O site NÃO toca nas caixas de correio.
```

**Tecnologia:**

- **Next.js 16.4.5** (App Router, React 19) + Tailwind 4 + TypeScript.
  - Atenção: esta versão do Next tem mudanças grandes. Antes de mexer no código, ler `AGENTS.md`
    e a documentação em `node_modules/next/dist/docs/`.
  - O ficheiro `src/proxy.ts` é o antigo "middleware" (trata os idiomas).
- **@opennextjs/cloudflare** converte o build do Next num Worker da Cloudflare. Configuração em
  `wrangler.jsonc` e `open-next.config.ts`.
- **Supabase** através de `@supabase/ssr` e `@supabase/supabase-js`. Não usamos ligação direta ao
  Postgres a partir do site, só a API, o que funciona em qualquer alojamento.
- **pdf-lib** gera o PDF do orçamento (JavaScript puro, sem WebAssembly).
- **Resend** envia os emails por HTTPS. Na Cloudflare não se pode usar SMTP.

---

## 3. Serviços, contas e quem é dono

Princípio: **as contas de produção ficam em nome da empresa** (email da empresa, de preferência
`info@pachinha.com`), com o programador como membro/convidado. Assim a empresa nunca fica refém de
uma pessoa.

| Serviço | Para quê | Plano | Dono da conta | Painel |
|---|---|---|---|---|
| Cloudflare | Alojar o site (Workers) + cópias (R2) | Free | Empresa | https://dash.cloudflare.com |
| Supabase | Base de dados, autenticação, ficheiros | Free | Empresa (programador como membro) | https://supabase.com/dashboard |
| Resend | Envio de emails automáticos | Free | Empresa | https://resend.com/overview |
| GitHub | Código + automatismos (deploy, cópias) | Free | Organização `Pachinha` | https://github.com/Pachinha/Dark-Version-Website |
| Telegram | Bot de avisos à equipa | Grátis | Criado com @BotFather | https://t.me/BotFather |
| webserver.pt | Domínio + caixas de email | Pago anualmente pela Sandra | Pascoal (revendedor) | — |
| Google Analytics | Estatísticas (só com consentimento de cookies) | Grátis | Empresa | https://analytics.google.com |

**Onde estão as credenciais (nunca aqui):**

- `.env.local`: no computador de quem desenvolve. Está no `.gitignore`. O modelo é `.env.example`.
- `.dev.vars`: cópia do `.env.local` para testar o modo Cloudflare localmente. Também está fora do git.
- Segredos da Cloudflare: Workers & Pages → `pachinha` → Settings → Variables and Secrets.
- Segredos do GitHub: repositório → Settings → Secrets and variables → Actions (para as cópias de
  segurança e o deploy automático).
- A **chave de cifra das cópias de segurança** fica guardada em **dois sítios offline**: com o
  programador e com a Sandra, num gestor de palavras-passe ou impressa num local seguro. Sem ela, as
  cópias não se abrem.

### 3.1 Situação real hoje (2026-11-05)

| Serviço | Em nome de quem está hoje | Para onde deve passar |
|---|---|---|
| Supabase | Conta pessoal do programador (José) | Organização com a Sandra como **Owner** (ver 3.3) |
| GitHub | Organização `Pachinha` | Sandra também como **Owner** da organização |
| Telegram (bot) | Criado pelo programador | Pode ficar; transferir se a Sandra quiser (ver 3.3) |
| Cloudflare, Resend | Ainda por criar | Criar já em nome da empresa |

### 3.2 Todas as chaves e segredos: o que são, onde vivem, como se trocam

Cada chave abre uma "porta" diferente. Não são repetidas.

| Nome | O que abre | Onde está guardada | Como se obtém / troca |
|---|---|---|---|
| `SUPABASE_DB_PASSWORD` | A base de dados Postgres diretamente (tabelas). **Só a cópia de segurança a usa**; o site não | Segredo do GitHub (Actions) + gestor de palavras-passe | Supabase → Project Settings → Database → *Reset database password*. Depois de trocar, **atualizar o segredo no GitHub**, ou a cópia da noite seguinte falha |
| `SUPABASE_SECRET_KEY` | A API do Supabase com poderes totais: ficheiros (fotos), apagar contas, ações de admin. O site **e** a cópia usam-na | `.env.local`, segredos da Cloudflare, segredo do GitHub | Supabase → Project Settings → API Keys → criar nova *secret key* → substituir nos 3 sítios → apagar a antiga |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | A API pública (o browser usa-a; protegida pelas regras RLS). Não é secreta | `.env.local`, Cloudflare | Supabase → API Keys |
| `BACKUP_PASSPHRASE` | **Abrir (decifrar) as cópias de segurança.** Não dá acesso a nada no Supabase | Segredo do GitHub + **gestor de palavras-passe do programador e da Sandra** | Gerada aleatoriamente em 2026-11-05. Se for trocada, as cópias antigas continuam a abrir **só com a chave antiga**: guardar as duas até as antigas expirarem (1 ano) |
| `SUPABASE_ACCESS_TOKEN` | A conta Supabase do programador (gestão por scripts) | Só no `.env.local` do programador | Supabase → Account → Access Tokens. Pessoal; não vai para produção |
| `PANEL_SLUG` | Não é uma chave: é o endereço secreto do painel (2.ª camada; o login + 2FA continuam a ser obrigatórios) | `.env.local`, Cloudflare | Escolher outro valor e atualizar na Cloudflare |
| `TELEGRAM_BOT_TOKEN` | Enviar mensagens como o bot | `.env.local`, Cloudflare | @BotFather → `/revoke` gera um novo |
| `RESEND_API_KEY` | Enviar emails como `@pachinha.com` | `.env.local` (opcional), Cloudflare | Resend → API Keys |
| `R2_*` (4 valores) | Escrever no bucket das cópias | Segredos do GitHub | Cloudflare → R2 → *Manage R2 API Tokens* (token só com acesso a esse bucket) |

**Como trocar um segredo no GitHub:** repositório → Settings → Secrets and variables → Actions →
lápis ao lado do nome → *Update*. O GitHub nunca mostra o valor antigo, só deixa substituí-lo.

**Se suspeitar que uma chave foi exposta**, por exemplo enviada por chat ou email:

1. Trocá-la logo, como indicado na tabela.
2. Atualizar todos os sítios onde está.
3. Publicar o site de novo, se for uma variável da Cloudflare.

### 3.3 Passar as contas para a Sandra (ou adicionar pessoas)

**Supabase.** Os projetos pertencem a uma *organização*, não a uma pessoa.

1. Supabase → escolher a organização → **Team** → *Invite* → email da Sandra → papel **Owner**.
   Também se podem convidar outras pessoas como *Developer* (trabalham no projeto) ou *Read-only*.
2. Quando a Sandra aceitar, ela passa a ser dona tal como o programador. Se for pedido, o
   programador desce para *Developer* ou sai.
   - Em alternativa, cria-se uma organização nova em nome da empresa e move-se o projeto:
     Project Settings → General → **Transfer project**. É preciso ser Owner nas duas
     organizações.
3. **Nada muda no site nem nas cópias.** O endereço do projeto, as chaves e a palavra-passe da BD
   continuam iguais.
4. Cuidado com a regra do plano Free: cada Owner/Admin pode ter no máximo 2 projetos gratuitos
   ativos, somando todas as organizações.
5. Ajuda: https://supabase.com/docs/guides/platform/access-control e
   https://supabase.com/docs/guides/platform/project-transfer

**GitHub.**

- github.com/orgs/Pachinha/people → *Invite member* → papel **Owner**.
- Os segredos e os automatismos ficam no repositório, não na pessoa, por isso mudar de dono não
  afeta nada.

**Cloudflare.**

- Criar a conta já com o email da empresa.
- Para adicionar o programador: Manage Account → **Members** → *Invite* (papel *Administrator*).

**Resend.**

- Criar a conta com o email da empresa.
- Para adicionar pessoas: Settings → **Team** → *Invite*.

**Telegram.**

- O bot pode ser transferido em @BotFather → `/mybots` → bot → *Bot Settings* → *Transfer
  ownership*. O Telegram exige 2FA ligado.
- Os avisos não dependem de quem é dono: os destinatários configuram-se com `npm run avisos`.

**Regra:** a Sandra, ou a empresa, deve ser **Owner** em todos os serviços. O programador fica como
membro. Assim, se um dia o programador deixar de estar disponível, nada fica preso.

---

## 4. Custos, limites e o que fazer quando se excede

Contexto de escala: no máximo cerca de 1000 clientes. Tudo abaixo está longe dos limites gratuitos
para este volume. Esta secção existe para que, **se** um dia algo falhar ou chegar ao limite, se
saiba exatamente o quê, como se nota e o que fazer.

### 4.1 Cloudflare Workers (o site)

| Limite (Free) | Valor | Como se nota se exceder | O que fazer |
|---|---|---|---|
| Tamanho do Worker (comprimido) | **3 MiB** | O `npm run deploy` falha com um erro de tamanho ("exceeds size limit") | Ver abaixo |
| Pedidos por dia | 100 000 | Erro 1027 para os visitantes até à meia-noite UTC | Passar a **Workers Paid (5 $/mês)**: 10 milhões de pedidos/mês incluídos |
| Tempo de CPU por pedido | 10 ms | Erro 1102 ("Worker exceeded resource limits") em páginas pesadas | Workers Paid: até 30 s por pedido |
| Ficheiros estáticos (imagens, CSS, JS) | Ilimitados e grátis | — | — |
| Otimização de imagens (binding `IMAGES`) | 5000 transformações únicas/mês | Imagens deixam de ser otimizadas | Workers Paid ou Cloudflare Images |

**Tamanho do Worker (o limite a vigiar):**

- Em 2026-11-04 o Worker tinha **≈ 2,5 MiB de 3 MiB**. Quase tudo é o próprio Next.js e não há
  muito mais a cortar.
- O tamanho aparece no fim do `npm run deploy` / `npm run upload` ("Total Upload: … / gzip: …").
- O que o faz crescer: novas bibliotecas importadas no servidor. Antes de adicionar uma dependência,
  verifique o tamanho em https://bundlephobia.com.
- **Se passar os 3 MiB:**
  1. Ver o que pesa com `npx wrangler deploy --dry-run --outdir=dist-check` e analisar os ficheiros
     gerados.
  2. Retirar bibliotecas pesadas ou carregá-las só no browser.
  3. Se não der, ativar o **Workers Paid (5 $/mês)**, que sobe o limite para **10 MiB**. Não é
     preciso mudar nada no código. Dashboard → Workers & Pages → Plans.

**Regras da plataforma que o código já respeita (não quebrar):**

- **Sem WebAssembly compilado em tempo de execução.** Foi por isto que o `@react-pdf/renderer` saiu:
  usa o motor de layout "yoga" em WASM. Bibliotecas que façam isto rebentam só em produção.
- **Sem sistema de ficheiros.** Nada de `fs.readFile` no servidor. As imagens do PDF estão embutidas
  em `src/lib/pdf-images.ts` (ver [12.4](#124-pdf-do-orçamento)).
- **Sem SMTP.** Os emails saem pela API do Resend (HTTPS).
- **Pedidos com corpo grande:** as fotos são reduzidas no browser (`src/lib/shrink-image.ts`, 1600 px
  em JPEG) antes de serem enviadas.

### 4.2 Supabase (base de dados, contas, ficheiros)

| Limite (Free) | Valor | Estimativa para a Pachinha | Se exceder |
|---|---|---|---|
| Base de dados | **500 MB** | 1000 clientes com pedidos e orçamentos ≈ 10–30 MB | Fica só de leitura. Limpar ou passar a Pro |
| Ficheiros (Storage) | **1 GB** | Fotos de pedidos (~300 KB cada após redução) + catálogo | Uploads falham. Limpar fotos antigas ou passar a Pro |
| Tráfego de saída | 5 GB/mês | Baixo (as imagens públicas passam por cache) | Avisos por email do Supabase; depois, limitação |
| Utilizadores ativos/mês | 50 000 | ≤ 1000 | — |
| **Pausa por inatividade** | Projeto parado após **7 dias sem atividade** | Com visitas diárias e a cópia noturna não deve acontecer | Dashboard → projeto → **Restore** (1–2 min). Os dados não se perdem |
| Cópias de segurança | **Nenhuma** no plano Free | — | Por isso existe a nossa cópia diária (secção 11) |

**Supabase Pro: 25 $/mês.**

- O que inclui: 8 GB de base de dados, 100 GB de ficheiros, sem pausas e cópias diárias com 7 dias
  de retenção.
- **Objetivo (decisão de 2026-11-06): nunca precisar dele.** O código está preparado para ficar no
  plano gratuito durante anos — ver "Plano para nunca pagar" abaixo. O Pro fica só como opção da
  empresa (ex.: se quiser cópias geridas pelo próprio Supabase).

**Números reais (2026-11-06):** 13 MB de dados e 38 KB de fotos.

- **Dados (texto):** ~5 KB por pedido com ficha, notas e orçamento → 500 MB ≈ 100 000 pedidos. Nunca é
  problema.
- **Fotos:** é o único limite que conta. Sem medidas, ~4–5 MB por pedido com fotos encheria 1 GB em
  ~220 pedidos.

**Plano para nunca pagar (3 camadas):**

1. **Fotos comprimidas antes de enviar** — feito. `src/lib/shrink-image.ts`: no browser, 1600 px em
   JPEG (~300 KB cada). Num ecrã ficam iguais às originais. 1 GB ≈ 1000+ pedidos com fotos.
2. **Medidor e avisos** — feito (migração 018, `src/lib/space.ts`).
   - Painel → Início → cartão "Site" → **Espaço gratuito** (barra verde, laranja a 80%, vermelha a 90%).
   - Aviso automático à administração (Telegram + email) ao passar 80, 90 e 95% — uma vez por nível.
     É verificado sempre que entra um pedido ou se mexe no catálogo.
   - Se os limites do plano mudarem: `SPACE_DATABASE_LIMIT_MB` / `SPACE_STORAGE_LIMIT_MB` (secção 8).
3. **Arquivo das fotos antigas no R2** — **por fazer** (com a ativação do R2, secção 14).
   - Fotos de pedidos fechados há mais de 1 ano passam sozinhas do Supabase para o R2 (10 GB grátis).
   - Continuam a ver-se na ficha do cliente; só vêm de outro sítio.
   - Total ~11 GB grátis ≈ mais de 20 000 pedidos com fotos.

**Como vigiar:** o medidor do painel e os avisos acima. Também: Supabase → projeto → **Reports /
Usage**, e o email que o Supabase manda ao dono da conta perto de um limite.

**Para não crescer sem controlo (já implementado):**

- Fotos reduzidas no browser antes do upload. Os buckets têm limite de tamanho por ficheiro:
  - `quote-photos` (privado): 3 MB por ficheiro.
  - `catalog` (público): 4 MB por ficheiro, só JPG/PNG/WebP.
- O catálogo não aceita PDFs (decisão de 2026-11-04, migração 015).
- Apagar uma conta de cliente apaga os dados dele (direito ao apagamento, RGPD).

**Se o espaço começar a apertar:**

1. Ver as tabelas maiores no SQL Editor:
   ```sql
   select relname, pg_size_pretty(pg_total_relation_size(relid))
   from pg_catalog.pg_statio_user_tables order by pg_total_relation_size(relid) desc;
   ```
2. Fotos de pedidos antigos e concluídos: **arquivar no R2** (camada 3), não apagar. Nunca apagar
   fotos sem combinar uma regra com a Sandra.

**Sair do Supabase (se um dia for preciso):**

- É Postgres normal, por isso não há dependência forte. A cópia de segurança (`pg_dump`) restaura
  em qualquer Postgres (Neon, um servidor próprio, etc.).
- O que exigiria trabalho: a autenticação (Supabase Auth + 2FA) e o Storage. Seria preciso
  reescrever `src/lib/supabase/*` e as ações.

### 4.3 Resend (emails)

| Limite (Free) | Valor | Se exceder |
|---|---|---|
| Emails por mês | 3000 | Envio falha: o site regista o erro e o resto continua a funcionar |
| Emails por dia | 100 | Idem, até ao dia seguinte |
| Domínios | 1 (`pachinha.com`) | — |

- **Resend Pro: 20 $/mês** para 50 000 emails. Para esta empresa, 100/dia chega com muita folga.
- Se o envio falhar, o painel continua a funcionar e o erro aparece nos logs da Cloudflare
  (`[email] falhou: …`).

### 4.4 Cloudflare R2 (cópias de segurança)

| Limite (Free) | Valor | Estimativa |
|---|---|---|
| Armazenamento | 10 GB/mês | 42 cópias × (BD comprimida + fotos) ≈ bem abaixo de 10 GB nos primeiros anos |
| Operações | 1 M escritas / 10 M leituras por mês | Dezenas por dia |
| Saída de dados (descarregar) | **Grátis** | — |

- Depois dos 10 GB paga-se ≈ 0,015 $/GB/mês, o que dá cêntimos.
- Se as fotos crescerem muito, a cópia passa a enviar só as fotos novas (incremental).

### 4.5 GitHub

- Actions em repositórios privados: 2000 minutos/mês grátis. A cópia diária usa ~1–2 min por dia
  (~60 min/mês) e cada deploy ~3–4 min.

### 4.6 Resumo: quando começar a pagar

| Sinal | Ação | Custo |
|---|---|---|
| Deploy falha por tamanho, erros 1027/1102 | Cloudflare Workers Paid | 5 $/mês |
| Aviso de espaço a 80% | Arquivar fotos no R2 (secção 4.2) — **não** passar a Pro | 0 € |
| Só se a empresa quiser cópias geridas pelo Supabase | Supabase Pro (opcional) | 25 $/mês |
| Mais de 100 emails/dia | Resend Pro | 20 $/mês |
| Mais de 10 GB de cópias | R2 pago | cêntimos |

---

## 5. Decisões tomadas e porquê

Decididas em 2026-11-04, com estas prioridades:

- O melhor para a Sandra e para a empresa, com aspeto profissional.
- Funcionar sozinho; a Sandra gere tudo no backoffice.
- Grátis até se justificar pagar.
- Mínima dependência do fornecedor do domínio.
- Sem servidor físico na empresa.

| Decisão | Alternativas consideradas | Porquê |
|---|---|---|
| **Cloudflare Workers** para o site | Vercel Hobby, alojamento partilhado da webserver.pt, Netlify, servidor na empresa | A Vercel Hobby **proíbe uso comercial** (podem suspender o site e exigir Pro, 20 $/mês). Alojamento partilhado (cPanel) não corre Next.js moderno de forma fiável e prende-nos ao Pascoal. Servidor próprio exige manutenção, eletricidade, internet fixa e segurança. O Cloudflare Free **permite uso comercial**, é muito rápido em Portugal e sobe para 5 $/mês só se for preciso |
| **Supabase Free** mantido | Neon, base de dados própria | Já estava todo integrado (contas, 2FA, RLS, fotos). É Postgres puro, sem dependência forte. O único ponto fraco do Free (não ter cópias) fica resolvido com a nossa cópia diária |
| **Cópias em Cloudflare R2** via GitHub Actions | Supabase Pro (25 $/mês), cópias no PC de alguém | Grátis, automático, fora do Supabase (se o Supabase falhar, a cópia está noutro fornecedor), cifrado e com retenção definida |
| **Resend** para emails | SMTP da webserver.pt, Gmail, Brevo | A Cloudflare não permite SMTP. O Resend envia **a partir dos endereços que já existem** (`info@`, respostas para `sandra.oliveira@`) sem custo extra e sem mexer nas caixas atuais. Só precisa de registos DNS, pedidos uma vez ao Pascoal |
| **pdf-lib** para o PDF | @react-pdf/renderer (usado antes), Puppeteer | O react-pdf usa WebAssembly em tempo de execução, o que a Cloudflare proíbe. O Puppeteer exige um browser no servidor. O pdf-lib é JavaScript puro. O PDF foi refeito com aspeto idêntico (diferença < 1 ponto face ao original) |
| **Domínio fica na webserver.pt**, nameservers não mudam | Transferir o domínio ou os nameservers para a Cloudflare | Mudar os nameservers deitaria abaixo o email (MX em cleanmx.pt). Pede-se ao Pascoal **um único pedido** com os registos necessários e mais nada |
| WhatsApp aos clientes manual (wa.me) | API oficial da Meta | A API custa por mensagem e exige modelos aprovados. Fica para mais tarde, se a Sandra quiser |
| Avisos à equipa por **Telegram** | WhatsApp via CallMeBot | O CallMeBot aceitava mas não entregava as mensagens. O Telegram é grátis, imediato e fiável |

---

## 6. Domínio e email (pachinha.com)

**Situação atual (consulta pública em 2026-11-04):**

- Registado desde 2001, **expira em 2027-08-10**. **A renovação tem de ser garantida pela Sandra
  junto do Pascoal.** Se o domínio expirar, caem o site e o email.
- DNS em `ns*.mydnspt.net` (webserver.pt).
- Email: MX `mx1/mx2.cleanmx.pt`. As caixas `info@` e `sandra.oliveira@pachinha.com` continuam
  exatamente como estão.
- Site antigo em `cp366.webserver.pt`. Continua no ar até à troca.

**Regras de ouro:**

1. **Nunca mudar os nameservers.** Só se acrescentam ou alteram registos individuais.
2. **Nunca mexer nos registos MX.**
3. O SPF existente é do email da webserver.pt. O Resend usa um **subdomínio próprio**
   (ex.: `send.pachinha.com`) para o seu SPF/MX de retorno, por isso não se mexe no SPF principal.

**Pedido único ao Pascoal** (preparado quando a conta Resend e a Cloudflare existirem; os valores
exatos aparecem nos painéis):

- Registos do **Resend**: DKIM (`resend._domainkey` TXT), SPF e MX de retorno no subdomínio de envio,
  e opcionalmente DMARC. Valores em Resend → Domains → `pachinha.com`.
- Registos do **site**:
  - Fase de teste: `novo.pachinha.com` CNAME → endereço do Worker.
  - No lançamento: `pachinha.com` e `www`. Os valores exatos vêm da Cloudflare (Custom Domains /
    Routes) no momento.

**Nota sobre domínio próprio num Worker:** para ligar um domínio personalizado a um Worker, a
Cloudflare normalmente exige que a zona DNS esteja na Cloudflare. Como não vamos mudar os
nameservers, as opções são:

- (a) O endereço `*.workers.dev` com CNAME a partir da webserver.pt. É o caminho de teste.
- (b) **Cloudflare for SaaS / custom hostnames**.
- (c) Proxy simples.

A escolha final e os passos exatos ficam registados aqui quando o lançamento for feito
(ver [14](#14-estado-atual-e-próximos-passos)).

---

## 7. Desenvolvimento local

**Requisitos:**

- Node.js 20+ e Git.
- **Windows:** ativar o **Modo de Programador** (Definições → Sistema → Para programadores). O
  build da Cloudflare cria *symlinks* e sem isto falha com `EPERM`.

**Primeira vez:**

```bash
git clone git@github.com:Pachinha/Dark-Version-Website.git
cd Dark-Version-Website
npm install
cp .env.example .env.local          # e preencher (ver secção 8)
cp .env.local .dev.vars             # só para o modo Cloudflare; acrescentar NEXTJS_ENV=development
```

**Comandos:**

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` | Build normal do Next.js (verifica erros de tipos) |
| `npm run lint` | ESLint |
| `npm run preview` | Build para a Cloudflare + simulação local do Worker (http://localhost:8787). **Testar sempre aqui antes de publicar**, porque é o ambiente real |
| `npm run deploy` | Build + publicação na Cloudflare |
| `npm run upload` | Build + envio de uma nova versão sem a ativar (para testar antes) |
| `npm run cf-typegen` | Gera os tipos das bindings da Cloudflare |
| `npm run avisos` | Configura os avisos à equipa (Telegram/email); ver `scripts/avisos.mjs` |
| `node scripts/pdf-images.mjs` | Regenera `src/lib/pdf-images.ts` depois de mudar `public/images/logo-doc.png` ou `glammfire-doc.png` |
| `node scripts/setup-supabase.mjs` | Configuração inicial das chaves locais (usa `SUPABASE_ACCESS_TOKEN`) |
| `node scripts/create-admin.mjs` | Cria/promove a conta de administrador. A palavra-passe vai para a área de transferência, nunca é impressa |

**Windows:**

- Se uma porta ficar ocupada depois de parar o `preview`, há processos `workerd`/`next` órfãos.
  Terminar pelo Gestor de Tarefas ou com
  `Get-Process workerd | Stop-Process`.

---

## 8. Variáveis de ambiente

Os **nomes** estão aqui; os **valores** nunca. O modelo comentado é o `.env.example`.

| Variável | Obrigatória | Para quê | Onde se obtém |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Endereço do projeto Supabase | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave pública (vai para o browser, protegida por RLS) | Supabase → API Keys |
| `SUPABASE_SECRET_KEY` | Sim | Chave secreta, **só servidor** (apagar contas, operações de admin) | Supabase → API Keys |
| `NEXT_PUBLIC_SITE_URL` | Sim | URL público (links nos emails) | ex.: `https://pachinha.com` |
| `PANEL_SLUG` | Sim | Endereço secreto do painel: `/<PANEL_SLUG>/entrar`. Sem ele o painel fica desligado | Escolhido por nós, longo e aleatório. **Nunca publicar** |
| `RESEND_API_KEY` | Produção | Envio de emails | Resend → API Keys |
| `MAIL_FROM` | Produção | Remetente, ex.: `Lareiras Pachinha <info@pachinha.com>` | — |
| `MAIL_REPLY_TO` | Opcional | Para onde vão as respostas dos clientes | — |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Só local | Alternativa ao Resend para testes (ex.: Gmail com palavra-passe de aplicação) | — |
| `TELEGRAM_BOT_TOKEN` | Recomendada | Bot de avisos | @BotFather |
| `ADMIN_TELEGRAM`, `STAFF_TELEGRAM` | Recomendada | IDs dos chats que recebem avisos | `npm run avisos ligar …` |
| `ADMIN_EMAIL`, `STAFF_EMAIL` | Recomendada | Cópia dos avisos por email | — |
| `NEXT_PUBLIC_GA_ID` | Opcional | Google Analytics (só carrega com consentimento) | GA → Admin |
| `NEXT_PUBLIC_COMPANY_WHATSAPP` | Opcional | Botão de WhatsApp no comprovativo | ex.: `351…` |
| `SPACE_DATABASE_LIMIT_MB`, `SPACE_STORAGE_LIMIT_MB` | Opcional | Limites do medidor de espaço (padrão 500 e 1024, plano gratuito) | Só mudar se o plano do Supabase mudar |
| `SUPABASE_ACCESS_TOKEN` | Só local | Scripts de manutenção (Management API) | Supabase → Account → Access Tokens |

**Na Cloudflare:**

- Valores públicos (`NEXT_PUBLIC_*`): ficam como *Variables*. São embutidos no build, por isso têm de
  existir também no momento do build.
- Tudo o resto vai como *Secret* (`npx wrangler secret put NOME`).

**No GitHub (Actions):** as cópias de segurança precisam de:

- `SUPABASE_DB_PASSWORD`: palavra-passe da BD (configurado em 2026-11-04).
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` e `R2_BUCKET`: destino na Cloudflare R2.
- `BACKUP_PASSPHRASE`: chave de cifra.
- `SUPABASE_SECRET_KEY`: para descarregar os ficheiros do Storage.

**Palavra-passe da base de dados:**

- **O site não a usa.** Só usa as chaves da API, por isso o site nunca precisou dela.
- Só a cópia de segurança precisa dela.
- Se ninguém a souber: Supabase → Project Settings → **Database** → **Reset database password**.
  Repor **não afeta o site**.
- Guarde-a logo num gestor de palavras-passe e depois coloque-a só no segredo do GitHub.

---

## 9. Publicar na Cloudflare

**Primeira vez:**

1. Criar a conta Cloudflare em https://dash.cloudflare.com/sign-up:
   - **Email `info@pachinha.com`**: a conta é da empresa desde o início e não há nada a
     transferir depois. Pode ser o programador a criá-la, mas precisa de acesso a essa caixa para
     o email de confirmação.
   - Password forte, guardada num gestor de palavras-passe. A Sandra fica com uma cópia.
   - Plano **Free**. Não pede cartão.
   - Se pedir para "adicionar um site/domínio", **saltar esse passo**. O domínio continua na
     webserver.pt e os nameservers não mudam (ver [secção 6](#6-domínio-e-email-pachinhacom)).
   - Ligar o **2FA**: My Profile → Authentication.
   - Convidar o programador: Manage Account → **Members** → *Invite* → papel **Administrator**.
     O programador passa a trabalhar com a sua própria conta.
2. `npx wrangler login` (abre o browser para autorizar).
3. Colocar os segredos: `npx wrangler secret put SUPABASE_SECRET_KEY`, e assim para cada variável
   da secção 8.
4. `npm run deploy`. O site fica em `https://pachinha.<conta>.workers.dev`.
5. No Supabase → Authentication → URL Configuration, acrescentar o novo endereço:
   - em *Redirect URLs*: `…/auth/confirm`;
   - depois do lançamento, mudar também o *Site URL*.
6. Testar tudo nesse endereço (ver a checklist abaixo). Só depois se pede o DNS ao Pascoal.

**Publicação automática (planeado):**

- Cada `git push` para `master` publica o site sozinho. Pode ser feito de duas formas:
  - Cloudflare Workers Builds, ligado ao repositório GitHub;
  - um workflow em `.github/workflows/`.
- Outros ramos podem gerar versões de pré-visualização.

**Checklist depois de cada publicação importante:**

- [ ] Página inicial e as 5 línguas (`/`, `/en`, `/es`, `/fr`, `/de`).
- [ ] Catálogo `/produtos`, uma página de produto e a página 404.
- [ ] Pedido de orçamento com foto.
- [ ] Registo/login de cliente.
- [ ] Login no painel com palavra-passe + código 2FA.
- [ ] Abrir um orçamento e gerar o PDF.
- [ ] Enviar um email de teste.
- [ ] Ver em telemóvel, tablet e computador.

**Voltar atrás:** Cloudflare → Workers & Pages → `pachinha` → **Deployments** → escolher a versão
anterior → *Rollback*. Demora segundos.

---

## 10. Base de dados (Supabase)

**Configuração inicial completa:** `supabase/README.md`, com o passo-a-passo de criação do projeto,
a ordem das migrações, URLs, modelos de email, palavras-passe e o primeiro administrador.

**Região:** UE (Frankfurt). Os dados ficam na UE (RGPD).

**Migrações** (ficheiros em `supabase/`, aplicados por ordem no SQL Editor; todos aplicados em
produção até à 017):

| Ficheiro | Conteúdo |
|---|---|
| `schema.sql` | Base: perfis, moradas, pedidos de manutenção, encomendas, consentimentos |
| `002_painel_admin.sql` | Painel, papéis (admin/técnico), obras |
| `003_seguranca.sql` | Endurecimento de segurança |
| `004`–`006` | Preferências de horário, pedido de orçamento sem conta + fotos, referência PCH-00001 |
| `007_endurecer_funcoes.sql` | Avisos do Security Advisor |
| `008` | Morada verificada, colaboradores só de consulta, partilhas, comentários |
| `009` | Remove o estado "Aceite" |
| `010`–`011` | Folha de orçamento (PDF), obra a partir do orçamento, notas de obra, todos os campos da folha em papel |
| `012` | Registos feitos pela administração para clientes sem conta |
| `013` | Link para o cliente partilhar a localização |
| `014_catalogo.sql` + `014_catalogo_dados.sql` | Catálogo (marcas, categorias, produtos) + dados iniciais |
| `015` | Catálogo sem PDFs, só imagens |
| `016_fichas_clientes.sql` | Ficha de cliente automática (com ou sem conta), possíveis repetidos, juntar fichas |
| `017_manutencao_sem_conta.sql` | Pedir limpeza/manutenção no site sem conta |
| `018_espaco.sql` | Medidor de espaço (`space_usage()`, só servidor) e níveis de aviso já enviados (`space_alerts`) |

**Tabelas:**

- Clientes e contas: `profiles`, `addresses`, `consent_events`.
- Pedidos: `quote_requests`, `maintenance_requests`, `location_requests`, `orders`.
- Orçamentos e obras: `quote_sheets`, `jobs`, `job_notes`.
- Partilha e comunicação: `client_shares`, `client_comments`, `notifications`.
- Histórico: `change_log`.
- Catálogo: `catalog_brands`, `catalog_categories`, `catalog_products`.
- Fichas de cliente: `customers`, `customer_not_duplicates` (ver [12.6](#126-fichas-de-cliente-e-repetidos)).

**Ficheiros (Storage):**

| Bucket | Privacidade | Conteúdo |
|---|---|---|
| `quote-photos` | Privado; acesso só por links temporários | Fotos dos pedidos de orçamento |
| `catalog` | Público | Fotos de produtos e logótipos |

**Segurança:**

- Todas as tabelas têm **RLS** (Row Level Security): cada cliente só vê o que é seu e a equipa vê
  conforme o papel.
- O painel exige **2FA (TOTP)**.
- A chave secreta só existe no servidor.

**Nova alteração à base de dados:**

1. Criar `supabase/0NN_descricao.sql`, idempotente sempre que possível.
2. Aplicar no SQL Editor.
3. Acrescentar a linha na tabela acima e em `supabase/README.md`.

---

## 11. Cópias de segurança e reposição

> **Estado (2026-11-04):** construído em `.github/workflows/backup.yml` + `scripts/backup-storage.mjs`.
> Enquanto a Cloudflare R2 não estiver configurada, cada cópia fica guardada no próprio GitHub
> (Actions → execução → *Artifacts*) durante 30 dias. Quando os segredos `R2_*` existirem, passa
> automaticamente para a R2. Atualizar esta nota quando isso acontecer.

**O que é copiado, todas as noites (02:00 UTC = 02:00/03:00 em Lisboa):**

1. **Base de dados**, com o método oficial do Supabase (`supabase db dump`), em 3 ficheiros:
   - `roles.sql`: papéis;
   - `schema.sql`: estrutura (tabelas, funções, políticas RLS);
   - `data.sql`: dados, incluindo as contas de utilizador do schema `auth`.
2. **Ficheiros:** todos os buckets do Storage (`quote-photos`, `catalog`), mais `buckets.json`
   com a configuração de cada bucket.

**Como:**

- Os servidores do GitHub ligam-se ao Supabase pelo *session pooler* (porta 5432), porque não têm
  IPv6.
- Juntam tudo num `.tar.gz` e **cifram-no** com GPG/AES-256, usando a `BACKUP_PASSPHRASE`.
- O ficheiro final chama-se `pachinha-AAAA-MM-DD.tar.gz.gpg` e vai para:
  - a pasta `diarias/` do bucket R2;
  - e também a `mensais/`, no dia 1 de cada mês.
- Fica num fornecedor diferente do Supabase: se um falhar, o outro tem os dados.
- Também se pode correr à mão: GitHub → **Actions** → *Cópia de segurança* → **Run workflow**.

**Onde fica cada cópia:**

| Fase | Onde | Durante quanto tempo | Como descarregar |
|---|---|---|---|
| **Agora** (sem Cloudflare) | No GitHub, anexada a cada execução | 30 dias, apagada sozinha | Actions → *Cópia de segurança* → clicar numa execução → fundo da página, *Artifacts* |
| **Depois** (com R2) | Cloudflare R2, bucket privado da empresa | 30 diárias + 12 mensais | Cloudflare → R2 → bucket → pasta `diarias/` ou `mensais/` → Download |

As duas guardam o mesmo: base de dados **e** ficheiros, sempre cifrados. Quem descarregar o
ficheiro sem a `BACKUP_PASSPHRASE` não consegue ler nada.

**Como foi montado (para refazer ou alterar):**

1. Ficheiros no código:
   - `.github/workflows/backup.yml`: o automatismo (horário, passos);
   - `scripts/backup-storage.mjs`: descarrega as fotos.
2. O workflow tem de estar no ramo **`master`**. O GitHub só agenda execuções no ramo principal.
3. Segredos em repositório → Settings → Secrets and variables → **Actions**:
   - `SUPABASE_DB_PASSWORD`;
   - `SUPABASE_SECRET_KEY`;
   - `BACKUP_PASSPHRASE`;
   - mais tarde, os 4 `R2_*`.

   O que é cada um está na [secção 3.2](#32-todas-as-chaves-e-segredos-o-que-são-onde-vivem-como-se-trocam).
   Se faltar algum, a execução falha com a mensagem "Faltam segredos: …".
4. **Ligar a R2 (quando houver conta Cloudflare):**
   - Criar um bucket privado (ex.: `pachinha-copias`).
   - Criar um *R2 API Token* com permissão *Object Read & Write* só nesse bucket.
   - Criar os segredos:
     - `R2_ACCOUNT_ID`: o ID da conta, que aparece no painel da R2;
     - `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`: os dados do token;
     - `R2_BUCKET`: o nome do bucket.
   - Acrescentar as regras de retenção descritas abaixo.
   - Não é preciso mudar código.
5. **Mudar o horário:** a linha `cron` no topo do workflow, em hora UTC.
   Exemplo: `"0 2 * * *"` corre às 02:00 UTC todos os dias.
6. **Mudar de projeto Supabase:** atualizar `SUPABASE_REF` e `SUPABASE_POOLER_HOST` no workflow.
   Os valores estão em Supabase → **Connect** → *Session pooler*.

**Retenção** (para não crescer sem controlo): regras de ciclo de vida no bucket R2, configuradas
uma vez na Cloudflare (R2 → bucket → Settings → Object lifecycle rules):

- prefixo `diarias/`: apagar após **30 dias**;
- prefixo `mensais/`: apagar após **365 dias**.

**Tamanho hoje:** a base de dados tem 13 MB e há 2 fotos. Cada cópia comprimida fica bem abaixo
de 10 MB.

**Se a cópia falhar:** o GitHub envia email e a execução aparece a vermelho em *Actions*.
Verifique uma vez por mês que as últimas execuções estão a verde.

**Repor (guia para o dia em que for preciso):**

1. **Descarregar** a cópia pretendida, da R2 (Cloudflare → R2 → bucket) ou do *Artifact* no GitHub.
   Um *Artifact* vem dentro de um `.zip`; extraia-o primeiro.
2. **Decifrar e extrair** (Linux/macOS/Git Bash; pede a chave de cifra):
   ```bash
   gpg -d pachinha-AAAA-MM-DD.tar.gz.gpg | tar -xzf -
   ```
   Fica uma pasta `backup/` com `db/` e `storage/`.
3. **Restaurar a base de dados.** Pode ser no mesmo projeto ou num projeto Supabase novo. Com
   `psql` e a ligação da BD (Supabase → Connect → *Session pooler*):
   ```bash
   psql "$DB_URL" -f backup/db/roles.sql
   psql "$DB_URL" -f backup/db/schema.sql
   psql "$DB_URL" -c "SET session_replication_role = replica" -f backup/db/data.sql
   ```
   - Guia oficial: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
   - Num projeto **existente** com dados, os conflitos são esperados. Restaurar de preferência
     num projeto novo e depois apontar o site para ele.
4. **Restaurar os ficheiros:**
   - Os buckets são criados pelas migrações.
   - Os ficheiros de `backup/storage/<bucket>/…` voltam a ser carregados com o mesmo caminho.
     Pode ser no painel do Supabase (Storage → Upload folder) ou por script.
5. **Se for um projeto novo:**
   - atualizar `NEXT_PUBLIC_SUPABASE_URL` e as chaves na Cloudflare, e publicar;
   - no workflow, atualizar `SUPABASE_REF` e `SUPABASE_POOLER_HOST`;
   - no GitHub, atualizar os segredos `SUPABASE_*`.

**Testar a reposição uma vez por ano** num projeto Supabase de teste. Uma cópia que nunca foi
testada não é uma cópia.

**Cópia manual dos ficheiros no computador:** `node scripts/backup-storage.mjs pasta-destino`
(lê as chaves do `.env.local`).

---

## 12. Funcionalidades e onde está o código

### 12.1 Estrutura

```
src/
  proxy.ts                 idiomas (reescreve /en/... → /... e define o idioma)
  app/                     páginas (App Router)
    page.tsx, produtos/, produto/[slug]/, obras/, sobre/, ...   site público
    pedir-orcamento/       formulário de pedido de orçamento (com fotos)
    orcamento/[token]/     PDF do orçamento para o cliente (link privado)
    localizacao/[token]/   cliente partilha a localização
    entrar/, registar/, recuperar/, conta/   área de cliente
    [painel]/              backoffice (endereço secreto = PANEL_SLUG)
    actions/               "server actions" (toda a lógica que escreve dados)
  components/              componentes (site, conta, admin)
  content/legal/           textos legais nas 5 línguas
  lib/
    supabase/              clientes Supabase (browser/servidor)
    i18n/                  dicionários PT/EN/ES/FR/DE
    sheet-pdf.ts           gerador do PDF (pdf-lib)
    pdf-images.ts          logótipos do PDF em base64 (gerado por script)
    mailer.ts              envio de emails (Resend → SMTP → só log)
    notify.ts, staff-alert.ts   avisos (Telegram + email)
supabase/                  migrações SQL + guia de configuração
scripts/                   utilitários (avisos, admin, setup, imagens do PDF)
public/                    imagens e ficheiros estáticos; _headers (cache)
wrangler.jsonc, open-next.config.ts   configuração Cloudflare
```

### 12.2 Idiomas

- O site público está em PT (sem prefixo), EN, ES, FR e DE.
- Na primeira visita a `/`, o visitante é encaminhado pelo idioma do browser. A escolha fica
  guardada no cookie `pachinha_lang`.
- Os textos estão em `src/lib/i18n/dict/*.ts`. O `pt.ts` define o tipo, por isso uma chave em falta
  noutra língua faz falhar o build.
- **Ficam só em português, de propósito:** área de cliente, login, backoffice e emails.
- Textos legais: o PT prevalece. Quando o PT mudar, atualizar as 4 traduções.
- As traduções foram feitas por IA e merecem revisão por um nativo.

### 12.3 Backoffice (painel)

- Endereço: `/<PANEL_SLUG>/entrar`. Pede palavra-passe e depois o código 2FA de uma app
  autenticadora.
- Separadores: pedidos/orçamentos, agenda, clientes, manutenção, obras, partilhados, catálogo
  (só admin) e equipa.
- Papéis: **admin** (tudo), **técnico/colaborador** (consulta e notas). Os comentários dos
  colaboradores geram aviso à administração.
- Catálogo: marcas, categorias e produtos com fotos. Apagar uma marca/categoria com produtos é
  recusado.

### 12.4 PDF do orçamento

- Código: `src/lib/sheet-pdf.ts`. Reproduz a folha em papel com todos os campos (rótulos trilingues
  tal como impressos) e logótipos Glamm Fire + Pachinha.
- Também gera continuação automática em várias páginas, com o cabeçalho da tabela repetido.
- **Tipos de letra:** são os padrão do PDF (Helvetica). Só suportam o alfabeto ocidental (WinAnsi).
  Caracteres fora disso (emojis, etc.) aparecem como `?` em vez de partir o PDF.
- **Mudar os logótipos:** substituir `public/images/logo-doc.png` / `glammfire-doc.png` e correr
  `node scripts/pdf-images.mjs`.
- Pontos de acesso:
  - o cliente abre `/orcamento/<token>` (só folhas já enviadas);
  - a equipa abre `…/orcamentos/<id>/folha/<sheet>/pdf`;
  - no email, o PDF segue em anexo.
- Em falta: "condições gerais de venda" para o verso (texto a fornecer pela Sandra).

### 12.5 Emails e avisos

- `src/lib/mailer.ts` escolhe o meio de envio:
  1. Usa o **Resend** se `RESEND_API_KEY` e `MAIL_FROM` existirem.
  2. Senão, usa **SMTP**.
  3. Senão, só escreve no log.
- Emails aos clientes: confirmação de pedido, notificações do painel e orçamento com PDF em anexo.
- WhatsApp aos clientes: o painel abre o wa.me com a mensagem pronta e a pessoa carrega em enviar.
- Avisos à equipa (novo pedido, comentário de colaborador, nota de obra): Telegram + cópia por
  email. Configurar com `npm run avisos`.
- Os emails de autenticação (confirmar conta, recuperar palavra-passe) são enviados pelo Supabase.
  Em produção, configurar Supabase → Authentication → SMTP Settings com o **SMTP do Resend**
  (`smtp.resend.com`). Sem isto, o Supabase só envia poucos emails por hora.

### 12.6 Fichas de cliente e repetidos

**Login nunca é obrigatório** para pedir orçamento (`/pedir-orcamento`) ou assistência
(`/pedir-servico`). A conta é opcional e serve para o cliente acompanhar os pedidos.

**Ficha automática (migração 016):**
- Cada pedido de orçamento, de limpeza/manutenção e cada obra fica ligado a uma ficha
  (`customers`), com ou sem conta.
- A ligação é feita **na base de dados**, por um *trigger* ao gravar, para todos os caminhos de
  entrada: site, área de cliente, "+ Novo" do painel e obra criada a partir de um orçamento.
- **Regra de reconhecimento:** primeiro o **telefone** normalizado (`912 345 678` =
  `+351912345678`), depois o **email**. Se não houver coincidência, cria uma ficha nova.
- O cliente **nunca sabe que foi reconhecido** e não lhe é mostrado nenhum dado antigo.
- **Na área de cliente** só aparecem os pedidos feitos com sessão iniciada, ou feitos sem conta
  com o mesmo email **confirmado**. Nunca aparecem por coincidência de telefone.
- **Nome e morada não juntam fichas sozinhos**, porque há homónimos e famílias na mesma casa.
  Esses casos aparecem em **Clientes → Possíveis repetidos**, onde a administração escolhe
  "juntar" ou "são pessoas diferentes". Juntar mantém a ficha com conta (ou a mais antiga) e
  move todos os pedidos para ela.
- Duas contas diferentes nunca se juntam.
- Apagar a conta apaga a ficha (RGPD).
- Código:
  - `supabase/016_fichas_clientes.sql`: regras, *triggers* e as funções `merge_customers` e
    `customer_duplicates`;
  - `src/lib/customers.ts`;
  - `src/app/actions/customers.ts`;
  - páginas `[painel]/clientes/**`.

**Pedido de assistência sem conta (migração 017):**
- `/pedir-servico`, nas 5 línguas, com os passos Serviço → Equipamento e quando → Morada e
  contacto → Confirmar.
- Pede a aceitação da política de privacidade a quem não tem conta.
- Envia um aviso Telegram à equipa (🚨 se for urgente) e um email de confirmação ao cliente.
- Código: `src/app/pedir-servico/`, `src/app/actions/service.ts` e `src/lib/service-emails.ts`.

---

## 13. Resolução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| Site mostra erro do Supabase / não carrega dados | Projeto Supabase **pausado** | Dashboard → projeto → Restore |
| `npm run deploy` falha por tamanho | Worker > 3 MiB | [4.1](#41-cloudflare-workers-o-site) |
| Erro 1102 em algumas páginas | Limite de CPU do plano Free | Workers Paid (5 $/mês) |
| PDF dá erro só em produção | Biblioteca com WASM ou leitura de ficheiros | Ver as regras em [4.1](#41-cloudflare-workers-o-site). Testar com `npm run preview` |
| Emails não chegam | Domínio não verificado no Resend, ou limite diário | Resend → Domains / Logs. Logs da Cloudflare: procurar `[email] falhou` |
| Emails vão para spam | DKIM/SPF/DMARC em falta | Confirmar os registos em Resend → Domains |
| Telegram não avisa | Token/chat errado ou bot bloqueado | `npm run avisos test admin` |
| Painel dá 404 | `PANEL_SLUG` em falta ou errado | Rever o segredo na Cloudflare |
| Link de confirmação de conta falha | URL não autorizado no Supabase | Authentication → URL Configuration |
| Build local falha com `EPERM symlink` (Windows) | Modo de Programador desligado | [7](#7-desenvolvimento-local) |
| Porta ocupada depois do `preview` | Processos `workerd` órfãos | `Get-Process workerd \| Stop-Process` |

**Ver os logs de produção:** Cloudflare → Workers & Pages → `pachinha` → **Logs** (ou
`npx wrangler tail` em tempo real).

---

## 14. Estado atual e próximos passos

**Feito (2026-11-04):**

- [x] Site, área de cliente, backoffice, catálogo e orçamentos em PDF no ramo `master`.
- [x] Adaptação à Cloudflare no ramo `feature/cloudflare`:
  - PDF refeito com pdf-lib;
  - emails pelo Resend;
  - testado localmente em modo Cloudflare (páginas, 5 línguas, PDF, login + 2FA, painel).

**Por fazer, por ordem:**

1. [ ] Conta Cloudflare da empresa → `wrangler login` → primeiro deploy em `*.workers.dev`.
2. [ ] Conta Resend → adicionar `pachinha.com` → obter os registos DNS.
3. [ ] **Um único pedido ao Pascoal** com:
   - os registos do Resend;
   - o subdomínio de teste `novo.pachinha.com`.
4. [ ] Testes completos no endereço de teste, em telemóvel, tablet e computador.
5. [ ] Configurar o SMTP do Supabase Auth com o Resend.
5b. [ ] **Espaço gratuito** (secção 4.2): confirmar a migração 018 no Supabase de produção, as
   variáveis do Telegram na Cloudflare e **construir o arquivo das fotos antigas no R2** (camada 3).
6. [~] Cópias de segurança: workflow feito e palavra-passe da BD no GitHub → faltam `SUPABASE_SECRET_KEY`, `BACKUP_PASSPHRASE` e a R2 →
   **testar uma reposição**.
7. [ ] Publicação automática a partir do GitHub.
8. [ ] Juntar `feature/cloudflare` ao `master`.
9. [ ] Lançamento: apontar `pachinha.com` e `www` para o site novo (segundo pedido ao Pascoal, ou
   incluído no primeiro). Atualizar `NEXT_PUBLIC_SITE_URL` e os URLs no Supabase.
10. [ ] Desligar o site antigo. A Sandra deve **mudar as palavras-passe** do backoffice antigo.

**Pendentes da Sandra:**

- Condições gerais de venda (verso do orçamento).
- Revisão dos textos legais por um jurista.
- Revisão das traduções.
- Garantir a renovação do domínio antes de **2027-08-10**.

**Opcional:** cache incremental do OpenNext em R2 (páginas mais rápidas). Só se fizer falta.

---

## 15. Links úteis

**Preços e limites (confirmar antes de decidir):**

- Cloudflare Workers — preços: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Workers — limites: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare R2 — preços: https://developers.cloudflare.com/r2/pricing/
- Supabase — preços: https://supabase.com/pricing
- Supabase — pausa de projetos Free: https://supabase.com/docs/guides/platform/billing-on-supabase
- Resend — preços: https://resend.com/pricing
- GitHub Actions — faturação: https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions
- Vercel — uso comercial no Hobby (porque saímos): https://vercel.com/docs/limits/fair-use-guidelines

**Documentação técnica:**

- OpenNext para Cloudflare: https://opennext.js.org/cloudflare
- Wrangler (CLI): https://developers.cloudflare.com/workers/wrangler/
- Domínios num Worker: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Supabase — cópias e restauro: https://supabase.com/docs/guides/platform/backups
- Supabase — SMTP próprio: https://supabase.com/docs/guides/auth/auth-smtp
- Resend — verificar domínio: https://resend.com/docs/dashboard/domains/introduction
- Resend — SMTP para o Supabase: https://resend.com/docs/send-with-supabase-smtp
- pdf-lib: https://pdf-lib.js.org
- Next.js (local, versão exata do projeto): `node_modules/next/dist/docs/`
