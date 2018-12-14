# Adding a new data field

In order to add anew data field it needs to be validated then added to the external connections.

## Steps:

1.  The data field should be added to the `validation.schema.js` so it can be validated as soon as it is accepted by the backend.
2.  The data field needs to be mapped to the correct field in the `tascomi.connector.js`
3.  The data field needs to be added to a new template in Notify to ensure it is sent to the FBO and LC.
4.  Add the data field to the database model in `db/models` in the correct subsection
5.  Create a new migration to add the data field column in the PostgresDB. For more information, see documentation on [Sequelize](https://sequelize.readthedocs.io/en/latest/docs/migrations/)
