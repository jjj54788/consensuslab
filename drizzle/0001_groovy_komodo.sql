CREATE TABLE `agents` (
	`id` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`profile` varchar(200) NOT NULL,
	`systemPrompt` text NOT NULL,
	`color` varchar(20) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debate_sessions` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`topic` text NOT NULL,
	`agentIds` json NOT NULL,
	`maxRounds` int NOT NULL DEFAULT 5,
	`currentRound` int NOT NULL DEFAULT 0,
	`status` enum('pending','running','paused','completed','error') NOT NULL DEFAULT 'pending',
	`summary` text,
	`keyPoints` json,
	`consensus` json,
	`disagreements` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `debate_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`sender` varchar(64) NOT NULL,
	`receiver` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`round` int NOT NULL,
	`sentiment` enum('positive','negative','neutral'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
