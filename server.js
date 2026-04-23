const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => res.send('Servidor 6M Operativo'));

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    
    // Configuramos el modelo para que OBLIGATORIAMENTE responda en JSON
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
    const responseText = result.response.text();
    
    // Como pedimos responseMimeType, la respuesta ya viene como JSON puro
    res.json(JSON.parse(responseText));

  } catch (error) {
    console.error("ERROR REAL:", error);
    res.status(500).json({ error: "Fallo en Gemini", detalle: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Puerto ${PORT}`));
