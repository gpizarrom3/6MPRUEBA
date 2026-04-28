const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de Google Gemini
// Asegúrate de tener GEMINI_API_KEY en tus variables de entorno de Render
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Usamos gemini-1.5-flash que es el modelo estable y rápido
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 2. Ruta para el diagnóstico
app.post('/api/diagnostico', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "El prompt es requerido" });
    }

    try {
        // Llamada a la IA
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Intentamos limpiar la respuesta por si la IA devuelve Markdown (```json ... ```)
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const jsonResponse = JSON.parse(cleanJson);
            res.json(jsonResponse);
        } catch (parseError) {
            // Si no es JSON puro, enviamos el texto tal cual
            res.json({ hipotesis: text });
        }

    } catch (error) {
        console.error("Error crítico en Gemini:", error);
        res.status(500).json({ 
            message: "Error al procesar con IA", 
            error: error.message 
        });
    }
});

// 3. Inicio del servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor de Auditoría corriendo en puerto ${PORT}`);
});
