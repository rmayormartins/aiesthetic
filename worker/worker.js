/**
 * Cloudflare Worker · Atelier Estético
 * Proxy para Replicate API · SDXL Inpainting
 *
 * Deploy:
 *   npm install -g wrangler
 *   wrangler login
 *   wrangler deploy
 *
 * Configurar secret:
 *   wrangler secret put REPLICATE_TOKEN
 *
 * Variáveis opcionais (wrangler.toml):
 *   ALLOWED_ORIGIN = "https://seu-dominio.com"  (default: *)
 */

const PROMPTS = {
  lips: {
    prompt: "natural lip enhancement, slightly fuller lips, subtle hyaluronic acid filler result, realistic skin texture, balanced proportions, professional beauty photograph, photorealistic",
    negative: "overfilled lips, duck lips, unnatural, plastic, distorted, asymmetric, blurry, low quality, deformed mouth, fake"
  },
  nose: {
    prompt: "refined nose shape, subtle nasal tip definition, natural rhinoplasty result, balanced facial harmony, realistic skin, professional portrait, photorealistic",
    negative: "overdone nose, unnatural angle, distorted bridge, asymmetric, plastic, fake, deformed, blurry"
  },
  lifting: {
    prompt: "subtle facial lift, refreshed appearance, gentle skin tension, natural firm cheeks, lifted contour, realistic skin texture, professional beauty photograph",
    negative: "pulled tight, windswept, unnatural tension, plastic, fake, distorted, overdone"
  },
  bichectomia: {
    prompt: "slightly slimmer cheeks, refined facial contour, subtle buccal fat reduction result, defined jawline, natural skin texture, balanced face, photorealistic",
    negative: "hollow cheeks, gaunt, sunken face, skeletal, unnatural, distorted, overdone"
  },
  chin: {
    prompt: "refined chin projection, balanced facial proportions, subtle mentoplasty result, natural jawline definition, photorealistic, professional portrait",
    negative: "exaggerated chin, prognathism, unnatural shape, distorted, asymmetric, fake"
  },
  brows: {
    prompt: "well-designed eyebrows, balanced arch, natural shape, defined brow line, polished groomed appearance, photorealistic",
    negative: "overdrawn, fake brows, harsh lines, unnatural shape, distorted, asymmetric"
  }
};

// Modelo no Replicate · troque por outro se desejar
// Opções:
//   lucataco/sdxl-inpainting (SDXL · qualidade alta · ~$0.012/img)
//   stability-ai/stable-diffusion-inpainting (SD1.5 · ~$0.0023/img)
const REPLICATE_MODEL_VERSION = "a5b13068cc81a89a4fbeefeccc774869fcb34df4dbc92c1555e0f2771d49dde7";
// ↑ versão atual do lucataco/sdxl-inpainting (verificar em replicate.com/lucataco/sdxl-inpainting)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    if (!env.REPLICATE_TOKEN) {
      return jsonResponse({ success: false, error: "REPLICATE_TOKEN não configurado no Worker" }, 500);
    }

    try {
      const body = await request.json();
      const { image, mask, procedure, intensity = "moderada" } = body;

      if (!image || !mask || !procedure) {
        return jsonResponse({ success: false, error: "Campos obrigatórios: image, mask, procedure" }, 400);
      }

      const promptConfig = PROMPTS[procedure];
      if (!promptConfig) {
        return jsonResponse({ success: false, error: `Procedimento inválido: ${procedure}` }, 400);
      }

      // Ajusta strength conforme intensidade
      const strengthMap = { sutil: 0.55, moderada: 0.75, intensa: 0.90 };
      const strength = strengthMap[intensity] || 0.75;

      // Cria predição no Replicate
      const createRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.REPLICATE_TOKEN}`,
          "Content-Type": "application/json",
          "Prefer": "wait" // Tenta retorno síncrono (até 60s)
        },
        body: JSON.stringify({
          version: REPLICATE_MODEL_VERSION,
          input: {
            image: image,
            mask: mask,
            prompt: promptConfig.prompt,
            negative_prompt: promptConfig.negative,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            strength: strength,
            scheduler: "K_EULER"
          }
        })
      });

      let prediction = await createRes.json();

      if (createRes.status !== 200 && createRes.status !== 201) {
        return jsonResponse({
          success: false,
          error: prediction.detail || "Falha na criação da predição"
        }, createRes.status);
      }

      // Polling se ainda não estiver pronto
      const pollUrl = prediction.urls?.get;
      const maxAttempts = 60; // 60s timeout
      let attempts = 0;

      while (
        pollUrl &&
        prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled" &&
        attempts < maxAttempts
      ) {
        await sleep(1000);
        const pollRes = await fetch(pollUrl, {
          headers: { "Authorization": `Bearer ${env.REPLICATE_TOKEN}` }
        });
        prediction = await pollRes.json();
        attempts++;
      }

      if (prediction.status === "succeeded") {
        // output pode ser string ou array
        const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        return jsonResponse({
          success: true,
          output: output,
          id: prediction.id,
          metrics: prediction.metrics
        });
      }

      return jsonResponse({
        success: false,
        error: prediction.error || `Status: ${prediction.status}`,
        status: prediction.status
      }, 500);

    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
