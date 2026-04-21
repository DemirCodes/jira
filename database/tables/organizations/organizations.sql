
CREATE TABLE public.organizations (
    org_id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_check_id text NOT NULL,
    org_name text NOT NULL,
    org_description text,
    slug text NOT NULL,
    org_status text DEFAULT 'active'::text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);
