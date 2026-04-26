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
  res.send('Servidor de Auditoría 6M activo - Versión 2.5 Pro (2026)');
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    
    // 1. Configuración con el modelo correcto para 2026
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Modelo actualizado y detectado en tu sistema
      generationConfig: {
        responseMimeType: "application/json", // Fuerza a la IA a responder solo JSON
        temperature: 0.1, 
      }
    });

    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ 
          text: systemPrompt + "\n\nIMPORTANTE: Responde únicamente con un objeto JSON válido. No incluyas texto extra.\n\n" + prompt 
        }] 
      }],
    });

    const responseText = result.response.text();
    console.log("Respuesta técnica de la IA:", responseText);

    // 2. Sistema de Doble Validación (Parsing)
    try {
      // Intento A: Parseo directo (lo más rápido)
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (parseError) {
      console.warn("Fallo el parseo directo, activando extractor de emergencia...");
      
      // Intento B: Extracción manual de llaves { } por si la IA metió ruido
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = responseText.substring(startIdx, endIdx + 1);
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("La IA no generó una estructura de datos válida");
      }
    }

  } catch (error) {
    console.error("Error crítico en el backend:", error);
    res.status(500).json({ 
      error: "Error al procesar los datos de la IA",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Motor de Auditoría corriendo en puerto ${PORT}`);
});
