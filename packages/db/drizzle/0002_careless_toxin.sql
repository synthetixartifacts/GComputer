CREATE TABLE `configurations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`default_value` text NOT NULL,
	`options` text,
	`description` text,
	`category` text DEFAULT 'general' NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`is_secret` integer DEFAULT false NOT NULL,
	`validation` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configurations_code_unique` ON `configurations` (`code`);