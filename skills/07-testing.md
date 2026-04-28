# SKILL: Tinker Testing & Quality Patterns

## Philosophy
Tests are not optional. Every DAO must have unit tests. Every critical user flow must have E2E tests. The agent must write tests alongside implementation.

## Testing Stack
- **Unit:** Vitest (Vite-native, fast)
- **E2E:** Playwright (Electron support)
- **Coverage:** Vitest built-in (v8)

## Unit Test Pattern

### DAO Tests
```typescript
// tests/unit/data/shops.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import { getAllShops, getShopById, createShop, updateShop, deleteShop } from "@/data/shops";

const sqlite = new Database(":memory:");
const db = drizzle(sqlite, { schema });

beforeEach(() => {
  sqlite.exec(`
    DROP TABLE IF EXISTS shops;
    CREATE TABLE shops (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      background_texture TEXT NOT NULL DEFAULT 'pegboard',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
  `);
});

afterAll(() => sqlite.close());

describe("shops DAO", () => {
  it("creates a shop", async () => {
    const shop = await createShop({ name: "Wood Shop", backgroundTexture: "pegboard", sortOrder: 0 });
    expect(shop.name).toBe("Wood Shop");
    expect(shop.id).toBeDefined();
    expect(shop.createdAt).toBeInstanceOf(Date);
  });

  it("gets all shops ordered by sortOrder", async () => {
    await createShop({ name: "Shop B", backgroundTexture: "concrete", sortOrder: 2 });
    await createShop({ name: "Shop A", backgroundTexture: "pegboard", sortOrder: 1 });
    const shops = await getAllShops();
    expect(shops).toHaveLength(2);
    expect(shops[0].name).toBe("Shop A");
    expect(shops[1].name).toBe("Shop B");
  });

  it("gets shop by id", async () => {
    const created = await createShop({ name: "Test Shop", backgroundTexture: "pegboard" });
    const found = await getShopById(created.id);
    expect(found?.name).toBe("Test Shop");
  });

  it("returns undefined for non-existent id", async () => {
    expect(await getShopById("non-existent")).toBeUndefined();
  });

  it("updates a shop", async () => {
    const created = await createShop({ name: "Old", backgroundTexture: "pegboard" });
    const updated = await updateShop(created.id, { name: "New" });
    expect(updated.name).toBe("New");
  });

  it("deletes a shop", async () => {
    const created = await createShop({ name: "To Delete", backgroundTexture: "pegboard" });
    await deleteShop(created.id);
    expect(await getShopById(created.id)).toBeUndefined();
  });
});
```

### Utility Tests
```typescript
// tests/unit/utils/validators.test.ts
import { describe, it, expect } from "vitest";
import { shopInsertSchema, itemInsertSchema } from "@/utils/validators";

describe("validators", () => {
  it("validates shop insert", () => {
    expect(() => shopInsertSchema.parse({ name: "Test", backgroundTexture: "pegboard" })).not.toThrow();
  });

  it("rejects shop without name", () => {
    expect(() => shopInsertSchema.parse({ backgroundTexture: "pegboard" })).toThrow();
  });

  it("validates reference item with whyThisMatters", () => {
    expect(() => itemInsertSchema.parse({
      workbenchId: "wb-1", type: "reference", content: "Some content", whyThisMatters: "Because..."
    })).not.toThrow();
  });

  it("rejects reference item without whyThisMatters", () => {
    expect(() => itemInsertSchema.parse({
      workbenchId: "wb-1", type: "reference", content: "Some content"
    })).toThrow();
  });
});
```

### Store Tests
```typescript
// tests/unit/stores/uiStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "@/stores/uiStore";

beforeEach(() => {
  useUiStore.setState({
    activeShopId: null, activeWorkbenchId: null, viewMode: "workbench",
    selectedItemId: null, selectedSkillId: null, modalStack: [],
    searchQuery: "", sidebarOpen: true,
  });
});

describe("uiStore", () => {
  it("sets active shop and resets workbench", () => {
    useUiStore.getState().setActiveShop("shop-1");
    expect(useUiStore.getState().activeShopId).toBe("shop-1");
    expect(useUiStore.getState().activeWorkbenchId).toBeNull();
    expect(useUiStore.getState().viewMode).toBe("workbench");
  });

  it("opens and closes modals", () => {
    useUiStore.getState().openModal({ type: "createShop" });
    expect(useUiStore.getState().modalStack).toHaveLength(1);
    useUiStore.getState().closeModal();
    expect(useUiStore.getState().modalStack).toHaveLength(0);
  });
});
```

## E2E Test Pattern

```typescript
// tests/e2e/onboarding.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Onboarding", () => {
  test.beforeEach(async ({ page }) => { await page.goto("/"); });

  test("user can create a shop and workbench", async ({ page }) => {
    await expect(page.locator("text=Tinker is a workshop")).toBeVisible();
    await page.click("[data-testid='create-shop-button']");
    await page.fill("[data-testid='shop-name-input']", "Test Shop");
    await page.click("[data-testid='submit-shop-button']");
    await expect(page.locator("text=Test Shop")).toBeVisible();

    await page.click("[data-testid='create-workbench-button']");
    await page.fill("[data-testid='workbench-name-input']", "Test Project");
    await page.fill("[data-testid='workbench-description-input']", "Learning to build");
    await page.click("[data-testid='submit-workbench-button']");
    await expect(page.locator("text=Test Project")).toBeVisible();
  });

  test("user can create an attempt item with scar", async ({ page }) => {
    await page.click("[data-testid='create-shop-button']");
    await page.fill("[data-testid='shop-name-input']", "Wood Shop");
    await page.click("[data-testid='submit-shop-button']");
    await page.click("[data-testid='create-workbench-button']");
    await page.fill("[data-testid='workbench-name-input']", "Dovetail Box");
    await page.click("[data-testid='submit-workbench-button']");
    await page.click("text=Dovetail Box");

    await page.click("[data-testid='add-item-button']");
    await page.selectOption("[data-testid='item-type-select']", "attempt");
    await page.fill("[data-testid='item-content-input']", "First attempt");
    await page.fill("[data-testid='attempt-what-input']", "Tried pins first");
    await page.fill("[data-testid='attempt-result-input']", "Gap too wide");
    await page.click("[data-testid='submit-item-button']");

    await page.click("[data-testid='tag-scar-button']");
    await page.selectOption("[data-testid='scar-type-select']", "execution_error");
    await page.click("[data-testid='submit-scar-button']");
    await expect(page.locator("[data-testid='scar-indicator']")).toBeVisible();
  });
});
```

## Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true, environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8", reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: true,
  forbidOnly: !!process.env.CI, retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, reporter: "html",
  use: { baseURL: "http://localhost:5173", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

## Coverage Targets
| Layer | Target | Priority |
|-------|--------|----------|
| DAO functions | 90% | Critical |
| Utility functions | 80% | High |
| Zustand stores | 70% | Medium |
| React components | 50% | Low |
| IPC handlers | 60% | Medium |

## Test Data (Fixtures)
```typescript
// tests/fixtures/shops.ts
import type { ShopInsert } from "@/types";
export const fixtureShop = (overrides?: Partial<ShopInsert>): ShopInsert => ({
  name: "Test Shop", backgroundTexture: "pegboard", sortOrder: 0, ...overrides,
});

// tests/fixtures/workbenches.ts
import type { WorkbenchInsert } from "@/types";
export const fixtureWorkbench = (overrides?: Partial<WorkbenchInsert>): WorkbenchInsert => ({
  shopId: "shop-1", name: "Test Project", description: "A test",
  posX: 0, posY: 0, width: 400, height: 300, maxItems: 50, ...overrides,
});
```

## Running Tests
```bash
npm run test              # Unit tests
npm run test -- --coverage
npm run test:e2e          # E2E tests
npm run test:e2e -- --ui  # E2E with UI
```

## No-Go List
- ❌ No tests depending on external services
- ❌ No tests with hardcoded timeouts
- ❌ No tests modifying real user data
- ❌ No skipped tests in CI
- ❌ No tests without assertions
- ❌ No E2E tests testing implementation details
