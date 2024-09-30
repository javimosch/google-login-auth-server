require("dotenv").config(); // Activate dotenv
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const Chance = require("chance");
const apiAuthMiddleware = require("./apiAuthMiddleware");

const jwt = require("jsonwebtoken");

// Initialize Chance
const chance = new Chance();

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
  let token = req.header("Authorization")?.split(" ")[1];

  // Fallback to query parameter if token is not found in header
  if (!token) {
    token = req.query._token;
  }

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const app = express();
const port = 3001;

// Setup SQLite Database using a file
const dbFilePath = "./tmp/database.sqlite";
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(`Connected to the SQLite database at ${dbFilePath}`);
  }
});
console.log("db init");

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
console.log("db serialized");

// Middleware to parse JSON
app.use(express.json());

// CRUD Functions for Users

// Create User
const createUser = (email, name, clientId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (email, name, clientId) VALUES (?, ?, ?)`,
      [email, name, clientId],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve({ id: this.lastID, email, name, clientId });
      }
    );
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
    db.run(
      `UPDATE users SET email = ?, name = ?, clientId = ? WHERE id = ?`,
      [email, name, clientId, id],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve({ id, email, name, clientId });
      }
    );
  });
};

// Delete User
const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE id = ?`, id, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

// Create Client
const createClient = (name) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO clients (name) VALUES (?)`, [name], function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ id: this.lastID, name });
    });
  });
};

// This is how you can implement the getClientsCount and getUsersCount functions
const getClientsCount = async () => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM clients`, [], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row.count);
    });
  });
};

const getUsersCount = async () => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM users`, [], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row.count);
    });
  });
};

// Function to migrate clients and users
const migrateData = async () => {
  console.log("Starting data migration..."); // Log start of migration
  // Check if there are any clients or users in the database
  const existingClients = await getClientsCount(); // This function should return the count of clients in the database
  const existingUsers = await getUsersCount(); // This function should return the count of users in the database

  console.log(
    `Existing clients: ${existingClients}, Existing users: ${existingUsers}`
  ); // Log existing counts

  if (existingClients > 0 || existingUsers > 0) {
    console.log(
      "Migration not performed: Clients or users already exist in the database."
    );
    return;
  }

  // Generate random clients and insert them
  const clientPromises = Array.from({ length: 4 }, (_, index) => {
    const clientName = index === 0 ? "sabatier" : chance.company();
    return createClient(clientName);
  });

  const clients = await Promise.all(clientPromises);
  console.log("Clients created:", clients);

  const fakeUsers = Array.from({ length: 9 }, () => {
    const email = chance.email();
    const name = chance.name();
    const clientId = clients[Math.floor(Math.random() * clients.length)].id; // Assign random clientId
    return { email, name, clientId };
  });

  // Add the specified user with a specific clientId
  const specifiedClientId = clients[0].id; // Assign to the first client for consistency
  fakeUsers.push({
    email: "arancibiajav@gmail.com",
    name: "Aranci Biajav",
    clientId: specifiedClientId,
  });

  for (const user of fakeUsers) {
    try {
      await createUser(user.email, user.name, user.clientId);
      console.log(`User created: ${user.email}`); // Log each created user
    } catch (err) {
      console.error(`Error creating user ${user.email}:`, err.message);
    }
  }
  console.log("Data migration completed."); // Log completion of migration
};

// Call the migrateData function to seed the database
migrateData();

/**
 * @swagger
 * /googleauth/external-id:
 *   post:
 *     summary: Get external identifier by username and client name
 *     description: Retrieve the external user identifier based on the provided username, client name, and password (mock).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's email (username) to look up.
 *               clientName:
 *                 type: string
 *                 description: The name of the client associated with the user.
 *               password:
 *                 type: string
 *                 description: The user's password (for mock purposes, not processed).
 *     responses:
 *       200:
 *         description: Successfully retrieved external user identifier.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 externalId:
 *                   type: string
 *                   description: A string combining userId and clientId (formatted as `userId_clientId`).
 *       400:
 *         description: Missing required parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating that required parameters are missing.
 *       403:
 *         description: Client name does not match the user's associated client.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating that the client name does not match.
 *       404:
 *         description: User not found based on the provided username.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating that the user was not found.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 */
app.post("/googleauth/external-id", apiAuthMiddleware, async (req, res) => {
  const { username, clientName, password } = req.body; // Accept password

  console.log("/googleauth/external-id", { username, clientName, password }); // Log for debugging

  // Validate required fields
  if (!username || !clientName) {
    return res.status(400).json({
      error: "Username and clientName are required.",
    });
  }

  try {
    // Query to find the user based on the provided username and retrieve their clientId
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, clientId FROM users WHERE email = ?`,
        [username],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    // If the user does not exist, return an error
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Now verify that the clientId matches the provided clientName
    const client = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM clients WHERE name = ?`,
        [clientName],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        }
      );
    });

    // Check if the user belongs to the matched client
    if (!client || client.id !== user.clientId) {
      console.log({
        client,
        user
      })
      return res
        .status(403)
        .json({ error: "Client name does not match the user's client." });
    }

    // Calculate the external ID
    const externalId = `${user.id}_${client.id}`;

    // Return the external ID
    return res.json({ externalId });
  } catch (error) {
    console.error("Error fetching external ID:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// external-app/api/index.js (291-406)
/**
 * @swagger
 * /googleauth/get_jwt:
 *   get:
 *     summary: Get JWT Token
 *     description: Retrieve a JWT token for a user based on their externalUserId.
 *     parameters:
 *       - in: query
 *         name: externalUserId
 *         required: true
 *         description: The externalUserId consisting of userId and clientId in the format userId_clientId.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful JWT token generation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The generated JWT token.
 *       400:
 *         description: Missing or invalid externalUserId format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating invalid externalUserId format or missing parameters.
 *       404:
 *         description: User not found based on the provided userId.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating no user was found.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating internal server error.
 */
app.get("/googleauth/get_jwt", apiAuthMiddleware, async (req, res) => {
  const { externalUserId } = req.query;

  console.log("/googleauth/get_jwt", { query: req.query });

  // Validate required field
  if (!externalUserId) {
    return res.status(400).json({
      error: "externalUserId is required.",
    });
  }

  // Validate externalUserId structure
  if (!externalUserId.includes("_")) {
    return res.status(400).json({
      error: "Invalid externalUserId format. Expected format: userId_clientId.",
    });
  }

  try {
    const token = await generateJwtToken(externalUserId);
    return res.json({ token });
  } catch (error) {
    console.error("Error generating JWT:", error.message);
    if (error.message === "User not found.") {
      return res.status(404).json({ error: error.message });
    } else if (
      error.message === "Client ID does not match the user's client."
    ) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});


/**
 * Generates a JSON Web Token (JWT) for an external user based on their user ID.
 *
 * @param {string} externalUserId - The external user ID in the format "userId_clientId".
 * @returns {Promise<string>} A Promise that resolves to the generated JWT.
 * @throws {Error} Throws an error if the user is not found or if the client ID does not match.
 */
const generateJwtToken = async (externalUserId) => {
  // Split externalUserId to get userId and clientId
  const [userId, clientId] = externalUserId.split("_");

  console.log('generateJwtToken',{
    userId,
    clientId
  })

  // Verify the user exists with the provided userId
  const user = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, email, clientId FROM users WHERE id = ?`,
      [parseInt(userId)],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      }
    );
  });

  // If the user does not exist, throw an error
  if (!user) {
    throw new Error("User not found.");
  }

  // Check if the clientId matches the user's clientId in the database
  if (user.clientId !== parseInt(clientId)) {
    throw new Error("Client ID does not match the user's client.");
  }

  // Generate JWT
  const payload = { userId: user.id, email: user.email }; // Include email if needed
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // Token expires in 1 hour

  return token;
};

// Add the Hello World route
app.get("/", authenticateJWT, (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
