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
 * /googleauth/external-id/{googleEmail}:
 *   get:
 *     summary: Get user identifier by Google email
 *     description: Retrieve the user id and client id associated with a provided Google email address.
 *     parameters:
 *       - in: path
 *         name: googleEmail
 *         required: true,
 *         description: The Google email address to look up.
 *         schema:
           type: string
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
app.get(
  "/googleauth/external-id/:googleEmail",
  apiAuthMiddleware,
  async (req, res) => {
    const googleEmail = req.params.googleEmail;

    try {
      // Query the users_google table to find the userId using the provided googleEmail
      const result = await new Promise((resolve, reject) => {
        db.get(
          `
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
      console.error("Error fetching user by googleEmail:", error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

/**
 * @swagger
 * /googleauth/get_jwt:
 *   get:
 *     summary: Get JWT Token
 *     description: Retrieve a JWT token for a user based on their Google email.
 *     parameters:
 *       - in: query
 *         name: googleEmail
 *         required: true,
 *         schema:
 *           type: string
 *         description: The Google email of the user to authenticate.
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
 *         description: Missing required parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating the parameter that is missing.
 *       404:
 *         description: User not found based on the provided Google email.
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
  const { googleEmail } = req.query;

  console.log("/googleauth/get_jwt", { query: req.query });

  if (!googleEmail) {
    return res.status(400).json({ error: "googleEmail is required." });
  }

  try {
    const { token, error } = await getJwtByGoogleEmail(googleEmail);
    if (error) {
      return res.json({ token, error });
    }
    return res.json({ token });
  } catch (error) {
    console.error("Error generating JWT:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

async function getJwtByGoogleEmail(googleEmail) {
  // Find the userId using the provided googleEmail
  const result = await new Promise((resolve, reject) => {
    db.get(
      `
          SELECT userId FROM users_google 
          WHERE googleEmail = ?`,
      [googleEmail],
      (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      }
    );
  });

  // If a matching record is found, issue a JWT
  if (result) {
    const payload = { userId: result.userId, googleEmail };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Token expires in 1 hour
    return { token };
  } else {
    return { token: null, error: "USER_NOT_FOUND" };
  }
}

// Define the /googleauth/verify_account route
app.post("/googleauth/link", apiAuthMiddleware, async (req, res) => {
  try {
    const { client, username, password, googleEmail } = req.body;

    console.log("/googleauth/link", {
      client,
      username,
      password,
      googleEmail,
    });

    // Validate required fields
    if (!client || !username || !googleEmail) {
      return res
        .status(400)
        .json({ error: "Client, username, and googleEmail are required." });
    }

    // First, validate the username and client name against the database
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

    // Now verify the client name matches the user's associated client
    const clientMatch = await new Promise((resolve, reject) => {
      db.get(`SELECT id FROM clients WHERE name = ?`, [client], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });

    //VERIFICATION
    // Check if the user belongs to the matched client
    if (!clientMatch || clientMatch.id !== user.clientId) {
      return res
        .status(403)
        .json({ error: "Client name does not match the user's client." });
    }

    //LINKING
    // If matches, call the internal link-google-email logic
    // Here you can simply call the insert function to link Google email
    const googleMetadata = null; // Assuming no metadata, can change based on requirement
    const linkRes = await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users_google (userId, googleEmail, googleMetadata) VALUES (?, ?, ?)`,
        [user.id, googleEmail, googleMetadata],
        function (err) {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });

    //TOKEN GEN
    let { token } = await getJwtByGoogleEmail(googleEmail);

    // If everything goes well, respond with a success message
    res
      .status(201)
      .json({ message: "Google email linked successfully.", token });
  } catch (error) {
    console.error("Error verifying account:", {
      error,
    });
    res.status(500).send("Internal Server Error");
  }
});

// Add the Hello World route
app.get("/", authenticateJWT, (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
