const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Configuración de Middlewares
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Confirmación de estado para Render
app.get('/', (req, res) => {
  res.send('Servidor Auditoría 6M - Motor de Inferencia Activo (v3.0 - 2026)');
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // 1. Configuración del Modelo Gemini 2.5
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Un poco de creatividad pero controlada
      }
    });

    // 2. INSTRUCCIÓN MAESTRA (Asegura que React reciba lo que espera)
    const systemPrompt = `
      Eres un experto en el diagrama de Ishikawa y la metodología de Auditoría 6M.
      Tu objetivo es analizar el fallo reportado y generar exactamente 6 preguntas críticas para encontrar la causa raíz.
      
      Debes clasificar las preguntas en las siguientes categorías:
      1. Mano de Obra (Personal)
      2. Maquinaria (Equipos/Herramientas)
      3. Métodos (Procesos)
      4. Materiales (Insumos/Componentes)
      5. Medio Ambiente (Entorno de trabajo)
      6. Medición (Datos/Calibración)

      REGLA DE ORO: Responde ÚNICAMENTE con un objeto JSON que tenga la clave "preguntas" como un array de strings.
      Formato esperado:
      {
        "preguntas": [
          "Pregunta sobre Mano de Obra...",
          "Pregunta sobre Maquinaria...",
          "Pregunta sobre Métodos...",
          "Pregunta sobre Materiales...",
          "Pregunta sobre Medio Ambiente...",
          "Pregunta sobre Medición..."
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ 
          text: systemPrompt + "\n\nFALLO REPORTADO POR EL USUARIO: " + prompt 
        }] 
      }],
    });

    const responseText = result.response.text();
    console.log("Respuesta de Gemini:", responseText);

    // 3. Sistema de Parseo Resiliente
    try {
      const data = JSON.parse(responseText);
      
      // Verificamos que contenga la clave "preguntas" antes de enviar
      if (data.preguntas && Array.isArray(data.preguntas)) {
        res.json(data);
      } else {
        throw new Error("El JSON no contiene el array de preguntas");
      }
      
    } catch (parseError) {
      // Extractor de emergencia si la IA ensucia el JSON
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonString = responseText.substring(startIdx, endIdx + 1);
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("Estructura de datos incompatible con el Frontend");
      }
    }

  } catch (error) {
    console.error("Error en el flujo de IA:", error);
    res.status(500).json({ 
      error: "Error al procesar los datos de la IA",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor de Producción 6M corriendo en puerto ${PORT}`);
});
