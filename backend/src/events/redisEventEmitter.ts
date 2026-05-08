/**
 * REDIS EVENT EMITTER (Pub/Sub)
 */

import { getRedisClient } from '../cache/redis';
import { log } from '../utils/logger';

export const Events = {
    ORG_CREATED: 'organization:created',
    ORG_INVITE_SENT: 'organization:invite:sent',
    ISSUE_CREATED: 'issue:created',
    ISSUE_ASSIGNED: 'issue:assigned',
} as const;

export type EventType = typeof Events[keyof typeof Events];

class RedisEventEmitter {
    private static instance: RedisEventEmitter;
    private listeners: Map<string, Function[]> = new Map();
    
    static getInstance(): RedisEventEmitter {
        if (!RedisEventEmitter.instance) {
            RedisEventEmitter.instance = new RedisEventEmitter();
        }
        return RedisEventEmitter.instance;
    }
    
    async emit(event: EventType, data: any): Promise<void> {
        const redis = getRedisClient();
        const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
        await redis.publish('app:events', message);
        log.debug(`📡 Event: ${event}`);
    }
    
    on(event: EventType, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }
    
    async start(): Promise<void> {
        const redis = getRedisClient();
        const subscriber = redis.duplicate();
        
        await subscriber.subscribe('app:events');
        subscriber.on('message', (channel, message) => {
            if (channel === 'app:events') {
                try {
                    const { event, data } = JSON.parse(message);
                    const callbacks = this.listeners.get(event);
                    callbacks?.forEach(cb => cb(data));
                } catch (error) {
                    log.error('Event parse error:', { error });
                }
            }
        });
        
        log.info('✅ Redis event system started');
    }
}

export const eventEmitter = RedisEventEmitter.getInstance();