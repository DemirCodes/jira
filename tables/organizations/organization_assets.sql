CREATE TABLE public.organization_assets (
    org_asset_id uuid DEFAULT gen_random_uuid() NOT NULL,
    org_id uuid NOT NULL,
    uploaded_by uuid,
    asset_type public.asset_type NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    byte_size bigint,
    storage_key text NOT NULL,
    checksum text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid
);