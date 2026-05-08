/**
 * ORGANIZATION CONTROLLER
 */

import { Request, Response } from 'express';
import * as orgService from '../services/organization.service';
import { log } from '../utils/logger';

// ==================== CREATE ====================
export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { name, slug, description } = req.body;

        if (!name || !slug) {
            res.status(400).json({ error: 'name and slug are required' });
            return;
        }

        const orgId = await orgService.createOrganization(userId, name, slug, description);
        res.status(201).json({ org_id: orgId });
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            res.status(409).json({ error: 'Slug already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== READ ====================
export const list = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const orgs = await orgService.getUserOrganizations(userId);
        res.json(orgs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const org = await orgService.getOrganizationById(id);
        
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }
        
        res.json(org);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ==================== UPDATE ====================
export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { name, description, slug } = req.body;

        const updated = await orgService.updateOrganization(userId, id, name, description, slug);
        res.json(updated);
    } catch (error: any) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Organization not found' });
        } else if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else if (error.message.includes('slug already exists')) {
            res.status(409).json({ error: 'Slug already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== DELETE ====================
export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        await orgService.deleteOrganization(userId, id);
        res.json({ message: 'Organization deleted successfully' });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Organization not found' });
        } else if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else if (error.message.includes('last owner')) {
            res.status(400).json({ error: 'Cannot delete the last owner' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== INVITE ====================
export const invite = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { friendshipCode, role = 'member' } = req.body;

        if (!friendshipCode) {
            res.status(400).json({ error: 'friendshipCode is required' });
            return;
        }

        const invitationId = await orgService.inviteToOrganization(userId, id, friendshipCode, role);
        res.status(201).json({ invitation_id: invitationId, message: 'Invitation sent' });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Organization not found' });
        } else if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else if (error.message.includes('already a member')) {
            res.status(409).json({ error: 'User is already a member' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== MEMBERS ====================
export const listMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const members = await orgService.getOrganizationMembers(userId, id);
        res.json(members);
    } catch (error: any) {
        if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id, memberId } = req.params;
        const { role } = req.body;

        const validRoles = ['admin', 'member', 'viewer'];
        if (!role || !validRoles.includes(role)) {
            res.status(400).json({ error: 'Invalid role. Allowed: admin, member, viewer' });
            return;
        }

        await orgService.updateMemberRole(userId, id, memberId, role);
        res.json({ message: 'Role updated successfully' });
    } catch (error: any) {
        if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: 'User or organization not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id, memberId } = req.params;

        await orgService.removeMember(userId, id, memberId);
        res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
        if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: 'User or organization not found' });
        } else if (error.message.includes('last owner')) {
            res.status(400).json({ error: 'Cannot remove the last owner' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== INVITATIONS ====================
export const listInvitations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const invitations = await orgService.getPendingInvitations(userId, id);
        res.json(invitations);
    } catch (error: any) {
        if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

export const cancelInvitation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { invitationId } = req.params;

        await orgService.cancelInvitation(userId, invitationId);
        res.json({ message: 'Invitation cancelled' });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Invitation not found' });
        } else if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== STATS ====================
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const stats = await orgService.getOrganizationStats(userId, id);
        res.json(stats);
    } catch (error: any) {
        if (error.message.includes('permission')) {
            res.status(403).json({ error: 'Permission denied' });
        } else if (error.message.includes('not found')) {
            res.status(404).json({ error: 'Organization not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

// ==================== LEAVE ====================
export const leave = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        await orgService.removeMember(userId, id, userId);
        res.json({ message: 'Successfully left organization' });
    } catch (error: any) {
        if (error.message.includes('last owner')) {
            res.status(400).json({ error: 'Last owner cannot leave. Transfer ownership first.' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};