// 4-step wizard: Account -> Professional -> CV upload -> Review/Submit.
// Password/Confirm Password share the same placeholder text ("••••••••"), so
// they're disambiguated by DOM order via nth(), not placeholder.
export class MentorRegistrationPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/register/mentor');
  }

  async fillAccountStep({ name, email, password, confirmPassword = password }) {
    await this.page.getByPlaceholder('Dr. Julian Thorne').fill(name);
    await this.page.getByPlaceholder('julian@prolign.edu').fill(email);
    const passwordInputs = this.page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(confirmPassword);
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async fillProfessionalStep({ linkedIn, hourlyRate }) {
    await this.page.getByPlaceholder('linkedin.com/in/username').fill(linkedIn);
    await this.page.getByPlaceholder('120').fill(String(hourlyRate));
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async uploadCv(buffer, filename = 'cv.pdf') {
    await this.page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: 'application/pdf',
      buffer,
    });
    // Wait for the uploaded filename to render before advancing — the "Next"
    // button's enabled state depends on React state updating after the
    // change event, which is asynchronous relative to setInputFiles resolving.
    await this.page.getByText(filename).waitFor();
    await this.page.getByRole('button', { name: 'Next' }).click();
  }

  async submit() {
    // Submitting kicks off a real CV upload + register call and then
    // unmounts this whole page for the OTP screen. Any Locator-based action
    // here — click(), dispatchEvent('click'), even locator.evaluate() —
    // still resolves the locator through Playwright's own tracked-handle
    // machinery, which can end up re-querying this exact locator afterward
    // and hang once the button is gone for good post-navigation, even though
    // the click itself already fully succeeded. page.evaluate() (not
    // locator.evaluate()) runs a plain DOM query with no Playwright locator
    // involved at all, avoiding that machinery entirely.
    //
    // Must actually WAIT for the button's text to say "Submit Application"
    // (not "Submitting...") before clicking — under real (e.g. remote-DB)
    // network latency, the step-3->4 transition's own re-render can still be
    // in flight the instant this runs, and a one-shot query can silently
    // find zero matching buttons and no-op.
    await this.page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
      return buttons.some((b) => b.textContent.includes('Submit Application') && !b.disabled);
    });
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
      const btn = buttons.find((b) => b.textContent.includes('Submit Application') && !b.disabled);
      btn?.click();
    });
  }

  async registerFull({ name, email, password, linkedIn, hourlyRate, cvBuffer }) {
    await this.fillAccountStep({ name, email, password });
    await this.fillProfessionalStep({ linkedIn, hourlyRate });
    await this.uploadCv(cvBuffer);
    await this.submit();
  }
}
