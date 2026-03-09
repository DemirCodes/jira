-- Private issue erişim hakları trigger ı 


-- --> admin issue düzenlemesi için bir kolon yetkı kolonu acmamız gerek 
alter table issues
add column is_editable boolean not null default false;



/*

**OWNER

Her şeyi görür

Her şeyi düzenler

**ADMIN
Görme:

is_private = false → görür

is_private = true → görmez

issue_membership varsa → görür

Düzenleme:

is_private = false VE project_admin ise → düzenler

issue_membership role uygun ise → düzenler

private issue default olarak düzenleyemez


**ISSUE_MEMBERSHIP

Görür

Role’a göre düzenler

contributor → update

reviewer → status change

watcher → read-only


*/



-- RLS->
set app.current_user_id = 'uuid';
-- policy : 
current_settings('app.current_user_id')::uuid;




-- rls active 
alter table issues enable row level security;


create policy issues_select_policy
on issues
for select
using
(
		exists 
		(
			-- owner
			select 1
			from organization_memberships as om
			join projects as p on p.project_id = issues.project_id
			join sites as s on s.site_id = p.site_id
			where om.org_id = s.org_id
			  and om.user_id = current_setting('app.current_user_id')::uuid
			  and om.role = 'owner'
			  and om.membership_is_active = true
			  and om.deleted_at is null
		)
		or
		-- issue membership
		exists 
		(
			select 1
			from issue_membership as im
			where im.issue_id = issues.issue_id
			  and im.user_id = current_setting('app.current_user_id')::uuid
			  and im.membership_is_active = true
			  and im.deleted_at is null
		)
		or
		-- amdin

		(
			issues.is_private = false
			and exists
			(
				select 1
				from organization_memberships as om
				join projects as p on p.project_id = issues.project_id
				join sites as s on s.site_id = p.site_id
				where om.org_id = s.org_id
				  and om.user_id = current_setting('app.current_user_id')::uuid
				  and om.role = 'admin'
				  and om.membership_is_acitve = true
				  and om.deleted_at is null
			)
		)
);





