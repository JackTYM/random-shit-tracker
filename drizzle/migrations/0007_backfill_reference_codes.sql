-- Custom SQL migration file, put your code below! --

WITH numbered AS (
  SELECT
    id,
    (CASE category
      WHEN 'motor' THEN 'MOT'
      WHEN 'kit' THEN 'KIT'
      WHEN 'plane' THEN 'PLN'
      WHEN 'part' THEN 'PRT'
      WHEN 'print' THEN 'PRN'
      WHEN 'other' THEN 'OTH'
    END) || '-' || lpad(
      (row_number() over (partition by owner_id, category order by created_at))::text,
      4, '0'
    ) AS computed_code
  FROM items
  WHERE reference_code IS NULL
)
UPDATE items
SET reference_code = numbered.computed_code
FROM numbered
WHERE items.id = numbered.id;
