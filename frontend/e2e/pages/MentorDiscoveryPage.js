export class MentorDiscoveryPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/find-mentors');
  }

  firstCard() {
    return this.page.locator('article').first();
  }

  async viewFirstMentor() {
    await this.firstCard().getByRole('button', { name: 'View' }).click();
  }

  async bookFirstMentor() {
    await this.firstCard().getByRole('button', { name: 'Book' }).click();
  }
}
