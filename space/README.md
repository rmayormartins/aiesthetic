---
title: Atelier Estético Backend
emoji: ✨
colorFrom: pink
colorTo: yellow
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
license: mit
short_description: Inpainting facial para simulação estética
---

# Atelier Estético · Backend

API de inpainting para o frontend [Atelier Estético](https://github.com/rmayormartins/atelier-estetico).

## Modelo
SDXL Inpainting (`diffusers/stable-diffusion-xl-1.0-inpainting-0.1`) com prompts ajustados para procedimentos estéticos.

## Uso via API
```javascript
import { Client } from "@gradio/client";
const client = await Client.connect("rmayormartins/atelier-estetico-backend");
const result = await client.predict("/inpaint", {
  image: imageBlob,
  mask: maskBlob,
  procedure: "lips",
  intensity: "moderada"
});
```

## Disclaimer
Ferramenta de simulação visual com propósito ilustrativo. Resultados reais variam conforme anatomia individual.
