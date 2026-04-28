# SKILL: Tinker Database & Drizzle ORM Patterns

## Philosophy
The database is the single source of truth. All schema changes go through Drizzle migrations. No raw SQL in components. No ad-hoc table creation.

## Schema Location
`src/db/schema.ts` — ONE file containing ALL table definitions. Do not split into multiple schema files.

## Table Definition Pattern
```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const entities = sqliteTable("entities", {
  id: text("id").primaryKey(),           // ALWAYS nanoid, never integer auto-increment
  name: text("name").notNull(),           // Use snake_case for DB column names
  createdAt: integer("created_at", {      // Use camelCase for TS property names
    mode: "timestamp"
  }).notNull(),
  isActive: integer("is_active", {        // Booleans as integer with mode: "boolean"
    mode: "boolean"
  }).notNull().default(true),
  metadata: text("metadata"),             // JSON stored as text, parsed in DAO
});

// ALWAYS define relations for type-safe joins
export const entitiesRelations = relations(entities, ({ one, many }) => ({
  parent: one(parents, {                 // One-to-one or many-to-one
    fields: [entities.parentId],
    references: [parents.id]
  }),
  children: many(children),              // One-to-many
}));
```

## Data Types Reference
| Concept | Drizzle Type | SQLite Type | Notes |
|---------|-------------|-------------|-------|
| ID | `text("id").primaryKey()` | TEXT | nanoid |
| String | `text("name").notNull()` | TEXT | Required strings |
| Optional string | `text("description")` | TEXT | Nullable |
| Integer | `integer("count").notNull()` | INTEGER | |
| Boolean | `integer("flag", {mode:"boolean"})` | INTEGER (0/1) | |
| Timestamp | `integer("created_at", {mode:"timestamp"})` | INTEGER (epoch ms) | |
| Float | `real("pos_x").notNull().default(0)` | REAL | Canvas coords |
| Enum | `text("type", {enum: [...]})` | TEXT | Type-safe strings |
| JSON | `text("metadata")` | TEXT | Store as JSON string |

## DAO Pattern
Every table has a DAO file in `src/data/`. DAOs are the ONLY files that import from `drizzle-orm`.

```typescript
// src/data/entities.ts
import { db } from "@/db";
import { entities } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { Entity, EntityInsert, EntityUpdate } from "@/types";

// READ ALL
export async function getAllEntities(): Promise<Entity[]> {
  return db.select().from(entities).orderBy(desc(entities.createdAt));
}

// READ BY ID
export async function getEntityById(id: string): Promise<Entity | undefined> {
  const results = await db
    .select()
    .from(entities)
    .where(eq(entities.id, id))
    .limit(1);
  return results[0];
}

// READ WITH FILTER
export async function getEntitiesByParent(parentId: string): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(eq(entities.parentId, parentId))
    .orderBy(entities.sortOrder);
}

// CREATE
export async function createEntity(data: EntityInsert): Promise<Entity> {
  const result = await db
    .insert(entities)
    .values(data)
    .returning();
  return result[0];
}

// BULK CREATE
export async function createEntities(data: EntityInsert[]): Promise<Entity[]> {
  const result = await db
    .insert(entities)
    .values(data)
    .returning();
  return result;
}

// UPDATE
export async function updateEntity(
  id: string,
  data: EntityUpdate
): Promise<Entity> {
  const result = await db
    .update(entities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(entities.id, id))
    .returning();
  return result[0];
}

// DELETE
export async function deleteEntity(id: string): Promise<void> {
  await db.delete(entities).where(eq(entities.id, id));
}

// AGGREGATE
export async function getEntityCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(entities);
  return result[0].count;
}
```

## Query Patterns

### Join with Relations
```typescript
import { entities, entityRelations } from "@/db/schema";

const result = await db.query.entities.findMany({
  with: {
    parent: true,
    children: true,
  },
  where: eq(entities.isActive, true),
});
```

### Search (Full Text)
SQLite does not have native full-text search in Drizzle. Use `like` for simple search:
```typescript
export async function searchEntities(query: string): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(
      or(
        like(entities.name, `%${query}%`),
        like(entities.description, `%${query}%`)
      )
    );
}
```

### Pagination
```typescript
export async function getEntitiesPaginated(
  page: number,
  pageSize: number
): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}
```

### Date Range
```typescript
export async function getEntitiesSince(date: Date): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(gte(entities.createdAt, date));
}
```

## Migration Workflow
1. Modify `src/db/schema.ts`
2. Run `npm run db:generate` — generates migration SQL
3. Review migration file in `src/db/migrations/`
4. Run `npm run db:migrate` — applies to local DB
5. Commit migration file to git

## Database Initialization
```typescript
// src/db/index.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("tinker.db"); // In production: path.join(app.getPath("userData"), "tinker.db")
export const db = drizzle(sqlite, { schema });

// Run migrations on startup
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
migrate(db, { migrationsFolder: "./src/db/migrations" });
```

## Type Generation
Types are derived from schema using Drizzle's inference:
```typescript
// src/types/index.ts
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { entities } from "@/db/schema";

export type Entity = InferSelectModel<typeof entities>;
export type EntityInsert = InferInsertModel<typeof entities>;
export type EntityUpdate = Partial<Omit<EntityInsert, "id" | "createdAt">>;
```

## Indexing
Add indexes for frequently queried columns:
```typescript
import { index } from "drizzle-orm/sqlite-core";

export const entities = sqliteTable("entities", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  parentIdx: index("parent_idx").on(table.parentId),
  createdIdx: index("created_idx").on(table.createdAt),
}));
```

## Constraints
- All tables MUST have `createdAt` and `updatedAt` timestamps
- All foreign keys MUST have `onDelete: "cascade"` or `onDelete: "set null"` explicitly
- All boolean fields MUST use `mode: "boolean"`
- All enum fields MUST use Drizzle's `enum` option with a const array
- All JSON fields MUST be stored as text and parsed/serialized in DAO

## No-Go List
- ❌ No raw SQL strings in components or hooks
- ❌ No multiple schema files
- ❌ No ALTER TABLE without migration
- ❌ No database access outside `src/data/` and `src/db/`
- ❌ No SQLite `AUTOINCREMENT` — use nanoid
- ❌ No `Date` objects stored directly — use epoch integers
