CREATE TABLE public.system_audit_logs (
    audit_id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_type public.actor_type NOT NULL,
    actor_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action_type text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
