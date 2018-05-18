Feature: Contact Details

   Contact details section validation

   Scenario: Entering invalid email without @ symbol
    Given I enter an email address without an @ symbol
    When I submit it to the back end application
    Then I get an error response

    Scenario: Entering invalid email with two @ symbols
    Given I enter an email address with two @ symbols
    When I submit it to the back end application
    Then I get an error response


    Scenario: Entering invalid mobile number with too many digits
    Given I enter a mobile number longer than 11 digits long
    When I submit the mobile nuber to the back end application
    Then I get an error response

