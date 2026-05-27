# Atelier Estético

Protótipo de simulação visual de procedimentos estéticos com IA, integrando MediaPipe Face Mesh (478 landmarks faciais), Claude Vision (análise estética) e Stable Diffusion Inpainting (procedimentos estruturais).

## Arquitetura

Dois caminhos de backend possíveis para os procedimentos estruturais (lábios, nariz, lifting etc):

**Gratuito (recomendado para testes):**
```
Frontend (GitHub Pages) → HF Space gratuito (SDXL Inpainting · ZeroGPU)
```

**Pago (produção):**
```
Frontend (GitHub Pages) → Cloudflare Worker → Replicate API
```

Os ajustes cutâneos (peeling, botox, olheiras etc) rodam 100% no navegador com Canvas + MediaPipe, sem custo.

## Estrutura do repositório

```
atelier-estetico/
├── index.html          Frontend completo (GitHub Pages)
├── README.md
├── DEPLOY.md           Passo a passo de deploy
├── .gitignore
├── space/              Backend gratuito (sobe pro HF Space)
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
└── worker/             Backend pago (Cloudflare Worker)
    ├── worker.js
    └── wrangler.toml
```

## Deploy rápido

Veja [DEPLOY.md](./DEPLOY.md) para instruções completas.

## Funcionalidades

**Processamento local (Canvas + MediaPipe):**
- Peeling, botox, clareamento dental, olheiras, glow, uniformização de tom, bronzeamento
- Máscaras precisas por região facial detectada

**IA na nuvem:**
- Análise estética não-diagnóstica (Claude Vision)
- Procedimentos estruturais via inpainting (lábios, nariz, lifting, bichectomia, mento, sobrancelhas)

## Custo

- **Caminho gratuito:** US$ 0/mês (HF Space ZeroGPU + GitHub Pages)
- **Caminho pago:** ~US$ 15/mês para 1000 simulações (Replicate + Claude Vision)

## Disclaimer

Ferramenta de simulação visual com propósito ilustrativo e educacional. Não substitui avaliação médica profissional.
