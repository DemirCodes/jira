import express from 'express';
import { tenantAuth } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';
import { setupSecurity } from './middlewares/security';
import organizationRoutes from './routes/organization.routes';
import siteRoutes from './routes/site.routes';
import invitationRoutes from './routes/invitation.routes';
import { log } from './utils/logger';

// ============================================
// ADIM 2: SESSİZ CRASH YAKALAYICILAR (GLOBAL)
// ============================================
process.on('uncaughtException', (err) => {
    console.error('🔥 KRAAAL YAKALADIM! UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 KRAAAL YAKALADIM! UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
});

const app = express();
const port = process.env.PORT || 3000;

// Güvenlik middleware'ini şimdilik izole ettik
// setupSecurity(app);

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ message: 'JIRA API is running!' });
});



app.use('/api/organizations', tenantAuth, organizationRoutes);
app.use('/api/sites', tenantAuth, siteRoutes);
app.use('/api/invitations', tenantAuth, invitationRoutes);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`🚀 SUNUCU AYAĞA KALKTI! Port: ${port}`);
    try {
        log.info(`🚀 Server running on port ${port}`);
    } catch (e) {
        console.error("Logger çalışırken patladı:", e);
    }
});



