"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("./middlewares/auth");
const errorHandler_1 = require("./middlewares/errorHandler");
const security_1 = require("./middlewares/security");
const organization_routes_1 = __importDefault(require("./routes/organization.routes"));
const site_routes_1 = __importDefault(require("./routes/site.routes"));
const invitation_routes_1 = __importDefault(require("./routes/invitation.routes"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
(0, security_1.setupSecurity)(app);
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
    res.json({ message: 'JIRA API is running!' });
});
app.use('/api/organizations', auth_1.authMiddleware, organization_routes_1.default);
app.use('/api/sites', auth_1.authMiddleware, site_routes_1.default);
app.use('/api/invitations', auth_1.authMiddleware, invitation_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    logger_1.log.info(`🚀 Server running on port ${port}`);
    logger_1.log.info(`📡 Health: http://localhost:${port}/health`);
});
//# sourceMappingURL=index.js.map