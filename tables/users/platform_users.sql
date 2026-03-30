CREATE TABLE public.platform_users (
    platform_user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    role public.platform_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);

