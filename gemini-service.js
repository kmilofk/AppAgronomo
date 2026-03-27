// gemini-service.js - Versión corregida con modelo válido
console.log("🔄 Cargando gemini-service.js...");

const GEMINI_API_KEY = "AIzaSyAzg62__McFpjBQW_xgXndJkPBQyopdOQo";
// ✅ USAR UN MODELO VÁLIDO - Gemini 2.5 Flash
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function consultarExpertoIA(promptUsuario, imagenBase64 = null, mimeType = "image/jpeg") {
    console.log("🔍 consultarExpertoIA llamada con:");
    console.log("- Prompt:", promptUsuario?.substring(0, 50) + "...");
    console.log("- Tiene imagen:", !!imagenBase64);
    console.log("- MimeType:", mimeType);

    try {
        const systemPrompt = `Eres un Ingeniero Agrónomo experto en cultivos tropicales de Colombia.
Tu objetivo es diagnosticar problemas en plantas a partir de imágenes y descripciones.

REGLAS IMPORTANTES:
1. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional fuera del JSON.
2. NO uses markdown, asteriscos, negritas, cursivas ni ningún formato especial.
3. Los textos deben ser en español sencillo y plano.
4. Los tratamientos deben ser un ARRAY de strings, cada uno una acción concreta y corta.
5. NO incluyas números ni viñetas en los strings del array de tratamientos.

Ejemplo de respuesta esperada:
{
  "diagnostico": "La planta presenta antracnosis, una enfermedad fúngica que causa manchas oscuras en hojas y frutos",
  "tratamiento": ["Podar las hojas y ramas afectadas", "Aplicar fungicida a base de cobre", "Mejorar la ventilación entre plantas"],
  "producto": "Fungicida cúprico 5g por litro de agua",
  "consejo": "Realiza aplicaciones cada 7 días hasta controlar la enfermedad",
  "urgencia": "Media"
}`;

        // Construir el prompt completo
        let fullPrompt = `${systemPrompt}\n\nPregunta del agricultor: ${promptUsuario}\n\nAnaliza la imagen y proporciona el diagnóstico en formato JSON.`;

        // Construir los contenidos para Gemini
        const parts = [{ text: fullPrompt }];

        // Si hay imagen, agregarla
        if (imagenBase64 && imagenBase64.trim() !== "") {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: imagenBase64
                }
            });
        }

        const requestBody = {
            contents: [{
                parts: parts
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
                topP: 0.95
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        console.log("📤 Enviando petición a Gemini con modelo: gemini-2.5-flash");

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log("📥 Respuesta recibida. Status:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Error HTTP completo:", errorData);
            throw new Error(errorData.error?.message || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Datos recibidos de Gemini");

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No se recibió respuesta de Gemini");
        }

        let rawText = data.candidates[0].content.parts[0].text;
        console.log("📝 Respuesta cruda:", rawText);

        // Extraer JSON
        function extractJSON(text) {
            let cleaned = text.replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }

            return cleaned;
        }

        const jsonString = extractJSON(rawText);
        console.log("🔧 JSON a parsear:", jsonString);

        let jsonResult;
        try {
            jsonResult = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("⚠️ Error parseando JSON:", parseError);
            jsonResult = {
                diagnostico: rawText.substring(0, 200),
                tratamiento: ["Consulta con un agrónomo especialista"],
                producto: "No aplica",
                consejo: "Envía la imagen nuevamente con mejor iluminación",
                urgencia: "Media"
            };
        }

        // Validar estructura
        const result = {
            diagnostico: jsonResult.diagnostico || "No se pudo determinar",
            tratamiento: Array.isArray(jsonResult.tratamiento) ? jsonResult.tratamiento : ["Consulta con especialista"],
            producto: jsonResult.producto || "No aplica",
            consejo: jsonResult.consejo || "Mantén monitoreo constante",
            urgencia: jsonResult.urgencia || "Media"
        };

        console.log("✨ Resultado final:", result);
        return result;

    } catch (error) {
        console.error("❌ Error en consultarExpertoIA:", error);
        return {
            diagnostico: "Error al conectar con el servicio. Intenta nuevamente.",
            tratamiento: ["Verifica tu conexión a internet", "Reintenta en unos momentos"],
            producto: "No disponible",
            consejo: "Contacta a tu agrónomo de confianza",
            urgencia: "Media"
        };
    }
}

// Exportar para uso global
window.consultarExpertoIA = consultarExpertoIA;
console.log("✅ gemini-service.js cargado correctamente. Modelo: gemini-2.5-flash");