import express from 'express';
import dotenv from 'dotenv';
import { tenantPool } from './db/tenantPool';
import { platformPool } from './db/platformPool';

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'JIRA API is running!' });
});

// Basic test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Server'ı başlat
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 Health: http://localhost:${port}/health`);
});