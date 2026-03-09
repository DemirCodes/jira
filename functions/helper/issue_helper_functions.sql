-- Active: 1772756684414@@127.0.0.1@5432@jira


-- user uuid  take ledık
create or replace function auth_current_user_id()
RETURNS uuid
language sql 
stable
as $$
select current_setting('app.current_user_id')::uuid;
$$;

/*
    Issue Roles:
    - contributor
    - reviewer
    - watcher
*/

-- user  issue 'contributor' üyesimi ? check func
create or replace function auth_is_issue_contributor(p_issue_id uuid)
returns BOOLEAN
language SQL
stable
as $$
select exists 
            (
                select 1
                from issue_memberships as im
                where 
                    im.issue_id = p_issue_id
                    AND
                    im.user_id = auth_current_user_id()
                    AND
                    im.role = 'contributor'
                    AND
                    im.deleted_at is NULL
            )
$$;


-- user  issue 'reviewer' üyesimi ? check func
create or replace function auth_is_issue_reviewer(p_issue_id uuid)
returns BOOLEAN
language SQL
stable
as $$
select exists 
            (
                select 1
                from issue_memberships as im
                where 
                    im.issue_id = p_issue_id
                    AND
                    im.user_id = auth_current_user_id()
                    AND
                    im.role = 'reviewer'
                    AND
                    im.deleted_at is NULL
            )

$$;

-- user  issue 'watcher' üyesimi ? check func
create or replace function auth_is_issue_watcher(p_issue_id uuid)
returns BOOLEAN
language SQL
stable
as $$
select exists 
            (
                select 1
                from issue_memberships as im
                where 
                    im.issue_id = p_issue_id
                    AND
                    im.user_id = auth_current_user_id()
                    AND
                    im.role = 'watcher'
                    AND
                    im.deleted_at is NULL
            )
$$;