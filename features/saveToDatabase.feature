@save_to_database_SDB-495
Feature: Backend saves new establishments to database

    @save_to_database_SDB-495_non_PI
    Scenario:
        Given I have a new registration with all valid required fields
        When I submit it to the backend
        Then The information is saved to the database

    Scenario: Save direct submission
        Given I have a new direct submission registration with all valid required fields
        When I submit it to the direct backend API
        Then The information is saved to the database