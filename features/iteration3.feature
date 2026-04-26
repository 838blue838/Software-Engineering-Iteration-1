Feature: Iteration 3 multi-LLM support and testing-team review

  Scenario: Chat page shows the Iteration 3 model selector
    Given I am logged in as "iter3_user" with password "Password1"
    When I open the chat page
    Then I should see the model selector
    And the model selector should include provider labels
      | OpenAI |
      | Google Gemini |
      | Anthropic Claude |

  Scenario: First message auto-creates a conversation and math tool answers
    Given I am logged in as "iter3_user" with password "Password1"
    When I open the chat page
    And I create a new conversation
    And I type "what is 2 + 2" into the chat box
    And I send the chat message
    Then the URL should contain "/chat?id="
    And I should see "2 + 2 = 4" in the chat window

  Scenario: Sidebar rename updates the active conversation
    Given I am logged in as "iter3_user" with password "Password1"
    When I open the chat page
    And I create a new conversation
    And I type "rename me please" into the chat box
    And I send the chat message
    And I rename the active conversation in the sidebar to "Renamed Sidebar Chat"
    Then I should see a conversation titled "Renamed Sidebar Chat" in the sidebar
    And the chat title should be "Renamed Sidebar Chat"

  Scenario: Sidebar delete removes the active conversation
    Given I am logged in as "iter3_user" with password "Password1"
    When I open the chat page
    And I create a new conversation
    And I type "delete me from sidebar" into the chat box
    And I send the chat message
    Then I should see a conversation titled "delete me from sidebar" in the sidebar
    When I delete the active conversation from the sidebar
    Then I should not see a conversation titled "delete me from sidebar" in the sidebar

  Scenario: History search finds and renames a previous conversation
    Given I am logged in as "iter3_user" with password "Password1"
    When I open the chat page
    And I create a new conversation
    And I type "unique algebra topic 123" into the chat box
    And I send the chat message
    And I open the history page
    And I search history for "algebra"
    Then I should see a history card containing "unique algebra topic 123"
    When I rename the first history conversation to "Renamed History Chat"
    Then I should see a history card containing "Renamed History Chat"

  Scenario: History delete removes a previous conversation
    Given I am logged in as "iter3_user" with password "Password1"
    When I open the chat page
    And I create a new conversation
    And I type "history delete target 456" into the chat box
    And I send the chat message
    And I open the history page
    And I search history for "history delete target 456"
    Then I should see a history card containing "history delete target 456"
    When I delete the first history conversation
    Then I should not see a history card containing "history delete target 456"