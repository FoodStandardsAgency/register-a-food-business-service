@send_to_tascomi_for_front-end_submissions_only
Feature: Send to tascomi for front-end submissions only

    Scenario:
        Given I have a new registration with all valid required fields
        When I submit it to the backend
        Then I get a success response

        Given I have a new direct submission registration with all valid required fields
        When I submit it to the direct backend API
        Then I get a success response

        When The tascomi task is triggered
        Then It returns an array of attempted registrations
        And Only front-end submission registrations are attempted