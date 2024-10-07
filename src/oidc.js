const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const app = express();

global.getOidcIssuerClient = async function () {
  const { Issuer } = require("openid-client");
  // Check if the OIDC client is already cached
  if (!global.oidcIssuerClient) {
    try {
      // Discover the OIDC issuer
      const issuer = await Issuer.discover("http://localhost:3000");

      // Create and cache the OIDC client
      global.oidcIssuerClient = new issuer.Client({
        client_id: "external_app_client_id",
        client_secret: "external_app_client_secret",
        redirect_uris: ["http://localhost:3000/sso/geored/auth/callback"],
        response_types: ["code"],
      });
    } catch (err) {
      console.error("Failed to initialize OIDC client:", err);
      throw new Error("OIDC client initialization failed");
    }
  }

  // Return the cached OIDC client
  return global.oidcIssuerClient;
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for session management
app.use(
  session({
    secret: "your-secret-key", // Change this to a more secure secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // For development, use false. Change to true in production.
  })
);

require("./oidc-issuer")().configure(app);

// Auth route to initiate the login process
app.get("/sso/geored/auth", async (req, res) => {
  try {
    const client = await global.getOidcIssuerClient();
    console.log("OIDC client successfully fetched for authentication");

    const authorizationUrl = client.authorizationUrl({
      response_type: "code",
      client_id: client.client_id,
      redirect_uri: client.redirect_uris[0], // Redirect URIs should be an array
      scope: "openid profile",
    });

    console.log("Generated authorization URL:", authorizationUrl);

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Error during authentication redirect:", error);
    res.status(500).json({ error: "Authentication redirect failed" });
  }
});

app.get("/sso/geored/auth/callback", async (req, res) => {
  const { code } = req.query;
  console.log("Received authorization code:", code);

  try {
    const client = await global.getOidcIssuerClient();
    console.log("OIDC client successfully fetched");

    // Exchange the authorization code for tokens
    const tokenSet = await client.callback(
      "http://localhost:3000/sso/geored/auth/callback", // redirect_uri
      { code,
        grant_type: 'authorization_code',
       },
       {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log("Received token set:", tokenSet);

    // Optionally, you can store the token in the session
    req.session.user = tokenSet.claims(); // Save user info in session, proceed as needed
    console.log("User info stored in session:", req.session.user);

    // Here, you could also send the access token or other info to the frontend
    const response = {
      authenticated: true,
      token: tokenSet.access_token,
      id_token: tokenSet.id_token,
    };
    console.log("Sending response to client:", response);
    res.send(JSON.stringify(response));
  } catch (error) {
    console.error("Error during callback processing:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Route to check authentication status
app.get("/sso/geored/check", (req, res) => {
  if (req.session.user) {
    const externalAppJWT = jwt.sign(
      { sub: req.session.user.sub, ...req.session.user },
      "external_app_secret_key", // Change this to a secure secret
      { expiresIn: "1h" }
    );
    res.json({ authenticated: true, token: externalAppJWT });
  } else {
    res.json({ authenticated: false });
  }
});

// Route to render demo page
app.get("/sso-test", (req, res) => {
  res.send(`
      <html>
        <body>
          <h1>Demo Page</h1>
          <button onclick="openLoginPopup()">Login with Geored</button>
          <script>
            function openLoginPopup() {
              const popup = window.open('http://localhost:3000/sso/geored/auth', 'Login', 'width=600,height=600');
              window.addEventListener('message', (event) => {
                if (event.data.type === 'AUTH_SUCCESS') {
                  const token = event.data.token;
                  // Use the token in your external app
                  console.log('Received token:', token);
                  popup.close();
                }
              });
            }
          </script>
        </body>
      </html>
    `);
});

app.get("/", (req, res) => {
  res.redirect("/sso-test");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`OIDC Geored running on http://localhost:${PORT}`)
);
