CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`nick` text NOT NULL,
	`rules` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL,
	`finished` integer DEFAULT 0 NOT NULL,
	`seconds` real DEFAULT 0 NOT NULL,
	`kills` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`damage` real DEFAULT 0 NOT NULL,
	`build` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_runs_owner_created` ON `runs` (`owner`,`created`);--> statement-breakpoint
CREATE INDEX `idx_runs_ranking` ON `runs` (`rules`,`finished`,`seconds`);