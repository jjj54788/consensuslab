ALTER TABLE `messages` ADD `logicScore` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `innovationScore` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `expressionScore` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `totalScore` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `scoringReasons` json;--> statement-breakpoint
ALTER TABLE `messages` ADD `isHighlight` int DEFAULT 0;