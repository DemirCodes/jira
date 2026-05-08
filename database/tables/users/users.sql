CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_name text NOT NULL,
    user_last_name text,
    user_display_name text,
    user_email public.citext NOT NULL,
    user_password text NOT NULL,
    user_is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    user_friendship_code uuid DEFAULT gen_random_uuid() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    email_verified_at timestamp with time zone,
    email_verification_token text,
    password_reset_token text,
    password_reset_expires_at timestamp with time zone,
    two_factor_secret text,
    two_factor_enabled boolean DEFAULT false,
    last_password_change_at timestamp with time zone DEFAULT now()
);


ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1;
