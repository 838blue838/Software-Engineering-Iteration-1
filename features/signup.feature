Feature: User Signup

  Scenario: Successful signup with a new username
    Given I am on the signup page
    When I enter username "newuser123" and password "password123"
    And I click the signup button
    Then I should be redirected to the dashboard

  Scenario: Signup fails with a duplicate username
    Given I am on the signup page
    When I enter username "newuser123" and password "password123"
    And I click the signup button
    Then I should see an error message