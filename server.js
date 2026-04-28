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
  
  // Usamos el modelo estable
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    console.log("--- NUEVA PETICIÓN RECIBIDA ---");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("RESPUESTA CRUDA DE IA:", text);

    // Buscador de JSON ultra-seguro
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1 || end === 0) {
      console.error("La IA no envió un JSON válido");
      return res.status(500).json({ error: "Formato IA inválido", raw: text });
    }

    const cleanJson = JSON.parse(text.substring(start, end));
    return res.json(cleanJson);

  } catch (error) {
    // ESTO NOS DIRÁ EL ERROR REAL EN LOS LOGS DE RENDER
    console.error("ERROR CRÍTICO EN MOTOR:", error.message);
    
    res.status(500).json({ 
      error: "Error interno del servidor", 
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR.RADIX blindado y activo"));
