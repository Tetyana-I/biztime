### BizTime
The exercise to build a REST-ful backend API server for a simple company/invoice tracker.

#### Local Deployment
Requirements: Node.js, npm, PostgreSQL

1. Initialize PostgreSQL. Create a database named 'biztime':

    `createdb biztime`

2. Clone Repository

    `git clone https://github.com/Tetyana-I/biztime.git`

3. Switch to application directory

    `cd express-biztime`

4. Seed initial data to the database

    `psql < data.sql`

5. Install dependencies

    `npm install`

6. Run application 

    `node app.js`

Server will be running at https://localhost:3000/