CREATE TABLE `debate_templates` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`agentIds` json NOT NULL,
	`rounds` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debate_templates_id` PRIMARY KEY(`id`)
);
