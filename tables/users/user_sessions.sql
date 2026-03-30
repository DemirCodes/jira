CREATE TABLE public.user_sessions (
    session_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token text NOT NULL,
    access_token text NOT NULL,
    user_agent text,
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);