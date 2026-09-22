INSERT INTO "streams" ("class_level_id", "name", "capacity")
SELECT "class_levels"."id", 'A', 40
FROM "class_levels"
WHERE NOT EXISTS (
  SELECT 1
  FROM "streams"
  WHERE "streams"."class_level_id" = "class_levels"."id"
    AND "streams"."name" = 'A'
);
