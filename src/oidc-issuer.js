const jwt = require("jsonwebtoken");

// Example issuer URL
const issuerUrl = "http://localhost:3000";

// Add this below your existing code in the useOidcIssuer function
const authUsers = {
  // For demonstration purposes, this is hardcoded. In practice, you'd check a database.
  "user@example.com": "password123",
};

module.exports = function useOidcIssuer() {
  return {
    configure(app) {
      const jwk = require("jwk");
      const { pki } = require("node-forge");

      // Generate key pair for signing JWTs
      const keyPair = pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

      // Convert keys to PEM
      const privateKeyPem = pki.privateKeyToPem(keyPair.privateKey);
      const publicKeyPem = pki.publicKeyToPem(keyPair.publicKey);

        // Convert public key to JWK
  const publicKeyJwk = jwk.pem2jwk(publicKeyPem);

  // Add required properties for JWKS
  publicKeyJwk.kid = "1";  // Key ID
  publicKeyJwk.use = "sig";  // Key usage
  publicKeyJwk.alg = "RS256";  // Algorithm

      // JWKS endpoint
      app.get(`/oidc-issuer/openid/v1/jwks`, (req, res) => {
        const keyset = {
          keys: [publicKeyJwk],
        };
        res.json(keyset);
      });


      // Example implementation of the `.well-known/openid-configuration` endpoint
      app.get(`/.well-known/openid-configuration`, (req, res) => {
        const config = {
          issuer: issuerUrl,
          authorization_endpoint: `${issuerUrl}/oidc-issuer/auth`,
          token_endpoint: `${issuerUrl}/oidc-issuer/token`,
          jwks_uri: `${issuerUrl}/oidc-issuer/openid/v1/jwks`,
        };
        res.json(config);
      });

      
      // Example authorization endpoint
      //http://localhost:3000/oidc-issuer/auth?client_id=external_app_client_id&scope=openid%20profile&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fsso%2Fgeored%2Fauth%2Fcallback
      app.get(`/oidc-issuer/auth`, (req, res) => {
        const { client_id, redirect_uri, response_type, scope } = req.query;

        // Check if we received a valid request
        if (response_type !== "code") {
          return res.status(400).send("Invalid response type");
        }

        // In a real scenario, you would serve a login form here.
        // But for this example, let's assume the username and password are passed as query parameters for simplicity.

        let { username, password } = req.query; // Replace this with a proper login form POST request handling.

        username = "user@example.com";
        password = "password123";
        if (!username || !password) {
          return res.status(400).send("Missing credentials");
        }

        // Validate credentials
        if (authUsers[username] !== password) {
          return res.status(401).send("Invalid username or password");
        }

        // Generate the authorization code
        const authorizationCode = jwt.sign(
          { iss: issuerUrl, sub: username, client_id: client_id,
            //aud: "profile", 
           },
          privateKeyPem,
          {
            algorithm: "RS256",
            expiresIn: "10m", // Short expiration for the auth code
          }
        );

        // Redirect to the provided redirect_uri with the authorization code
        const redirectUriWithCode = `${redirect_uri}?code=${authorizationCode}`;

        // Optional: include a state parameter for security
        // const state = req.query.state ? req.query.state : '';
        // const redirectUriWithCode = `${redirect_uri}?code=${authorizationCode}&state=${state}`;

        res.redirect(redirectUriWithCode);
      });

      // Example token endpoint
      app.post("/oidc-issuer/token", (req, res) => {
        // Handle token requests and grant access tokens in exchange for authorization codes
        console.log("POST /oidc-issuer/token request received");

        const { code, grant_type, client_id, client_secret, redirect_uri } =
          req.body;

        console.log("Request body:", req.body);

        if (grant_type !== "authorization_code") {
          console.log("Invalid grant type:", grant_type);
          res.status(400).json({ error: "Invalid grant type" });
          return;
        }

        console.log("Grant type is authorization_code");

        /* // Validate the client and redirect URI
        if (!validateClient(client_id, client_secret, redirect_uri)) {
    console.log("Invalid client credentials:", { client_id, client_secret, redirect_uri });
          res.status(401).json({ error: "Invalid client credentials" });
          return;
        } */

        console.log("Client credentials are valid");

        // Generate access token and id token
        const accessToken = jwt.sign(
          { sub: "user123", iss: issuerUrl,aud: "external_app_client_id",  },
          privateKeyPem,
          {
            algorithm: "RS256",
            expiresIn: "1h",
          }
        );
        const idToken = jwt.sign(
          { sub: "user123", iss: issuerUrl,aud: "external_app_client_id",  },
          privateKeyPem,
          {
            algorithm: "RS256",
            expiresIn: "1h",
          }
        );

        console.log("Generated tokens:", { accessToken, idToken });

        res.json({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          id_token: idToken,
        });
      });

      /* // Example function to validate client credentials and redirect URI
      function validateClient(clientId, clientSecret, redirectUri) {
        // Implement your client validation logic here
        // For demonstration purposes, this is a simple check
        return (
          clientId === "your_client_id" &&
          clientSecret === "your_client_secret" &&
          redirectUri === "http://localhost:3000/sso/geored/auth/callback"
        );
      } */
    },
  };
};
