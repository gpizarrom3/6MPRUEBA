const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Configuración de seguridad para tu frontend en Vercel
app.use(cors({
  origin: 'https://6-mpruebafrontend-git-main-guillermos-projects-bff23201.vercel.app'
})); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send("ACR.RADIX Core - Engine 2.5 (Modo de Alta Precisión)");
});

// Función de apoyo para esperar (delay)
const wait = (ms) => new Promise(res => setTimeout(res, ms));

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
  });

  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Actúa como Experto en ACR. Genera un informe técnico profesional en JSON.`
    : `Eres un Consultor Senior 6M. Genera un cuestionario técnico en JSON.`;

  let intentos = 0;
  const maxIntentos = 3;

  while (intentos < maxIntentos) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
      });

      const responseText = result.response.text();
      // Limpieza vital para evitar el "No disponible"
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      return res.json(JSON.parse(cleanJson));

    } catch (error) {
      intentos++;
      console.error(`Intento ${intentos} fallido:`, error.message);

      // Si es un error de saturación (503) y no hemos superado los intentos, esperamos 3 segundos
      if (error.message.includes('503') && intentos < maxIntentos) {
        console.log("Servidor saturado. Reintentando en 3 segundos...");
        await wait(3000); 
      } else {
        // Si es otro tipo de error o ya no hay más intentos, enviamos la falla
        return res.status(500).json({ 
          error: "Falla en el motor de IA", 
          details: error.message 
        });
      }
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("ACR.RADIX: Motor 2.5 Flash con Reintento Activo"));
