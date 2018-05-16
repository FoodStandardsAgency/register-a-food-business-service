Feature: Contact Details

   Contact details section validation

   Scenario: Entering invalid email
    Given I enter an email address without an @ symbol
    When I submit it to the back end application
    Then I get an error response