-- Create Religion Master Table
CREATE TABLE IF NOT EXISTS religion_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  religion_name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add religion_id to community_master (link communities to religions)
ALTER TABLE community_master
  ADD COLUMN religion_id INT DEFAULT NULL AFTER id,
  ADD FOREIGN KEY (religion_id) REFERENCES religion_master(id) ON DELETE SET NULL;

-- Create Caste Master Table (linked to communities)
CREATE TABLE IF NOT EXISTS caste_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  caste_name VARCHAR(100) NOT NULL,
  community_id INT NOT NULL,
  religion_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (community_id) REFERENCES community_master(id) ON DELETE CASCADE,
  FOREIGN KEY (religion_id) REFERENCES religion_master(id) ON DELETE CASCADE,
  UNIQUE KEY unique_caste_per_community (caste_name, community_id)
);

-- Insert Religions
INSERT INTO religion_master (religion_name) VALUES
('Hindu'),
('Christian'),
('Muslim'),
('Sikh'),
('Buddhist'),
('Jain'),
('Others')
ON DUPLICATE KEY UPDATE religion_name=VALUES(religion_name);

-- Update existing communities with religion associations (Hindu communities first)
UPDATE community_master SET religion_id = (SELECT id FROM religion_master WHERE religion_name = 'Hindu')
WHERE community_name IN ('BC', 'BCM', 'MBC', 'DNC', 'OC');

UPDATE community_master SET religion_id = (SELECT id FROM religion_master WHERE religion_name = 'Hindu')
WHERE community_name = 'SC' OR community_name = 'ST';

-- Add sample castes for Hindu communities
INSERT INTO caste_master (caste_name, community_id, religion_id)
SELECT c.caste_name, cm.id, r.id
FROM (
  SELECT 'Mudaliar' as caste_name UNION
  SELECT 'Reddy' UNION
  SELECT 'Kamma' UNION
  SELECT 'Velama' UNION
  SELECT 'Naidu' UNION
  SELECT 'Reddiar' UNION
  SELECT 'Kumhar' UNION
  SELECT 'Dhobi' UNION
  SELECT 'Barber' UNION
  SELECT 'Carpenter' UNION
  SELECT 'Blacksmith' UNION
  SELECT 'Mochi'
) c
CROSS JOIN community_master cm
CROSS JOIN religion_master r
WHERE cm.community_name IN ('BC', 'BCM', 'MBC', 'DNC')
AND r.religion_name = 'Hindu'
ON DUPLICATE KEY UPDATE caste_name=VALUES(caste_name);

-- Add sample SC/ST castes
INSERT INTO caste_master (caste_name, community_id, religion_id)
SELECT c.caste_name, cm.id, r.id
FROM (
  SELECT 'Adi Dravidar' as caste_name UNION
  SELECT 'Adi Dravida' UNION
  SELECT 'Madiga' UNION
  SELECT 'Chakkiliyar' UNION
  SELECT 'Iraular' UNION
  SELECT 'Kanikar' UNION
  SELECT 'Korachar' UNION
  SELECT 'Lambadi' UNION
  SELECT 'Maldhari' UNION
  SELECT 'Paraiyan' UNION
  SELECT 'Samban' UNION
  SELECT 'Thoti'
) c
CROSS JOIN community_master cm
CROSS JOIN religion_master r
WHERE cm.community_name IN ('SC', 'ST')
AND r.religion_name = 'Hindu'
ON DUPLICATE KEY UPDATE caste_name=VALUES(caste_name);

-- Add OC (Others) castes
INSERT INTO caste_master (caste_name, community_id, religion_id)
SELECT c.caste_name, cm.id, r.id
FROM (
  SELECT 'Brahmin' as caste_name UNION
  SELECT 'Brahmin - Iyer' UNION
  SELECT 'Brahmin - Iyengar' UNION
  SELECT 'Brahmin - Saivite' UNION
  SELECT 'Brahmin - Vaishnav' UNION
  SELECT 'Brahmin - Others' UNION
  SELECT 'Chetty' UNION
  SELECT 'Chettiar' UNION
  SELECT 'Christian' UNION
  SELECT 'Desai' UNION
  SELECT 'Kulkarni' UNION
  SELECT 'Marwari'
) c
CROSS JOIN community_master cm
CROSS JOIN religion_master r
WHERE cm.community_name = 'OC'
AND r.religion_name = 'Hindu'
ON DUPLICATE KEY UPDATE caste_name=VALUES(caste_name);

-- Create indexes for quick lookups
CREATE INDEX idx_religion_id ON community_master(religion_id);
CREATE INDEX idx_community_caste ON caste_master(community_id);
CREATE INDEX idx_religion_caste ON caste_master(religion_id);
