Feature: Admin: list, view, and delete users

  Scenario: Admin can view a mentor's detail and delete them
    Given a verified mentor account exists
    When the admin logs in with the mentor-management admin account
    And the admin opens the Mentors tab
    Then the mentor's row should be visible
    When the admin views the mentor's detail
    Then the detail modal should show the mentor's name
    When the admin closes the detail modal
    And the admin deletes the mentor
    Then the mentor's row should no longer be visible

  Scenario: Admin can view a mentee's detail and delete them
    Given a verified mentee account exists
    When the admin logs in with the mentee-management admin account
    And the admin opens the Mentees tab
    Then the mentee's row should be visible
    When the admin deletes the mentee
    Then the mentee's row should no longer be visible
