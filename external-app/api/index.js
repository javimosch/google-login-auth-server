const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const faker = require('faker');

const app = express();
const port = 3001;

// Setup SQLite Database using a file
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
});

// Create clients and users tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  )`);

  // Create users table with clientId field
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    clientId INTEGER,
    FOREIGN KEY (clientId) REFERENCES clients (id)
  )`);

  // Create users_google table with foreign key to users table
  db.run(`CREATE TABLE IF NOT EXISTS users_google (
    userId INTEGER,
    googleEmail TEXT UNIQUE,
    googleMetadata TEXT,
    FOREIGN KEY (userId) REFERENCES users (id)
  )`);
});

// Middleware to parse JSON
app.use(express.json());

// CRUD Functions for Users

// Create User
const createUser = (email, name, clientId) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (email, name, clientId) VALUES (?, ?, ?)`, [email, name, clientId], function(err) {
      if (err) {
        return reject(err);
      }
      resolve({ id: this.lastID, email, name, clientId });
    });
  });
};

// Read Users
const readUsers = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM users`, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
};

// Update User
const updateUser = (id, email, name, clientId) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET email = ?, name = ?, clientId = ? WHERE id = ?`, [email, name, clientId, id], function(err) {
      if (err) {
        return reject(err);
      }
      resolve({ id, email, name, clientId });
    });
  });
};

// Delete User
const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE id = ?`, id, function(err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

// Create Client
const createClient = (name) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO clients (name) VALUES (?)`, [name], function(err) {
      if (err) {
        return reject(err);
      }
      resolve({ id: this.lastID, name });
    });
  });
};

// Function to migrate clients and users
const migrateData = async () => {
  // Generate random clients and insert them
  const clientPromises = Array.from({ length: 4 }, () => {
    const clientName = faker.company.companyName();
    return createClient(clientName);
  });

  const clients = await Promise.all(clientPromises);
  console.log('Clients created:', clients);

  const fakeUsers = Array.from({ length: 9 }, () => {
    const email = faker.internet.email();
    const name = faker.name.findName();
    const clientId = clients[Math.floor(Math.random() * clients.length)].id; // Assign random clientId
    return { email, name, clientId };
  });

  // Add the specified user with a specific clientId
  const specifiedClientId = clients[0].id; // Assign to the first client for consistency
  fakeUsers.push({
    email: 'arancibiajav@gmail.com',
    name: 'Aranci Biajav',
    clientId: specifiedClientId,
  });

  for (const user of fakeUsers) {
    try {
      await createUser(user.email, user.name, user.clientId);
    } catch (err) {
      console.error(`Error creating user ${user.email}:`, err.message);
    }
  }
};

// Call the migrateData function to seed the database
migrateData();

app.get('/', (req, res) => {
  res.send('Hello World 2');
});

/**
 * @swagger
 * /external-id/{googleEmail}:
 *   get:
 *     summary: Get user identifier by Google email
 *     description: Retrieve the user id and client id associated with a provided Google email address.
 *     parameters:
 *       - in: path
 *         name: googleEmail
 *         required: true
 *         description: The Google email address to look up.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user identifier.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 identifier:
 *                   type: string
 *                   description: A string combining userId and clientId (formatted as `userId_clientId`).
 *       500:
 *         description: Internal Server Error
 */
app.get('/external-id/:googleEmail', async (req, res) => {
  const googleEmail = req.params.googleEmail;

  try {
    // Query the users_google table to find the userId using the provided googleEmail
    const result = await new Promise((resolve, reject) => {
      db.get(`
        SELECT users.id AS userId, users.clientId 
        FROM users_google 
        JOIN users ON users_google.userId = users.id 
        WHERE users_google.googleEmail = ?`, 
        [googleEmail],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    // If a matching record is found, return the combined result
    if (result) {
      return res.json({ identifier: `${result.userId}_${result.clientId}` });
    } else {
      return res.json({ identifier: null });
    }
  } catch (error) {
    console.error('Error fetching user by googleEmail:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


/**
 * @swagger
 * /link-google-email:
 *   post:
 *     summary: Link a Google email to an existing user
 *     description: This endpoint links a given Google email to an existing user identified by their email. If the link already exists, it returns a success message.
 *     parameters:
 *       - in: body
 *         name: linkGoogleEmail
 *         description: The googleEmail to link with the userEmail
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             googleEmail:
 *               type: string
 *               example: user@gmail.com
 *             userEmail:
 *               type: string
 *               example: arancibiajav@gmail.com
 *             googleMetadata: 
 *               type: string
 *               example: '{"someKey": "someValue", "anotherKey": "anotherValue"}'
 *     responses:
 *       200:
 *         description: Google email already linked.
 *       201:
 *         description: Google email linked successfully.
 *       400:
 *         description: Both googleEmail and userEmail are required.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal Server Error.
 *
 * @example
  curl -X POST \
  http://localhost:3001/link-google-email \
  -H "Content-Type: application/json" \
  -d '{"googleEmail": "arancibiajav@gmail.com", "userEmail": "arancibiajav@gmail.com", "googleMetadata": "{\"someKey\": \"someValue\"}"}'
 */
  app.post('/link-google-email', async (req, res) => {
    const { googleEmail, userEmail, googleMetadata } = req.body;
  
    // Validate required fields
    if (!googleEmail || !userEmail) {
      return res.status(400).json({ error: 'Both googleEmail and userEmail are required.' });
    }
  
    try {
      // Check if the user exists
      const user = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id FROM users WHERE email = ?`,
          [userEmail],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row);
          }
        );
      });
  
      // Handle case where user not found
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      // Check if the link already exists in users_google
      const existingLink = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM users_google WHERE googleEmail = ? AND userId = ?`,
          [googleEmail, user.id],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row);
          }
        );
      });
  
      if (existingLink) {
        // If the link already exists, update the googleMetadata
        await new Promise((resolve, reject) => {
          db.run(
            `UPDATE users_google SET googleMetadata = ? WHERE googleEmail = ? AND userId = ?`,
            [googleMetadata || null, googleEmail, user.id],
            function(err) {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });
        return res.status(200).json({ message: 'Google email metadata updated successfully.' });
      }
  
      // If the link doesn't exist, create a new record in users_google
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users_google (userId, googleEmail, googleMetadata) VALUES (?, ?, ?)`,
          [user.id, googleEmail, googleMetadata || null], // Store null if googleMetadata is not provided
          function(err) {
            if (err) {
              return reject(err);
            }
            resolve();
          }
        );
      });
  
      res.status(201).json({ message: 'Google email linked successfully.' });
    } catch (error) {
      console.error('Error linking google email:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });
  


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
