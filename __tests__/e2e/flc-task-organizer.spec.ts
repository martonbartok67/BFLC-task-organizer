import { test, expect } from "@playwright/test";

test("loads dashboard shell", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("FLC Task Organizer")).toBeVisible();
  await expect(page.getByText("Multi-Project Workflow Dashboard")).toBeVisible();
});

test("loads calendar and analytics routes", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByText("Calendar View")).toBeVisible();

  await page.goto("/analytics");
  await expect(page.getByText("Project Progress Analytics")).toBeVisible();
});
