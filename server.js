const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Se obtiene de las variables de entorno para mayor seguridad
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

app.post('/api/diagnostico', async (req, res) => {
  const { prompt, systemPrompt, schema } = req.body;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    });
    
    const result = await response.json();
    const aiResponse = JSON.parse(result.candidates[0].content.parts[0].text);
    res.json(aiResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la comunicación con la IA' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));