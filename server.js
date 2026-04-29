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
        
        // USAMOS EL MODELO QUE APARECE PRIMERO EN TU LISTA
        // Cambiamos v1 por v1beta porque es donde aparece listado tu modelo
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${API_KEY}`;

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
            return res.status(response.status).json({ error: data.error?.message });
        }

        // Estructura de respuesta estándar de Gemini
        const aiText = data.candidates[0].content.parts[0].text;
        
        // Limpiamos el JSON por si la IA pone texto extra
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
app.listen(PORT, () => {
    console.log(`✅ Servidor AUDITORIA-6M activo con Gemini 2.5 Flash`);
});
