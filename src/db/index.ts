import { drizzle } from "drizzle-orm/libsql";
import { DB_PATH } from "../../config";
import * as schema from "./schema";

export const db = drizzle({
	connection: {
		url: `file:${DB_PATH}`,
	},
	casing: "snake_case",
	schema,
});
