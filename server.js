const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Inicialización de Gemini
// La librería usará automáticamente v1 si no especificamos otra cosa, 
// pero lo aseguramos en la configuración del modelo.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// IMPORTANTE: Usamos el nombre base 'gemini-1.5-flash'
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash" 
}, { apiVersion: 'v1' });

// 2. Ruta de Diagnóstico
app.post('/api/diagnostico', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ message: "Falta el prompt" });

    try {
        console.log("--- Petición recibida ---");
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Limpiar el formato JSON que a veces envía la IA
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const jsonResponse = JSON.parse(cleanJson);
            res.json(jsonResponse);
        } catch (e) {
            // Si la IA responde texto plano, lo envolvemos para el frontend
            res.json({ hipotesis: text });
        }

    } catch (error) {
        console.error("ERROR GEMINI:", error.message);
        res.status(500).json({ 
            message: "Error de comunicación con la IA",
            error: error.message 
        });
    }
});

// 3. Lanzamiento
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor activo en puerto ${PORT}`);
});
