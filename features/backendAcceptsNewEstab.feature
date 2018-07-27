@accepting_new_feature_SDB-489
Feature: Backend accepts new establishment and responds

    @accepts_new_estab_SDB-489_happy_path
    Scenario:
        Given I have a new registration with all valid required fields
        When I submit it to the backend
        Then I get a success response

    @accepts_new_estab_SDB-489_error
    Scenario:
        Given I have a new establishment with some invalid required fields
        When I submit it to the backend
        Then I get an error response

    @accepts_new_estab_SDB-489_multiple_conditional
    Scenario:
        Given I have a new registration with all valid required fields
        And I have multiple conditional required fields
        When I submit it to the backend
        Then I get an error response




