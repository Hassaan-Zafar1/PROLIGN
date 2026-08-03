Feature: Mentee signup: register -> OTP -> interview link -> dashboard
  Covers the mentee onboarding journey (qa/test_cases_testrail_import.csv,
  Mentee Interview + Auth sections): register through the UI, verify email via
  OTP, then land on the dashboard with a profile populated from the interview.
  The real interview is a live, non-deterministic AI conversation (Ayla, on the
  separate Python AI_interviewer service) — driving that end-to-end is out of
  scope here. Instead this seeds a completed interview profile via the
  dev-only side channel and links it through the REAL POST /api/interview
  endpoint (interviewService.submitInterview), exercising the actual
  account-linking code path the app itself depends on.

  Scenario: Mentee can register, verify email, and see an interview-linked profile on the dashboard
    Given a new mentee fills out the registration form
    And they submit the registration form
    Then they should be taken to the OTP verification page
    When the OTP is fetched via the dev-only test channel and submitted
    Then they should be routed to the interview page
    When a completed interview profile is seeded and linked to their account
    And they go to their dashboard
    Then their populated profile should be visible
