import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import * as relations from "./schema/relations";

export default drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
  },
  casing: "snake_case",
     schema: { ...schema, ...relations },
});
