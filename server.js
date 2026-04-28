const express = require('express');
const cors = require('cors'); 
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send("ACR.RADIX Core - Resiliencia Activa");
});

app.post('/api/diagnostico', async (req, res) => {
  const { prompt } = req.body;
  const esReporteFinal = prompt.includes("RESPUESTAS");

  const systemPrompt = esReporteFinal 
    ? `Actúa como Experto en ACR. Genera un dictamen técnico en JSON:
       {
         "resumen_6m": { "Mano de Obra": "...", "Maquinaria": "...", "Métodos": "...", "Materiales": "...", "Medio Ambiente": "...", "Medición": "..." },
         "hipotesis": "...",
         "recomendaciones": ["...", "..."]
       }`
    : `Eres un Consultor Senior 6M. Genera un protocolo de preguntas 6M en JSON:
       {
         "categorias": [ { "nombre": "...", "preguntas": [ { "texto": "...", "aviso": "..." } ] } ]
       }`;

  // LISTA DE MODELOS POR PRIORIDAD
  // Intentamos con el 2.5, si falla por 503, saltamos al 1.5 o al 3.
  const modelosPrioritarios = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3-flash"];
  
  let exito = false;
  let ultimoError = null;

  for (const nombreModelo of modelosPrioritarios) {
    if (exito) break;

    try {
      console.log(`Intentando diagnóstico con: ${nombreModelo}...`);
      const model = genAI.getGenerativeModel({ 
        model: nombreModelo, 
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + "\n\nDATOS: " + prompt }] }],
      });

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      res.json(JSON.parse(cleanJson));
      exito = true;
      console.log(`Éxito con ${nombreModelo}`);

    } catch (error) {
      console.error(`Falla en ${nombreModelo}:`, error.message);
      ultimoError = error.message;
      // Si el error no es de saturación (503), quizás no valga la pena reintentar, 
      // pero por ahora probaremos el siguiente modelo en la lista.
    }
  }

  if (!exito) {
    res.status(503).json({ 
      error: "Saturación Global de IA", 
      details: "Todos los modelos de respaldo están bajo alta demanda. Reintente en un momento.",
      log: ultimoError
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("ACR.RADIX: Motor con redundancia iniciado."));
