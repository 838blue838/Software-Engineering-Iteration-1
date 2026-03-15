Feature: User Logout

  @requiresUser
  Scenario: User can log out successfully
    Given I am logged in as "testuser_login" with password "password123"
    When I click the logout button
    Then I should be redirected to the home page