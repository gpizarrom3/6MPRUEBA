const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// 1. CONFIGURACIÓN DE CORS (Links de Vercel + Local)
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
  res.send("ACR.RADIX Core - Resiliencia Activa (2.5 + Fallback)");
});

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  // ESTRATEGIA: El 2.5 es el titular. El 1.5 es el respaldo si el 2.5 colapsa.
  // Ambos consumen de tus 10.000 CLP de saldo.
  const modelosPrioritarios = ["gemini-2.5-flash-latest", "gemini-1.5-flash-latest"];
  
  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Actúa como Experto en ACR Industrial. Genera un dictamen profesional en JSON.`
    : `Eres un consultor 6M. Genera un cuestionario técnico en JSON.`;

  for (const nombreModelo of modelosPrioritarios) {
    try {
      console.log(`Solicitando diagnóstico a: ${nombreModelo}...`);
      const model = genAI.getGenerativeModel({ 
        model: nombreModelo,
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
      });

      const responseText = result.response.text();
      // Limpieza de etiquetas JSON para evitar el "No disponible"
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      console.log(`Éxito con modelo: ${nombreModelo}`);
      return res.json(JSON.parse(cleanJson));

    } catch (error) {
      // Si el error es 503 (Saturación), intentamos con el siguiente modelo de la lista
      if (error.message.includes('503')) {
        console.warn(`[AVISO] Modelo ${nombreModelo} saturado. Saltando al respaldo...`);
        continue; 
      }
      
      // Si es otro tipo de error, lo reportamos directamente
      console.error(`Error crítico en ${nombreModelo}:`, error.message);
      return res.status(500).json({ error: "Falla en motor de IA", details: error.message });
    }
  }

  // Si llegamos aquí, es que ambos modelos fallaron (caso muy raro con cuenta de pago)
  res.status(503).json({ 
    error: "Servidores de Google en mantenimiento", 
    details: "Por favor, reintente en 30 segundos." 
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("ACR.RADIX: Motor industrial encendido."));
