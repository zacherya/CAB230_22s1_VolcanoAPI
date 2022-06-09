
# VolcanoAPI - QUT CAB230 2022 Semester 2

A REST API service built in nodejs using the express framework, used to deliver information about volcanoes around the world.


## Installation - Linux

1. Launch a console window in the root directory of the projects.

2. Re-install npm packages
```bash
   cd VolcanoAPI
   npm install
```

3. Generate a secure token key
```javascript
   require('crypto').randomBytes(64).toString('hex')
```

4. Create an environment file (`.env`) in the root of the VolcanoAPI directory, replacing `NODE_ENV` with either `production` or `development` and adding your secure token key from step 3 into `TOKEN_SECRET`

   **NOTE: The app will not run without the TOKEN_SECRET set!**
```env
   NODE_ENV=production
   TOKEN_SECRET=A_VERY_SECRET_TOKEN
```

**Production** is set to run on port `443` and HTTPS which requires a certificate to be configured in `bin\www.js`.

**Development** is set to run on port `3000` and HTTP.

5. Run the `dump_modified.sql` dump file in your MySQL server. Located in the project root directory. This will create the database and all associated tables

6. Configure the `knexfile.js` with your MySQL connection information

7. To run the application, run the following command
```bash
   npm start
```
or if developing use `nodemon` for live restarts when project files change
```bash
   npm start live
```

### Having trouble running without sudo in production?
You'll need to enabled Linux to bind to privilaged ports and access protected certificate files
```bash
   sudo chmod +rx /etc/ssl/private/
   sudo chmod +r /etc/ssl/private/node-selfsigned.key
   sudo setcap ‘cap_net_bind_service=+ep’ /usr/bin/node
```
Alternatively you can give the super user ownership of the project directory and run with sudo
```bash
   cd ..
   sudo chown root VolcanoAPI
   cd VolcanoAPI
   sudo npm start
```

### Need help creating a self signed cert for testing?
Run the following commands to create one in the default ssl certificate and key directories
```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/node-selfsigned.key -out /etc/ssl/certs/node-selfsigned.crt
```

## API Documentation

When running the project, visit the `Swagger Documentation` located on the root of the accessable url.

For example go to `http://localhost:3000/` or `https://urltoyourserver.com/` to access the SwaggerUI
## Running Tests

To run tests, run the following command

```bash
  npm run test
```


## Tech Stack
**Server:** Node, Express, nodemon (For live server restarts when editing files, not used in production)

**Authentication:** JsonWebToken, bcrypt

**Documentation:** swagger-ui-express

**Error Handling:** http-errors (In conjunction with a custom built handler)

**Logging:** rotating-file-system

**Data Access:** mysql2, knex

**Other frameworks/libaries:** cors, dotenv, helmet, morgan


## Authors

- Zac Adams ([@zacherya](https://www.github.com/zacherya))

