var express = require('express');
var bodyParser = require('body-parser');
var app = express();

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

app.get('/', function(req, res) {
    res.send('Hello World!');
});

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

app.post('/api/user', (req, res) => {
    db('users').insert({
        name: req.body.name,
        email: req.body.email
    })
        .returning('id')
        .then(id => res.json({"id": id[0]}))
        .catch(err => res.status(400).json({"error": err.message}));
});

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
