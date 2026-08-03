// Unlike MenteeDashboard's, this "Your Profile" heading renders
// unconditionally — the Rating row beneath it always renders too ("No
// reviews yet" or a real rating), so it's a reliable proof-of-render even
// for a freshly built profile with sparse CV-extracted data.
export class MentorDashboardPage {
  constructor(page) {
    this.page = page;
    this.profileHeading = page.getByRole('heading', { name: 'Your Profile' });
  }

  async goto() {
    await this.page.goto('/mentor/dashboard');
  }
}
