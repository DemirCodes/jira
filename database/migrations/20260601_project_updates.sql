-- Active: 1778846018554@@127.0.0.1@5432@jira
-- Sütunları ekle
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_key VARCHAR(6);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS board_type VARCHAR(20) DEFAULT 'scrum';

ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- KRİTİK: Eğer sistemde halihazırda proje varsa 'project_key' null olamaz.
-- Mevcut projelere ID'lerinin ilk 5 harfinden oluşan geçici bir key atıyoruz.
UPDATE projects
SET
    project_key = UPPER(
        SUBSTRING(project_id::text, 1, 5)
    )
WHERE
    project_key IS NULL;

-- Şimdi kısıtlamaları (Constraints) güvenle ekleyebiliriz
ALTER TABLE projects ALTER COLUMN project_key SET NOT NULL;

ALTER TABLE projects
ADD CONSTRAINT projects_site_id_project_key_unique UNIQUE (site_id, project_key);