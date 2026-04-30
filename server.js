const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// RECUERDA: Configura GEMINI_API_KEY en Render -> Dashboard -> Environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Función auxiliar para pausas (Retry Delay)
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (tipo === "PREGUNTAS") {
      prompt = `Actúa como Auditor Senior de Ingeniería. Contexto: ${datos.contexto}, Síntoma: ${datos.sintomas}.
      Genera un JSON con 6 categorías Ishikawa (Mano de Obra, Maquinaria, Métodos, Materiales, Medio Ambiente, Medición).
      Cada categoría con 2 preguntas sensoriales (oído, vista, tacto, olfato).
      IMPORTANTE: Cada pregunta DEBE incluir un campo "riesgo" técnico detallado.
      RESPONDE SOLO EL JSON PURO:
      { "categorias": [ { "nombre": "...", "preguntas": [{ "texto": "...", "riesgo": "..." }] } ] }`;
    } else {
      prompt = `Genera un INFORME TÉCNICO DE INGENIERÍA (ACR) basado en: ${JSON.stringify(datos.respuestas)}.
      Usa lenguaje técnico avanzado y profesional.
      RESPONDE EXCLUSIVAMENTE CON ESTE FORMATO JSON:
      {
        "id_informe": "ACR-${Math.floor(Math.random() * 9000) + 1000}",
        "resumen_ejecutivo": "Descripción técnica del hallazgo...",
        "analisis_6m": {
          "Maquinaria": "...", "Material": "...", "Medio Ambiente": "...",
          "Metodo": "...", "Medicion": "...", "Mano de Obra": "..."
        },
        "hipotesis_raiz": "Causa probable principal...",
        "conclusiones": ["...", "...", "..."],
        "plan_accion": ["...", "...", "..."]
      }`;
    }

    // --- LÓGICA DE REINTENTO (RETRY LOOP) ---
    let intentos = 0;
    const maxIntentos = 3;
    let success = false;
    let lastError = null;

    while (intentos < maxIntentos && !success) {
      try {
        console.log(`Intento ${intentos + 1} para ${tipo} con Gemini 2.5 Flash...`);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Limpieza de Markdown
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);
        
        res.json(data);
        success = true;
        console.log(`Éxito en Intento ${intentos + 1}`);

      } catch (error) {
        intentos++;
        lastError = error;
        
        // Si es error 503 (Servidor saturado), esperamos y reintentamos
        if (error.message.includes("503") || error.message.includes("504") || error.message.includes("demand")) {
          const waitTime = intentos * 2000;
          console.warn(`Gemini 2.5 ocupado. Reintentando en ${waitTime/1000}s...`);
          await sleep(waitTime);
        } else {
          // Si es otro error (como 400 o 401), rompemos el bucle
          break;
        }
      }
    }

    if (!success) {
      throw lastError;
    }

  } catch (error) {
    console.error("ERROR CRÍTICO EN BACKEND:", error.message);
    res.status(500).json({ 
      error: "Fallo en la comunicación con la IA", 
      mensaje: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Motor 6M (Exclusivo 2.5 Flash + Retry) operativo en puerto ${PORT}`));
