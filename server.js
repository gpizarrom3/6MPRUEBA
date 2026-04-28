const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Configuración de CORS con todas tus URLs permitidas
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
  
  // Usamos el modelo más estable para evitar caídas
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Eres un experto en ACR. Responde estrictamente en formato JSON: {"hipotesis": "...", "recomendaciones": []}`
    : `Eres un consultor 6M. Responde estrictamente en formato JSON: {"categorias": [{"nombre": "...", "preguntas": [{"texto": "..."}]}]}`;

  try {
    const result = await model.generateContent(systemPrompt + "\n\nDATOS: " + prompt);
    const text = result.response.text();

    // Extractor de JSON para evitar errores por texto extra de la IA
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    const jsonString = text.substring(start, end);
    
    return res.json(JSON.parse(jsonString));

  } catch (error) {
    console.error("Error en servidor:", error.message);
    res.status(500).json({ error: "Falla en IA", details: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR Operativo"));
