ALTER TABLE scars ADD COLUMN notes text;

ALTER TABLE skills ADD COLUMN evidence_workbench_id text;
ALTER TABLE skills ADD COLUMN last_evidence_at integer;
ALTER TABLE skills ADD COLUMN review_due_at integer;
