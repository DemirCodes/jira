\i enums/site_enums.sql
\i tables/sites/site_memberships.sql
\i tables/sites/site_assets.sql
\i functions/auth/auth_is_site_admin.sql
\i functions/auth/auth_is_site_contributor.sql
\i functions/auth/auth_is_site_viewer.sql
\i functions/helper/site_helper_functions.sql
\i triggers/sites/trg_site_memberships_role_guard.sql
\i policies/sites/site_memberships_rls.sql
\i policies/sites/site_assets_rls.sql

ALTER TABLE public.site_memberships
    ADD CONSTRAINT site_memberships_site_id_fkey 
    FOREIGN KEY (site_id) REFERENCES public.sites(site_id) ON DELETE CASCADE;

ALTER TABLE public.site_memberships
    ADD CONSTRAINT site_memberships_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;



