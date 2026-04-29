const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// RECUERDA: Configura tu API Key en Render -> Environment -> GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    
    // Mantenemos tu versión específica
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    let prompt = "";

    if (tipo === "PREGUNTAS") {
      prompt = `Actúa como un experto en manufactura y el método Ishikawa. 
      Analiza este contexto: "${datos.contexto}" y este síntoma: "${datos.sintomas}".
      Genera 6 categorías (Mano de Obra, Maquinaria, Métodos, Materiales, Medio Ambiente, Medición).
      Para cada categoría crea 2 preguntas sensoriales.
      RESPONDE EXCLUSIVAMENTE EN FORMATO JSON PURO, sin textos extras:
      {
        "categorias": [
          {
            "nombre": "Mano de Obra",
            "preguntas": [
              { "texto": "¿Ves signos de fatiga?", "aviso": "Observación humana" }
            ]
          }
        ]
      }`;
    } else {
      prompt = `Genera un reporte de causa raíz basado en estas respuestas sensoriales: ${JSON.stringify(datos.respuestas)}.
      RESPONDE EXCLUSIVAMENTE EN FORMATO JSON PURO:
      {
        "resumen_6m": { "Mano de Obra": "resumen...", "Maquinaria": "resumen..." },
        "hipotesis": "causa probable...",
        "recomendaciones": ["rec 1", "rec 2"]
      }`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // LIMPIEZA DE SEGURIDAD (Quita ```json ... ``` si la IA los pone)
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    try {
      const parsedData = JSON.parse(cleanJson);
      res.json(parsedData);
    } catch (parseError) {
      console.error("Error parseando JSON de la IA:", text);
      res.status(500).json({ error: "La IA entregó un formato inválido" });
    }

  } catch (error) {
    console.error("Error crítico en Render:", error);
    res.status(500).json({ error: "Fallo en la conexión con Gemini 2.5", detalle: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor 6M en puerto ${PORT}`));
