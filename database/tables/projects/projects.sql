CREATE TABLE public.projects (
    project_id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    project_check_id text NOT NULL,
    project_name text NOT NULL,
    project_description text,
    slug text,
    project_status public.project_status DEFAULT 'active'::public.project_status NOT NULL,
    created_by uuid,
    completed_at timestamp with time zone,
    completed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    is_private boolean DEFAULT false NOT NULL
);