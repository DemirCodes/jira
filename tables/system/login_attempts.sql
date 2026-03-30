CREATE TABLE public.login_attempts (
    attempt_id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    ip_address inet,
    success boolean DEFAULT false NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);