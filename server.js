const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// RECUERDA: Configura GEMINI_API_KEY en Render (Environment Variables)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (tipo === "PREGUNTAS") {
      prompt = `Actúa como Auditor Senior de Mantenimiento Industrial. 
      Contexto: "${datos.contexto}". Síntoma: "${datos.sintomas}".
      Genera 6 categorías Ishikawa (Mano de Obra, Maquinaria, Métodos, Materiales, Medio Ambiente, Medición).
      Cada categoría debe tener 2 preguntas basadas en observaciones sensoriales.
      IMPORTANTE: Incluye un campo "riesgo" que explique la falla técnica si la respuesta es afirmativa.
      
      RESPONDE SOLO CON ESTE JSON:
      {
        "categorias": [
          {
            "nombre": "Maquinaria",
            "preguntas": [
              { "texto": "¿...?", "riesgo": "..." }
            ]
          }
        ]
      }`;
    } else {
      prompt = `Genera un INFORME TÉCNICO DE INGENIERÍA (ACR) basado en: ${JSON.stringify(datos.respuestas)}.
      Usa lenguaje técnico avanzado.
      RESPONDE ÚNICAMENTE CON ESTE JSON:
      {
        "id_informe": "ACR-${Math.floor(Math.random() * 9000) + 1000}",
        "resumen_ejecutivo": "...",
        "analisis_6m": {
          "Maquinaria": "...", "Material": "...", "Medio Ambiente": "...",
          "Metodo": "...", "Medicion": "...", "Mano de Obra": "..."
        },
        "hipotesis_raiz": "...",
        "conclusiones": ["...", "...", "..."],
        "plan_accion": ["...", "...", "..."]
      }`;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleanJson));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fallo en el motor de IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Backend 6M Activo"));
