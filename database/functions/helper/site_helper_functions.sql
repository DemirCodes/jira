-- Active: 1772756684414@@127.0.0.1@5432@jira


create or replace function auth_current_user_id()
returns uuid
language sql
STABLE
as $$
select current_setting('app.current_user_id')::uuid;
$$;


-- user site ''

create or replace function auth_is_site_admin(p_site_id uuid) 
returns BOOLEAN
language SQL
stable 
as $$
    SELECT
        EXISTS
            (
                SELECT
                    1
                from    
                    site_memberships as sm
                WHERE
                    sm.site_id = p_site_id
                    AND
                    sm.user_id = auth_current_user_id()
                    AND
                    sm.role = 'admin'
                    AND
                    sm.deleted_at is null
            )

$$;

create or replace function auth_is_site_contributor(p_site_id uuid)
returns boolean
language sql
stable
as $$
    select
        exists
        (
            select
                1
            from
                site_memberships as sm
            where
                sm.site_id = p_site_id
                and
                sm.user_id = auth_current_user_id()
                and
                sm.role = 'contrubitor'
                and
                sm.deleted_at is null
        )
$$;


create or replace function auth_is_site_viewer(p_site_id uuid)
returns BOOLEAN
language SQL
STABLE
as $$
    SELECT
        EXISTS
        (
            SELECT
                1
            from
                site_memberships as sm
            WHERE
                sm.site_id = p_site_id
                AND
                sm.user_id = auth_current_user_id()
                AND
                sm.role = 'viewer'
                AND
                sm.deleted_at is null
        )

$$;
