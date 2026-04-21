CREATE OR REPLACE FUNCTION trigger_notify_issue_assigned()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assignee_id IS NOT NULL AND OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        INSERT INTO notifications (user_id, type, title, content, metadata)
        VALUES (
            NEW.assignee_id,
            'issue_assigned',
            'Yeni Issue Atandı',
            'Issue #' || NEW.issue_no || ': ' || NEW.issue_title,
            jsonb_build_object('issue_id', NEW.issue_id, 'issue_no', NEW.issue_no)
        );
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issue_assigned_notification
AFTER UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_issue_assigned();