# Configurar a área de cliente (Supabase)

1. **Criar o projeto** em https://supabase.com → New project → região **Frankfurt (eu-central-1)**
   (mantém os dados na UE).
2. **Base de dados:** SQL Editor → New snippet → colar `supabase/schema.sql` → Run.
   Depois, da mesma forma e por esta ordem, `supabase/002_painel_admin.sql` (painel, técnicos, obras),
   `supabase/003_seguranca.sql`, `supabase/004_preferencias_pedido.sql` (preferências de horário dos pedidos)
   `supabase/005_pedido_orcamento.sql` (pedido de orçamento sem conta, fotos, novos estados)
   `supabase/006_referencia_pedido.sql` (número de referência PCH-00001),
   `supabase/007_endurecer_funcoes.sql` (avisos do Security Advisor),
   `supabase/008_morada_partilha_comentarios.sql` (morada verificada no orçamento,
   colaboradores só de consulta, partilha de clientes e comentários),
   `supabase/009_sem_estado_aceite.sql` (retira o estado "Aceite" dos pedidos de orçamento),
   `supabase/010_folha_orcamento_notas_obra.sql` (folha de orçamento em PDF, obra a partir do
   orçamento confirmado, notas de obra da equipa),
   `supabase/011_folha_campos_papel.sql` (todos os campos da folha em papel),
   `supabase/012_registos_pela_administracao.sql` (a administração regista limpezas, visitas e
   obras para clientes sem conta; técnico nas visitas),
   e `supabase/013_pedido_localizacao.sql` (link para o cliente partilhar a localização).
3. **Chaves:** Project Settings → API Keys. Copie `.env.example` para `.env.local` e preencha
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`.
   Coloque as mesmas variáveis no alojamento (ex.: Vercel → Settings → Environment Variables).
4. **URLs:** Authentication → URL Configuration
   - Site URL: `https://www.o-seu-dominio.pt`
   - Redirect URLs: `https://www.o-seu-dominio.pt/auth/confirm` e `http://localhost:3000/auth/confirm`
5. **Emails em português:** Authentication → Emails → Templates — traduza “Confirm signup” e “Reset password”.
5c. **Email de confirmação ao cliente:** preencher `SMTP_*` em `.env.local` (ver `src/lib/mailer.ts`).
   WhatsApp da empresa no comprovativo: `NEXT_PUBLIC_COMPANY_WHATSAPP`.
5b. **Avisos para a equipa** (novo pedido de orçamento; comentários dos colaboradores só para a
   administração): Telegram + cópia por email. Configurar com `npm run avisos` (ver `scripts/avisos.mjs`)
   e copiar `TELEGRAM_BOT_TOKEN`, `STAFF_TELEGRAM`, `ADMIN_TELEGRAM`, `STAFF_EMAIL`, `ADMIN_EMAIL` para o alojamento.
6. **SMTP próprio (obrigatório em produção):** o email do Supabase só envia poucos emails por hora.
   Authentication → Emails → SMTP Settings — use o email da empresa ou um serviço como Brevo/Resend.
7. **Palavras-passe:** Authentication → Providers → Email → ative “Prevent use of leaked passwords”
   e um comprimento mínimo de 8.
8. **Tornar-se administrador:** registe-se no site, confirme o email e execute no SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
     where email = 'o-seu-email@exemplo.pt';
   ```
9. **Google Analytics:** coloque o ID (`G-…`) em `NEXT_PUBLIC_GA_ID`. Em GA → Admin → Data retention,
   escolha 2 meses e desative Google Signals — reduz os dados recolhidos.

## Antes de publicar
- Preencher os campos `[ ]` em `src/lib/legal.ts`, `/privacidade` e `/termos`.
- Rever os textos legais com um jurista (são rascunhos).
- Assinar o DPA (acordo de subcontratação) do Supabase e do alojamento — normalmente é um clique no painel.
