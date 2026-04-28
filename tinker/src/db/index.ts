import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { electron } from "../lib/electron";

export const db = drizzle(
  async (sql: string, params: readonly unknown[], method: "run" | "all" | "values" | "get") => {
    try {
      if (method === "run") {
        await electron.dbMutate({ sql, params: [...params] });
        return { rows: [] };
      } else {
        const res = await electron.dbQuery({ sql, params: [...params] });
        return { rows: res.data as unknown[] };
      }
    } catch (e) {
      console.error("DB IPC Error:", e);
      throw e;
    }
  },
  { schema }
);
