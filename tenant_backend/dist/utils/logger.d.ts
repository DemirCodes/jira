import winston from 'winston';
type LogMeta = Record<string, unknown>;
export declare const logger: winston.Logger;
type LogMethod = (message: string, meta?: LogMeta) => void;
export declare const log: {
    info: LogMethod;
    error: LogMethod;
    warn: LogMethod;
    debug: LogMethod;
};
export declare const stream: {
    write: (message: string) => void;
};
export {};
//# sourceMappingURL=logger.d.ts.map