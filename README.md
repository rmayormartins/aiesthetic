# Atelier Estético

Protótipo de simulação visual de procedimentos estéticos com IA, integrando MediaPipe Face Mesh (detecção de 478 landmarks faciais), Claude Vision (análise estética) e Replicate (procedimentos estruturais via SDXL Inpainting).

## Arquitetura

```
Frontend (GitHub Pages)  →  Claude API (direto)
                         →  Cloudflare Worker  →  Replicate API
                                                (proxy seguro)
```

## Estrutura do repositório

```
atelier-estetico/
├── index.html          Frontend completo (vai pro GitHub Pages)
├── README.md           Este arquivo
├── DEPLOY.md           Passo a passo de deploy
├── .gitignore
└── worker/
    ├── worker.js       Cloudflare Worker (proxy Replicate)
    └── wrangler.toml   Config do Worker
```

## Deploy rápido

Veja [DEPLOY.md](./DEPLOY.md) para instruções completas.

## Funcionalidades

**Processamento local (Canvas + MediaPipe):**
- Peeling, botox, clareamento dental, olheiras, glow, uniformização de tom, bronzeamento
- Máscaras precisas por região facial

**IA na nuvem:**
- Análise estética não-diagnóstica (Claude Vision)
- Procedimentos estruturais via inpainting (lábios, nariz, lifting, bichectomia, mento, sobrancelhas)

## Custo estimado

- Cloudflare Worker: grátis (até 100k req/dia)
- Replicate SDXL Inpainting: ~US$ 0.012 por simulação estrutural
- Claude Vision: ~US$ 0.003 por análise

## Disclaimer

Ferramenta de simulação visual com propósito ilustrativo e educacional. Não substitui avaliação médica profissional.
