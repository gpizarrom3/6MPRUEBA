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

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  // Usamos los nombres que Google garantiza que NO dan 404
  const modelos = ["gemini-1.5-flash", "gemini-1.5-pro"];
  
  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Eres un experto en ACR. Responde SOLO en JSON con este formato: {"hipotesis": "...", "recomendaciones": []}`
    : `Eres un consultor 6M. Responde SOLO en JSON con este formato: {"categorias": [{"nombre": "...", "preguntas": [{"texto": "..."}]}]}`;

  for (const nombreModelo of modelos) {
    try {
      console.log(`Intentando con: ${nombreModelo}`);
      const model = genAI.getGenerativeModel({ model: nombreModelo });
      const result = await model.generateContent(systemPrompt + "\n\nDATOS: " + prompt);
      const response = await result.response;
      const text = response.text();
      
      // Limpieza de JSON
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return res.json(JSON.parse(cleanJson));

    } catch (error) {
      console.error(`Falla en ${nombreModelo}:`, error.message);
      continue; // Si falla uno, prueba el otro
    }
  }

  res.status(503).json({ error: "No se pudo conectar con Gemini. Reintente." });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR Activo"));
