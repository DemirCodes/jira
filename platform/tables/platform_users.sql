CREATE TABLE platform_users (
    platform_user_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email citext UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role platform_role NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid
);