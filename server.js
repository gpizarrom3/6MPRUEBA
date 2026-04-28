const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de Google Gemini
// Forzamos el uso de la versión estable 'v1' para evitar el error 404 de la 'v1beta'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CONFIGURACIÓN MODIFICADA: 
// Pasamos un segundo objeto con apiVersion: 'v1'
const model = genAI.getGenerativeModel(
    { model: "gemini-1.5-flash" },
    { apiVersion: 'v1' }
);

// 2. Ruta para el diagnóstico
app.post('/api/diagnostico', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "El prompt es requerido" });
    }

    try {
        // Llamada a la generación de contenido
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Limpieza de formato Markdown si la IA lo incluye
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            // Intentamos devolver el objeto JSON parseado
            const jsonResponse = JSON.parse(cleanJson);
            res.json(jsonResponse);
        } catch (parseError) {
            // Si la respuesta no es un JSON válido, enviamos el texto en un campo 'hipotesis'
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
