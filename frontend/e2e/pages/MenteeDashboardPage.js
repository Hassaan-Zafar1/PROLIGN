// The "Your Profile" section only renders when at least one of
// university/degree/bio/domainInterest/targetIndustry/targetCompanyTier/
// experienceLevel/linkedinUrl is set on the mentee's backend profile — it's
// the correct proof that the interview-link flow actually populated data,
// not just that the dashboard rendered at all.
export class MenteeDashboardPage {
  constructor(page) {
    this.page = page;
    this.profileHeading = page.getByRole('heading', { name: 'Your Profile' });
  }

  async goto() {
    await this.page.goto('/mentee/dashboard');
  }
}
