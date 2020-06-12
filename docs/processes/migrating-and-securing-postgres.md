## Procedure
### Creating a new server and database
This could be done programatically but for this purpose, it can be easily achieved through the portal.
 1. Create a new Azure Database for PostgreSQL server with the following properties:
    * Type: Single server
    * Subscription: `<subscription>` (as per environment)
    * Resource group: `<resource group>` (as per environment)
    * Server name: `<server name>` e.g. `psql-rafb-dev` (as per naming conventions)
    * Data source : `None`
    * Location: `(Europe) UK South`
    * Version: `11`
    * Compute + storage: 
      * Type: `Basic`  
      * Storage: `50 GB`
      * Backup Retention Period: `14 Days`
    * Administrator account:
      * Admin username `<username>` (Store in KeePass)
      * Password: `<password>` (Store in KeePass)
 1. Once deployed, update `Connection security` to whitelist the IP address of the machine from which to perform the migration and the app services which connect to the database server.

### Creating the permissions model
New databases are created with a default `public` schema. When using PG Admin, it is easier to restore to a schema with same name and then rename the schema afterwards. The steps below, therefore, setup the user permissions model on the public schema:
 1. Connect to the new server with PG Admin, using the administrator account details entered above.
 1. Create a new database, e.g. `rafb`.
 1. Run the following query on the public schema of the new database:

    ```sql
    CREATE ROLE read_write;
    
    GRANT USAGE ON SCHEMA public TO read_write;  

    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO read_write;  
    GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO read_write;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO read_write;  
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO read_write;

    CREATE USER read_write_user WITH PASSWORD '<password1>';  
    GRANT read_write TO read_write_user;

    CREATE ROLE read_write_migrate;
    GRANT read_write to read_write_migrate;

    GRANT ALL ON SCHEMA public TO read_write_migrate; 

    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO read_write_migrate;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO read_write_migrate; 

    CREATE USER read_write_migrate_user WITH PASSWORD '<password2>';  
    GRANT read_write_migrate TO read_write_migrate_user;
    ```

### Migrating the database
This can be done easily via the command line: 
 1. Run the following command, substituting hostname, passwords etc. as appropriate:  
 ```sh
 pg_dump --no-owner -d "user=postgresadmin@dev-temp-store password=<password1>  host=dev-temp-store.postgres.database.azure.com port=5432 dbname=postgres sslmode=require" | psql -d "user=read_write_migrate_user@psql-rafb-dev password=<password2> host=psql-rafb-dev.postgres.database.azure.com port=5432 dbname=rafb sslmode=require"
 ```

Alternatively it can also be achieved through PG Admin: 
 1. Connect to the **old** server with PG Admin, using appropriate administrator account details.
 1. Right-click on the `public` schema and click `Backup`.
 1. Select the following options:
    * Filename: `<filename>.backup`
    * Format: `Custom`
    * Encoding: `UTF8`
    * Sections
      * Pre-data
      * Data
      * Post-data
    * Don't save
      * Owner
 1. Click `Backup` and verify process completes successfully.
 1. Connect to the new server with PG Admin, using the administrator account details entered previously.   
 1. Right-click on the `public` schema and select `Restore`.
 1. Select the following options:
    * Filename: `<filename>.backup` (select file created earlier)
    * Sections
      * Pre-data
      * Data
      * Post-data
    * Don't save
      * Owner
    * Queries
      * Clean before restore  

Either way, rename the schema afterwards as follows and set as default schema:
 1. Right-click on the `public` schema and select `Properties`.
 1. Amend the name as appropriate and click `OK`.
 1. Run the following query on the the new database:

    ```sql
    ALTER ROLE read_write_user SET search_path TO registrations;
    ALTER ROLE read_write_migrate_user SET search_path TO registrations;
    ```
 
## Testing
Ensure the changes have been effective with PG Admin:
  1. Connect to the DB as the `read_write_user` and verify that it is possible to update data but not to add a new column.
  1. Connect to the DB as the `read_write_migrate_user` and verify that it is possible to to add and delete a new column and a new table.
 
 Or from the command prompt with pgcli:
 
 1. From a command prompt, run the following command, substituting in the appropriate host and password etc: 
    ```sh
    pgcli "postgres://read_write_user@dev-temp-store:<password>@dev-temp-store.postgres.database.azure.com:5432/postgres?sslmode=require"
    ```
1. Then the following:  
```sql
SELECT * FROM public.registrations LIMIT 10
```