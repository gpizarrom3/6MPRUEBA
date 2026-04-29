const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// RECUERDA: Configura GEMINI_API_KEY en las variables de entorno de Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    let systemPrompt = "";

    if (tipo === "PREGUNTAS") {
      systemPrompt = `Actúa como Auditor Senior 6M. Genera preguntas para un ALCANCE PRELIMINAR basadas en los SENTIDOS (vista, oído, tacto, olfato). 
      NO pidas datos duros o medidas exactas. 
      Estructura el JSON así:
      {
        "categorias": [
          {
            "nombre": "Mano de Obra",
            "preguntas": [{ "texto": "¿Notas cansancio en el personal?", "aviso": "El factor humano es el 70% de los fallos." }]
          },
          { "nombre": "Maquinaria", "preguntas": [...] },
          { "nombre": "Métodos", "preguntas": [...] },
          { "nombre": "Materiales", "preguntas": [...] },
          { "nombre": "Medio Ambiente", "preguntas": [...] },
          { "nombre": "Medición", "preguntas": [...] }
        ]
      }`;
    } else {
      systemPrompt = `Genera un Informe de Causa Raíz (ACR) basado en las 6M.
      JSON: {
        "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
        "resumen_general": "...",
        "hipotesis": "...",
        "recomendaciones": ["...", "..."]
      }`;
    }

    const result = await model.generateContent(systemPrompt + "\n\nDatos: " + JSON.stringify(datos));
    res.json(JSON.parse(result.response.text()));
  } catch (error) {
    res.status(500).json({ error: "Error en el motor de IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor 6M en puerto ${PORT}`));
