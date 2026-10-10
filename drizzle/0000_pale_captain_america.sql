CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`actorId` int NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`entityType` varchar(128) NOT NULL,
	`entityId` int,
	`payloadJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clarification_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`vendorId` int,
	`evidenceId` int,
	`question` text NOT NULL,
	`status` enum('OPEN','SENT','ANSWERED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clarification_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commercial_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`vendorId` int NOT NULL,
	`documentId` int,
	`category` varchar(128) NOT NULL,
	`description` text,
	`amount` decimal(12,2),
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`periodMonths` int,
	`classification` enum('EXPLICIT','DERIVED','USER_ASSUMPTION','UNKNOWN') NOT NULL DEFAULT 'EXPLICIT',
	`included` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commercial_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decision_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`evidenceCoverage` decimal(5,2) NOT NULL DEFAULT '0',
	`resolvedRequirements` int NOT NULL DEFAULT 0,
	`totalRequirements` int NOT NULL DEFAULT 0,
	`activeVendorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decision_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`selectedVendorId` int,
	`status` enum('DRAFT','ACCEPTED','REOPENED') NOT NULL DEFAULT 'DRAFT',
	`rationale` text,
	`acceptedBy` int,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`version` varchar(32) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`extractedText` text,
	`extractedData` text,
	`changeSummary` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`vendorId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`documentType` varchar(64) NOT NULL,
	`storageKey` varchar(512),
	`storageUrl` varchar(1024),
	`mimeType` varchar(128),
	`processingStatus` enum('UPLOADING','PROCESSING','PROCESSED','REVIEW_REQUIRED','FAILED') NOT NULL DEFAULT 'UPLOADING',
	`totalPages` int NOT NULL DEFAULT 0,
	`processedPages` int NOT NULL DEFAULT 0,
	`failedPages` int NOT NULL DEFAULT 0,
	`reviewRequiredPages` int NOT NULL DEFAULT 0,
	`latestVersion` varchar(32) NOT NULL DEFAULT 'v1',
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`weightsJson` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`vendorId` int NOT NULL,
	`documentId` int NOT NULL,
	`documentVersionId` int,
	`requirementId` int,
	`label` varchar(255) NOT NULL,
	`normalizedValue` varchar(255),
	`originalText` text,
	`page` int,
	`classification` enum('FACT','DERIVED','INFERENCE','UNKNOWN','RISK','CONFLICT') NOT NULL DEFAULT 'FACT',
	`evidenceStrength` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`completeness` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`confidence` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`interpretation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roomId` int,
	`kind` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirement_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requirementId` int NOT NULL,
	`vendorId` int NOT NULL,
	`normalizedValue` varchar(255),
	`originalClaim` text,
	`status` enum('EXCEEDS','MEETS','UNKNOWN','RISK','DOES_NOT_MEET','CONFLICT') NOT NULL,
	`interpretation` text,
	`evidenceStrength` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`confidence` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirement_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`originalWording` text,
	`normalizedConcept` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`classification` enum('MANDATORY','PREFERRED','HARD_CONSTRAINT') NOT NULL DEFAULT 'PREFERRED',
	`weight` decimal(5,2) NOT NULL DEFAULT '0',
	`source` varchar(512),
	`status` enum('AI_SUGGESTED','USER_CONFIRMED') NOT NULL DEFAULT 'USER_CONFIRMED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`vendorId` int,
	`evidenceId` int,
	`severity` enum('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL,
	`category` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`explanation` text NOT NULL,
	`impact` text,
	`recommendedAction` text,
	`status` enum('OPEN','MITIGATED','ACCEPTED') NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tco_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`vendorId` int NOT NULL,
	`horizonYears` int NOT NULL,
	`knownCosts` decimal(12,2) NOT NULL,
	`estimatedTotal` decimal(12,2),
	`unknownCosts` text,
	`assumptions` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tco_calculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`initials` varchar(8) NOT NULL,
	`fitLabel` varchar(255),
	`score` decimal(5,2) NOT NULL DEFAULT '0',
	`comparableTco` decimal(12,2),
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`delta` decimal(6,2),
	`note` text,
	`tone` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clarification_questions` ADD CONSTRAINT `clarification_questions_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clarification_questions` ADD CONSTRAINT `clarification_questions_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clarification_questions` ADD CONSTRAINT `clarification_questions_evidenceId_evidence_id_fk` FOREIGN KEY (`evidenceId`) REFERENCES `evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clarification_questions` ADD CONSTRAINT `clarification_questions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercial_items` ADD CONSTRAINT `commercial_items_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercial_items` ADD CONSTRAINT `commercial_items_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercial_items` ADD CONSTRAINT `commercial_items_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decision_rooms` ADD CONSTRAINT `decision_rooms_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_selectedVendorId_vendors_id_fk` FOREIGN KEY (`selectedVendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `decisions` ADD CONSTRAINT `decisions_acceptedBy_users_id_fk` FOREIGN KEY (`acceptedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document_versions` ADD CONSTRAINT `document_versions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluation_profiles` ADD CONSTRAINT `evaluation_profiles_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluation_profiles` ADD CONSTRAINT `evaluation_profiles_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_documentVersionId_document_versions_id_fk` FOREIGN KEY (`documentVersionId`) REFERENCES `document_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence` ADD CONSTRAINT `evidence_requirementId_requirements_id_fk` FOREIGN KEY (`requirementId`) REFERENCES `requirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirement_evaluations` ADD CONSTRAINT `requirement_evaluations_requirementId_requirements_id_fk` FOREIGN KEY (`requirementId`) REFERENCES `requirements`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirement_evaluations` ADD CONSTRAINT `requirement_evaluations_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requirements` ADD CONSTRAINT `requirements_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risks` ADD CONSTRAINT `risks_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risks` ADD CONSTRAINT `risks_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `risks` ADD CONSTRAINT `risks_evidenceId_evidence_id_fk` FOREIGN KEY (`evidenceId`) REFERENCES `evidence`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tco_calculations` ADD CONSTRAINT `tco_calculations_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tco_calculations` ADD CONSTRAINT `tco_calculations_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_roomId_decision_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `decision_rooms`(`id`) ON DELETE no action ON UPDATE no action;