CREATE TABLE
	`authors` (
		`author_id` integer PRIMARY KEY NOT NULL,
		`first_name` text,
		`last_name` text,
		`username` text NOT NULL,
		`email` text NOT NULL,
		`website` text,
		`affiliation` text
	);

CREATE TABLE
	`keywords` (
		`keyword_id` integer PRIMARY KEY NOT NULL,
		`keyword` text
	);

CREATE TABLE
	`papers` (
		`paper_id` integer PRIMARY KEY NOT NULL,
		`paper_title` text,
		`published_in` text,
		`date` text,
		`keywords_raw` text,
		`abstract` text,
		`paper_reference` text,
		`downloads` integer,
		`lingbuzz_id` text NOT NULL,
		`download_link` text
	);

CREATE TABLE
	`papers_authors` (
		`ap_id` integer PRIMARY KEY NOT NULL,
		`author_id` integer,
		`paper_id` integer,
		`author_position` integer,
		FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`) ON UPDATE no action ON DELETE no action,
		FOREIGN KEY (`paper_id`) REFERENCES `papers` (`paper_id`) ON UPDATE no action ON DELETE no action
	);

CREATE TABLE
	`papers_keywords` (
		`kp_id` integer PRIMARY KEY NOT NULL,
		`keyword_id` integer,
		`paper_id` integer,
		FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`keyword_id`) ON UPDATE no action ON DELETE no action,
		FOREIGN KEY (`paper_id`) REFERENCES `papers` (`paper_id`) ON UPDATE no action ON DELETE no action
	);

CREATE UNIQUE INDEX `authors_username_unique` ON `authors` (`username`);

CREATE UNIQUE INDEX `papers_lingbuzz_id_unique` ON `papers` (`lingbuzz_id`);