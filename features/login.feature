Feature: User Login

  @requiresUser
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter username "testuser_login" and password "password123"
    And I click the login button
    Then I should be redirected to the dashboard

  Scenario: Login fails with invalid credentials
    Given I am on the login page
    When I enter username "wronguser" and password "wrongpass"
    And I click the login button
    Then I should see an error message