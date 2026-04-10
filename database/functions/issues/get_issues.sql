create or replace function get_issues
(
    p_project_id uuid
)
returns table
(
  issue_id uuid,
  issue_name text
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
  SELECT
    i.issue_id,
    i.issue_name
  FROM
    issues as i 
  INNER JOIN 
      issue_memberships as im on im.issue_id = i.issue_id
  WHERE
    i.deleted_at is null
    AND
    (i.project_id is null or i.issue_id = p_project_id)
    AND
    im.user_id = v_user_id
    AND
    im.membership_is_active = 1
    AND
    im.deleted_at is null
  ORDER BY 
    i.issue_name;
end;

$$;


