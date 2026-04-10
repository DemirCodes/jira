alter table public.site_memberships enable row level security;


create POLICY site_memberships_select_policy on public.site_memberships
    for SELECT
    USING
    (
        auth_is_site_viewer(site_id) OR
        auth_is_org_member((select org_id from sites where site_id = site_memberhips.site_id))
    );


CREATE POLICY site_memberships_insert_policy ON public.site_memberships
    FOR INSERT 
    WITH CHECK (
        auth_is_site_admin(site_id) OR
        auth_is_org_admin((SELECT org_id FROM sites WHERE site_id = site_memberships.site_id))
    );

CREATE POLICY site_memberships_update_policy ON public.site_memberships
    FOR UPDATE 
    USING (
        auth_is_site_admin(site_id) OR
        auth_is_org_admin((SELECT org_id FROM sites WHERE site_id = site_memberships.site_id))
    );

CREATE POLICY site_memberships_delete_policy ON public.site_memberships
    FOR DELETE 
    USING (
        auth_is_site_admin(site_id) OR
        auth_is_org_admin((SELECT org_id FROM sites WHERE site_id = site_memberships.site_id))
    );  