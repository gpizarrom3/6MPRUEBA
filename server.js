const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// 1. CONFIGURACIÓN DE PERMISOS (CORS)
// Esto permite que tu frontend en Vercel se comunique con este backend en Render
app.use(cors());
app.use(express.json());

// 2. INICIALIZACIÓN DE LA IA
// Usamos la variable de entorno que configuraste en el panel de Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. RUTA DE PRUEBA (HEALTH CHECK)
// Si entras a la URL de Render, verás este mensaje si todo está OK
app.get('/', (req, res) => {
  res.send('Servidor de Auditoría 6M activo y funcionando con Gemini 2.5');
});

// 4. RUTA PRINCIPAL DE DIAGNÓSTICO
app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;

    // Configuración del modelo 2.5-flash (el más rápido de 2026)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1 // Baja temperatura para mayor precisión técnica
      }
    });

    // Llamada a la IA combinando el contexto y la instrucción del sistema
    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
    const responseText = result.response.text();

    // Intentamos parsear el JSON que nos envía Google
    try {
      const cleanJson = JSON.parse(responseText);
      res.json(cleanJson);
    } catch (parseError) {
      // Si la IA envía texto extra, lo limpiamos manualmente
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      const extractedJson = responseText.substring(startIdx, endIdx + 1);
      res.json(JSON.parse(extractedJson));
    }

  } catch (error) {
    console.error("ERROR EN EL SERVIDOR:", error);
    res.status(500).json({ 
      error: "Error en la comunicación con la IA",
      detalle: error.message 
    });
  }
});

// 5. INICIO DEL SERVIDOR
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
