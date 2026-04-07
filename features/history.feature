Feature: Conversation History

  @requiresUser
  Scenario: View conversation history
    Given I am logged in as "testuser_login" with password "Password1"
    When I fetch my conversation history
    Then I should receive a list of conversations

  @requiresUser
  Scenario: Search conversation history
    Given I am logged in as "testuser_login" with password "Password1"
    When I search my history for "algebra"
    Then I should receive search results
