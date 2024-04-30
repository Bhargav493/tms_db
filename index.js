const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();
const port = 3004;  // Customize the port number if needed

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: 'very_secret_key',  // Change this to a random string in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if you are using HTTPS
}));

// Configure database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username', // Replace with your MySQL username
    password: 'your_password', // Replace with your MySQL password
    database: 'task_management_system' // Make sure this is your actual database name
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log("Connected to the database.");
});

// Generic error handler for database operations
function handleDatabaseError(res, err) {
    console.error('Database error:', err);
    res.status(500).send('Database error occurred.');
}

// Authentication and Authorization Middleware
function checkAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(403).send("Unauthorized");
    }
}

// Login API for both Admins and Users
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;  // Role can be 'admin' or 'user'
    const table = role === 'admin' ? 'admins' : 'users';
    const sql = `SELECT * FROM ${table} WHERE email = ?`;

    db.query(sql, [email], async (err, results) => {
        if (err) return handleDatabaseError(res, err);
        if (results.length === 0) {
            res.status(401).send("No such user found");
        } else {
            const match = await bcrypt.compare(password, results[0].password);
            if (match) {
                req.session.user = { id: results[0].id, role: role };
                res.send("Logged in successfully");
            } else {
                res.status(401).send("Password is incorrect");
            }
        }
    });
});

// Logout API
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to logout');
        }
        res.send("Logged out successfully");
    });
});

// CRUD API Endpoints for Users
app.get('/users', checkAuthentication, (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return handleDatabaseError(res, err);
        res.json(results);
    });
});

app.post('/users', checkAuthentication, (req, res) => {
    const { name, email, password, mobile } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return handleDatabaseError(res, err);
        db.query('INSERT INTO users (name, email, password, mobile) VALUES (?, ?, ?, ?)',
                 [name, email, hash, mobile], (err, result) => {
            if (err) return handleDatabaseError(res, err);
            res.json({ message: 'User added successfully', userId: result.insertId });
        });
    });
});

app.put('/users/:uid', checkAuthentication, (req, res) => {
    const { name, email, password, mobile } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return handleDatabaseError(res, err);
        db.query('UPDATE users SET name = ?, email = ?, password = ?, mobile = ? WHERE uid = ?',
                 [name, email, hash, mobile, req.params.uid], (err, result) => {
            if (err) return handleDatabaseError(res, err);
            res.json({ message: 'User updated successfully' });
        });
    });
});

app.delete('/users/:uid', checkAuthentication, (req, res) => {
    db.query('DELETE FROM users WHERE uid = ?', [req.params.uid], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'User deleted successfully' });
    });
});

// CRUD API Endpoints for Leaves
app.get('/leaves', checkAuthentication, (req, res) => {
    db.query('SELECT * FROM leaves', (err, results) => {
        if (err) return handleDatabaseError(res, err);
        res.json(results);
    });
});

app.post('/leaves', checkAuthentication, (req, res) => {
    const { uid, subject, message, status } = req.body;
    db.query('INSERT INTO leaves (uid, subject, message, status) VALUES (?, ?, ?, ?)',
             [uid, subject, message, status], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'Leave added successfully', leaveId: result.insertId });
    });
});

app.put('/leaves/:lid', checkAuthentication, (req, res) => {
    const { uid, subject, message, status } = req.body;
    db.query('UPDATE leaves SET uid = ?, subject = ?, message = ?, status = ? WHERE lid = ?',
             [uid, subject, message, status, req.params.lid], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'Leave updated successfully' });
    });
});

app.delete('/leaves/:lid', checkAuthentication, (req, res) => {
    db.query('DELETE FROM leaves WHERE lid = ?', [req.params.lid], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'Leave deleted successfully' });
    });
});

// CRUD API Endpoints for Tasks
app.get('/tasks', checkAuthentication, (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) return handleDatabaseError(res, err);
        res.json(results);
    });
});

app.post('/tasks', checkAuthentication, (req, res) => {
    const { uid, description, start_date, end_date, status } = req.body;
    db.query('INSERT INTO tasks (uid, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
             [uid, description, start_date, end_date, status], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'Task added successfully', taskId: result.insertId });
    });
});

app.put('/tasks/:tid', checkAuthentication, (req, res) => {
    const { uid, description, start_date, end_date, status } = req.body;
    db.query('UPDATE tasks SET uid = ?, description = ?, start_date = ?, end_date = ?, status = ? WHERE tid = ?',
             [uid, description, start_date, end_date, status, req.params.tid], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'Task updated successfully' });
    });
});

app.delete('/tasks/:tid', checkAuthentication, (req, res) => {
    db.query('DELETE FROM tasks WHERE tid = ?', [req.params.tid], (err, result) => {
        if (err) return handleDatabaseError(res, err);
        res.json({ message: 'Task deleted successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
