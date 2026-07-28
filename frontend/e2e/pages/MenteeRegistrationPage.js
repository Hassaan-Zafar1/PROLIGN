// MenteeRegistration.jsx has no id/name attributes on its inputs (only
// placeholder text), so locators here are placeholder-based to match.
export class MenteeRegistrationPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/register/mentee');
  }

  async register({ name, email, password, confirmPassword = password, linkedIn }) {
    await this.page.getByPlaceholder('Your full name').fill(name);
    await this.page.getByPlaceholder('you@example.com').fill(email);
    await this.page.getByPlaceholder('Create a password').fill(password);
    await this.page.getByPlaceholder('Confirm your password').fill(confirmPassword);
    if (linkedIn) {
      await this.page.getByPlaceholder('linkedin.com/in/your-profile').fill(linkedIn);
    }
    await this.page.getByRole('button', { name: 'Create Account' }).click();
  }
}
