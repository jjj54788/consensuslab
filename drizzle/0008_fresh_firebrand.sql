ALTER TABLE `debate_templates` MODIFY COLUMN `userId` varchar(255);--> statement-breakpoint
ALTER TABLE `debate_templates` ADD `isSystem` int DEFAULT 0 NOT NULL;