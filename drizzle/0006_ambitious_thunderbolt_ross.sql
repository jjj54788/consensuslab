ALTER TABLE `agents` ADD `category` enum('debater','evaluator','specialist') DEFAULT 'debater' NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `displayOrder` int DEFAULT 0 NOT NULL;