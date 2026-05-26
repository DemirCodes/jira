import express from 'express';
import dotenv from 'dotenv';
import { tenantPool } from './db/tenantPool';
import { platformPool } from './db/platformPool';
import { eventEmitter } from './events/redisEventEmitter';
import { setupSecurity } from './middlewares/security';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimit';
import { authMiddleware } from './middlewares/auth';
import organizationRoutes from './routes/organization.routes';
import { log } from './utils/logger';
import invitationRoutes from './routes/invitation.routes';
dotenv.config();

const app = express();
const port = process.env.PORT || 3030;

setupSecurity(app);
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);


// Public endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ message: 'JIRA API is running!' });
});


// API Routes
app.use('/api/organizations', authMiddleware, organizationRoutes);
app.use('/api/invitations', authMiddleware, invitationRoutes);

// Error handler (en son)
app.use(errorHandler);

app.listen(port, () => {
    log.info(`🚀 Server running on port ${port}`);
    log.info(`📡 Health: http://localhost:${port}/health`);
});

eventEmitter.start().catch(err => {
    log.error('Failed to start event emitter:', err);
});