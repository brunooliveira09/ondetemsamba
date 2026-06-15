🥁 Onde Tem Samba
Mapa interativo de eventos de samba em Porto Feliz — SP.
Estrutura do projeto
```
onde-tem-samba/           ← raiz do repositório GitHub
├── index.html            ← Mapa público (página principal)
├── admin.html            ← Painel administrativo
├── env.js                ← ⚠️  Credenciais (NÃO está no GitHub)
├── env.example.js        ← Modelo de credenciais (suba este)
├── schema_completo.sql   ← Banco de dados Supabase
├── vercel.json           ← Configuração de deploy
├── .gitignore            ← Protege env.js
└── README.md
```
---
Configuração passo a passo
1. Banco de dados (Supabase)
Acesse supabase.com → crie um projeto
Vá em SQL Editor
Cole e execute o `schema_completo.sql`
Vá em Authentication → Users → crie o usuário admin
2. Credenciais
Copie `env.example.js` → renomeie para `env.js`
Preencha com suas chaves do Supabase:
`SUPABASE_URL` — Settings → API → Project URL
`SUPABASE_KEY` — Settings → API → anon public
`SUPABASE_SERVICE_KEY` — Settings → API → service_role secret
Nunca suba `env.js` para o GitHub
3. GitHub
Crie repositório `onde-tem-samba`
Suba todos os arquivos exceto `env.js`
O `.gitignore` já protege automaticamente
4. Vercel
vercel.com → New Project → importe o repositório
Clique em Deploy
O site estará em `onde-tem-samba.vercel.app`
5. env.js no servidor
O `env.js` não está no GitHub, então você precisa criar ele diretamente no Vercel:
No Vercel → seu projeto → Settings → Environment Variables
Adicione uma variável chamada `OTS_ENV_JSON` com o conteúdo JSON das suas credenciais
OU: suba o `env.js` manualmente via Vercel CLI:
```bash
   npm i -g vercel
   vercel env add env.js production
   ```
Opção mais simples: use o Vercel CLI para fazer deploy incluindo o env.js:
```bash
   vercel --prod
   ```
O `.gitignore` protege o GitHub, mas o Vercel CLI sobe tudo da pasta local.
---
Acesso
URL	Descrição
`seusite.vercel.app`	Mapa público
`seusite.vercel.app/admin.html`	Painel admin
Login admin padrão (sem Supabase)
E-mail: `admin@ondetemSamba.com.br`
Senha: `samba@2024`
Login admin (com Supabase)
Use o e-mail e senha do usuário criado em Authentication → Users
---
Modo dia/noite
O mapa troca automaticamente baseado no horário:
6h às 18h → modo dia (mapa claro)
18h às 6h → modo noite (mapa escuro âmbar)
Botão 🌙/☀️ no canto inferior direito para forçar a troca
Tecnologias
Leaflet + OpenStreetMap
Supabase — PostgreSQL + Auth
Vercel — hospedagem gratuita
Custo estimado
Serviço	Custo
GitHub	Grátis
Vercel	Grátis
Supabase	Grátis (até 500 MB)
Domínio .com.br	~R$ 40/ano (opcional)
