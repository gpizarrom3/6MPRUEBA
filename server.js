const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. SOLUCIÓN AL "Cannot GET /"
app.get('/', (req, res) => {
  res.send("Servidor ACR.RADIX Operacional - Motor Gemini Activo");
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // 2. MODELO CORREGIDO (Gemini 1.5 Flash es el actual y más rápido)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.2 // Bajamos un poco la temperatura para más precisión técnica
      }
    });

    const esReporteFinal = prompt.includes("RESPUESTAS");

    const systemPrompt = esReporteFinal 
      ? `Actúa como Experto en ACR. Genera un informe técnico profesional estrictamente en JSON.
         Estructura requerida:
         {
           "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
           "hipotesis": "...",
           "recomendaciones": ["...", "..."]
         }`
      : `Eres un Consultor Senior 6M. Analiza el fallo y genera preguntas para un ALCANCE PRELIMINAR. 
         Organiza por categorías de Ishikawa. Para cada pregunta, añade un 'aviso' técnico.
         JSON: {
           "categorias": [
             {
               "nombre": "Maquinaria",
               "preguntas": [
                 { "texto": "¿...", "aviso": "..." }
               ]
             }
           ]
         }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS DE ENTRADA: " + prompt }] }],
    });

    const responseText = result.response.text();
    
    // 3. LIMPIEZA DE SEGURIDAD
    // Esto quita posibles etiquetas ```json ... ``` que rompen el JSON.parse
    const cleanJson = responseText.replace(/```json|```/g, "").trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      res.json(parsedData);
    } catch (parseError) {
      console.error("Error parseando JSON de la IA:", responseText);
      res.status(500).json({ error: "La IA devolvió un formato ilegible" });
    }

  } catch (error) {
    console.error("ERROR CRÍTICO EN SERVIDOR:", error);
    res.status(500).json({ error: "Falla en el motor de IA", details: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor ACR.RADIX activo en puerto " + PORT));
