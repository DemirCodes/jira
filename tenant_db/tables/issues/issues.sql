
CREATE TABLE public.issues (
    issue_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    issue_no bigint NOT NULL,
    issue_title text NOT NULL,
    issue_description text,
    status public.issue_status DEFAULT 'open'::public.issue_status NOT NULL,
    priority public.priority_level DEFAULT 'medium'::public.priority_level,
    reporter_id uuid,
    assignee_id uuid,
    parent_issue_id uuid,
    blocking_issue_id uuid,
    issue_is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    is_private boolean DEFAULT false NOT NULL,
    is_editable boolean DEFAULT false NOT NULL
);
