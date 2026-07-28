// No goto() for the normal flow — registration navigates here via the app's
// own client-side router (navigateTo), which is what actually sets
// sessionStorage['otpUserId'] that this page reads. A fresh page.goto()
// wouldn't have that value set.
export class OtpPage {
  constructor(page) {
    this.page = page;
    this.otpInput = page.locator('#otp-input');
    this.verifyButton = page.getByRole('button', { name: 'Verify Email' });
  }

  async verify(otp) {
    await this.otpInput.fill(otp);
    await this.verifyButton.click();
  }
}
