CREATE TABLE public.site_memberships (
    site_membership_id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.site_role NOT NULL,
    invited_by uuid,
    membership_is_active boolean DEFAULT true NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);