const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Esto permite que tu App en Vercel se comunique con este servidor en Render
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Página de confirmación para ver en el navegador
app.get('/', (req, res) => {
  res.send('Servidor de Auditoría 6M activo y listo en server.js');
});

// Ruta de diagnóstico que llama tu Frontend
app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt, systemPrompt, schema } = req.body;
// ... dentro de app.post('/api/diagnostico', ...)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // <--- Asegúrate de que diga 2.5-flash
  generationConfig: { responseMimeType: "application/json" }
});

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt }
    ]);

    res.json(JSON.parse(result.response.text()));
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ error: "Error en la comunicación con la IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
