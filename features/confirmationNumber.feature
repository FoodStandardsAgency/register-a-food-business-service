@receive_confirmation_number_SDB-47
Feature: As Samantha I want to receive a confirmation number when I submit my registration details so that I can contact local councils who are processing my application and they can access my details

    Scenario:
        Given I have a new registration with all valid required fields
        When I submit it to the backend
        Then I get a success response
        And I receive a confirmation number