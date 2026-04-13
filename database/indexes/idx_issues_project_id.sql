-- indexes/idx_issues_project_id.sql

-- Issues tablosu için index'ler

-- 1. project_id üzerinde index (projedeki issue'ları hızlı getirir)
create index if not exists idx_issues_project_id 
    on issues (project_id) 
    where deleted_at is null;

-- 2. status üzerinde index (duruma göre filtreleme için)
create index if not exists idx_issues_status 
    on issues (status) 
    where deleted_at is null;

-- 3. priority üzerinde index (önceliğe göre filtreleme için)
create index if not exists idx_issues_priority 
    on issues (priority) 
    where deleted_at is null;

-- 4. reporter_id üzerinde index (kullanıcının açtığı issue'lar için)
create index if not exists idx_issues_reporter_id 
    on issues (reporter_id) 
    where deleted_at is null;

-- 5. assignee_id üzerinde index (kullanıcıya atanan issue'lar için)
create index if not exists idx_issues_assignee_id 
    on issues (assignee_id) 
    where deleted_at is null;

-- 6. parent_issue_id üzerinde index (alt issue'lar için)
create index if not exists idx_issues_parent_issue_id 
    on issues (parent_issue_id) 
    where deleted_at is null;

-- 7. created_at üzerinde index (tarihe göre sıralama için)
create index if not exists idx_issues_created_at 
    on issues (created_at desc) 
    where deleted_at is null;

-- 8. Composite index (project_id + status birlikte filtreleme için)
create index if not exists idx_issues_project_id_status 
    on issues (project_id, status) 
    where deleted_at is null;

-- 9. Composite index (project_id + priority birlikte filtreleme için)
create index if not exists idx_issues_project_id_priority 
    on issues (project_id, priority) 
    where deleted_at is null;

-- 10. Composite index (assignee_id + status birlikte filtreleme için)
create index if not exists idx_issues_assignee_id_status 
    on issues (assignee_id, status) 
    where deleted_at is null;