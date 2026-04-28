const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de Google Gemini - MÁXIMA COMPATIBILIDAD
// Inicializamos con la API Key de las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Forzamos el uso del modelo estable en la versión v1
// Usamos 'gemini-1.5-flash' sin añadidos, que es el nombre más estándar
const model = genAI.getGenerativeModel(
    { model: "gemini-1.5-flash" },
    { apiVersion: 'v1' }
);

// 2. Ruta para el diagnóstico
app.post('/api/diagnostico', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "Falta el prompt" });
    }

    try {
        console.log("--- Iniciando Petición ---");
        
        // Ejecución de la IA
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Limpiamos la respuesta: a veces Gemini devuelve ```json ... ```
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            // Intentamos parsear para enviar un objeto JSON limpio al frontend
            const jsonResponse = JSON.parse(cleanJson);
            res.json(jsonResponse);
        } catch (e) {
            // Si no es JSON (es texto plano), lo enviamos en un campo coherente
            res.json({ 
                hipotesis: text,
                nota: "Respuesta en formato texto plano" 
            });
        }

    } catch (error) {
        console.error("ERROR EN MOTOR GEMINI:", error.message);
        
        // Enviamos el error detallado para debuggear en el frontend si es necesario
        res.status(500).json({ 
            message: "Error de comunicación con la IA",
            error: error.message,
            sugerencia: "Verifica que la API KEY sea v1 y esté activa en Google AI Studio"
        });
    }
});

// 3. Inicio del servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📌 Endpoint: /api/diagnostico`);
    console.log(`🤖 Modelo: gemini-1.5-flash (v1)`);
});
