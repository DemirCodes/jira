import winston from 'winston';
type LogMeta = Record<string, unknown>;
export declare const logger: winston.Logger;
export declare const log: {
    info: (message: string, meta?: LogMeta) => winston.Logger;
    error: (message: string, meta?: LogMeta) => winston.Logger;
    warn: (message: string, meta?: LogMeta) => winston.Logger;
    debug: (message: string, meta?: LogMeta) => winston.Logger;
};
export declare const stream: {
    write: (message: string) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map