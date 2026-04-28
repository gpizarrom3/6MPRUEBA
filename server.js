const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

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
  res.send("ACR.RADIX Core - Resiliencia Activa (v2.2)");
});

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  // ELIMINADO EL '-latest': Usamos los nombres base que son más estables para la API
  const modelosPrioritarios = ["gemini-2.5-flash", "gemini-1.5-flash"];
  
  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Actúa como Experto en ACR Industrial. Genera un dictamen profesional en JSON.`
    : `Eres un consultor 6M. Genera un cuestionario técnico en JSON.`;

  for (const nombreModelo of modelosPrioritarios) {
    try {
      console.log(`Intentando conexión con: ${nombreModelo}...`);
      const model = genAI.getGenerativeModel({ 
        model: nombreModelo,
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
      });

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      console.log(`✅ Éxito con: ${nombreModelo}`);
      return res.json(JSON.parse(cleanJson));

    } catch (error) {
      // Si el error es 404 (No encontrado) o 503 (Saturado), saltamos al siguiente
      if (error.message.includes('404') || error.message.includes('503')) {
        console.warn(`[AVISO] Modelo ${nombreModelo} no disponible o no encontrado. Probando respaldo...`);
        continue; 
      }
      
      console.error(`Error crítico en ${nombreModelo}:`, error.message);
      return res.status(500).json({ error: "Falla en motor de IA", details: error.message });
    }
  }

  res.status(503).json({ 
    error: "Modelos no encontrados o saturados", 
    details: "Verifique que los nombres de los modelos en su plan de Google AI Studio coincidan." 
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("ACR.RADIX: Motor corregido y escuchando."));
