
CREATE TABLE public.issue_memberships (
    issue_membership_id uuid DEFAULT gen_random_uuid() NOT NULL,
    issue_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.issue_role NOT NULL,
    membership_is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);
