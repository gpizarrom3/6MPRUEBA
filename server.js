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
        const API_KEY = process.env.GEMINI_API_KEY;
        // Probamos con la URL de producción estable
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error detallado:", data);
            return res.status(response.status).json({ 
                error: data.error?.message || "Error en la API de Google" 
            });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            res.json(JSON.parse(cleanJson));
        } catch (e) {
            res.json({ hipotesis: aiText });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor activo en Chile/Render puerto ${PORT}`));
