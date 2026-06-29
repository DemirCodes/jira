create or replace function get_issues(
    p_project_id uuid default null
)
returns table(
    issue_id uuid,
    issue_title text,
    issue_no bigint,
    status issue_status,
    priority priority_level,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = PUBLIC
as $$
declare
    v_user_id uuid;
begin
    v_user_id := auth_current_user_id();

    IF v_user_id is null THEN
        raise EXCEPTION 'User not authenticated';
    end if;

    return query 
    SELECT DISTINCT
        i.issue_id,
        i.issue_title,
        i.issue_no,
        i.status,
        i.priority,
        i.created_at
    FROM issues i
    WHERE i.deleted_at IS NULL
        AND (p_project_id IS NULL OR i.project_id = p_project_id)
        AND (
            -- Kullanıcı issue'nun üyesi mi?
            EXISTS (
                SELECT 1 FROM issue_memberships im
                WHERE im.issue_id = i.issue_id
                    AND im.user_id = v_user_id
                    AND im.membership_is_active = true
                    AND im.deleted_at IS NULL
            )
            OR
            -- Kullanıcı issue'nun reporter'ı mı?
            i.reporter_id = v_user_id
            OR
            -- Kullanıcı issue'ya assigne edilmiş mi?
            i.assignee_id = v_user_id
        )
    ORDER BY i.issue_no;
end;
$$;