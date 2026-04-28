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
  
  // NOMBRES OFICIALES 2026: gemini-1.5-flash es el estándar de mayor compatibilidad
  const modeloTitular = "gemini-1.5-flash";
  
  const esReporteFinal = prompt.includes("RESPUESTAS");
  const systemPrompt = esReporteFinal 
    ? `Eres un experto en ACR. Responde UNICAMENTE un objeto JSON: {"hipotesis": "...", "recomendaciones": []}`
    : `Eres un consultor 6M. Responde UNICAMENTE un objeto JSON: {"categorias": [{"nombre": "...", "preguntas": [{"texto": "..."}]}]}`;

  try {
    console.log(`Conectando con ${modeloTitular}...`);
    const model = genAI.getGenerativeModel({ model: modeloTitular });
    
    const result = await model.generateContent(systemPrompt + "\n\nDATOS: " + prompt);
    const text = result.response.text();

    // EXTRACCIÓN DE SEGURIDAD: Busca el JSON incluso si hay texto extra
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    const jsonString = text.substring(start, end);
    
    const cleanJson = JSON.parse(jsonString);
    console.log("✅ Respuesta procesada con éxito");
    return res.json(cleanJson);

  } catch (error) {
    console.error(`Error en el motor:`, error.message);
    
    // Si el error es de cuota o saturación, devolvemos un mensaje claro
    const status = error.message.includes('503') ? 503 : 500;
    return res.status(status).json({ 
      error: "Error en el motor de IA", 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR.RADIX en línea con Gemini 1.5 Flash"));
