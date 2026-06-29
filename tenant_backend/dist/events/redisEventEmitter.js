"use strict";
/**
 * REDIS EVENT EMITTER (Pub/Sub)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = exports.Events = void 0;
const redis_1 = require("../cache/redis");
const logger_1 = require("../utils/logger");
exports.Events = {
    ORG_CREATED: 'organization:created',
    ORG_INVITE_SENT: 'organization:invite:sent',
    ISSUE_CREATED: 'issue:created',
    ISSUE_ASSIGNED: 'issue:assigned',
};
class RedisEventEmitter {
    static instance;
    listeners = new Map();
    static getInstance() {
        if (!RedisEventEmitter.instance) {
            RedisEventEmitter.instance = new RedisEventEmitter();
        }
        return RedisEventEmitter.instance;
    }
    async emit(event, data) {
        const redis = (0, redis_1.getRedisClient)();
        const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
        await redis.publish('app:events', message);
        logger_1.log.debug(`📡 Event: ${event}`);
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    async start() {
        const redis = (0, redis_1.getRedisClient)();
        const subscriber = redis.duplicate();
        await subscriber.subscribe('app:events');
        subscriber.on('message', (channel, message) => {
            if (channel === 'app:events') {
                try {
                    const { event, data } = JSON.parse(message);
                    const callbacks = this.listeners.get(event);
                    callbacks?.forEach(cb => cb(data));
                }
                catch (error) {
                    logger_1.log.error('Event parse error:', { error });
                }
            }
        });
        logger_1.log.info('✅ Redis event system started');
    }
}
exports.eventEmitter = RedisEventEmitter.getInstance();
//# sourceMappingURL=redisEventEmitter.js.map