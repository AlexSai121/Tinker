import { expect, test, type Page, type TestInfo } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9oNn14kAAAAASUVORK5CYII=",
  "base64"
);

const emptyExportJson = JSON.stringify({
  version: 1,
  scope: "full",
  data: {
    shops: [],
    workbenches: [],
    items: [],
    itemMedia: [],
    scars: [],
    skills: [],
    bridges: [],
    skillBridges: [],
    lockerItems: [],
    cameraStates: [],
    appSettings: [],
  },
});

const pageErrors = new WeakMap<Page, string[]>();

function uiStoreSnapshot(onboardingCompleted: boolean) {
  return JSON.stringify({
    state: {
      activeShopId: null,
      activeWorkbenchId: null,
      viewMode: "workbench",
      projectView: "board",
      viewTabsExpanded: true,
      sidebarOpen: true,
      sidebarWidth: 240,
      onboardingCompleted,
    },
    version: 0,
  });
}

async function resetApp(page: Page, options: { onboardingCompleted?: boolean } = {}) {
  const onboardingCompleted = options.onboardingCompleted ?? true;

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((snapshot) => {
    window.localStorage.clear();
    window.localStorage.setItem("tinker-ui-store", snapshot);
  }, uiStoreSnapshot(onboardingCompleted));
  await page.reload({ waitUntil: "domcontentloaded" });

  if (onboardingCompleted) {
    await expect(page.getByTestId("app-shell")).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Every failure has a lesson." })).toBeVisible();
  }
}

async function completeOnboarding(page: Page, shopName: string) {
  await resetApp(page, { onboardingCompleted: false });

  await page.getByTestId("btn-onboarding-skip-intro").click();
  await expect(page.getByRole("heading", { name: "What will you be working on?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "What's your experience level?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Where will most of your work happen?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "What's your biggest goal right now?" })).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Create your first workspace (Shop)" })).toBeVisible();
  await page.getByTestId("input-onboarding-shop-name").fill(shopName);
  await page.getByRole("button", { name: "Create My Shop" }).click();
  await expect(page.getByRole("heading", { name: "You're all set!" })).toBeVisible();
  await page.getByTestId("btn-onboarding-complete").click();

  await expect(page.getByTestId("app-shell")).toBeVisible();
  await expect(page.locator('[data-testid^="shop-item-"]').first()).toContainText(shopName);
}

async function createShop(page: Page, name: string) {
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

async function ensureSidebarOpen(page: Page) {
  const shopItem = page.locator('[data-testid^="shop-item-"]').first();
  if (await shopItem.isVisible().catch(() => false)) {
    return;
  }

  await page.getByTestId("btn-toggle-sidebar").click();
  await expect(shopItem).toBeVisible();
}

async function openCreateProject(page: Page) {
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

async function createProject(page: Page, projectName: string, description: string) {
  await openCreateProject(page);
  await page.getByTestId("input-project-name").fill(projectName);
  await page.getByTestId("input-project-description").fill(description);
  await page.getByTestId("btn-create-project").click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
}

async function ensureItemCreatorVisible(page: Page) {
  const creatorTab = page.getByTestId("item-type-card-attempt").first();
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

async function collapseProjectTouchSheet(page: Page) {
  const touchSheetToggle = page.getByTestId("btn-toggle-project-sheet");
  if (await touchSheetToggle.isVisible().catch(() => false)) {
    await touchSheetToggle.click();
  }
}

async function openProjectFromSidebar(page: Page, projectName: string) {
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

async function openSettings(page: Page) {
  await page.getByTestId("btn-settings").click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
}

async function createAttempt(page: Page, title: string) {
  await ensureItemCreatorVisible(page);
  await page.getByTestId("item-type-card-attempt").first().click();
  await page.getByTestId("input-item-title").fill(title);
  await page.getByTestId("input-item-content").fill(title);
  await page.getByTestId("input-attempt-what").fill("I cut the pins first with a marking knife.");
  await page.getByTestId("input-attempt-result").fill("The fit drifted and left a visible gap on the baseline.");
  await page.getByTestId("btn-create-item").click();
  await collapseProjectTouchSheet(page);
  await expect(page.getByTestId("item-card-attempt").filter({ hasText: title })).toBeVisible();
}

async function createObservation(page: Page, title: string, content = title) {
  await page.getByTestId("btn-create-observation-flow").click();
  await page.getByTestId("input-item-title").fill(title);
  await page.getByTestId("input-item-content").fill(content);
  await page.getByTestId("btn-create-item").click();
  await expect(page.getByTestId("item-card-observation").filter({ hasText: title })).toBeVisible();
}

async function clearSelectedItem(page: Page) {
  const clearButton = page.getByTestId("btn-clear-selected-item");
  if (await clearButton.isVisible().catch(() => false)) {
    await clearButton.click();
  } else {
    await page.getByTestId("playground-workbench").click({ position: { x: 32, y: 32 } });
  }
}

test.describe("critical flows", () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    pageErrors.set(page, errors);
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(`console: ${message.text()}`);
      }
    });

    await resetApp(page);
  });

  test.afterEach(async ({ page }) => {
    expect(pageErrors.get(page) ?? []).toEqual([]);
  });

  test("onboarding creates the first workshop", async ({ page }) => {
    await completeOnboarding(page, "Onboarding Workshop");
    await expect(page.getByTestId("workbench-canvas")).toBeVisible();
  });

  test("user can create a workshop and a project", async ({ page }, testInfo: TestInfo) => {
    await createShop(page, "Workshop Alpha");
    await createProject(page, "Project Alpha", "A sturdy description for the first project.");

    await expect(page.getByTestId("app-shell")).toBeVisible();

    if (testInfo.project.name === "tablet-safari") {
      await expect(page.getByTestId("project-touch-sheet")).toBeVisible();
    } else {
      await expect(page.getByTestId("btn-back-to-workbench")).toBeVisible();
    }
  });

  test("user can create an attempt, tag a scar, and bridge across projects", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Bridge and scar regression targets the desktop workbench.");

    await createShop(page, "Workshop Beta");
    await createProject(page, "Project Alpha", "The first project is where the failed attempt will live.");
    await createAttempt(page, "First dovetail attempt");

    await page.getByTestId("btn-add-scar").click();
    await page.getByTestId("select-scar-failure-type").selectOption("execution");
    await page.getByTestId("select-scar-severity").selectOption("restart");
    await page.getByTestId("input-scar-notes").fill("The saw angle drifted once I sped up, so the joint needed a full reset.");
    await page.getByTestId("btn-save-scar").click();
    await expect(page.getByTestId("scar-indicator")).toBeVisible();

    await page.getByTestId("btn-back-to-workbench").click();
    await expect(page.getByTestId("workbench-canvas")).toBeVisible();

    await createProject(page, "Project Beta", "The second project will hold the reference point for a bridge.");
    await createObservation(page, "Reference geometry from the cleaner follow-up project");

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

    await page.getByTestId("btn-open-export-from-settings").click();
    await expect(page.getByRole("heading", { name: "Export Data" })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("btn-run-export").click(),
    ]);
    expect(download.suggestedFilename()).toContain("tinker-export");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await page.getByTestId("input-import-json").setInputFiles({
      name: "empty-tinker-export.json",
      mimeType: "application/json",
      buffer: Buffer.from(emptyExportJson),
    });
    await expect(page.getByText(/Imported .* items, .* skills, and .* locker items/)).toBeVisible();

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

  test("desktop navigation, search, locker, skills, and dashboards stay wired", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "This is the desktop release smoke path.");
    test.setTimeout(90000);

    await createShop(page, "Workshop Epsilon");
    await createProject(page, "Project Epsilon", "A project for search, locker, skills, and dashboard smoke coverage.");

    await page.getByTestId("btn-create-reference-flow").click();
    await page.getByTestId("btn-create-item").click();
    await expect(page.getByText("Add a short summary before continuing")).toBeVisible();
    await expect(page.getByText("References need a source URL")).toBeVisible();
    await expect(page.getByText("Explain why this reference matters")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByTestId("btn-create-breakthrough-flow").click();
    await page.getByTestId("input-item-title").fill("Evidence-backed breakthrough");
    await page.getByTestId("input-item-content").fill("This discovery should require evidence before it can be saved.");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByTestId("error-breakthrough-media")).toContainText("Breakthroughs need at least one evidence upload.");
    await page.getByRole("button", { name: "Close" }).click();

    await createObservation(page, "Searchable clamp geometry", "Searchable clamp geometry note for release hardening.");
    await clearSelectedItem(page);

    await expect(page.getByTestId("input-skill-name")).toBeVisible();
    await page.getByTestId("input-skill-name").fill("Signal tracing");
    await page.getByTestId("btn-add-skill").click();
    await expect(page.locator('[data-testid^="skill-status-"]').first()).toContainText("exposed");
    await page.locator('[data-testid^="skill-evidence-"]').first().click();
    await page.getByTestId("input-skill-evidence").fill("Used the project notes as first evidence of trying this skill.");
    await page.getByTestId("select-skill-status").selectOption("attempted");
    await page.getByTestId("btn-save-skill-evidence").click();
    await expect(page.locator('[data-testid^="skill-status-"]').first()).toContainText("attempted");

    await page.keyboard.press("Control+K");
    await expect(page.getByTestId("input-global-search")).toBeFocused();
    await page.getByTestId("input-global-search").fill("Searchable");
    await expect(page.locator('[data-testid^="search-result-item-"]').first()).toBeVisible();
    await page.locator('[data-testid^="search-result-item-"]').first().click();
    await expect(page.getByRole("heading", { name: "Project Epsilon" })).toBeVisible();

    await ensureSidebarOpen(page);
    await page.getByTestId("btn-view-locker").click();
    await expect(page.getByRole("heading", { name: "Reference Locker" })).toBeVisible();
    await page.getByTestId("btn-open-create-locker").click();
    await page.getByTestId("input-locker-title").fill("Useful clamp article");
    await page.getByTestId("input-locker-url").fill("https://example.com/clamp");
    await page.getByTestId("input-locker-why").fill("Useful reference for clamp layout decisions.");
    await page.getByTestId("btn-create-locker-item").click();
    await expect(page.getByText("Useful clamp article")).toBeVisible();
    await page.getByTestId("input-locker-search").fill("clamp");
    await expect(page.getByText("Useful clamp article")).toBeVisible();
    await page.locator('[data-testid^="btn-open-rescue-"]').first().click();
    await page.locator('[data-testid^="input-rescue-why-"]').first().fill("This belongs in the project as a real reference note.");
    await page.locator('[data-testid^="btn-rescue-locker-"]').first().click();
    await expect(page.getByRole("heading", { name: "Project Epsilon" })).toBeVisible();

    await ensureSidebarOpen(page);
    await page.getByTestId("btn-view-locker").click();
    await page.getByTestId("btn-locker-tab-archived").click();
    await expect(page.getByText("Useful clamp article")).toBeVisible();

    await ensureSidebarOpen(page);
    await page.getByTestId("btn-view-scarMap").click();
    await expect(page.getByRole("heading", { name: "Scar Map" })).toBeVisible();
    await page.getByTestId("select-scar-type-filter").selectOption("execution");
    await expect(page.getByText("No scars in this slice").or(page.getByText("Timeline"))).toBeVisible();

    await ensureSidebarOpen(page);
    await page.getByTestId("btn-view-portfolio").click();
    await expect(page.getByRole("heading", { name: "Skill Portfolio" })).toBeVisible();
    await expect(page.getByText("Signal tracing")).toBeVisible();

    await ensureSidebarOpen(page);
    await page.getByTestId("btn-view-review").click();
    await expect(page.getByRole("heading", { name: "Weekly Review" })).toBeVisible();
    for (let i = 0; i < 4; i += 1) {
      await page.getByTestId("btn-review-next").click();
    }
    await page.getByTestId("btn-complete-weekly-review").click();
    await expect(page.getByText(/Next review|Review due now/)).toBeVisible();

    await ensureSidebarOpen(page);
    await page.getByTestId("btn-view-constellation").click();
    await expect(page.getByTestId("constellation-stat-projects")).toBeVisible();
    await expect(page.getByTestId("constellation-stat-bridges")).toBeVisible();
  });

  test("tablet project sheet supports create and skill tabs", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "tablet-safari", "This regression targets tablet layout controls.");

    await createShop(page, "Workshop Tablet");
    await createProject(page, "Project Tablet", "A tablet-sized project surface for sheet controls.");

    await expect(page.getByTestId("project-touch-sheet")).toBeVisible();
    await page.getByTestId("btn-toggle-project-sheet").click();
    await page.getByTestId("btn-tablet-tab-create").click();
    await expect(page.getByTestId("item-type-card-attempt")).toBeVisible();
    await page.getByTestId("btn-tablet-tab-skills").click();
    await expect(page.getByText("Skills Developed")).toBeVisible();
    await page.getByTestId("btn-toggle-project-sheet").click();
    await expect(page.getByTestId("project-touch-sheet")).toContainText("Expand");
  });
});
