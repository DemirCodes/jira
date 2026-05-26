-- İndeksler
CREATE INDEX idx_invitations_org_id ON invitations (org_id)
WHERE
    deleted_at IS NULL;

CREATE INDEX idx_invitations_invited_user ON invitations (invited_user_id)
WHERE
    deleted_at IS NULL
    AND status = 'pending';

CREATE INDEX idx_invitations_status ON invitations (status)
WHERE
    deleted_at IS NULL;