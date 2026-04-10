-- create issues.sql

-- when created issues this functions will be started


-- they can be create same issue_title
create or replace funcion create_issues(
    issue_title text
)
returns uuid
LANGUAGE plpgsql
security DEFINER
set search_path = PUBLIC
AS $$
declare
    v_org_id uuid;
    v_