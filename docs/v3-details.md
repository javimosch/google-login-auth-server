# Version 3 Implementation Details for Custom SSO Support

## Overview
This document outlines the implementation details for integrating custom Single Sign-On (SSO) support into the application. It will detail the libraries used, the specific implementation steps, and considerations for ensuring a smooth integration. Additionally, the current application will also act as the custom SSO provider and support multiple custom SSO configurations.

## Libraries Used
To facilitate the implementation of custom SSO, the following libraries will be leveraged:

1. **Express**: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
   - **Installation**: `npm install express`

2. **Passport.js**: A popular middleware for Node.js that simplifies the process of implementing various authentication strategies, including SSO.
   - **Installation**: `npm install passport passport-custom`

3. **Axios**: A promise-based HTTP client for the browser and Node.js, used for making API requests to the custom SSO provider.
   - **Installation**: `npm install axios`

4. **dotenv**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`, useful for managing sensitive information like API keys.
   - **Installation**: `npm install dotenv`

## Implementation Steps
### 1. Configure Environment Variables
Create a `.env` file in the root of the project to store sensitive information for multiple custom SSO providers:
```
CUSTOM_SSO_CLIENT_ID_APP1=your_custom_sso_client_id_app1
CUSTOM_SSO_CLIENT_SECRET_APP1=your_custom_sso_client_secret_app1
CUSTOM_SSO_REDIRECT_URI_APP1=http://localhost:3000/custom-sso/app1/callback

CUSTOM_SSO_CLIENT_ID_APP2=your_custom_sso_client_id_app2
CUSTOM_SSO_CLIENT_SECRET_APP2=your_custom_sso_client_secret_app2
CUSTOM_SSO_REDIRECT_URI_APP2=http://localhost:3000/custom-sso/app2/callback
```

### 2. Set Up Passport.js for Multiple Custom SSO Providers
In your main application file (e.g., `src/server.js`), configure Passport.js to use a custom strategy for each SSO provider:
```javascript
const passport = require('passport');
const CustomStrategy = require('passport-custom').Strategy;

passport.use('custom-sso-app1', new CustomStrategy((req, done) => {
    // Implement custom SSO logic for App 1 here
}));

passport.use('custom-sso-app2', new CustomStrategy((req, done) => {
    // Implement custom SSO logic for App 2 here
}));
```

### 3. Create Routes for Custom SSO
Add the following routes to your `src/routes/auth.js` file:
```javascript
// Initiate Custom SSO for App 1
router.get('/custom-sso/app1', (req, res) => {
    const redirectUri = process.env.CUSTOM_SSO_REDIRECT_URI_APP1;
    const url = `http://localhost:3000/custom-sso/app1/auth?client_id=${process.env.CUSTOM_SSO_CLIENT_ID_APP1}&redirect_uri=${redirectUri}`;
    res.redirect(url);
});

// Handle Custom SSO Callback for App 1
router.get('/custom-sso/app1/callback', passport.authenticate('custom-sso-app1', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
});

// Custom SSO Authentication Logic for App 1
router.get('/custom-sso/app1/auth', (req, res) => {
    // Here, implement the logic to authenticate the user with the custom SSO provider for App 1
});

// Repeat similar routes for App 2
// Initiate Custom SSO for App 2
router.get('/custom-sso/app2', (req, res) => {
    const redirectUri = process.env.CUSTOM_SSO_REDIRECT_URI_APP2;
    const url = `http://localhost:3000/custom-sso/app2/auth?client_id=${process.env.CUSTOM_SSO_CLIENT_ID_APP2}&redirect_uri=${redirectUri}`;
    res.redirect(url);
});

// Handle Custom SSO Callback for App 2
router.get('/custom-sso/app2/callback', passport.authenticate('custom-sso-app2', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
});

// Custom SSO Authentication Logic for App 2
router.get('/custom-sso/app2/auth', (req, res) => {
    // Here, implement the logic to authenticate the user with the custom SSO provider for App 2
});
```

### 4. Linking Accounts
Implement the logic for linking accounts in the `/link-custom-account` route, similar to the existing Google linking logic, ensuring it can handle multiple SSO providers.

### 5. Acting as Custom SSO Provider
Modify the application to handle authentication requests directly. The application will now act as the custom SSO provider, handling user authentication and issuing tokens for multiple applications:
- Implement user authentication logic in the `/custom-sso/app1/auth` and `/custom-sso/app2/auth` routes.
- Generate and return a token upon successful authentication for each application.

## Testing
Ensure to test the new routes and integration thoroughly. Use tools like Postman to simulate requests to the custom SSO providers and validate the responses for each application.

## Conclusion
By following these steps and utilizing the specified libraries, the application will be equipped to support multiple custom SSO configurations while also acting as the custom SSO provider, enhancing its flexibility and integration capabilities.