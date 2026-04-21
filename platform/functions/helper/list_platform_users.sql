create or replace function list_platform_users
(
	p_role platform_role default null,
	p_limit int default 50,
	p_offset int default 0
)
returns table
(
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
		raise exception 'Only super admin can list platform users';
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
		(
			p_role is null or pu.role = p_role
		)
		and
		pu.deleted_at is null
	order by
		pu.created_at desc
	limit p_limit offset p_offset;
end;
$$;
