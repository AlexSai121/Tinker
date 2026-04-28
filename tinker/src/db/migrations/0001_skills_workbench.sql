ALTER TABLE `skills` ADD COLUMN `workbench_id` text REFERENCES `workbenches`(`id`) ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX `skill_workbench_idx` ON `skills` (`workbench_id`);
