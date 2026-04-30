const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// RECUERDA: Configura GEMINI_API_KEY en Render -> Dashboard -> Environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    
    // Si falla con 2.5-flash, intenta cambiar temporalmente a 1.5-flash para descartar disponibilidad
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (tipo === "PREGUNTAS") {
      prompt = `Actúa como Auditor Senior. Contexto: ${datos.contexto}, Síntoma: ${datos.sintomas}.
      Genera un JSON con 6 categorías Ishikawa (Mano de Obra, Maquinaria, Métodos, Materiales, Medio Ambiente, Medición).
      Cada una con 2 preguntas sensoriales y un campo "riesgo" técnico.
      RESPONDE SOLO EL JSON, SIN COMENTARIOS NI MARKDOWN:
      { "categorias": [ { "nombre": "...", "preguntas": [{ "texto": "...", "riesgo": "..." }] } ] }`;
    } else {
    // IMPORTANTE: Este prompt obliga a la IA a seguir el formato Premium
    prompt = `Genera un INFORME TÉCNICO DE INGENIERÍA (ACR) basado en estas respuestas 6M: ${JSON.stringify(datos.respuestas)}.
    
    RESPONDE EXCLUSIVAMENTE CON ESTE FORMATO JSON:
    {
      "id_informe": "ACR-7039",
      "resumen_ejecutivo": "Aquí va un párrafo técnico sobre el hallazgo...",
      "analisis_6m": {
        "Maquinaria": "Descripción técnica...",
        "Material": "Descripción técnica...",
        "Medio Ambiente": "Descripción técnica...",
        "Metodo": "Descripción técnica...",
        "Medicion": "Descripción técnica...",
        "Mano de Obra": "Descripción técnica..."
      },
      "hipotesis_raiz": "La causa raíz probable es...",
      "conclusiones": ["Conclusión 1", "Conclusión 2", "Conclusión 3"],
      "plan_accion": ["Acción 1", "Acción 2", "Acción 3"]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // LIMPIEZA CRÍTICA: Elimina bloques de código Markdown si la IA los incluye
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    try {
      const data = JSON.parse(cleanJson);
      res.json(data);
    } catch (e) {
      console.error("Fallo al parsear JSON. Contenido original:", text);
      res.status(500).json({ error: "La IA no devolvió un JSON válido.", raw: text });
    }

  } catch (error) {
    // Esto aparecerá en los logs de Render
    console.error("ERROR CRÍTICO EN BACKEND:", error.message);
    res.status(500).json({ error: "Fallo interno en el servidor", mensaje: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Motor 6M operando en puerto ${PORT}`));
