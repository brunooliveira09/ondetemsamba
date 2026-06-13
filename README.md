# 🥁 Onde Tem Samba

Mapa interativo de eventos de samba — pagode, raiz, partido alto e mais.

## Estrutura do projeto

```
onde-tem-samba/
├── index.html      # HTML principal
├── style.css       # Todos os estilos
├── config.js       # ⚙️  Configure suas credenciais aqui
├── db.js           # Camada de dados (Supabase + fallback local)
├── app.js          # Lógica do mapa e interações
├── vercel.json     # Configuração de deploy
└── README.md
```

## Como configurar

### 1. Supabase (banco de dados)
Edite `config.js` e substitua:
```js
url:     'https://SEU_PROJECT_ID.supabase.co'
anonKey: 'SUA_ANON_KEY_AQUI'
```

Rode o `schema.sql` no SQL Editor do Supabase, depois o `seed.sql`.

### 2. Deploy no Vercel
1. Crie um repo no GitHub e suba todos os arquivos desta pasta
2. Acesse vercel.com → New Project → importe o repo
3. Clique em Deploy — pronto!

### 3. Sem banco configurado
O app funciona normalmente com dados de exemplo locais.
Quando o Supabase estiver configurado, os dados reais aparecem automaticamente.

## Tecnologias
- [Leaflet](https://leafletjs.com/) — mapa interativo
- [OpenStreetMap](https://openstreetmap.org/) — tiles gratuitos
- [Supabase](https://supabase.com/) — banco PostgreSQL + Auth
- [Vercel](https://vercel.com/) — hospedagem estática

## Custo estimado
| Serviço | Custo |
|---------|-------|
| GitHub  | Grátis |
| Vercel  | Grátis |
| Supabase| Grátis (até 500 MB) |
| Domínio .com.br | ~R$ 40/ano |
