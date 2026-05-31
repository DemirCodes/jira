import express from 'express';
import { authMiddleware } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';
import { setupSecurity } from './middlewares/security';
import organizationRoutes from './routes/organization.routes';
import siteRoutes from './routes/site.routes';
import invitationRoutes from './routes/invitation.routes';
import { log } from './utils/logger';

const app = express();
const port = process.env.PORT || 3000;

setupSecurity(app);
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ message: 'JIRA API is running!' });
});

app.use('/api/organizations', authMiddleware, organizationRoutes);
app.use('/api/sites', authMiddleware, siteRoutes);
app.use('/api/invitations', authMiddleware, invitationRoutes);

app.use(errorHandler);

app.listen(port, () => {
    log.info(`🚀 Server running on port ${port}`);
    log.info(`📡 Health: http://localhost:${port}/health`);
});
