CREATE TABLE `notice_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

--> statement-breakpoint
CREATE INDEX `notice_channels_guild_id_idx` ON `notice_channels` (`guild_id`);
--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`result` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`day` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

--> statement-breakpoint
CREATE INDEX `results_user_id_idx` ON `results` (`user_id`);
--> statement-breakpoint
CREATE INDEX `results_discord_id_idx` ON `results` (`discord_id`);
--> statement-breakpoint
CREATE INDEX `results_discord_id_year_month_day_idx` ON `results` (`discord_id`,`year`,`month`,`day`);
--> statement-breakpoint
CREATE INDEX `results_discord_id_year_month_idx` ON `results` (`discord_id`,`year`,`month`);
--> statement-breakpoint
CREATE UNIQUE INDEX `results_discord_id_year_month_day_unique` ON `results` (`discord_id`,`year`,`month`,`day`);
--> statement-breakpoint
CREATE TABLE `totals` (
	`id` text PRIMARY KEY NOT NULL,
	`kira` integer DEFAULT 0 NOT NULL,
	`yoshida` integer DEFAULT 0 NOT NULL,
	`daikichi` integer DEFAULT 0 NOT NULL,
	`chukichi` integer DEFAULT 0 NOT NULL,
	`kichi` integer DEFAULT 0 NOT NULL,
	`syokichi` integer DEFAULT 0 NOT NULL,
	`suekichi` integer DEFAULT 0 NOT NULL,
	`kyo` integer DEFAULT 0 NOT NULL,
	`daikyo` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`kira` integer DEFAULT 0 NOT NULL,
	`yoshida` integer DEFAULT 0 NOT NULL,
	`daikichi` integer DEFAULT 0 NOT NULL,
	`chukichi` integer DEFAULT 0 NOT NULL,
	`kichi` integer DEFAULT 0 NOT NULL,
	`syokichi` integer DEFAULT 0 NOT NULL,
	`suekichi` integer DEFAULT 0 NOT NULL,
	`kyo` integer DEFAULT 0 NOT NULL,
	`daikyo` integer DEFAULT 0 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

--> statement-breakpoint
CREATE INDEX `users_discord_id_idx` ON `users` (`discord_id`);