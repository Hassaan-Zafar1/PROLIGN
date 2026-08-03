// The sidebar nav renders twice in the DOM (desktop <aside> + a mobile bottom
// nav, toggled by CSS breakpoint, both present regardless of viewport) — scope
// to <aside> to avoid a Playwright strict-mode "multiple elements" error on
// the default Desktop Chrome viewport.
export class AdminDashboardPage {
  constructor(page) {
    this.page = page;
    this.sidebar = page.locator('aside');
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async goToMentorsTab() {
    // The nav button's accessible name is "groups Mentors" (the material-icon
    // ligature text is a literal text node preceding the visible label), so
    // `exact: true` never matches. A plain substring match on "Mentors" also
    // wrongly hits the sidebar's "ProLign / Modern Mentorship" brand button
    // ("Mentors" is a substring of "Mentorship", with no word boundary after
    // it there) — a \b-bounded regex avoids both problems.
    await this.sidebar.getByRole('button', { name: /\bMentors\b/ }).click();
  }

  async goToMenteesTab() {
    await this.sidebar.getByRole('button', { name: /\bMentees\b/ }).click();
  }

  memberRow(name) {
    return this.page.locator('tr').filter({ hasText: name });
  }

  async viewMember(name) {
    await this.memberRow(name).getByTitle('View details').click();
  }

  // Delete confirmation is a native window.confirm(), not a DOM modal —
  // must register the dialog handler before triggering it.
  async deleteMember(name) {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.memberRow(name).getByTitle('Delete').click();
  }
}
