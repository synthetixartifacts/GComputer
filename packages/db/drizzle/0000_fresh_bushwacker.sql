CREATE TABLE `ai_agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`version` text DEFAULT '1.0' NOT NULL,
	`enable` integer DEFAULT true NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`system_prompt` text,
	`configuration` text DEFAULT '{}' NOT NULL,
	`model_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_agents_code_unique` ON `ai_agents` (`code`);--> statement-breakpoint
CREATE TABLE `ai_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`model` text NOT NULL,
	`input_price` real,
	`output_price` real,
	`endpoint` text NOT NULL,
	`params` text DEFAULT '{}' NOT NULL,
	`message_location` text,
	`message_stream_location` text,
	`input_token_count_location` text,
	`output_token_count_location` text,
	`provider_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`provider_id`) REFERENCES `ai_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_models_code_unique` ON `ai_models` (`code`);--> statement-breakpoint
CREATE TABLE `ai_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`authentication` text NOT NULL,
	`secret_key` text,
	`configuration` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_providers_code_unique` ON `ai_providers` (`code`);--> statement-breakpoint
CREATE TABLE `test` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`column1` text,
	`column2` text
);
