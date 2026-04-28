const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Evita el error "Cannot GET /"
app.get('/', (req, res) => {
  res.send("ACR.RADIX Server - Online");
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // RESTAURADO: Volvemos al modelo que SÍ te funcionaba
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
    });

    const esReporteFinal = prompt.includes("RESPUESTAS");

    const systemPrompt = esReporteFinal 
      ? `Actúa como Experto en ACR. Genera un informe técnico profesional.
         Responde ESTRICTAMENTE en este formato JSON:
         {
           "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
           "hipotesis": "...",
           "recomendaciones": ["...", "..."]
         }`
      : `Eres un Consultor Senior 6M. Analiza el fallo y genera TODAS las preguntas necesarias para un ALCANCE PRELIMINAR. 
         Organiza por categorías de Ishikawa. Para cada pregunta, añade un 'aviso' técnico.
         Responde ESTRICTAMENTE en este formato JSON:
         {
           "categorias": [
             {
               "nombre": "Maquinaria",
               "preguntas": [
                 { "texto": "¿...", "aviso": "..." }
               ]
             }
           ]
         }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
    });

    // --- EL CAMBIO VITAL AQUÍ ---
    const responseText = result.response.text();
    
    // Limpiamos la respuesta de posibles bloques de código markdown (```json ... ```)
    // que es lo que rompe el JSON.parse y causa el Error 500
    const cleanJson = responseText.replace(/```json|```/g, "").trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      res.json(parsedData);
    } catch (parseError) {
      console.error("Error al parsear JSON:", responseText);
      // Si falla el parseo, enviamos un objeto con la hipótesis cruda para no perder la info
      res.json({ 
        hipotesis: "Error de formato en IA, revise logs.",
        error_raw: responseText 
      });
    }

  } catch (error) {
    console.error("ERROR EN LA IA:", error);
    res.status(500).json({ error: "Falla en el motor de IA", details: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR.RADIX activo con gemini-2.5-flash"));
