CREATE TABLE public.email_verifications (
    verification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email public.citext NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);