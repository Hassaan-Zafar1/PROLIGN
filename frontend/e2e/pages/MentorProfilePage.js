export class MentorProfilePage {
  constructor(page) {
    this.page = page;
    // "Book a Session" renders twice (desktop sidebar + mobile sticky bar) —
    // .first() picks whichever is present/visible for the current viewport.
    this.bookButton = page.getByRole('button', { name: 'Book a Session' }).first();
  }

  async bookSession() {
    await this.bookButton.click();
  }
}
