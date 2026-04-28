const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

// Inicializa la IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send("ACR.RADIX Core - Engine 3.0 Operacional");
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt } = req.body;

    // --- CAMBIO CLAVE: USAMOS GEMINI 3 FLASH (El estándar de 2026) ---
    // Si prefieres usar la versión estable anterior, usa "gemini-1.5-flash"
    // pero asegúrate de que tu librería esté actualizada: npm install @google/generative-ai@latest
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash", // <--- Nombre actualizado
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.2 
      }
    });

    const esReporteFinal = prompt.includes("RESPUESTAS");

    const systemPrompt = esReporteFinal 
      ? `Actúa como Experto en ACR Forense. Genera un dictamen técnico en JSON:
         {
           "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
           "hipotesis": "...",
           "recomendaciones": ["...", "..."]
         }`
      : `Eres un Consultor Senior 6M. Genera un protocolo de preguntas 6M en JSON:
         {
           "categorias": [
             {
               "nombre": "...",
               "preguntas": [ { "texto": "...", "aviso": "..." } ]
             }
           ]
         }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
    });

    const responseText = result.response.text();
    
    // Limpieza de seguridad por si la IA incluye markdown
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    res.json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("ERROR EN MOTOR ACR:", error);
    
    // Si vuelve a dar 404, este mensaje te ayudará a diagnosticar
    res.status(500).json({ 
      error: "Falla de vinculación con Gemini", 
      details: error.message,
      suggestion: "Verifica que tu API Key tenga acceso al modelo gemini-3-flash o actualiza el paquete @google/generative-ai"
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("ACR.RADIX: Motor de IA iniciado."));
