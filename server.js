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
    const { prompt, systemPrompt } = req.body;
    
    // Inicializamos el modelo 2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Configuramos la generación de forma más compatible
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
      generationConfig: {
        // Quitamos el responseMimeType de aquí si la librería da problemas
        // y nos aseguramos de que el prompt pida JSON explícitamente
        temperature: 0.7,
      }
    });

    const responseText = result.response.text();
    
    // Limpiamos la respuesta por si la IA añade bloques de código Markdown (```json)
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ error: "Error en la comunicación con la IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
