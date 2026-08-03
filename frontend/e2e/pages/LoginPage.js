export class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async openRoleModal() {
    await this.page.getByRole('button', { name: /Create Account/i }).first().click();
  }

  async goToMenteeRegistration() {
    await this.openRoleModal();
    await this.page.getByRole('button', { name: /Continue as Mentee/i }).click();
  }

  async goToMentorRegistration() {
    await this.openRoleModal();
    await this.page.getByRole('button', { name: /Continue as Mentor/i }).click();
  }
}
