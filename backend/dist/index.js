"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var dotenv_1 = require("dotenv");
var redisEventEmitter_1 = require("./events/redisEventEmitter");
var security_1 = require("./middlewares/security");
var errorHandler_1 = require("./middlewares/errorHandler");
var rateLimit_1 = require("./middlewares/rateLimit");
var auth_1 = require("./middlewares/auth");
var organization_routes_1 = require("./routes/organization.routes");
var logger_1 = require("./utils/logger");
dotenv_1.default.config();
var app = (0, express_1.default)();
var port = process.env.PORT || 3030;
(0, security_1.setupSecurity)(app);
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/api', rateLimit_1.apiLimiter);
// Public endpoints
app.get('/health', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/', function (req, res) {
    res.json({ message: 'JIRA API is running!' });
});
// API Routes
app.use('/api/organizations', auth_1.authMiddleware, organization_routes_1.default);
// Error handler (en son)
app.use(errorHandler_1.errorHandler);
app.listen(port, function () {
    logger_1.log.info("\uD83D\uDE80 Server running on port ".concat(port));
    logger_1.log.info("\uD83D\uDCE1 Health: http://localhost:".concat(port, "/health"));
});
redisEventEmitter_1.eventEmitter.start().catch(function (err) {
    logger_1.log.error('Failed to start event emitter:', err);
});
