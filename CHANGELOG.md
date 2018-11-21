## Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## v3.7.3 - 21st November 2018 (unreleased)

### Modified

* Add keepAlive: true to database config

## v3.7.2 - 20th November 2018 (unreleased)

### Modified

* Update authentication package to version with retry logic

## v3.7.1 - 6th November 2018 (unreleased)

### Modified

* Optimisations to the various async calls to make the user get their response quicker

## v3.7.0 - 5th November 2018 (unreleased)

### Modified

* SDB-237 Add a PDF to the LC notifications email

## v3.6.4 - 5th November 2018 (unreleased)

### Modified

* SDB-924 Generic Notify connector (moved config into database)

## v3.6.3 - 30th October 2018 (unreleased)

### Modified

* Fix typo in Operator model for operator_company_name

## v3.6.2 - 30th October 2018 (unreleased)

### Modified

* Add council row into registrations table

## v3.6.1 - 29th October 2018 (released)

### Modified

* Memory leak bugfix

## v3.6.0 - 29th October 2018 (released)

### Added

* Added SDB-930 DB Enhancements

## v3.5.0 - 4th October 2018 (unreleased)

### Added

* Added SDB-52 Establishment opening days

## v3.4.1 - 20th September 2018 (unreleased)

### Added

* Added abilitiy to send registrations to multiple locations

## v3.4.0 - 18th September 2018 (unreleased)

### Added

* Added business other details

## v3.3.2 - 7th September 2018 (unreleased)

### Added

* Added local council number to lc info

## v3.3.1 - 3rd September 2018 (unreleased)

### Modified

* Tascomi connector now sends the hygiene council ID

## v3.3.0 - 31st August 2018 (unreleased)

### Added

* Added connection to cacheDB to cache every new registration for 72 hours

## v3.2.1 - 31st August 2018 (unreleased)

### Added

* Added business_type and import / export activities to tascomi connector

## v3.2.0 - 30th August 2018 (unreleased)

### Added

* Added return and delete records

## v3.1.2 - 30th August 2018 (unreleased)

### Modified

* Fix bug that prevented validation errors from being logged correctly

## v3.1.1 - 28th August 2018 (unreleased)

### Modified

* Returned data name modified from email_success_fbo to email_fbo
* Returned data name modified from email_success_lc to email_lc

## v3.1.0 - 28th August 2018 (unreleased)

### Added

* SBD-6 LC lookup

## v3.0.0 - 21st August 2018 (unreleased)

### Added

* Added secret and name based authentication to all API routes

## v2.7.0 - 7th August 2018 (unreleased)

### Added

* SDB-22 Local council email notifications

## v2.6.0 - 7th August 2018 (unreleased)

### Added

* SDB-241 - Business import export activities

## v2.5.0 - 7th August 2018 (unreleased)

### Added

* SDB-5 - Business types - type in

## v2.4.0 - 3rd August 2018 (unreleased)

### Added

* SDB-521 - Tascomi integration

## v2.3.0 - 1st August 2018 (unreleased)

### Added

* SDB-47 - Registration confirmation number

## v2.2.0 - 30th July 2018 (unreleased)

### Added

* SDB-236 - Registration submission date

## v2.1.0 - 30th July 2018 (unreleased)

### Added

* SDB-50 - Establishment Type

## v2.0.0 - 27th July 2018 (unreleased)

### Modified

* Changed API from GraphQL to REST API, after reassessing benefits of GraphQL in our service context.

## v1.13.0 - 18th July 2018 (unreleased)

### Added

* Database layer

## v1.12.0 - 11th July 2018 (unreleased)

### Added

* SDB-114 / 115 - Establishment opening date

## v1.11.0 - 11th July 2018 (unreleased)

### Added

* SDB-40 - Customer Type

## v1.10.1 - 6th July 2018 (unreleased)

### Modified

* Removal of registration role from backend

## v1.10.0 - 6th July 2018 (unreleased)

### Added

* SDB-113 - Establishment Contact Details

## v1.9.0 - 28th June 2018 (unreleased)

### Added

* SDB-40 - Charity details

## v1.8.0 - 28th June 2018 (unreleased)

### Added

* SDB-1 - Operator Address

## v1.7.0 - 25th June 2018 (unreleased)

### Added

* SDB-36 - Limited company details

## v1.6.0 - 25th June 2018 (unreleased)

### Added

* SDB-55 - Operator type

## v1.5.0 - 25th June 2018 (unreleased)

### Modified

* SDB-247 - Validation refactor

## v1.4.0 - 18th June 2018 (unreleased)

### Added

* SDB-156 - Simple contact details

## v1.3.0 - 18th June 2018 (unreleased)

### Added

* SDB-144 - Backed data schema visualisation with Voyager

## v1.2.0 - 13th June 2018 (unreleased)

### Added

* SDB-4 - Establishment trading name
* SDB-49 - Establishment address (with info drop down)

## v1.1.0 - 6th June 2018 (unreleased)

### Added

* SDB-44 - Back end connection
* SDB-34 - Submit a registration
* SDB-49 - Establishment address (without info drop down)
