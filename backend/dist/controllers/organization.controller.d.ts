/************ IMPORTS ***********/
import { Request, Response } from 'express';
/************ IMPORTS ***********/
export declare const create: (req: Request, res: Response) => Promise<void>;
export declare const list: (req: Request, res: Response) => Promise<void>;
export declare const getById: (req: Request, res: Response) => Promise<void>;
export declare const update: (req: Request, res: Response) => Promise<void>;
export declare const remove: (req: Request, res: Response) => Promise<void>;
export declare const invite: (req: Request, res: Response) => Promise<void>;
export declare const listMembers: (req: Request, res: Response) => Promise<void>;
export declare const updateMemberRole: (req: Request, res: Response) => Promise<void>;
export declare const removeMember: (req: Request, res: Response) => Promise<void>;
export declare const listInvitations: (req: Request, res: Response) => Promise<void>;
export declare const cancelInvitation: (req: Request, res: Response) => Promise<void>;
export declare const getStats: (req: Request, res: Response) => Promise<void>;
export declare const leave: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=organization.controller.d.ts.map