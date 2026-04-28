CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);--> statement-breakpoint
CREATE TABLE `bridges` (
	`id` text PRIMARY KEY NOT NULL,
	`source_item_id` text NOT NULL,
	`target_item_id` text NOT NULL,
	`note` text NOT NULL,
	`strength` integer DEFAULT 1 NOT NULL,
	`last_reinforced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bridge_source_idx` ON `bridges` (`source_item_id`);--> statement-breakpoint
CREATE INDEX `bridge_target_idx` ON `bridges` (`target_item_id`);--> statement-breakpoint
CREATE TABLE `camera_states` (
	`id` text PRIMARY KEY NOT NULL,
	`workbench_id` text NOT NULL,
	`pos_x` real DEFAULT 0 NOT NULL,
	`pos_y` real DEFAULT 0 NOT NULL,
	`zoom` real DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workbench_id`) REFERENCES `workbenches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `camera_state_workbench_idx` ON `camera_states` (`workbench_id`);--> statement-breakpoint
CREATE TABLE `item_media` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_item_idx` ON `item_media` (`item_id`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`workbench_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text NOT NULL,
	`pos_x` real DEFAULT 0 NOT NULL,
	`pos_y` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workbench_id`) REFERENCES `workbenches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `item_workbench_idx` ON `items` (`workbench_id`);--> statement-breakpoint
CREATE INDEX `item_type_idx` ON `items` (`type`);--> statement-breakpoint
CREATE TABLE `locker_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`stale_date` integer NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `locker_stale_date_idx` ON `locker_items` (`stale_date`);--> statement-breakpoint
CREATE INDEX `locker_archived_idx` ON `locker_items` (`is_archived`);--> statement-breakpoint
CREATE TABLE `scars` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`failure_type` text NOT NULL,
	`severity` text NOT NULL,
	`cost_time` text,
	`cost_materials` text,
	`cost_money` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scar_item_idx` ON `scars` (`item_id`);--> statement-breakpoint
CREATE INDEX `scar_failure_type_idx` ON `scars` (`failure_type`);--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`background_texture` text DEFAULT 'pegboard' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `shop_created_idx` ON `shops` (`created_at`);--> statement-breakpoint
CREATE TABLE `skill_bridges` (
	`id` text PRIMARY KEY NOT NULL,
	`skill_id` text NOT NULL,
	`item_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `skill_bridge_skill_idx` ON `skill_bridges` (`skill_id`);--> statement-breakpoint
CREATE INDEX `skill_bridge_item_idx` ON `skill_bridges` (`item_id`);--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `skill_status_idx` ON `skills` (`status`);--> statement-breakpoint
CREATE TABLE `workbenches` (
	`id` text PRIMARY KEY NOT NULL,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`pos_x` real DEFAULT 0 NOT NULL,
	`pos_y` real DEFAULT 0 NOT NULL,
	`pos_z` real DEFAULT 0 NOT NULL,
	`width` real DEFAULT 1000 NOT NULL,
	`height` real DEFAULT 1000 NOT NULL,
	`last_opened_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workbench_shop_idx` ON `workbenches` (`shop_id`);--> statement-breakpoint
CREATE INDEX `workbench_created_idx` ON `workbenches` (`created_at`);--> statement-breakpoint
CREATE INDEX `workbench_last_opened_idx` ON `workbenches` (`last_opened_at`);