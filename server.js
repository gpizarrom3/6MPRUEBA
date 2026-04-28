const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Forzamos v1 y el modelo latest
const model = genAI.getGenerativeModel(
    { model: "gemini-1.5-flash-latest" },
    { apiVersion: 'v1' }
);

// --- PRUEBA DE DIAGNÓSTICO (Se ejecuta al iniciar el servidor) ---
async function diagnosticarModelos() {
    console.log("🔍 DIAGNÓSTICO: Verificando conexión con Google...");
    try {
        // Intentamos una mini-generación de prueba
        const testResult = await model.generateContent("Hola");
        const testRes = await testResult.response;
        console.log("✅ DIAGNÓSTICO EXITOSO: El modelo responde correctamente.");
    } catch (e) {
        console.error("❌ DIAGNÓSTICO FALLIDO:", e.message);
        console.log("Sugerencia: Si ves 404 aquí, genera una nueva API KEY en Google AI Studio.");
    }
}
diagnosticarModelos(); 
// ----------------------------------------------------------------

// 2. Ruta para el diagnóstico de auditoría
app.post('/api/diagnostico', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: "El prompt es requerido" });
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const jsonResponse = JSON.parse(cleanJson);
            res.json(jsonResponse);
        } catch (parseError) {
            res.json({ hipotesis: text });
        }

    } catch (error) {
        console.error("Error en petición de usuario:", error);
        res.status(error.status || 500).json({ 
            message: "Error en la IA", 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});
