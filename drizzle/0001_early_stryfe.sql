ALTER TABLE `documents` ADD `coverageMetric` varchar(32) DEFAULT 'pages' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `totalUnits` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `processedUnits` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `failedUnits` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `reviewRequiredUnits` int DEFAULT 0 NOT NULL;