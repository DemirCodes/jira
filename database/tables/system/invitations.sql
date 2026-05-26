-- invitations.sql
DROP TABLE IF EXISTS invitations CASCADE;

CREATE TABLE invitations (
    invitation_id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES organizations (org_id) ON DELETE CASCADE,
    invited_by uuid NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    invited_user_id uuid NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    entity_type text NOT NULL CHECK (
        entity_type IN (
            'organization',
            'site',
            'project'
        )
    ),
    entity_id uuid, -- site_id veya project_id (org davetinde NULL)
    role text NOT NULL, -- org_role, site_role veya project_role değeri
    status text NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'accepted',
            'rejected',
            'expired'
        )
    ),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    accepted_at timestamptz,
    rejected_at timestamptz,
    cancelled_at timestamptz,
    deleted_at timestamptz
);