const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/diagnostico', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ message: "Falta el prompt" });

    try {
        console.log("--- Iniciando Petición Directa (REST) ---");

        // Construimos la URL manualmente para evitar el error 404
        // Usamos la versión v1 estable
        const API_KEY = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // Si la respuesta de Google no es exitosa
        if (!response.ok) {
            console.error("Error de Google API:", data);
            throw new Error(data.error?.message || "Error desconocido en la API");
        }

        // Extraemos el texto de la respuesta
        const aiText = data.candidates[0].content.parts[0].text;

        // Limpiamos el formato JSON si viene con backticks
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            res.json(JSON.parse(cleanJson));
        } catch (e) {
            res.json({ hipotesis: aiText });
        }

    } catch (error) {
        console.error("ERROR CRÍTICO:", error.message);
        res.status(500).json({ 
            message: "Error en la conexión manual", 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Servidor REST activo en puerto ${PORT}`);
});
