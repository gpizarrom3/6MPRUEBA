const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Permite la comunicación con Vercel
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Confirmación visual al entrar a la URL de Render
app.get('/', (req, res) => {
  res.send('Servidor de Auditoría 6M activo y listo en server.js');
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    
    // Modelo detectado en tu PowerShell
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
      generationConfig: {
        temperature: 0.1, 
      }
    });

    const responseText = result.response.text();
    console.log("Respuesta bruta de la IA:", responseText);

    // EXTRACTOR DE JSON: Busca el primer '{' y el último '}'
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("La IA no devolvió un formato JSON válido");
    }

    const jsonString = responseText.substring(startIdx, endIdx + 1);
    
    // Enviamos el JSON puro al frontend
    res.json(JSON.parse(jsonString));

  } catch (error) {
    console.error("Error detallado en el servidor:", error);
    res.status(500).json({ error: "Error al procesar los datos de la IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
