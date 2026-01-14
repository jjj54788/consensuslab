CREATE TABLE `agent_model_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`agentId` varchar(64) NOT NULL,
	`modelId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_model_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`baseUrl` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_providers_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `model_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64),
	`modelId` int NOT NULL,
	`agentId` varchar(64),
	`inputTokens` int,
	`outputTokens` int,
	`cost` decimal(10,6),
	`latencyMs` int,
	`status` varchar(20) NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_usage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` int NOT NULL,
	`modelName` varchar(100) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`description` text,
	`maxTokens` int NOT NULL DEFAULT 4096,
	`costPer1kInput` decimal(10,6),
	`costPer1kOutput` decimal(10,6),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`providerId` int NOT NULL,
	`apiKeyEncrypted` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_api_keys_id` PRIMARY KEY(`id`)
);
