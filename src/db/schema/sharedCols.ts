import type { SQLiteColumnBuilders } from "drizzle-orm/sqlite-core/columns/all";

const sharedColumns = (t: SQLiteColumnBuilders) => {
	return {
		id: t.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
		createdAt: t.integer({ mode: "timestamp" }).$defaultFn(() => new Date()),
		updatedAt: t
			.integer({ mode: "timestamp" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date()),
	};
};

export const rowTimestampColumns = (t: SQLiteColumnBuilders) => {
	return {
		rowCreatedAt: t.integer({ mode: "timestamp" }).$defaultFn(() => new Date()),
		rowUpdatedAt: t
			.integer({ mode: "timestamp" })
			.$defaultFn(() => new Date())
			.$onUpdate(() => new Date()),
	};
};

export const recordTimestampColumns = (t: SQLiteColumnBuilders) => {
	return {
		dataCreatedAt: t.integer({ mode: "timestamp" }).notNull(),
		dataUpdatedAt: t.integer({ mode: "timestamp" }).notNull(),
	};
};
