const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
    });

    const esReporteFinal = prompt.includes("RESPUESTAS");

    const systemPrompt = esReporteFinal 
      ? `Actúa como Experto en ACR. Genera un informe técnico profesional.
         JSON: {
           "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
           "hipotesis": "...",
           "recomendaciones": ["...", "..."]
         }`
      : `Eres un Consultor Senior 6M. Analiza el fallo y genera TODAS las preguntas necesarias para un ALCANCE PRELIMINAR (sin pedir datos exactos). 
         Organiza por categorías de Ishikawa. Para cada pregunta, añade un 'aviso' o 'implicancia' técnica.
         JSON: {
           "categorias": [
             {
               "nombre": "Maquinaria",
               "preguntas": [
                 { "texto": "¿...", "aviso": "Las revisiones de hardware deben ser por personal certificado." }
               ]
             }
           ]
         }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
    });

    res.json(JSON.parse(result.response.text()));
  } catch (error) {
    res.status(500).json({ error: "Error en la IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor Pro 6M activo"));
