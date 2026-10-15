CREATE TABLE `room_members` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`member` text NOT NULL,
	`nick` text NOT NULL,
	`joined` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_room_updated` ON `room_members` (`room_id`,`updated`);--> statement-breakpoint
CREATE TABLE `room_signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` text NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_signals_recipient` ON `room_signals` (`room_id`,`recipient`,`id`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`host` text NOT NULL,
	`password` text DEFAULT '' NOT NULL,
	`private` integer DEFAULT 0 NOT NULL,
	`mode` text DEFAULT 'infinite' NOT NULL,
	`max_players` integer DEFAULT 12 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rooms_updated` ON `rooms` (`updated`);