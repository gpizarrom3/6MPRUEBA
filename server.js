const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// 1. CONFIGURACIÓN DE CORS (LISTA DE INVITADOS VIP)
const originsPermitidos = [
  'https://6-mpruebafrontend.vercel.app', 
  'https://6-mpruebafrontend-git-main-guillermos-projects-bff23201.vercel.app', 
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || originsPermitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS: URL no autorizada'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// INICIALIZACIÓN DE GOOGLE AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// RUTA RAÍZ (Para saber que el servidor está vivo)
app.get('/', (req, res) => {
  res.send("ACR.RADIX Engine - Status: Operacional (Gemini 2.5 Active)");
});

// FUNCIÓN AUXILIAR PARA REINTENTOS (ESPERA EN MILISEGUNDOS)
const wait = (ms) => new Promise(res => setTimeout(res, ms));

// RUTA PRINCIPAL DE DIAGNÓSTICO
app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
  });

  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Actúa como Experto en ACR. Genera un dictamen técnico profesional. Responde estrictamente en JSON:
       {
         "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
         "hipotesis": "...",
         "recomendaciones": ["...", "..."]
       }`
    : `Eres un Consultor Senior 6M. Analiza el fallo y genera preguntas 6M. Responde estrictamente en JSON:
       {
         "categorias": [ { "nombre": "...", "preguntas": [ { "texto": "...", "aviso": "..." } ] } ]
       }`;

  let intentos = 0;
  const maxIntentos = 3;

  while (intentos < maxIntentos) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
      });

      const responseText = result.response.text();
      
      // LIMPIEZA DE MARCADO (Evita errores de parseo si la IA envía ```json)
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      const parsedData = JSON.parse(cleanJson);
      return res.json(parsedData);

    } catch (error) {
      intentos++;
      console.error(`Intento ${intentos} - Error:`, error.message);

      // Si el error es por saturación (503) reintentamos tras 3 segundos
      if (error.message.includes('503') && intentos < maxIntentos) {
        await wait(3000); 
      } else {
        // Si ya no hay más intentos o es otro error, respondemos con el fallo
        return res.status(500).json({ 
          error: "Falla en el motor de IA", 
          details: error.message 
        });
      }
    }
  }
});

// INICIO DEL SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`ACR.RADIX: Corriendo en puerto ${PORT}`));
