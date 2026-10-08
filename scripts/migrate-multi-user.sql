-- Multi-user migration. Run through scripts/migrate-multi-user.mjs, which fills in
-- the owner of existing rows (__OWNER_ID__) and wraps everything in one transaction.

ALTER TABLE `user` ADD `username` text;
ALTER TABLE `user` ADD `headline` text;
ALTER TABLE `user` ADD `bio` text;
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);

CREATE TABLE `__new_books` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`authors` text NOT NULL,
	`year` integer,
	`status` text DEFAULT 'want-to-read' NOT NULL,
	`progress` integer DEFAULT 0,
	`rating` integer,
	`cover_url` text,
	`file_url` text,
	`last_location` text,
	`finished_at` text,
	`notes` text,
	`tags` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `__new_books` (`id`, `user_id`, `title`, `authors`, `year`, `status`, `progress`, `rating`, `cover_url`, `file_url`, `last_location`, `finished_at`, `notes`, `tags`, `created_at`, `updated_at`)
SELECT `id`, '__OWNER_ID__', `title`, `authors`, `year`, `status`, `progress`, `rating`, `cover_url`, `file_url`, `last_location`,
	CASE WHEN `status` = 'finished' THEN substr(`updated_at`, 1, 10) END, `notes`, `tags`, `created_at`, `updated_at`
FROM `books`;
DROP TABLE `books`;
ALTER TABLE `__new_books` RENAME TO `books`;

CREATE TABLE `__new_concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text,
	`status` text DEFAULT 'studied' NOT NULL,
	`notes` text,
	`tags` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `__new_concepts` (`id`, `user_id`, `name`, `slug`, `short_description`, `status`, `notes`, `tags`, `created_at`, `updated_at`)
SELECT `id`, '__OWNER_ID__', `name`, `slug`, `short_description`, `status`, `notes`, `tags`, `created_at`, `updated_at`
FROM `concepts`;
DROP TABLE `concepts`;
ALTER TABLE `__new_concepts` RENAME TO `concepts`;
CREATE UNIQUE INDEX `concepts_user_slug_unique` ON `concepts` (`user_id`, `slug`);

CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`repo_url` text,
	`status` text DEFAULT 'idea' NOT NULL,
	`tech_stack` text,
	`lessons_learned` text,
	`completed_at` text,
	`tags` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `__new_projects` (`id`, `user_id`, `name`, `description`, `repo_url`, `status`, `tech_stack`, `lessons_learned`, `completed_at`, `tags`, `created_at`, `updated_at`)
SELECT `id`, '__OWNER_ID__', `name`, `description`, `repo_url`, `status`, `tech_stack`, `lessons_learned`,
	CASE WHEN `status` = 'completed' THEN substr(`updated_at`, 1, 10) END, `tags`, `created_at`, `updated_at`
FROM `projects`;
DROP TABLE `projects`;
ALTER TABLE `__new_projects` RENAME TO `projects`;

CREATE TABLE `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`link` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
