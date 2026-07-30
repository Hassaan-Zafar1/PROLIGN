# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\features\admin.feature.spec.js >> Admin: list, view, and delete users >> Admin can view a mentee's detail and delete them
- Location: e2e\.features-gen\e2e\features\admin.feature.spec.js:18:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin/
Received string:  "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × locator resolved to <html lang="en" data-theme="light">…</html>
      - unexpected value "http://localhost:5173/login"

```

```yaml
- main:
  - text: school ProLign workspace_premium Trusted by 10,000+ Professionals
  - heading "Grow Faster with Expert Mentorship" [level=1]
  - paragraph: Connect with experienced mentors, gain career guidance, and accelerate your professional journey.
  - text: groups
  - paragraph: 500+
  - paragraph: Mentors
  - text: event_available
  - paragraph: 10,000+
  - paragraph: Sessions
  - text: thumb_up
  - paragraph: 95%
  - paragraph: Satisfaction
  - text: domain
  - paragraph: 50+
  - paragraph: Industries
  - paragraph: New Here?
  - paragraph: Join our mentorship community and start your growth journey today.
  - button "person_add Create Account"
  - button "arrow_back Home"
  - text: school ProLign
  - heading "Welcome Back" [level=2]
  - paragraph: Sign in to continue your mentorship journey.
  - text: Email Address
  - textbox "Email address" [disabled]:
    - /placeholder: you@example.com
    - text: e2e-admin@prolign.test
  - text: mail Password
  - textbox "Password" [disabled]:
    - /placeholder: Enter your password
    - text: E2eAdmin@12345
  - text: lock
  - button "Show password": visibility
  - checkbox "Remember me" [disabled]
  - text: Remember me
  - button "Forgot Password?" [disabled]
  - button "Logging in..." [disabled]:
    - img
    - text: Logging in...
- region "Notifications Alt+T"
```

# Test source

```ts
  1  | import { Given, When, Then, expect } from '../../fixtures/base.js';
  2  | 
  3  | When('the admin logs in with the mentor-management admin account', async ({ page, loginPage }) => {
  4  |   await loginPage.goto();
  5  |   await loginPage.login('Admin10@prolign.com', 'Admin5293@');
  6  |   await expect(page).toHaveURL(/\/admin/);
  7  | });
  8  | 
  9  | When('the admin logs in with the mentee-management admin account', async ({ page, loginPage }) => {
  10 |   await loginPage.goto();
  11 |   await loginPage.login('e2e-admin@prolign.test', 'E2eAdmin@12345');
> 12 |   await expect(page).toHaveURL(/\/admin/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  13 | });
  14 | 
  15 | When('the admin opens the Mentors tab', async ({ adminDashboardPage }) => {
  16 |   await adminDashboardPage.goToMentorsTab();
  17 | });
  18 | 
  19 | When('the admin opens the Mentees tab', async ({ adminDashboardPage }) => {
  20 |   await adminDashboardPage.goToMenteesTab();
  21 | });
  22 | 
  23 | Then('the mentor\'s row should be visible', async ({ adminDashboardPage, world }) => {
  24 |   // Generous timeout: registerAndVerify above raced other specs' concurrent
  25 |   // registrations for the same backend/SMTP resources — the admin list read
  26 |   // can queue behind that under fullyParallel local runs.
  27 |   await expect(adminDashboardPage.memberRow(world.mentor.name)).toBeVisible({ timeout: 10000 });
  28 | });
  29 | 
  30 | Then('the mentee\'s row should be visible', async ({ adminDashboardPage, world }) => {
  31 |   // Same generous timeout as the mentor case above.
  32 |   await expect(adminDashboardPage.memberRow(world.mentee.name)).toBeVisible({ timeout: 10000 });
  33 | });
  34 | 
  35 | When('the admin views the mentor\'s detail', async ({ adminDashboardPage, world }) => {
  36 |   await adminDashboardPage.viewMember(world.mentor.name);
  37 | });
  38 | 
  39 | Then('the detail modal should show the mentor\'s name', async ({ page, world }) => {
  40 |   // The detail modal shows the member's name as a heading.
  41 |   await expect(page.getByRole('heading', { name: world.mentor.name })).toBeVisible();
  42 | });
  43 | 
  44 | When('the admin closes the detail modal', async ({ page }) => {
  45 |   // Multiple "close" controls exist on the page (an icon-only modal-close
  46 |   // button and a Toastify notification close, both with lowercase accessible
  47 |   // name "close") — only the modal's own text footer button is exactly
  48 |   // "Close" (capital C), so exact:true disambiguates.
  49 |   await page.getByRole('button', { name: 'Close', exact: true }).click();
  50 | });
  51 | 
  52 | When('the admin deletes the mentor', async ({ adminDashboardPage, world }) => {
  53 |   await adminDashboardPage.deleteMember(world.mentor.name);
  54 | });
  55 | 
  56 | When('the admin deletes the mentee', async ({ adminDashboardPage, world }) => {
  57 |   await adminDashboardPage.deleteMember(world.mentee.name);
  58 | });
  59 | 
  60 | Then('the mentor\'s row should no longer be visible', async ({ adminDashboardPage, world }) => {
  61 |   await expect(adminDashboardPage.memberRow(world.mentor.name)).toHaveCount(0);
  62 | });
  63 | 
  64 | Then('the mentee\'s row should no longer be visible', async ({ adminDashboardPage, world }) => {
  65 |   await expect(adminDashboardPage.memberRow(world.mentee.name)).toHaveCount(0);
  66 | });
  67 | 
```