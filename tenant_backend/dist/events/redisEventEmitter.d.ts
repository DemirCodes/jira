/**
 * REDIS EVENT EMITTER (Pub/Sub)
 */
export declare const Events: {
    readonly ORG_CREATED: "organization:created";
    readonly ORG_INVITE_SENT: "organization:invite:sent";
    readonly ISSUE_CREATED: "issue:created";
    readonly ISSUE_ASSIGNED: "issue:assigned";
};
export type EventType = typeof Events[keyof typeof Events];
declare class RedisEventEmitter {
    private static instance;
    private listeners;
    static getInstance(): RedisEventEmitter;
    emit(event: EventType, data: any): Promise<void>;
    on(event: EventType, callback: Function): void;
    start(): Promise<void>;
}
export declare const eventEmitter: RedisEventEmitter;
export {};
//# sourceMappingURL=redisEventEmitter.d.ts.map