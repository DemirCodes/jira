CREATE TABLE user_sessions (
    session_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform_user_id uuid REFERENCES platform_users(platform_user_id),
    token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    revoked_at timestamptz
);
