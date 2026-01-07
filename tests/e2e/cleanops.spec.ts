import { test, expect } from "@playwright/test";

let jobUrl = "";

async function login(page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe.serial("CleanOPS flows", () => {
  test("cleaner completes a job", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 37.7893, longitude: -122.3949 });

    await login(page, "cleaner1@cleanops.local", "CleanOPS123!");
    await expect(page).toHaveURL(/\/app\/cleaner\/today/);

    const firstJob = page.locator("a[href^=\"/app/cleaner/jobs/\"]").first();
    await firstJob.click();
    jobUrl = page.url();

    await page.getByRole("button", { name: /clock in/i }).click();
    await page.getByRole("button", { name: /start break/i }).click();
    await page.getByRole("button", { name: /end break/i }).click();

    const taskCheckboxes = page.locator("button[role=\"checkbox\"]");
    const count = await taskCheckboxes.count();
    for (let i = 0; i < count; i += 1) {
      await taskCheckboxes.nth(i).click();
    }

    await page.getByRole("button", { name: /submit for review/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: /clock out/i }).click();
  });

  test("supervisor approves job", async ({ page }) => {
    await login(page, "supervisor@cleanops.local", "CleanOPS123!");
    await expect(page).toHaveURL(/\/app\/supervisor\/dashboard/);
    if (jobUrl) {
      await page.goto(jobUrl.replace("/cleaner/", "/supervisor/"));
    }
    await page.getByRole("button", { name: /approve job/i }).click();
  });

  test("HR exports CSV", async ({ page }) => {
    await login(page, "hr@cleanops.local", "CleanOPS123!");
    await expect(page).toHaveURL(/\/app\/hr\/users/);
    await page.goto("/app/hr/timesheets");
    const [response] = await Promise.all([
      page.waitForResponse(/\/api\/timesheets\/export/),
      page.getByRole("button", { name: /export csv/i }).click(),
    ]);
    const csv = await response.text();
    expect(csv).toContain("regular_minutes");
    expect(csv).toContain("overtime_minutes");
  });
});
