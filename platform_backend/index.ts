import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Sağlık kontrolü (Healthcheck) için basit bir endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Platform Backend  Çalışıyor! 🚀' 
    });
});

app.listen(port, () => {
    console.log(`[Platform] Sunucu ${port} portunda tetikte...`);
});