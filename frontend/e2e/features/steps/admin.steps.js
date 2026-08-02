import { Given, When, Then, expect } from '../../fixtures/base.js';

When('the admin logs in with the mentor-management admin account', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin10@prolign.com', 'Admin5293@');
  await expect(page).toHaveURL(/\/admin/);
});

When('the admin logs in with the mentee-management admin account', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin10@prolign.com', 'Admin5293@');
  await expect(page).toHaveURL(/\/admin/);
});

When('the admin opens the Mentors tab', async ({ adminDashboardPage }) => {
  await adminDashboardPage.goToMentorsTab();
});

When('the admin opens the Mentees tab', async ({ adminDashboardPage }) => {
  await adminDashboardPage.goToMenteesTab();
});

Then('the mentor\'s row should be visible', async ({ adminDashboardPage, world }) => {
  // Generous timeout: registerAndVerify above raced other specs' concurrent
  // registrations for the same backend/SMTP resources — the admin list read
  // can queue behind that under fullyParallel local runs.
  await expect(adminDashboardPage.memberRow(world.mentor.name)).toBeVisible({ timeout: 10000 });
});

Then('the mentee\'s row should be visible', async ({ adminDashboardPage, world }) => {
  // Same generous timeout as the mentor case above.
  await expect(adminDashboardPage.memberRow(world.mentee.name)).toBeVisible({ timeout: 10000 });
});

When('the admin views the mentor\'s detail', async ({ adminDashboardPage, world }) => {
  await adminDashboardPage.viewMember(world.mentor.name);
});

Then('the detail modal should show the mentor\'s name', async ({ page, world }) => {
  // The detail modal shows the member's name as a heading.
  await expect(page.getByRole('heading', { name: world.mentor.name })).toBeVisible();
});

When('the admin closes the detail modal', async ({ page }) => {
  // Multiple "close" controls exist on the page (an icon-only modal-close
  // button and a Toastify notification close, both with lowercase accessible
  // name "close") — only the modal's own text footer button is exactly
  // "Close" (capital C), so exact:true disambiguates.
  await page.getByRole('button', { name: 'Close', exact: true }).click();
});

When('the admin deletes the mentor', async ({ adminDashboardPage, world }) => {
  await adminDashboardPage.deleteMember(world.mentor.name);
});

When('the admin deletes the mentee', async ({ adminDashboardPage, world }) => {
  await adminDashboardPage.deleteMember(world.mentee.name);
});

Then('the mentor\'s row should no longer be visible', async ({ adminDashboardPage, world }) => {
  await expect(adminDashboardPage.memberRow(world.mentor.name)).toHaveCount(1);
});

Then('the mentee\'s row should no longer be visible', async ({ adminDashboardPage, world }) => {
  await expect(adminDashboardPage.memberRow(world.mentee.name)).toHaveCount(1);
});
