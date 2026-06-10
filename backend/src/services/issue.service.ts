/**
 * ISSUE SERVICE (SECURED WITH RLS WRAPPER & JIRA FEATURES)
 * Core Policy Matrisine Göre Sıralanmıştır.
 */

import { tenantPool } from '../db/tenantPool';
import { PoolClient } from 'pg';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';
import { isValidName, isValidUUID, containsDangerousChars } from '../utils/regexValidator';
import { IssueSummary, IssueDetail } from '../types/issue.types';

// ============================================================================
// ALTYAPI VE YARDIMCI FONKSİYONLAR (CORE MİMARİ)
// ============================================================================
const withRLS = async <T>(userId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await tenantPool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const validateUUIDs = (...uuids: (string | undefined | null)[]) => {
    uuids.forEach(id => {
        if (id && !isValidUUID(id)) throw new AppError(ErrorCodes.VALIDATION_INVALID_UUID);
    });
};

// ============================================================================
// ANA LİSTE (ISSUE AUTH & ACCESS POLICY CORE FONKSİYONLARI)
// ============================================================================

// 1. CREATE
export const createIssue = async (
    projectId: string,
    title: string,
    userId: string,
    description: string = '',
    isPrivate: boolean = false
): Promise<string> => {
    validateUUIDs(projectId);
    
    if (!isValidName(title, 2, 255)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME, 'Title must be between 2 and 255 characters');
    if (containsDangerousChars(title) || containsDangerousChars(description)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters detected in title or description');
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim().substring(0, 5000); 

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                'SELECT create_issues($1, $2, $3, $4) as issue_id',
                [projectId, trimmedTitle, trimmedDesc || null, isPrivate]
            );

            if (!result.rows[0]?.issue_id) {
                throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create issue');
            }

            const newIssueId = result.rows[0].issue_id;
            log.info('Issue created', { issueId: newIssueId, projectId });
            return newIssueId;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            if (error.message?.includes('Permission denied')) {
                throw new AppError(ErrorCodes.ISSUE_PERMISSION_DENIED, error.message);
            }
            log.error('Failed to create issue', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to create issue');
        }
    });
};

// 2. LIST
export const listIssues = async (
    userId: string,
    projectId?: string,
    status?: string,
    priority?: string,
    assigneeId?: string,
    reporterId?: string,
    search?: string,
    limit: number = 50,
    offset: number = 0
): Promise<IssueSummary[]> => {
    validateUUIDs(projectId, assigneeId, reporterId);
    
    if (search && containsDangerousChars(search)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in search query');
    }

    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);

    return withRLS(userId, async (client) => {
        try {
            const safeSearch = search ? search.trim().substring(0, 100) : null;
            
            const result = await client.query(
                'SELECT * FROM list_issues($1, $2, $3, $4, $5, $6, $7, $8)',
                [projectId || null, status || null, priority || null, assigneeId || null, reporterId || null, safeSearch, safeLimit, safeOffset]
            );

            return result.rows as IssueSummary[];
        } catch (error: any) {
            log.error('Failed to list issues', { projectId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to list issues');
        }
    });
};

// 3. GET
export const getIssueById = async (
    issueId: string, 
    userId: string,
    projectId?: string
): Promise<IssueDetail> => {
    validateUUIDs(issueId, projectId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                'SELECT * FROM get_issue_id($1, $2)',
                [issueId, projectId || null]
            );

            if (result.rowCount === 0) {
                throw new AppError(ErrorCodes.ISSUE_NOT_FOUND, 'Issue not found or deleted');
            }
            return result.rows[0] as IssueDetail;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            if (error.message?.includes('not found')) throw new AppError(ErrorCodes.ISSUE_NOT_FOUND);
            
            log.error('Failed to retrieve issue details', { issueId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to retrieve issue details');
        }
    });
};

// 4. UPDATE
export const updateIssue = async (
    issueId: string,
    userId: string,
    projectId?: string,
    title?: string,
    description?: string,
    status?: string,
    priority?: string,
    assigneeId?: string,
    isPrivate?: boolean
): Promise<void> => {
    validateUUIDs(issueId, projectId, assigneeId);

    if (title) {
        if (!isValidName(title, 2, 255)) throw new AppError(ErrorCodes.VALIDATION_INVALID_NAME);
        if (containsDangerousChars(title)) throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in title');
    }

    if (description && containsDangerousChars(description)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in description');
    }

    if (status && containsDangerousChars(status)) throw new AppError(ErrorCodes.VALIDATION_FAILED);
    if (priority && containsDangerousChars(priority)) throw new AppError(ErrorCodes.VALIDATION_FAILED);

    const trimmedTitle = title?.trim() || null;
    const trimmedDesc = description ? description.trim().substring(0, 5000) : null;

    return withRLS(userId, async (client) => {
        try {
            await client.query(
                'SELECT update_issues($1, $2, $3, $4, $5, $6, $7, $8)',
                [issueId, trimmedTitle, trimmedDesc, status || null, priority || null, assigneeId || null, isPrivate ?? null, projectId || null]
            );

            log.info('Issue updated', { issueId });
        } catch (error: any) {
            if (error.message?.includes('Permission denied')) {
                throw new AppError(ErrorCodes.ISSUE_PERMISSION_DENIED, error.message);
            }
            if (error.message?.includes('No changes')) {
                throw new AppError(ErrorCodes.VALIDATION_FAILED, 'No changes provided to update');
            }
            if (error.message?.includes('not found')) {
                throw new AppError(ErrorCodes.ISSUE_NOT_FOUND);
            }
            log.error('Failed to update issue', { issueId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to update issue');
        }
    });
};

// 5. DELETE
export const deleteIssue = async (
    issueId: string, 
    userId: string, 
    projectId?: string
): Promise<void> => {
    validateUUIDs(issueId, projectId);

    return withRLS(userId, async (client) => {
        try {
            await client.query('SELECT delete_issues($1, $2)', [issueId, projectId || null]);
            log.info('Issue deleted', { issueId });
        } catch (error: any) {
            if (error.message?.includes('not found')) throw new AppError(ErrorCodes.ISSUE_NOT_FOUND);
            if (error.message?.includes('Permission denied')) {
                throw new AppError(ErrorCodes.ISSUE_PERMISSION_DENIED, error.message);
            }
            log.error('Failed to delete issue', { issueId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to delete issue');
        }
    });
};

// 6. INVITE (ADD MEMBER)
export const inviteToIssue = async (
    friendshipCode: string,
    orgId: string,
    siteId: string,
    projectId: string,
    issueId: string,
    role: string,
    userId: string
): Promise<void> => {
    validateUUIDs(friendshipCode, orgId, siteId, projectId, issueId);

    if (containsDangerousChars(role)) {
        throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Invalid characters in role');
    }

    return withRLS(userId, async (client) => {
        try {
            await client.query(
                'SELECT invite_issue($1, $2, $3, $4, $5, $6::issue_role)',
                [friendshipCode, orgId, siteId, projectId, issueId, role]
            );
            log.info('User invited to issue', { issueId, role });
        } catch (error: any) {
            if (error.message?.includes('Permission denied')) {
                throw new AppError(ErrorCodes.ISSUE_PERMISSION_DENIED, error.message);
            }
            if (error.message?.includes('not found')) throw new AppError(ErrorCodes.ISSUE_NOT_FOUND);
            if (error.message?.includes('already has a membership')) {
                throw new AppError(ErrorCodes.ISSUE_ALREADY_EXISTS, 'User is already a member of this issue');
            }
            if (error.message?.includes('active member of the project')) {
                throw new AppError(ErrorCodes.VALIDATION_FAILED, 'User must be in the project before joining an issue');
            }
            log.error('Failed to invite to issue', { issueId, error });
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to invite user to issue');
        }
    });
};

// ============================================================================
// EKSTRA FONKSİYONLAR 
// ============================================================================

export const restoreIssue = async (issueId: string, userId: string, projectId: string): Promise<void> => {
    validateUUIDs(issueId, projectId);

    return withRLS(userId, async (client) => {
        try {
            const result = await client.query(
                `UPDATE issues 
                 SET deleted_at = NULL, updated_at = now()
                 WHERE issue_id = $1 AND project_id = $2 AND deleted_at IS NOT NULL
                 RETURNING issue_id`,
                [issueId, projectId]
            );

            if (result.rowCount === 0) throw new AppError(ErrorCodes.ISSUE_NOT_FOUND, 'Deleted issue not found');
            log.info('Issue restored successfully', { issueId });
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError(ErrorCodes.DB_QUERY_FAILED, 'Failed to restore issue');
        }
    });
};