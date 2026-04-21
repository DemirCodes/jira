-- Active: 1772756684414@@127.0.0.1@5432@jira



-- user uuid  take ledık
create or replace function auth_current_user_id()
RETURNS uuid
language sql 
stable
as $$
select current_setting('app.current_user_id')::uuid;
$$;




-- user  projects 'project_admin' üyesimi ? check func
create or replace function auth_is_project_admin(p_project_id uuid)
returns BOOLEAN
language SQL
stable
as $$
select 
    exists 
            (
                select 
                    1
                from 
                    project_memberships as pm 
                where 
                    pm.project_id = p_project_id
                    AND
                    pm.user_id = auth_current_user_id()
                    AND
                    pm.role = 'project_admin'::project_role
                    AND
                    pm.deleted_at is NULL
            )
$$;

-- user projects 'contributor' üyesimi ? check func
create or replace function auth_is_project_contributor(p_project_id uuid)
returns boolean
LANGUAGE SQL
STABLE
as $$
select 
    EXISTS
            (
                select
                    1
                FROM
                    project_memberships as pm
                WHERE
                    pm.project_id = p_project_id
                    AND
                    pm.user_id = auth_current_user_id()
                    AND
                    pm.role = 'contributor'::project_role
                    AND
                    pm.deleted_at is NULL
            )
$$;

-- user projects 'reviewer' üyesimi ? check  func
create or replace FUNCTION auth_is_project_reviewer(p_project_id uuid)
returns boolean
language sql
STABLE
as $$
SELECT
    EXISTS
        (
            select 
                1
            FROM
                project_memberships as pm
            where 
                pm.project_id = p_project_id
                AND
                pm.user_id = auth_current_user_id()
                AND
                pm.role = 'reviewer'::project_role
                AND
                pm.deleted_at is null
        )
$$;



-- user projects 'viewer' üyesimi ? check  func
create or replace FUNCTION auth_is_project_viewer(p_project_id uuid)
returns boolean
language sql
STABLE
as $$
SELECT
    EXISTS
        (
            select 
                1
            FROM
                project_memberships as pm
            where 
                pm.project_id = p_project_id
                AND
                pm.user_id = auth_current_user_id()
                AND
                pm.role = 'viewer'::project_role
                AND
                pm.deleted_at is null
        )
$$;