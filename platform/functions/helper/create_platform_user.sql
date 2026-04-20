create or replace function create_platorm_user
(
	p_email citext,
	p_password_hash text,
	p_role platform_role
)
returns uuid
language plpgsql
security definer
as $$
declare
	v_user_id uuid;
	v_actor_id uuid;
begin
	v_actor_id := auth_current_platform_user_id();

	if v_actor_id is null then
		raise exception 'User not authenticated';
	end if;

	if not auth_is_platform_super_admin() then
		raise exception 'Only super admin can create platform users';
	end if;


	insert into 
		platform_user
		(
			email,
			password_hash,
			role,
			is_active
		)
	values
		(
			p_email,
			p_password_hash,
			p_role,
			true
		)
	returning
		platform_user_id 
	into
		v_user_id;


	return v_user_id;
end;
$$;