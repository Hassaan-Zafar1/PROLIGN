// Booking involves a real Stripe Elements iframe for the payment step itself
// (frameLocator territory, and Stripe's own hosted UI — not app logic this
// suite owns). This page object only covers through "Continue to Payment",
// which is what actually calls the real POST /sessions and creates the
// session — the part of the flow this app is responsible for.
export class BookingPage {
  constructor(page) {
    this.page = page;
    this.continueButton = page.getByRole('button', { name: 'Continue to Payment' });
  }

  async selectFirstAvailableDay() {
    const dayButtons = this.page.getByRole('button', { name: /^\d{1,2}$/ });
    await dayButtons.first().click();
  }

  async selectFirstTimeSlot() {
    const slotButton = this.page.getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)\s*-\s*\d{1,2}:\d{2}\s?(AM|PM)/i }).first();
    await slotButton.click();
  }

  async continueToPayment() {
    await this.continueButton.click();
  }
}
