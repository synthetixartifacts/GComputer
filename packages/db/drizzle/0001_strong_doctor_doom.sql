CREATE TABLE `discussions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text DEFAULT 'New Discussion' NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`agent_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `ai_agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`who` text NOT NULL,
	`content` text NOT NULL,
	`discussion_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`discussion_id`) REFERENCES `discussions`(`id`) ON UPDATE no action ON DELETE cascade
);
