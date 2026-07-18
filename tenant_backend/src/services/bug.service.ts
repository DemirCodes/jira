import { prisma } from '../db/prisma';

interface CreateBugPayload {
    userId: string;
    title: string;
    description: string;
    org_id?: string;
    project_id?: string;
    priority?: any; // Prizma enum'una göre tipini belirleyebilirsin
}

export const bugService = {
    async createBug(data: CreateBugPayload) {
        return await prisma.application_bugs.create({
            data: {
                reported_by: data.userId,
                title: data.title,
                description: data.description,
                org_id: data.org_id,
                project_id: data.project_id,
                priority: data.priority || 'medium',
            }
        });
    },

    async getBugsByOrg(orgId: string) {
        return await prisma.application_bugs.findMany({
            where: {
                deleted_at: null,
                org_id: orgId
            },
            orderBy: {
                created_at: 'desc'
            },
            select: {
                bug_id: true,
                title: true,
                status: true,
                priority: true,
                created_at: true,
            }
        });
    },

    async getBugById(bugId: string, orgId: string) {
        return await prisma.application_bugs.findFirst({
            where: {
                bug_id: bugId,
                org_id: orgId,
                deleted_at: null
            }
        });
    },

    async deleteBug(bugId: string, orgId: string, userId: string) {
        const result = await prisma.application_bugs.updateMany({
            where: {
                bug_id: bugId,
                org_id: orgId,
                deleted_at: null
            },
            data: {
                deleted_at: new Date(),
                deleted_by: userId,
                // Eğer enum'unda 'closed' veya 'resolved' varsa statüyü de güncelleyebilirsin:
                // status: 'closed' 
            }
        });
        return result.count > 0;
    }


};