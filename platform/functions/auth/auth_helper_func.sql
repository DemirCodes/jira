create or replace function auth_current_platform_user_id()
returns uuid
language sql stable
as $$
	select current_setting('app.current_platform_user_id')::uuid;
$$;