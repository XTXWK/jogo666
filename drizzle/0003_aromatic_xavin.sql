CREATE TABLE `profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`best_brutality` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
