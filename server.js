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
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    });

    // DETERMINAR SI ES ENTREVISTA O REPORTE FINAL
    const esReporteFinal = prompt.includes("RESPUESTAS");

    const systemPrompt = esReporteFinal 
      ? `Actúa como un Experto en Análisis de Causa Raíz (ACR). 
         Basado en las respuestas de la auditoría 6M, genera un informe final estrictamente en este formato JSON:
         {
           "resumen_6m": {
             "mano_de_obra": "resumen...",
             "maquinaria": "resumen...",
             "metodos": "resumen...",
             "materiales": "resumen...",
             "medio_ambiente": "resumen...",
             "medicion": "resumen..."
           },
           "hipotesis": "La causa raíz probable es...",
           "recomendaciones": ["rec 1", "rec 2", "rec 3"]
         }`
      : `Actúa como Auditor Senior 6M. Genera 6 preguntas críticas (una por cada M de Ishikawa) para investigar el fallo.
         Responde estrictamente en este formato JSON:
         {
           "preguntas": ["P1 (Mano Obra)", "P2 (Maquinaria)", "P3 (Métodos)", "P4 (Materiales)", "P5 (Medio Ambiente)", "P6 (Medición)"]
         }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
    });

    res.json(JSON.parse(result.response.text()));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor 6M listo`));
