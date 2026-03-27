/**
 * gemini-service.js (Configurado para OpenRouter)
 * Sistema de diagnóstico agrícola
 * Desarrollado por Ing Hernan Camilo
 */

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function consultarExpertoIA(promptUsuario, imagenBase64 = null, mimeType = "image/jpeg") {
    try {
        // Usamos Gemini 2.0 Flash a través de OpenRouter (Excelente para visión y rápido)
        const modelo = "google/gemini-2.0-flash-001";

        const systemPrompt = `Eres un Ingeniero Agrónomo experto en cultivos tropicales de Colombia.
Tu objetivo es diagnosticar problemas en plantas.
REGLAS:
1. Responde en español sencillo y profesional.
2. Si hay imagen, analízala detalladamente.
3. RESPONDE ÚNICAMENTE con un objeto JSON válido con texto PLANO, sin formato markdown.
4. NO uses asteriscos (*), negritas (**), cursivas, ni ningún carácter de formato especial.
5. Los tratamientos deben ser frases cortas y concretas, sin numeración interna (la numeración se añade en la app).
6. Evita guiones, viñetas o cualquier marcador de lista en el texto.

Estructura del JSON esperado:
{
  "diagnostico": "Texto descriptivo claro sin asteriscos ni formato especial",
  "tratamiento": ["Primera acción concreta", "Segunda acción concreta", "Tercera acción concreta"],
  "producto": "Nombre comercial y dosis específica o No aplica",
  "consejo": "Recomendación breve y práctica",
  "urgencia": "Alta, Media o Baja"
}`;

        // Estructura de contenido para OpenRouter (compatible con OpenAI)
        let contenidoMensaje = [];
        contenidoMensaje.push({ type: "text", text: promptUsuario });

        if (imagenBase64) {
            contenidoMensaje.push({
                type: "image_url",
                image_url: {
                    url: `data:${mimeType};base64,${imagenBase64}`
                }
            });
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://agro-red.app', // Opcional para OpenRouter
                'X-Title': 'AgroRed App'
            },
            body: JSON.stringify({
                model: modelo,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: contenidoMensaje }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Error desconocido en OpenRouter");
        }

        const data = await response.json();
        let rawText = data.choices[0].message.content;

        // Limpiar el texto de posibles bloques de código markdown
        rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        return JSON.parse(rawText);

    } catch (error) {
        console.error("Error en el servicio de IA:", error);
        return {
            diagnostico: "Error de conexión: " + error.message,
            tratamiento: ["Verifica tu conexión", "Reintenta en un momento"],
            producto: "No disponible",
            consejo: "Asegúrate de tener buena señal.",
            urgencia: "Media"
        };
    }
}

window.consultarExpertoIA = consultarExpertoIA;