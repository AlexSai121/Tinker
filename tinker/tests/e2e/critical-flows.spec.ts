import { expect, test } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9oNn14kAAAAASUVORK5CYII=",
  "base64"
);

async function createShop(page: import("@playwright/test").Page, name: string) {
  await page.getByTestId("btn-create-shop").click();
  await page.getByTestId("input-shop-name").fill(name);
  const submitButton = page.getByTestId("btn-create-shop-submit");
  try {
    await submitButton.click({ timeout: 1500 });
  } catch {
    await submitButton.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
  }
  await expect(page.locator('[data-testid^="shop-item-"]').first()).toContainText(name);
}

async function ensureSidebarOpen(page: import("@playwright/test").Page) {
  const shopItem = page.locator('[data-testid^="shop-item-"]').first();
  if (await shopItem.isVisible().catch(() => false)) {
    return;
  }

  await page.getByTestId("btn-toggle-sidebar").click();
  await expect(shopItem).toBeVisible();
}

async function openCreateProject(page: import("@playwright/test").Page) {
  await ensureSidebarOpen(page);
  const shopItem = page.locator('[data-testid^="shop-item-"]').first();
  const createProjectButton = page.locator('[data-testid^="btn-create-workbench-"]').first();

  await shopItem.scrollIntoViewIfNeeded();
  if (!(await createProjectButton.isVisible().catch(() => false))) {
    await expect(createProjectButton).toBeVisible();
  }

  try {
    await createProjectButton.click({ timeout: 1500 });
  } catch {
    await createProjectButton.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
  }
}

async function createProject(
  page: import("@playwright/test").Page,
  projectName: string,
  description: string
) {
  await openCreateProject(page);
  await page.getByTestId("input-project-name").fill(projectName);
  await page.getByTestId("input-project-description").fill(description);
  await page.getByTestId("btn-create-project").click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
}

async function ensureItemCreatorVisible(page: import("@playwright/test").Page) {
  const creatorTab = page.getByTestId("item-type-card-attempt");
  if (await creatorTab.isVisible().catch(() => false)) {
    return;
  }

  const touchSheetToggle = page.getByTestId("btn-toggle-project-sheet");
  if (await touchSheetToggle.isVisible().catch(() => false)) {
    await touchSheetToggle.click();
    await page.getByTestId("btn-tablet-tab-create").click();
    await expect(creatorTab).toBeVisible();
  }
}

async function collapseProjectTouchSheet(page: import("@playwright/test").Page) {
  const touchSheetToggle = page.getByTestId("btn-toggle-project-sheet");
  if (await touchSheetToggle.isVisible().catch(() => false)) {
    await touchSheetToggle.click();
  }
}

async function openProjectFromSidebar(page: import("@playwright/test").Page, projectName: string) {
  await ensureSidebarOpen(page);
  const shopItem = page.locator('[data-testid^="shop-item-"]').first();
  const projectItem = page.locator('[data-testid^="workbench-item-"]', { hasText: projectName }).first();

  if (!(await projectItem.isVisible().catch(() => false))) {
    await shopItem.click();
    await expect(projectItem).toBeVisible();
  }

  try {
    await projectItem.click({ timeout: 1500 });
  } catch {
    await projectItem.evaluate((element) => {
      (element as HTMLDivElement).click();
    });
  }
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
}

async function openSettings(page: import("@playwright/test").Page) {
  await page.getByTestId("btn-settings").click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
}

test.describe("critical flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("onboarding can create a workshop and a project", async ({ page }, testInfo) => {
    await createShop(page, "Workshop Alpha");
    await createProject(page, "Project Alpha", "A sturdy description for the first project.");

    await expect(page.getByTestId("app-shell")).toBeVisible();
    await expect(page.getByTestId("btn-back-to-workbench")).toBeVisible();

    if (testInfo.project.name === "tablet-safari") {
      await expect(page.getByTestId("project-touch-sheet")).toBeVisible();
    }
  });

  test("user can create an attempt, tag a scar, and bridge across projects", async ({ page }) => {
    await createShop(page, "Workshop Beta");
    await createProject(page, "Project Alpha", "The first project is where the failed attempt will live.");
    await ensureItemCreatorVisible(page);

    await page.getByTestId("item-type-card-attempt").click();
    await page.getByTestId("input-item-content").fill("First dovetail attempt");
    await page.getByTestId("input-attempt-what").fill("I cut the pins first with a marking knife.");
    await page.getByTestId("input-attempt-result").fill("The fit drifted and left a visible gap on the baseline.");
    await page.getByTestId("btn-create-item").click();
    await collapseProjectTouchSheet(page);

    await page.getByTestId("btn-add-scar").click();
    await page.getByTestId("select-scar-failure-type").selectOption("execution");
    await page.getByTestId("select-scar-severity").selectOption("restart");
    await page.getByTestId("input-scar-notes").fill("The saw angle drifted once I sped up, so the joint needed a full reset.");
    await page.getByTestId("btn-save-scar").click();
    await expect(page.getByTestId("scar-indicator")).toBeVisible();

    await page.getByTestId("btn-back-to-workbench").click();
    await expect(page.getByTestId("workbench-canvas")).toBeVisible();

    await createProject(page, "Project Beta", "The second project will hold the reference point for a bridge.");
    await ensureItemCreatorVisible(page);
    await page.getByTestId("input-item-content").fill("Reference geometry from the cleaner follow-up project");
    await page.getByTestId("btn-create-item").click();
    await collapseProjectTouchSheet(page);

    await page.getByTestId("btn-back-to-workbench").click();
    await openProjectFromSidebar(page, "Project Alpha");

    const attemptCard = page.getByTestId("item-card-attempt").filter({ hasText: "First dovetail attempt" });
    await expect(attemptCard).toBeVisible();
    await attemptCard.locator('[data-testid^="btn-open-bridge-"]').click();
    await page.locator('[data-testid^="bridge-target-"]').first().click();
    await page.getByTestId("input-bridge-note").fill(
      "This second project proves the geometry that fixed the failed baseline cut in the first project."
    );
    await page.getByTestId("btn-create-bridge").click();

    await page.getByTestId("btn-view-constellation").click();
    await expect(page.getByTestId("constellation-stat-projects")).toContainText("2");
    await expect(page.getByTestId("constellation-stat-bridges")).toContainText("1");
  });

  test("project playground supports sticky notes, media preview, and reload persistence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "This regression targets desktop workbench interactions.");

    await createShop(page, "Workshop Gamma");
    await createProject(page, "Project Gamma", "A project for hardening the new playground surface.");

    const playground = page.getByTestId("playground-workbench");
    await expect(playground).toBeVisible();

    await playground.dblclick({ position: { x: 220, y: 180 } });
    const stickyTitle = page.locator('[data-testid^="sticky-note-title-"]').first();
    const stickyInput = page.locator('[data-testid^="sticky-note-input-"]').first();
    await expect(stickyTitle).toBeVisible();
    await expect(stickyInput).toBeVisible();
    await stickyTitle.fill("Clamp setup");
    await stickyInput.fill("Clamp angle reminder");
    await playground.click({ position: { x: 40, y: 40 } });
    await expect(stickyTitle).toHaveValue("Clamp setup");
    await expect(stickyInput).toHaveValue("Clamp angle reminder");

    await page.locator('[data-testid="media-uploader-input"]').first().setInputFiles({
      name: "bench-proof.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });

    const previewButton = page.locator('[data-testid^="btn-preview-media-secondary-"]').first();
    await expect(previewButton).toBeVisible();
    await previewButton.click({ force: true });
    await expect(page.getByTestId("media-preview-modal")).toBeVisible();
    await expect(page.getByTestId("media-preview-image")).toBeVisible();
    await page.getByRole("button", { name: "Close preview" }).click();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Project Gamma" })).toBeVisible();
    await expect(page.locator('[data-testid^="sticky-note-title-"]').first()).toHaveValue("Clamp setup");
    await expect(page.locator('[data-testid^="sticky-note-input-"]').first()).toHaveValue("Clamp angle reminder");
    await expect(page.locator('[data-testid^="btn-preview-media-"]').first()).toBeVisible();
  });

  test("settings can keep new projects on the canvas after creation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "This regression targets desktop settings and canvas flow.");

    await createShop(page, "Workshop Delta");
    await openSettings(page);
    await page.getByRole("button", { name: "Behavior" }).click();
    const openProjectToggle = page.getByTestId("toggle-open-project-on-create");
    await openProjectToggle.uncheck();
    await page.getByTestId("btn-save-settings").click();

    await openCreateProject(page);
    await page.getByTestId("input-project-name").fill("Canvas Stay Project");
    await page.getByTestId("input-project-description").fill("This project should leave us on the canvas after creation.");
    await page.getByTestId("btn-create-project").click();

    await expect(page.getByTestId("workbench-canvas")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Canvas Stay Project" })).toHaveCount(0);
  });
});
