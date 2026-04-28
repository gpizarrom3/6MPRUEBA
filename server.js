const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Lista de URLs permitidas (Vercel + Local)
const originsPermitidos = [
  'https://6-mpruebafrontend.vercel.app',
  'https://6-mpruebafrontend-git-main-guillermos-projects-bff23201.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: originsPermitidos,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send("ACR.RADIX Server - Exclusivo Gemini 2.5 Flash");
});

// Función de espera para reintentos
const wait = (ms) => new Promise(res => setTimeout(res, ms));

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  // CONFIGURACIÓN ÚNICA: Solo usamos tu modelo de pago
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
  });

  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Actúa como Experto en ACR Industrial. Genera un dictamen profesional en JSON.`
    : `Eres un consultor 6M. Genera un cuestionario técnico en JSON.`;

  let intentos = 0;
  const maxIntentos = 3;

  while (intentos < maxIntentos) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
      });

      const responseText = result.response.text();
      // Limpiamos el JSON por si viene con etiquetas markdown
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      return res.json(JSON.parse(cleanJson));

    } catch (error) {
      intentos++;
      console.error(`Intento ${intentos} fallido con 2.5 Flash:`, error.message);

      // Si es un error de saturación (503), esperamos y reintentamos con el MISMO modelo
      if (error.message.includes('503') && intentos < maxIntentos) {
        await wait(3000); 
      } else if (intentos === maxIntentos) {
        return res.status(503).json({ 
          error: "Saturación en Google 2.5", 
          details: "El modelo está bajo alta demanda. Reintente en un momento." 
        });
      } else if (!error.message.includes('503')) {
        // Si es otro tipo de error (como seguridad o formato), cortamos de inmediato
        return res.status(500).json({ error: "Falla interna", details: error.message });
      }
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Backend ACR.RADIX: Corriendo con Gemini 2.5"));
