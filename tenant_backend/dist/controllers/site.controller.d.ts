/**
 * SITE CONTROLLER
 *
 * Tüm yetkilendirme authorization.service.ts ile yapılır.
 * Controller sadece request/response işlemlerinden sorumludur.
 *
 * GÜVENLİK: Tüm yazma işlemlerinde org_id validasyonu yapılır.
 */
import { Request, Response } from 'express';
export declare const create: (req: Request, res: Response) => Promise<void>;
export declare const listByOrg: (req: Request, res: Response) => Promise<void>;
export declare const getById: (req: Request, res: Response) => Promise<void>;
export declare const update: (req: Request, res: Response) => Promise<void>;
export declare const updateStatus: (req: Request, res: Response) => Promise<void>;
export declare const remove: (req: Request, res: Response) => Promise<void>;
export declare const invite: (req: Request, res: Response) => Promise<void>;
export declare const listMembers: (req: Request, res: Response) => Promise<void>;
export declare const updateMemberRole: (req: Request, res: Response) => Promise<void>;
export declare const removeMember: (req: Request, res: Response) => Promise<void>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=site.controller.d.ts.map