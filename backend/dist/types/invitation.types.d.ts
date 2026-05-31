export interface Invitation {
    invitation_id: string;
    org_id: string;
    invited_by: string;
    invited_user_id: string;
    entity_type: 'organization' | 'site' | 'project' | 'issue';
    entity_id: string | null;
    role: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    created_at: Date;
    expires_at: Date;
    accepted_at: Date | null;
    rejected_at: Date | null;
    cancelled_at: Date | null;
}
export interface InvitationWithDetails extends Invitation {
    org_name: string;
    invited_by_name: string;
    invited_user_name: string;
    invited_user_email: string;
}
export interface CreateInvitationInput {
    org_id: string;
    friendshipCode: string;
    entity_type: 'organization' | 'site' | 'project' | 'issue';
    entity_id?: string;
    role: string;
}
//# sourceMappingURL=invitation.types.d.ts.map