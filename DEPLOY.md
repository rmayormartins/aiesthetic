# Deploy · Atelier Estético

Guia passo a passo. Frontend vai pro GitHub Pages, Worker vai pro Cloudflare (workers.dev). Os dois são gratuitos.

---

## Parte 1 · Frontend no GitHub Pages

### 1.1 Criar repositório

No GitHub:
1. Botão verde "New repository"
2. Nome: `atelier-estetico` (ou outro)
3. Público
4. Não marcar nenhuma opção de inicialização (README, .gitignore etc)
5. Create repository

### 1.2 Subir arquivos

```bash
# Na sua máquina, na pasta atelier-estetico/
cd atelier-estetico

git init
git add .
git commit -m "feat: atelier estético inicial"
git branch -M main
git remote add origin https://github.com/rmayormartins/atelier-estetico.git
git push -u origin main
```

### 1.3 Ativar GitHub Pages

No GitHub, dentro do repo:
1. Settings → Pages (menu lateral)
2. Source: `Deploy from a branch`
3. Branch: `main` · pasta: `/ (root)`
4. Save

Em 1-2 minutos fica disponível em:
`https://rmayormartins.github.io/atelier-estetico/`

Nessa URL já funciona:
- Upload de foto
- Câmera (HTTPS por padrão no GitHub Pages)
- MediaPipe Face Mesh
- Todos os efeitos cutâneos
- Análise IA com Claude Vision

O que ainda não funciona: procedimentos estruturais (precisa do Worker, próxima parte).

---

## Parte 2 · Cloudflare Worker

### 2.1 Criar conta no Cloudflare

[cloudflare.com](https://cloudflare.com) · plano gratuito. 100k requisições/dia no Worker, mais que suficiente.

### 2.2 Obter token da Replicate

1. Criar conta em [replicate.com](https://replicate.com)
2. Settings → API tokens
3. Create token, copiar (formato `r8_xxxxxxxx`)
4. Adicionar método de pagamento (Replicate cobra por uso, ~US$ 0.012/imagem com SDXL inpainting)

### 2.3 Instalar Wrangler

```bash
# Wrangler é a CLI do Cloudflare Workers
npm install -g wrangler

# Login (vai abrir o navegador)
wrangler login
```

### 2.4 Deploy do Worker

```bash
# Entrar na pasta do worker
cd atelier-estetico/worker

# Configurar o token da Replicate como secret (NÃO vai pro git!)
wrangler secret put REPLICATE_TOKEN
# Cole o token quando pedir e Enter

# Deploy
wrangler deploy
```

Output esperado:
```
Published atelier-estetico-proxy
  https://atelier-estetico-proxy.SEU_USUARIO.workers.dev
```

Copia essa URL. É o endpoint do Worker.

### 2.5 Verificar Worker

Teste rápido (substitui pela sua URL):

```bash
curl -X OPTIONS https://atelier-estetico-proxy.SEU_USUARIO.workers.dev
```

Deve retornar headers CORS (sem erro 500).

---

## Parte 3 · Conectar frontend ao Worker

### Opção A · Configurar via interface (mais simples)

1. Abre `https://rmayormartins.github.io/atelier-estetico/`
2. Carrega uma foto
3. No painel "Procedimentos estruturais", cola a URL do Worker no campo "Endpoint do Worker"
4. Escolhe um procedimento → Simular

### Opção B · Hardcoded (pra deixar fixo nos testes)

Edita o `index.html` localmente, procura por:

```html
<input type="text" id="worker-endpoint" placeholder="https://seu-worker.workers.dev" value="">
```

Coloca a URL no `value=""`:

```html
<input type="text" id="worker-endpoint" placeholder="https://seu-worker.workers.dev" value="https://atelier-estetico-proxy.SEU_USUARIO.workers.dev">
```

Commit e push:
```bash
git add index.html
git commit -m "config: hardcode worker endpoint"
git push
```

GitHub Pages atualiza em 1-2 minutos.

---

## Parte 4 · Atualizações futuras

### Atualizar frontend
```bash
# Edita o index.html, depois:
git add .
git commit -m "descrição da mudança"
git push
```
Pages publica automaticamente.

### Atualizar Worker
```bash
cd worker
# Edita worker.js, depois:
wrangler deploy
```

### Ver logs do Worker em tempo real
```bash
cd worker
wrangler tail
```

Útil pra debugar erros da Replicate (token inválido, modelo offline, timeout etc).

---

## Parte 5 · Troubleshooting comum

**"REPLICATE_TOKEN não configurado"**
Esqueceu o `wrangler secret put REPLICATE_TOKEN`. Roda de novo.

**Câmera não abre no celular**
GitHub Pages é HTTPS, deveria funcionar. iOS Safari às vezes pede recarregar a página na primeira vez. Verifica permissões em Settings → Safari → Camera.

**MediaPipe não detecta rosto**
Foto frontal, boa iluminação, sem óculos escuros. Se persistir, o app cai pro fallback de regiões aproximadas.

**Worker retorna 500**
Roda `wrangler tail` em outra aba e tenta de novo. O erro real aparece nos logs. Mais comum: token Replicate expirado ou sem crédito.

**Inpainting muda muito o rosto**
SDXL Inpainting puro perde identidade. Soluções:
- Reduz `strength` no `worker.js` (de 0.75 pra 0.55)
- Troca pelo modelo `zsxkib/instant-id` que preserva embedding facial
- Restringe mais a máscara da região (editar índices dos landmarks no HTML)

---

## Parte 6 · Custos reais

Estimativa pra 1000 simulações/mês (caso uso clínica pequena):

| Serviço | Custo |
|---|---|
| GitHub Pages | Grátis |
| Cloudflare Worker (free tier 100k/dia) | Grátis |
| Replicate SDXL Inpainting (1000 × $0.012) | US$ 12 |
| Claude Vision (1000 análises × ~$0.003) | US$ 3 |
| **Total mensal** | **~US$ 15** |

Pra escala maior ou produção, considerar self-hosted Stable Diffusion (RTX 4090 ~US$ 0.40/h em vast.ai).

---

## Parte 7 · LGPD (se for usar em clínica real)

- Pede consentimento explícito antes do upload (modal inicial)
- Replicate apaga imagens após 1h por padrão · confirma na conta
- Worker não armazena nada (já está assim)
- Adicionar opção "apagar minha foto agora" no frontend
- Política de privacidade visível
- Não enviar dados de identificação do paciente junto com a imagem
