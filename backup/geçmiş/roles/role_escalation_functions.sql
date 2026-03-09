-- =========================================
--	1) Role uyumluluk fonksiyonları 
-- =========================================

create or replace function can_assign_project_role
(
		p_org_role org_role, 
		p_project_role project_role
)
returns boolean
language plpgsql
immutable
as $$
begin
	-- owner|admin: her project rolunu atabilir
	if p_org_role in ('owner','admin') then
		return true;
	end if;

	-- membeR: project_admin olamaz
	if p_org_role = 'member' then
		return  p_project_role in ('contributor' , 'reviewer', 'viewer');
	end if;

	if p_org_role = 'viewer' then
		return p_project_role = 'viewer';
	end if;

	return false;
end;
$$;


-- ====================================
-- 2) Trigger function
-- ====================================

create or replace function trg_project_memberships_role_guard()
returns trigger
language plpgsql
as $$
declare
	v_org_id uuid;
	v_org_role org_role;
begin
	
		-- Project -> Site -> Organization
		select 
			s.org_id
		into
			v_org_id
		from 
			projects as p
		join 
			sites as s on s.site_id = p.site_id
		where
			p.project_id = NEW.project_id;


		if v_org_id is null then 
			raise exception 'Organization not found  for project %', NEW.project_id;
		end if;


		-- Kullanıcının organization rolunu al
		select
			om.role
		into 
			v_org_role
		from 
			organization_memberships as om 
		where 
			om.org_id = v_org_id
					and
			om.user_id = NEW.user_id
					and
			om.membership_is_active = true
					and
			om.deleted_at is null;



		if v_org_role is null then 
			raise exception 
				'User % is not an active member of organization %',
				NEW.user_id , v_org_id;
		end if;

		-- Escalation kontrolü
		if not can_assign_project_role(v_org_role , NEW.role) then
			raise exception
			'Role escalation blocked: org_role= % cannot be assigned project_role = %',
			v_org_role, NEW.role;
		end if;

		return NEW;
end;
$$;
 
-- ================================
--	3) Trigger Baglama
-- ================================

drop trigger if exists project_membership_role_guard
on project_memberships;

create trigger project_memberships_role_guard
before insert or update of role
on project_memberships
for each row
execute function trg_project_memberships_role_guard();