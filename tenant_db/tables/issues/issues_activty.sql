create table if not exists issue_activity (
    activity_id uuid default gen_random_uuid() primary key,
    issue_id uuid not null references issues(issue_id) on delete cascade,
    user_id uuid references users(user_id) on delete set null,
    field_name text not null,
    old_value text,
    new_value text,
    created_at timestamptz default now()
);
