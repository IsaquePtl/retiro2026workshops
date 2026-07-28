# Retiro App

Pagina simples para o Retiro de Adolescentes da MCI Corroios com:

- voto em 2 workshops
- envio de 1 pergunta anonima
- fundo fullscreen com imagem e video
- armazenamento gratuito em Google Sheets via Google Apps Script

## Tecnologias

- Next.js
- Google Sheets
- Google Apps Script
- Vercel

## Configuracao local

1. Instala as dependencias:

```bash
npm install
```

2. Copia `.env.example` para `.env.local` e preenche:

```bash
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-deployment-id/exec
APPS_SCRIPT_SHARED_SECRET=define-a-random-secret
```

3. Inicia a app:

```bash
npm run dev
```

## Configurar a Google Sheet

1. Cria uma Google Sheet nova
2. Cria ou deixa o script criar automaticamente estas tabs:
   - `Votos`
   - `Perguntas`
3. Na Google Sheet, abre `Extensions > Apps Script`
4. Cola o conteudo de `google-apps-script/Code.gs`
5. Em `Project Settings > Script Properties`, cria:
   - `APPS_SCRIPT_SHARED_SECRET`
   - valor igual ao que colocaste em `.env.local`
6. Faz `Deploy > New deployment`
7. Escolhe `Web app`
8. Em `Who has access`, escolhe `Anyone`
9. Copia o URL final do deploy e coloca em `GOOGLE_APPS_SCRIPT_URL`

## Estrutura criada na Sheet

Tab `Resumo`:
- Top 2 em tempo real
- ranking completo de temas
- total de votos

Tab `Votos`:
- `Data`
- `Tema 1`
- `Tema 2`
- `submission_key` (escondida)

Tab `Perguntas`:
- `Data`
- `Pergunta`
- `submission_key` (escondida)

Depois de atualizar o `Code.gs`, corre uma vez a funcao `setup` no Apps Script para aplicar o visual.

## Personalizacao rapida

- Titulo e subtitulo: `lib/workshops.ts`
- Temas dos workshops: `lib/workshops.ts`
- Layout e estilos: `app/page.tsx`

## Deploy na Vercel

1. Importar este repositorio na Vercel
2. Adicionar as variaveis de ambiente:
   - `GOOGLE_APPS_SCRIPT_URL`
   - `APPS_SCRIPT_SHARED_SECRET` (opcional)
3. Deploy

URLs:
- Formulario (publico): `/`
- Resultados (so lideres): `/r/SEU_TOKEN_SECRETO`

O link de resultados nao aparece em lado nenhum do formulario.
Partilha esse URL apenas com a equipa. Sem o token certo, a pagina responde 404.

Define `RESULTS_ACCESS_TOKEN` no `.env.local` e na Vercel.


## Notas

- O bloqueio de respostas repetidas e feito por dispositivo/browser, usando um identificador local.
- O Apps Script tambem verifica duplicados por `submission_key` antes de escrever na folha.
- Isto reduz duplicados, mas nao impede 100% respostas repetidas se alguem trocar de browser ou dispositivo.
