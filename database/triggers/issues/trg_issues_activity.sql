-- triggers/issues/trg_issue_activity.sql

-- Issue activity trigger fonksiyonu
create or replace function trg_issue_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
begin
    -- 1. Kullanıcıyı al
    v_user_id := auth_current_user_id();
    
    -- 2. INSERT işlemi
    if tg_op = 'INSERT' then
        insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
        values (new.issue_id, v_user_id, 'issue_created', null, new.issue_title, now());
        return new;
    
    -- 3. UPDATE işlemi
    elsif tg_op = 'UPDATE' then
        -- issue_title değişti mi?
        if old.issue_title != new.issue_title then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'issue_title', old.issue_title, new.issue_title, now());
        end if;
        
        -- issue_description değişti mi?
        if old.issue_description != new.issue_description then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'issue_description', old.issue_description, new.issue_description, now());
        end if;
        
        -- status değişti mi?
        if old.status != new.status then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'status', old.status::text, new.status::text, now());
        end if;
        
        -- priority değişti mi?
        if old.priority != new.priority then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'priority', old.priority::text, new.priority::text, now());
        end if;
        
        -- assignee_id değişti mi?
        if old.assignee_id != new.assignee_id then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'assignee_id', old.assignee_id::text, new.assignee_id::text, now());
        end if;
        
        -- is_private değişti mi?
        if old.is_private != new.is_private then
            insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
            values (new.issue_id, v_user_id, 'is_private', old.is_private::text, new.is_private::text, now());
        end if;
        
        return new;
    
    -- 4. DELETE işlemi
    elsif tg_op = 'DELETE' then
        insert into issue_activity (issue_id, user_id, field_name, old_value, new_value, created_at)
        values (old.issue_id, v_user_id, 'deleted', old.issue_title, null, now());
        return old;
    end if;
    
    return null;
end;
$$;

-- Trigger'ı oluştur (INSERT ve UPDATE için)
drop trigger if exists issue_activity_trigger on issues;

create trigger issue_activity_trigger
    after insert or update or delete on issues
    for each row
    execute function trg_issue_activity();