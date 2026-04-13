-- indexes/idx_issues_assignee_id.sql

-- Issues tablosu assignee_id için index

-- assignee_id üzerinde index (kullanıcıya atanan issue'lar için)
create index if not exists idx_issues_assignee_id 
    on issues (assignee_id) 
    where deleted_at is null;

-- assignee_id + status composite index (kullanıcıya atanan issue'ları duruma göre filtreleme için)
create index if not exists idx_issues_assignee_id_status 
    on issues (assignee_id, status) 
    where deleted_at is null;

-- assignee_id + priority composite index (kullanıcıya atanan issue'ları önceliğe göre filtreleme için)
create index if not exists idx_issues_assignee_id_priority 
    on issues (assignee_id, priority) 
    where deleted_at is null;