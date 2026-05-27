# Deploy · Atelier Estético

Guia completo · Frontend no GitHub Pages + Backend no Hugging Face Space (gratuito).

A versão paga via Cloudflare Worker + Replicate fica documentada na seção final, para evolução futura.

---

## Caminho recomendado · 100% gratuito

```
Frontend (GitHub Pages)  →  Claude API (análise)
                         →  HF Space gratuito (inpainting)
```

Sem cartão de crédito, sem risco de cobrança automática. Quando o tier free esgota, o serviço apenas para de responder até o próximo ciclo.

---

## Parte 1 · Frontend no GitHub Pages

### 1.1 Criar repositório

No GitHub:
1. New repository
2. Nome: `atelier-estetico`
3. Público, sem inicialização
4. Create

### 1.2 Subir arquivos

```bash
cd atelier-estetico
git init
git add .
git commit -m "feat: atelier estético inicial"
git branch -M main
git remote add origin https://github.com/rmayormartins/atelier-estetico.git
git push -u origin main
```

### 1.3 Ativar Pages

Settings → Pages → Source: `Deploy from a branch` → Branch `main` / `(root)` → Save.

Em 1-2 minutos: `https://rmayormartins.github.io/atelier-estetico/`

Funciona de cara: upload, câmera, MediaPipe, todos os ajustes cutâneos, análise IA com Claude. Só os procedimentos estruturais precisam do HF Space (próxima parte).

---

## Parte 2 · Backend gratuito no Hugging Face Space

### 2.1 Criar Space

1. Login em [huggingface.co](https://huggingface.co)
2. Botão de perfil → New Space
3. Owner: seu usuário
4. Space name: `atelier-estetico-backend`
5. License: `mit`
6. SDK: `Gradio`
7. Hardware: **ZeroGPU** (gratuito, dynamic GPU)
8. Visibility: `Public`
9. Create Space

> Sobre ZeroGPU: é a GPU compartilhada gratuita do HF. Permite ~5 minutos de GPU por dia no tier free, suficiente pra dezenas de simulações. Sem ZeroGPU disponível? Pode escolher CPU básico, mas inpainting fica lento (~5-10 min/imagem).

### 2.2 Subir os arquivos do Space

Cada Space é um repositório Git. Clone o seu Space localmente:

```bash
# Clone o repo do Space (vazio)
git clone https://huggingface.co/spaces/rmayormartins/atelier-estetico-backend
cd atelier-estetico-backend

# Copiar arquivos da pasta space/ deste projeto pra raiz do Space
cp /caminho/para/atelier-estetico/space/app.py .
cp /caminho/para/atelier-estetico/space/requirements.txt .
cp /caminho/para/atelier-estetico/space/README.md .

# Commit e push
git add .
git commit -m "feat: backend de inpainting estético"
git push
```

### 2.3 Aguardar build

O Space começa a construir automaticamente. Primeira build demora 5-10 minutos (baixa o modelo SDXL, ~6.5GB).

Acompanha em `https://huggingface.co/spaces/rmayormartins/atelier-estetico-backend` na aba "Logs".

Quando aparecer "Running on local URL: ..." está pronto.

### 2.4 Conectar frontend ao Space

Abre o app no GitHub Pages, carrega foto, vai em "Procedimentos estruturais":
- **Backend:** `Hugging Face Space (gratuito)`
- **Space ID:** `rmayormartins/atelier-estetico-backend` (seu usuário + nome do Space)
- Escolhe procedimento → Simular

Pronto. Custo zero.

### 2.5 Fixar Space ID no código (opcional)

Pra evitar colar o ID toda vez nos testes, edita `index.html`:

```html
<input type="text" id="endpoint-url" placeholder="..." value="">
```

Para:

```html
<input type="text" id="endpoint-url" placeholder="..." value="rmayormartins/atelier-estetico-backend">
```

`git commit && git push` → atualiza no GitHub Pages.

---

## Parte 3 · Como o HF Space funciona

### Sleep automático
Spaces gratuitos dormem após 48h sem uso. Próxima requisição acorda o Space (demora ~30s na primeira chamada). Depois fica responsivo enquanto houver atividade.

### Rate limit
- **ZeroGPU free:** ~5 min de GPU/dia
- **HF Pro ($9/mês):** ~25 min de GPU/dia + Spaces priority
- Após esgotar, requisições enfileiram ou falham até o reset

### Acompanhar logs
Aba "Logs" no Space mostra requisições em tempo real. Útil pra debugar.

### Atualizar o backend
Edita `app.py` localmente, faz `git push` pro repositório do Space. Rebuild automático.

---

## Parte 4 · Caminho pago (Cloudflare Worker + Replicate)

Use isso quando precisar de produção, baixa latência consistente ou alta concorrência. Custo: ~US$ 12/mês pra 1000 simulações.

### 4.1 Token Replicate
1. Conta em [replicate.com](https://replicate.com)
2. Settings → API tokens → Create token
3. Cadastrar método de pagamento

### 4.2 Deploy do Worker

```bash
npm install -g wrangler
wrangler login
cd atelier-estetico/worker
wrangler secret put REPLICATE_TOKEN  # cola o token
wrangler deploy
```

Output: `https://atelier-estetico-proxy.SEU_USUARIO.workers.dev`

### 4.3 Conectar no frontend
No app:
- **Backend:** `Cloudflare Worker · Replicate (pago)`
- **URL:** cole a URL do Worker

---

## Parte 5 · Estrutura final do repositório

```
atelier-estetico/
├── index.html              ← GitHub Pages serve isso
├── README.md
├── DEPLOY.md
├── .gitignore
├── space/                  ← Backend gratuito (sobe pra HF Space)
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
└── worker/                 ← Backend pago (opcional)
    ├── worker.js
    └── wrangler.toml
```

GitHub Pages só expõe a raiz (`index.html`). As pastas `space/` e `worker/` ficam versionadas mas não são acessíveis publicamente via Pages, perfeito.

---

## Parte 6 · Troubleshooting

**HF Space "Building" há muito tempo**
Primeira build leva 5-10 min (baixa modelo). Se passar de 20 min, ver Logs pra identificar erro (geralmente dependência faltando em `requirements.txt`).

**HF Space "Runtime error"**
Logs mostram traceback. Mais comum: OOM (sem memória) quando hardware é CPU em vez de ZeroGPU.

**"Space não retornou imagem"**
Conexão `@gradio/client` mudou de versão. Garantir que o `app.py` tem `api_name="inpaint"` no `.click()`.

**Câmera não abre no celular**
GitHub Pages já é HTTPS. iOS Safari às vezes pede recarregar. Settings → Safari → Camera → Allow.

**MediaPipe não detecta rosto**
Foto frontal, iluminação adequada, sem óculos escuros. Fallback automático usa regiões aproximadas.

**Inpainting muda muito o rosto**
Reduzir `strength` em `app.py` (linha `INTENSITY_MAP`), valores menores preservam mais do original. Alternativa: trocar modelo no `app.py` por algo que preserva identidade (`PhotoMaker`, `InstantID`).

---

## Parte 7 · LGPD (uso real em clínica)

- Consentimento explícito antes do upload
- HF Space e Replicate não armazenam por padrão · confirmar nas políticas
- Adicionar opção "apagar minha foto agora" no frontend
- Política de privacidade visível
- Não enviar dados identificadores junto com imagem
