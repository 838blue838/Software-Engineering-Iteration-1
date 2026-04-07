Feature: Chat with LLM

  @requiresUser
  Scenario: Start a new conversation
    Given I am logged in as "testuser_login" with password "Password1"
    When I create a new conversation
    Then I should receive a conversation ID

  @requiresUser
  Scenario: Send a message in a conversation
    Given I am logged in as "testuser_login" with password "Password1"
    And I have an active conversation
    When I send the message "What is 2 plus 2?"
    Then I should receive an assistant reply

  @requiresUser
  Scenario: View messages in a conversation
    Given I am logged in as "testuser_login" with password "Password1"
    And I have an active conversation
    And I send the message "Hello LLM"
    When I fetch the conversation
    Then the conversation should contain at least 1 message
