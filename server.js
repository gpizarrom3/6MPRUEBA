const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  
  // Usamos el nombre que Google reconoce universalmente para evitar el 404
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extractor de JSON para evitar que texto extra rompa el servidor
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    if (start === -1) {
      return res.status(500).json({ error: "La IA no respondió en formato JSON" });
    }

    return res.json(JSON.parse(text.substring(start, end)));
  } catch (error) {
    console.error("Error en servidor:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR.RADIX listo"));
