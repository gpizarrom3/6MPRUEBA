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
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
      generationConfig: {
        temperature: 0.1, // Bajamos la temperatura para que sea más preciso y menos "hablador"
      }
    });

    const responseText = result.response.text();
    console.log("Respuesta bruta de la IA:", responseText); // Esto te servirá para ver el error en los logs

    // --- FUNCIÓN EXTRACTORA DE JSON ---
    // Esta parte busca el primer '{' y el último '}' para ignorar cualquier texto extra
    const startIdx = responseText.indexOf('{');
    const endIdx = responseText.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("La IA no devolvió un formato JSON válido");
    }

    const jsonString = responseText.substring(startIdx, endIdx + 1);
    
    // Parseamos el JSON limpio
    const finalData = JSON.parse(jsonString);
    res.json(finalData);

  } catch (error) {
    console.error("Error detallado en el servidor:", error);
    res.status(500).json({ error: "Error al procesar los datos de la IA" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
