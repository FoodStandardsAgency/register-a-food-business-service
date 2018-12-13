# Register a food business service

## Setting up your development environment

To run this application, you must use the [register-a-food-business-environment](https://github.com/FoodStandardsAgency/register-a-food-business-environment) repository to set up your development environment.

It is recommended that you install the Prettier code-formatting extension for your IDE.

## Detailed guides

The following detailed guides are available:

* [Starting and testing the application](./docs/contribution-guidelines/starting-testing-the-app.md)
* [Adding a new data field](./docs/contribution-guidelines/adding-a-new-data-field.md)
* [The tech stack](./docs/contribution-guidelines/the-tech-stack.md)
* [The email notifications service](https://foodstandardsagency.atlassian.net/wiki/spaces/RFB/pages/491290652/The+Notifications+service)
* [The FSA reference number generator](https://foodstandardsagency.atlassian.net/wiki/spaces/RFB/pages/491126788/The+FSA+registration+reference+number+generator)

## The `/api/registration` route

The `/api/registration` route is the endpoint for creating, fetching, and deleting registrations.

### `POST /api/registration/createNewRegistration`

A successful `POST` request to the `/createNewRegistration` route requires the following:

* A `POST` body in `application/json` format, containing the registration data, in the data structure defined in [validation.schema.js](/src/services/validation.schema.js)
* Four `POST` headers:
  * `Content-Type`: `application/json`
  * `client-name`: currently there is only one permitted client, the front-end application, and its name is stored in the environment variables for this service application.
  * `api-secret`: the corresponding secret for `client-name`.
  * `registration-data-version`: a string version number, in Semver format, to correlate with one of the entries in the `configVersion` collection in the Config database.

A successful `POST` request to the `/createNewRegistration` route performs the following actions, in order:

* Saves the registration data to the `*-back-end-cache` database on Azure. This action means that any failed subsequent steps will be recoverable via a manual search of the cache database, rather than the user data being lost forever.
* Validates the registration data against the [schema](/src/services/validation.schema.js)
* Fetches the config details (such as contact details) for the specified district council and, optionally, its corresponding county council in cases where the county council manages food standards.
* Gets metadata for the registration. Currently, this is the unique food business registration number (via an [Epimorphics API](https://foodstandardsagency.atlassian.net/wiki/spaces/RFB/pages/491126788/The+FSA+registration+reference+number+generator)) and the registration date in `YYYY-MM-DD` format.
* Sends a combined response object back to the client
* Performs a series of asynchronous post-response operations:
  * Sends the registration to the Tascomi API specified in the config database for that council
  * Saves the registration to the PostgreSQL database (`*-temp-store`) on Azure
  * Gets the config for the specified `registration-data-version`, which includes template IDs for GOV.UK Notify emails
  * Sends confirmation/notification emails to the Food Business Operator and Local Council(s) via [GOV.UK Notify](https://foodstandardsagency.atlassian.net/wiki/spaces/RFB/pages/491290652/The+Notifications+service).

### `DELETE /api/registration/:fsa_rn`

This route is primarily in place to allow easy actioning of GDPR deletion requests on individual registrations by the FSA registration number, or other required registration deletions. The `client-name` and `api-secret` headers are required to use this route. Note that the matching environment variables are the `ADMIN_*` variables, which are different to those for the `POST/createNewRegistration` route.

### `GET /api/registration/:fsa_rn`

This route is deprecated because the collections service now provides all `GET` functionality for saved registrations. However, the route can be used for admin purposes if necessary. The `client-name` and `api-secret` headers are required to use this route. Note that the matching environment variables are the `ADMIN_*` variables, which are different to those for the `POST/createNewRegistration` route.

## The `/api/status` route

The `/api/status` route is the endpoint for fetching status data, ranging from healthcheck (on/off) to more complex status data.

### `GET /api/status/healthcheck`

This route returns a success message. No message is returned if the service is not running.

### `GET /api/status/all`

This route returns a JSON object containing all available status points and their values, such as `storeRegistrationsInCacheSucceeded`.

### `GET /api/status/name/:statusName`

This route returns the status value for the given status point name.
