ALTER TABLE locker_items ADD COLUMN why_this_matters text;
ALTER TABLE locker_items ADD COLUMN archived_at integer;
ALTER TABLE locker_items ADD COLUMN rescued_item_id text;
ALTER TABLE locker_items ADD COLUMN rescued_workbench_id text;
