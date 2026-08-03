Feature: Guest browsing (no login)
  Regression coverage for TC-REGRESSION-001/002/003 (qa/test_cases_testrail_import.csv):
  a guest clicking View/Book used to get stuck in an infinite reload loop — GET
  /reviews and GET /availability were fully auth-gated, and the axios interceptor
  reloaded the page on *any* 401, even a guest's who never had a token to refresh
  in the first place. If either regression reappears, this scenario times out
  waiting for the next page to render, rather than passing.

  Scenario: Guest can browse mentors, view a profile, and reach booking without looping
    Given a mentor is available to browse
    When I browse Find Mentors as a guest, with no authentication
    Then at least one mentor card should be visible
    When the guest views the first mentor's profile
    Then the guest should reach the mentor's profile page
    When the guest starts booking a session with that mentor
    Then the guest should reach the booking page without looping
