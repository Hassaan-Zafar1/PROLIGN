Feature: Booking a session (logged-in mentee)
  Covers TC-BOOKING (qa/test_cases_testrail_import.csv): a logged-in mentee
  browses a mentor's real availability and books a session through to the
  payment step. Stripe's own hosted card UI is out of scope — this suite only
  owns the app logic up through the real POST /sessions call.

  Scenario: Mentee can browse a mentor's availability and book a session
    Given a mentor with an available slot tomorrow at 10:00 AM exists
    And a verified mentee account exists
    When the mentee logs in
    Then the mentee should land on the interview page
    When the mentee searches for that mentor on the Find Mentors page
    Then the mentor's card should be visible
    When the mentee clicks Book on the mentor's card
    Then the mentee should reach the booking page
    When the mentee selects the available time slot
    And the mentee continues to payment
    Then the Stripe payment step should be reached
