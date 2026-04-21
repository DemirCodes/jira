ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_assets_select_policy ON public.site_assets
    FOR SELECT 
    USING (
        auth_is_site_viewer(site_id)
    );

CREATE POLICY site_assets_insert_policy ON public.site_assets
    FOR INSERT 
    WITH CHECK (
        auth_is_site_contributor(site_id)
    );

CREATE POLICY site_assets_update_policy ON public.site_assets
    FOR UPDATE 
    USING (
        auth_is_site_contributor(site_id) OR 
        uploaded_by = auth_current_user_id()
    );

CREATE POLICY site_assets_delete_policy ON public.site_assets
    FOR DELETE 
    USING (
        auth_is_site_admin(site_id) OR 
        uploaded_by = auth_current_user_id()
    );