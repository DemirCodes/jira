create or replace function create_projects 
(
    project_name text
)
returns uuid
language plpgsql
SECURITY DEFINER
set search_path = public
as $$
DECLARE
    v_site_id uuid;
    v_user_id uuid;
    v_