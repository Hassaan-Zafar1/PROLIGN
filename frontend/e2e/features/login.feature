Feature: Login and logout, all three roles

  Scenario: Mentee logs in and is routed to the interview
    Given a verified mentee account exists
    When the mentee logs in
    Then they should be routed to the interview, since their profile isn't complete yet

  Scenario: Mentor logs in and reaches their dashboard
    Given a verified mentor account exists
    When the mentor logs in
    Then they should reach the mentor dashboard

  Scenario: Admin logs in and reaches the admin dashboard
    Given the seeded E2E admin account
    When the admin logs in
    Then they should reach the admin dashboard

  Scenario: Logout returns to a public page and clears the session
    Given a verified mentor account exists
    When the mentor logs in
    Then they should reach the mentor dashboard
    When they log out
    Then they should be redirected away from the mentor dashboard
    And revisiting the mentor dashboard directly should also redirect away
