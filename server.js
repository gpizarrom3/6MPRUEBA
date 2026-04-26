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
  res.send('Servidor de Auditoría 6M activo y listo (Versión Blindada v2)');
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    
    // 1. Configuración del modelo con MimeType JSON (Esto obliga a la IA a no hablar de más)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // He bajado a 1.5 por estabilidad, pero puedes usar 2.0 si prefieres
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, 
      }
    });

    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ 
          text: systemPrompt + "\n\nINSTRUCCIÓN FINAL: Responde únicamente con el objeto JSON. Sin introducciones ni formatos markdown.\n\n" + prompt 
        }] 
      }],
    });

    const responseText = result.response.text();
    console.log("Respuesta recibida de la IA:", responseText);

    // 2. Intento de parseo directo
    try {
      const jsonData = JSON.parse(responseText);
      res.json(jsonData);
    } catch (parseError) {
      console.warn("Fallo el parseo directo, intentando extracción manual...");
      
      // 3. Extractor de emergencia (Tu código original mejorado)
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = responseText.substring(startIdx, endIdx + 1);
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("La IA no generó una estructura JSON válida");
      }
    }

  } catch (error) {
    console.error("Error detallado en el servidor:", error);
    res.status(500).json({ 
      error: "Error al procesar los datos de la IA",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
