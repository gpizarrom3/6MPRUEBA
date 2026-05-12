const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { tipo, datos } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // USA el prompt completo que viene del frontend, sin reemplazarlo
    const prompt = datos.instruccion;

    console.log(`[${tipo}] Prompt recibido (primeros 300 chars):`, prompt?.substring(0, 300));

    if (!prompt) {
      return res.status(400).json({ error: "No se recibió ningún prompt (datos.instruccion vacío)." });
    }

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

        const cleanJson = text.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);

        res.json(data);
        success = true;
        console.log(`Éxito en intento ${intentos + 1}`);

      } catch (error) {
        intentos++;
        lastError = error;

        if (error.message.includes("503") || error.message.includes("504") || error.message.includes("demand")) {
          const waitTime = intentos * 2000;
          console.warn(`Gemini ocupado. Reintentando en ${waitTime / 1000}s...`);
          await sleep(waitTime);
        } else {
          console.error("Error no recuperable:", error.message);
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
app.listen(PORT, () => console.log(`Motor 6M operativo en puerto ${PORT}`));
