-- Active: 1772756684414@@127.0.0.1@5432@jira


-- user uuid  take ledık
create or replace function auth_current_user_id()
returns uuid
language sql
stable
as $$
select current_setting('app.current_user_id')::uuid;
$$;

-- user  organizasyon 'member' üyesimi ? check func
create or replace function auth_is_org_member(p_org_id uuid)
returns BOOLEAN
language SQL
stable
as $$
select exists 
            (
                select 1
                from organization_memberships as om 
                where 
                    om.org_id = p_org_id
                    AND
                    om.user_id = auth_current_user_id()
                    AND
                    om.role = 'member'
                    AND
                    om.deleted_at is NULL
            )
$$;


-- user organizasyon 'viewer' üyesimi ? check FUNCTION
create or replace FUNCTION auth_is_org_viewer(p_org_id uuid)
returns BOOLEAN
LANGUAGE SQL
STABLE
as $$
SELECT 
    exists 
        (
            select
                 1
            from 
                organization_memberships as om
            WHERE
                om.org_id = p_org_id
                AND
                om.user_id = auth_current_user_id()
                AND
                om.role = 'viewer'
                AND
                om.deleted_at is NULL
        )
$$;




-- user organizasyon 'admin' üyesimi ? check function
create or replace function auth_is_org_admin(p_org_id uuid)
returns BOOLEAN
language sql
STABLE
as $$
SELECT
    exists 
        (
            select
                1
            FROM
                organization_memberships as om
            WHERE
                om.org_id = p_org_id
                AND
                om.user_id = auth_current_user_id()
                AND
                om.role = 'admin'
                AND
                om.deleted_at is NULL
        )
$$;

-- user organizasyon 'owner' üyesimi ? check function
create or replace function auth_is_org_owner(p_org_id uuid)
returns BOOLEAN
LANGUAGE SQL
STABLE
as $$
SELECT
    EXISTS
        (
            SELECT
                1
            FROM
                organization_memberships as om
            WHERE
                om.org_id = p_org_id
                AND
                om.user_id = auth_current_user_id()
                AND
                om.role = 'owner'
                AND
                om.deleted_at is null
        )
$$;
