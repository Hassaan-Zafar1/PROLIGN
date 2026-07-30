Feature: Smoke test
  Phase 0 harness-verification smoke test — proves Playwright (config, webServer
  auto-start, browser install, POM/fixture wiring) works before the real E2E
  scenarios exercise auth, discovery, booking, and admin.

  Scenario: Landing page loads
    Given I am on the landing page
    Then the page title should contain "ProLign"
