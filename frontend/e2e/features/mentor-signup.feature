Feature: Mentor signup: register -> OTP -> CV build -> dashboard
  Covers the full mentor onboarding journey (qa/test_cases_testrail_import.csv,
  Mentee/Mentor Profile CRUD + Auth sections): register through the UI, verify
  email via OTP, upload a CV, and land on the dashboard with an auto-built
  profile. MentorOnboarding.jsx deliberately holds its "building profile"
  screen for a minimum ~10s (plus a ~2.2s auto-advance) for UX pacing — this
  scenario is tagged @slow (playwright-bdd's built-in special tag, mapping to
  Playwright's native test.slow() — triples the default 30s timeout to 90s,
  matching the original spec's explicit test.setTimeout(90000)) to give that
  real, unmockable wait room to run.

  @slow
  Scenario: Mentor can register, verify email, and reach the dashboard with a built profile
    Given a new mentor fills out the account step of registration
    Then the Professional Information step should be shown
    When they fill out the professional information step
    Then the Profile Setup step should be shown
    When they upload their CV
    Then the Review & Submit step should be shown
    When they submit the mentor application
    Then they should be redirected to the OTP verification page
    When the OTP is fetched via the dev-only test channel and submitted
    Then their profile should be built and the mentor dashboard reached
