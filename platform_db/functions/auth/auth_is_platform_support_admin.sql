create or replace function auth_is_platform_support_admin()
returns boolean
language sql stable 
as $$
	select	exists(
		select
			1
		from	
			platform_users
		where
			platform_user_id = auth_current_platform_user_id()
			and
			role = 'support_admin'
			and
			is_active = true
			and
			deleted_at is null
	);
$$;