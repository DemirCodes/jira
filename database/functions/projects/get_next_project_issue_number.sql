CREATE OR REPLACE FUNCTION get_next_project_issue_number(p_project_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_val INT;
BEGIN
    INSERT INTO project_issue_counters (project_id, last_value)
    VALUES (p_project_id, 1)
    ON CONFLICT (project_id) 
    DO UPDATE SET 
        last_value = project_issue_counters.last_value + 1,
        updated_at = now()
    RETURNING last_value INTO v_next_val;

    RETURN v_next_val;
END;
$$;