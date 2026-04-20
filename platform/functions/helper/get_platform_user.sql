create or replace function get_platform_user(p_user_id uuid)
returns table(
	platform_user_id uuid,
	email citext,
	role platform_role,
	is_active boolean,
	created_at timestamptz
)
language plpgsql
security definer
as $$
begin
	if not auth_is_platform_super_admin() then
		raise exception 'Only super admin can view platform users';
	end if;

	return query
	select
		pu.platform_user_id,
		pu.email,
		pu.role,
		pu.is_active,
		pu.created_at
	from
		platform_users as pu
	where
		pu.platform_user_id = p_user_id
		and
		pu.deleted_at is null;
end;
$$;