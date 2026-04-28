const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors({
  origin: [
    'https://6-mpruebafrontend.vercel.app',
    'https://6-mpruebafrontend-git-main-guillermos-projects-bff23201.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  // Nombres de modelos estándar que NO fallan (v1/v1beta)
  const modelos = ["gemini-1.5-flash", "gemini-pro"];
  
  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Eres un experto en ACR. Responde únicamente con un objeto JSON: {"hipotesis": "...", "recomendaciones": []}`
    : `Eres un consultor 6M. Responde únicamente con un objeto JSON: {"categorias": [{"nombre": "...", "preguntas": [{"texto": "..."}]}]}`;

  for (const nombre of modelos) {
    try {
      console.log(`Intentando con: ${nombre}`);
      const model = genAI.getGenerativeModel({ model: nombre });
      
      const result = await model.generateContent(systemPrompt + "\n\nDATOS: " + prompt);
      const text = result.response.text();

      // ESTO ES CLAVE: Extrae el JSON incluso si la IA manda basura alrededor
      const jsonMatch = text.match(/\{[\s\S]*\}/); 
      if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta");
      
      const cleanJson = JSON.parse(jsonMatch[0]);
      console.log(`✅ Éxito con ${nombre}`);
      return res.json(cleanJson);

    } catch (error) {
      console.error(`Error en ${nombre}:`, error.message);
      continue; 
    }
  }

  res.status(500).json({ error: "Todos los modelos fallaron. Revise su API KEY o cuota." });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR.RADIX estable."));
