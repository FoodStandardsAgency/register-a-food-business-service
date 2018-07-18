@save_to_database_SDB-495
Feature: Backend saves new establishments to database

    @save_to_database_SDB-495_non_PI
    Scenario:
        Given I have a new establishment with all valid required fields
        When I submit it to the backend
        Then The non personal information is saved to the database

    @save_to_database_SDB-495_PI
    Scenario:
        Given I have a new establishment with all valid required fields
        When I submit it to the backend
        Then The personal information is not saved to the database

