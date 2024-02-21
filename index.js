const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'express-sandbox',
        version: '0.1.0',
        description: 'Sandbox CRUD Node Express SQLite API for testing different concepts and tools',
    },
    host: 'localhost:3000',
    basePath: '/',
};

// Options for the swagger-jsdoc package
const options = {
    swaggerDefinition,
    apis: ['./index.js'], // path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './database.db'
    },
    useNullAsDefault: true,
});

db.schema.hasTable('users').then((exists) => {
    if (!exists) {
        return db.schema.createTable('users', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.string('email');
        }).then(()=> {
            // table created
            console.log('Users table is created. Inserting some rows..');
            // Seeding data..
            return db('users').insert(
                [{
                    name: 'John Doe',
                    email: 'johndoe@example.com'
                }, {
                    name: 'Jane Doe',
                    email: 'janedoe@example.com'
                }]);
        }).then(() => console.log('Data is inserted.') );
    }
})
    .catch((error) => console.error("Error creating tables", error));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/api-docs.json", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

/**
 * @swagger
 * /:
 *  get:
 *    summary: Home page
 *    description: Returns a simple greeting message
 *    responses:
 *      200:
 *        description: Returns the greeting message 'Hello World!'
 *        content:
 *          text/plain:
 *            schema:
 *              type: string
 *              example: 'Hello World!'
 */
app.get('/', function(req, res) {
    res.send('Hello World!');
});

/**
 * @swagger
 * /api/users:
 *  get:
 *    summary: Retrieves a list of users
 *    description: Retrieves a list of all the users from the database
 *    responses:
 *      200:
 *        description: A JSON array of all users
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: integer
 *                  name:
 *                    type: string
 *                  email:
 *                    type: string
 *      500:
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 */
app.get('/api/users', (req, res) => {
    db.select('*').from('users')
        .then(users => {
            res.send(users);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: 'Error fetching users'});
        });
});

/**
 * @swagger
 * /api/user:
 *  post:
 *    summary: Add a new user
 *    description: Add a new user to the database
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              email:
 *                type: string
 *    responses:
 *      200:
 *        description: The id of the new added user
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: integer
 *      400:
 *        description: Server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 */
app.post('/api/user', (req, res) => {
    db('users').insert({
        name: req.body.name,
        email: req.body.email
    })
        .returning('id')
        .then(id => res.json({"id": id[0]}))
        .catch(err => res.status(400).json({"error": err.message}));
});

/**
 * @swagger
 * /api/user/{id}:
 *  get:
 *    summary: Retrieve a user
 *    description: Retrieve a user by id from the database
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: integer
 *        required: true
 *        description: Numeric ID of the user to retrieve
 *    responses:
 *      200:
 *        description: The requested user
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: integer
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *      400:
 *        description: Server or user not found error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 */
app.get('/api/user/:id', (req, res) => {
    db('users')
        .where({id: req.params.id})
        .first()
        .then(user => {
            if (!user) {
                return res.status(400).json({"error": "User not found"})
            }
            res.json(user);
        })
        .catch(err => res.status(400).json({"error": err.message}));
});

/**
 * @swagger
 * /api/user/{id}:
 *  put:
 *    summary: Update a user
 *    description: Update a user by id in the database
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *            type: integer
 *        required: true
 *        description: Numeric ID of the user to update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              email:
 *                type: string
 *    responses:
 *      200:
 *        description: The number of changes made
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                changes:
 *                  type: integer
 *      400:
 *        description: Server or user not found error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 */
app.put('/api/user/:id', (req, res) => {
    db('users')
        .where({id: req.params.id})
        .update({
            name: req.body.name,
            email: req.body.email
        })
        .then(changes => {
            if (!changes) {
                return res.status(400).json({"error": "User not found to update"})
            }
            res.json({"changes": changes});
        })
        .catch(err => res.status(400).json({"error": err.message}));
});

/**
 * @swagger
 * /api/user/{id}:
 *  delete:
 *    summary: Delete a user
 *    description: Delete a user by id from the database
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *            type: integer
 *        required: true
 *        description: Numeric ID of the user to delete
 *    responses:
 *      200:
 *        description: The number of changes made
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                changes:
 *                  type: integer
 *      400:
 *        description: Server or user not found error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                error:
 *                  type: string
 */
app.delete('/api/user/:id', (req, res) => {
    db('users')
        .where({id: req.params.id})
        .del()
        .then(changes => {
            if (!changes) {
                return res.status(400).json({"error": "User not found to delete"})
            }
            res.json({"changes": changes});
        })
        .catch(err => res.status(400).json({"error": err.message}));
});

app.listen(3000, function () {
    console.log('App listening on port 3000!');
});

process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});
