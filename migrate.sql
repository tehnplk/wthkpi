CREATE TABLE IF NOT EXISTS kpi_type (
  id int(10) unsigned NOT NULL,
  type varchar(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO kpi_type (id, type) VALUES (1, 'ยุทธศาสตร์') ON DUPLICATE KEY UPDATE type = VALUES(type);
INSERT INTO kpi_type (id, type) VALUES (2, 'คุณภาพ') ON DUPLICATE KEY UPDATE type = VALUES(type);

ALTER TABLE kpi_topic ADD COLUMN IF NOT EXISTS kpi_type_id int(10) unsigned DEFAULT NULL;
ALTER TABLE kpi_topic ADD COLUMN IF NOT EXISTS status enum('pass','fail','pending') NOT NULL DEFAULT 'pending';
