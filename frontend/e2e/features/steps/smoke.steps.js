import { Given, Then, expect } from '../../fixtures/base.js';

Given('I am on the landing page', async ({ landingPage }) => {
  await landingPage.goto();
});

Then('the page title should contain {string}', async ({ page }, text) => {
  await expect(page).toHaveTitle(new RegExp(text));
});
