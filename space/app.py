"""
Atelier Estético · HF Space backend
Inpainting facial com Stable Diffusion XL · roda em ZeroGPU (gratuito).
"""

import spaces
import gradio as gr
import torch
from diffusers import AutoPipelineForInpainting
from PIL import Image

# Modelo de inpainting · SDXL otimizado
MODEL_ID = "diffusers/stable-diffusion-xl-1.0-inpainting-0.1"

# Carrega o pipeline (uma vez no boot do Space)
pipe = AutoPipelineForInpainting.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    variant="fp16"
).to("cuda")

# Otimizações de memória
pipe.enable_xformers_memory_efficient_attention()
pipe.enable_model_cpu_offload()

# Prompts por procedimento
PROMPTS = {
    "lips": (
        "natural lip enhancement, slightly fuller lips, subtle hyaluronic acid filler result, "
        "realistic skin texture, balanced proportions, professional beauty photograph, photorealistic",
        "overfilled lips, duck lips, unnatural, plastic, distorted, asymmetric, blurry, deformed"
    ),
    "nose": (
        "refined nose shape, subtle nasal tip definition, natural rhinoplasty result, "
        "balanced facial harmony, realistic skin, professional portrait, photorealistic",
        "overdone nose, unnatural angle, distorted bridge, asymmetric, plastic, deformed"
    ),
    "lifting": (
        "subtle facial lift, refreshed appearance, gentle skin tension, natural firm cheeks, "
        "lifted contour, realistic skin texture, professional beauty photograph",
        "pulled tight, windswept, unnatural tension, plastic, distorted, overdone"
    ),
    "bichectomia": (
        "slightly slimmer cheeks, refined facial contour, subtle buccal fat reduction result, "
        "defined jawline, natural skin texture, photorealistic",
        "hollow cheeks, gaunt, sunken face, skeletal, unnatural, overdone"
    ),
    "chin": (
        "refined chin projection, balanced facial proportions, subtle mentoplasty result, "
        "natural jawline definition, photorealistic, professional portrait",
        "exaggerated chin, prognathism, unnatural shape, distorted, asymmetric"
    ),
    "brows": (
        "well-designed eyebrows, balanced arch, natural shape, defined brow line, "
        "polished groomed appearance, photorealistic",
        "overdrawn, fake brows, harsh lines, unnatural shape, distorted"
    )
}

# Intensidade controla o strength do inpainting
INTENSITY_MAP = {
    "sutil": 0.55,
    "moderada": 0.75,
    "intensa": 0.90
}


@spaces.GPU(duration=60)
def inpaint(image: Image.Image, mask: Image.Image, procedure: str, intensity: str):
    """
    Aplica inpainting na região mascarada conforme procedimento estético selecionado.

    Args:
        image: foto original (PIL Image)
        mask: máscara branca sobre preto, branco = área a editar
        procedure: chave de PROMPTS (lips, nose, lifting, ...)
        intensity: sutil | moderada | intensa

    Returns:
        PIL Image com resultado
    """
    if procedure not in PROMPTS:
        raise gr.Error(f"Procedimento inválido: {procedure}")

    prompt, negative = PROMPTS[procedure]
    strength = INTENSITY_MAP.get(intensity, 0.75)

    # Garantir dimensões compatíveis (SDXL prefere múltiplos de 8)
    w, h = image.size
    target_w = (w // 8) * 8
    target_h = (h // 8) * 8
    if (w, h) != (target_w, target_h):
        image = image.resize((target_w, target_h), Image.LANCZOS)
        mask = mask.resize((target_w, target_h), Image.LANCZOS)

    # Mask precisa ser grayscale
    if mask.mode != "L":
        mask = mask.convert("L")

    result = pipe(
        prompt=prompt,
        negative_prompt=negative,
        image=image,
        mask_image=mask,
        num_inference_steps=30,
        guidance_scale=7.5,
        strength=strength,
    ).images[0]

    return result


# Interface Gradio
with gr.Blocks(title="Atelier Estético · API") as demo:
    gr.Markdown("""
    # Atelier Estético · Inpainting API

    Backend gratuito para simulação de procedimentos estéticos.
    Endpoint usado pelo frontend (GitHub Pages) via `@gradio/client`.

    **Procedimentos:** lábios, nariz, lifting, bichectomia, mento, sobrancelhas
    **Intensidades:** sutil, moderada, intensa
    """)

    with gr.Row():
        with gr.Column():
            in_image = gr.Image(label="Foto original", type="pil")
            in_mask = gr.Image(label="Máscara (branco = área a editar)", type="pil")
            in_proc = gr.Dropdown(
                choices=list(PROMPTS.keys()),
                value="lips",
                label="Procedimento"
            )
            in_intensity = gr.Dropdown(
                choices=["sutil", "moderada", "intensa"],
                value="moderada",
                label="Intensidade"
            )
            btn = gr.Button("Aplicar", variant="primary")

        with gr.Column():
            out_image = gr.Image(label="Resultado", type="pil")

    btn.click(
        fn=inpaint,
        inputs=[in_image, in_mask, in_proc, in_intensity],
        outputs=out_image,
        api_name="inpaint"  # importante: nome usado pela API
    )

if __name__ == "__main__":
    demo.queue(max_size=20).launch()
