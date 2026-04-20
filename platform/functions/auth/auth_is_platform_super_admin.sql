create or replace function auth_is_platform_super_admin()
returns boolean
language sql stable 
as $$
	select exists (
		select 
			1
		from
			platform_users
		where
			platforms_user_id = auth_current_platform_user_id()
			and
			role = 'super_admin'
			and
			is_active = true
			and
			deleted_at is null
	);
$$;