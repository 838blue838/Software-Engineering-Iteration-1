Feature: Multi-LLM local comparison

  Scenario: User submits one prompt to three local providers
    Given the user has access to the local chat providers
    When the user requests a comparison
    Then the system should be configured to compare multiple local LLMs