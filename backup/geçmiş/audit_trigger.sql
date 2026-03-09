/*
	Bu sorgu kısmında user ilk defa organızasyon olusturdugund kı durumları ele alıp kodlarını yazcaz
	
*/

CREATE OR REPLACE FUNCTION create_organization(
    p_user_id uuid,
    p_org_name text,
    p_slug text,
    p_description text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_org_id uuid;
    v_slug text;
    v_org_count integer;
BEGIN
    -- =========================
    -- VALIDATION
    -- =========================
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User id is required';
    END IF;

    -- Kullanıcı aktif mi?
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE user_id = p_user_id
          AND user_is_active = true
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User not found or inactive';
    END IF;

    -- =========================
    -- ORGANIZATION LIMIT CONTROL
    -- =========================
    
    SELECT COUNT(*) INTO v_org_count
    FROM organizations
    WHERE created_by = p_user_id
      AND deleted_at IS NULL;

    IF v_org_count >= 2 THEN
        RAISE EXCEPTION 'Organization creation limit reached (max 2)';
    END IF;

    -- =========================
    -- FIELD VALIDATION
    -- =========================
    
    IF p_org_name IS NULL OR length(trim(p_org_name)) = 0 THEN
        RAISE EXCEPTION 'Organization name is required';
    END IF;

    IF p_slug IS NULL OR length(trim(p_slug)) = 0 THEN
        RAISE EXCEPTION 'Slug is required';
    END IF;

    v_slug := lower(trim(p_slug));

    IF EXISTS (
        SELECT 1 FROM organizations 
        WHERE slug = v_slug 
          AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Slug already exists';
    END IF;

    -- =========================
    -- INSERT ORGANIZATION
    -- =========================
    
    INSERT INTO organizations (
        org_name,
        slug,
        org_check_id,
        org_description,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        trim(p_org_name),
        v_slug,
        encode(gen_random_bytes(6), 'hex'),
        p_description,
        p_user_id,
        now(),
        now()
    )
    RETURNING org_id INTO v_org_id;

    -- =========================
    -- INSERT OWNER MEMBERSHIP
    -- =========================
    
    INSERT INTO organization_memberships (
        org_id,
        user_id,
        role,
        membership_is_active,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        v_org_id,
        p_user_id,
        'owner',
        true,
        now(),
        now(),
        now()
    );

    -- =========================
    -- AUDIT
    -- =========================
    
    INSERT INTO system_audit_logs (
        actor_type,
        actor_id,
        entity_type,
        entity_id,
        action_type,
        new_value,
        created_at
    )
    VALUES (
        'tenant_user',
        p_user_id,
        'organization',
        v_org_id,
        'CREATE',
        jsonb_build_object(
            'org_name', trim(p_org_name),
            'slug', v_slug
        ),
        now()
    );

    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;






-- Organizasyon da ki tek owner ın degısıklıge ugrama engelı ->

create or replace function prevent_last_owner_removal()
returns trigger as $$
declare 
	v_owner_count integer;
begin
	-- Sadece eski kayıt owner ise ilgileniyoruz
	if OLD.role = 'owner' then

		-- Owner rolü değiştiriliyormu?
		if TG_OP = 'UPDATE' and 
		(
			NEW.role <> 'owner'
			or	NEW.membership_is_active = false
			or 	NEW.deleted_at is not null
		)
		or TG_OP = 'DELETE' 
		THEN

			-- v_owner_count içerisine aktif olan ve silinmemiş koşullarını saglayan owner sayısını ekledik
			select count(*) into v_owner_count
			from organization_memberships
			where 
				org_id = OLD.org_id
				and
				membership_is_active = true
				and
				deleted_at is null;
			-- v_owner_count yani owner sayısı 1 ve ya 1 den az ise hata patlattık
			if v_owner_count <= 1 then
				raise exception
					'Organization must have at least one active owner.';
			end if;
		end if;

		return NEW;
end;
$$ language plpgsql;

create trigger trg_prevent_last_owner_removal
before update or delete on organization_memberships
for each row
execute function prevent_last_owner_removal();

-- Unutmus oldugum user a default olarak viewer rolunu verme yı tamamladık ->
alter table organization_memberships 
alter column role set default 'viewer';


-- user soft delete veya delete e ugradıysa organizasyon tablolarındakı guncellemeler -> 
create or replace function propagate_user_deactivation_to_memberships()
returns trigger as $$
begin
		-- user soft delete veya inactive olduysa 
		if  (OLD.deleted_at is null and NEW.deleted_at is not null)
				or
			(OLD.user_is_active = true  and NEW.user_is_active = false)
		then

				update 
					organization_memberships
				set 
					membership_is_acive = false,
					updated_at = now()
				where
					user_id = NEW.user_id
					and
					membership_is_active = true
					and
					deleted_at is null;
		end if;

		return NEW;
end;
$$ language plpgsql;

CREATE TRIGGER trg_user_deactivation_propagation
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION propagate_user_deactivation_to_memberships();





-- organizasyon uyelerı tablosunda eger bir user inactive duruma duserse -> 
CREATE OR REPLACE FUNCTION propagate_user_soft_delete_to_org_memberships()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- User soft delete olduysa (ilk kez deleted_at doluyorsa)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN

    UPDATE organization_memberships om
    SET
      membership_is_active = false,
      deleted_at = COALESCE(om.deleted_at, now()),
      deleted_by = COALESCE(NEW.deleted_by, om.deleted_by),
      updated_at = now()
    WHERE om.user_id = NEW.user_id
      AND om.deleted_at IS NULL;  -- daha önce silinmemiş membership'ler

  END IF;

  -- İstersen sadece inactive olunca da üyeliği pasife çek (deleted_at setleme yok)
  IF OLD.user_is_active = true AND NEW.user_is_active = false AND NEW.deleted_at IS NULL THEN
    UPDATE organization_memberships om
    SET
      membership_is_active = false,
      updated_at = now()
    WHERE om.user_id = NEW.user_id
      AND om.deleted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_soft_delete_memberships ON users;

CREATE TRIGGER trg_user_soft_delete_memberships
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION propagate_user_soft_delete_to_org_memberships();


/*
UPDATE users
SET deleted_at = now(),
    deleted_by = :actor_user_id
WHERE user_id = :target_user_id
  AND deleted_at IS NULL;
*/


/*
	TİP: another tables(project_memberships , issue_membership , organization_membership) have membersip_is_active . we can use that column . 
	and its working like boolean true is default version.
*/



-- inactive user organizasyon içerisine membership olarak eklenmemelı 
create or replace function validate_org_membership_insert()
returns trigger
language plpgsql
as $$
declare
	v_user_active boolean;
	v_user_deleted_at timestamptz;
	v_org_deleted_at timestamptz;
begin
	-- user check
	select
		user_is_Active,
		deleted_at
	into 
		v_user_active ,
		v_user_deleted_at
	from 	
		users
	where 
		user_id = NEW.user_id;


	if not found then
		raise exception 'user does not exists';
	end if;

	if v_user_active = false or v_user_deleted_at is not null then
		raise exception	'User is inactive or deleted';
	end if;

	-- organization kontrolu
	select 
		deleted_at
	into
		v_org_deleted
	from
		organizations
	where
		org_id = NEW.org_id;


	if not found then
		raise exception 'Organization does not exists';
	end if;

	if v_org_deleted_at is not null then
		raise exception 'Cannot add membership to deleted organization';
	end if;

	return NEW;
end;
$$;

DROP TRIGGER IF EXISTS trg_validate_org_membership_insert
ON organization_memberships;

CREATE TRIGGER trg_validate_org_membership_insert
BEFORE INSERT ON organization_memberships
FOR EACH ROW
EXECUTE FUNCTION validate_org_membership_insert();
	


