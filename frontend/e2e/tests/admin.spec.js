import { test, expect } from '../fixtures/base.js';

test.describe('Admin: list, view, and delete users', () => {
  test('admin can view a mentor\'s detail and delete them', async ({
    page, loginPage, adminDashboardPage, testUsers, api,
  }) => {
    const mentor = testUsers.mentor();
    await api.registerAndVerify({
      email: mentor.email, password: mentor.password, role: 'mentor', name: mentor.name,
      linkedinUrl: mentor.linkedIn, hourlyRate: Number(mentor.hourlyRate),
    });

    await loginPage.goto();
    await loginPage.login('e2e-admin@prolign.test', 'E2eAdmin@12345');
    await expect(page).toHaveURL(/\/admin/);

    await adminDashboardPage.goToMentorsTab();
    await expect(adminDashboardPage.memberRow(mentor.name)).toBeVisible();

    await adminDashboardPage.viewMember(mentor.name);
    // The detail modal shows the member's name as a heading.
    await expect(page.getByRole('heading', { name: mentor.name })).toBeVisible();
    // Multiple "close" controls exist on the page (an icon-only modal-close
    // button and a Toastify notification close, both with lowercase
    // accessible name "close") — only the modal's own text footer button is
    // exactly "Close" (capital C), so `exact: true` disambiguates.
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await adminDashboardPage.deleteMember(mentor.name);
    await expect(adminDashboardPage.memberRow(mentor.name)).toHaveCount(0);
  });

  test('admin can view a mentee\'s detail and delete them', async ({
    page, loginPage, adminDashboardPage, testUsers, api,
  }) => {
    const mentee = testUsers.mentee();
    await api.registerAndVerify({ email: mentee.email, password: mentee.password, role: 'mentee', name: mentee.name });

    await loginPage.goto();
    await loginPage.login('e2e-admin@prolign.test', 'E2eAdmin@12345');
    await expect(page).toHaveURL(/\/admin/);

    await adminDashboardPage.goToMenteesTab();
    await expect(adminDashboardPage.memberRow(mentee.name)).toBeVisible();

    await adminDashboardPage.deleteMember(mentee.name);
    await expect(adminDashboardPage.memberRow(mentee.name)).toHaveCount(0);
  });
});
