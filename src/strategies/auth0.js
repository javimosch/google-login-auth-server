const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

passport.use(new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,        // Votre domaine Auth0 (ex: 'dev-xxx.auth0.com')
  clientID: process.env.AUTH0_CLIENT_ID,   // ID client de votre application Auth0
  clientSecret: process.env.AUTH0_CLIENT_SECRET, // Secret client de votre application Auth0
  callbackURL: process.env.AUTH0_CALLBACK_URL,  // URL de callback (ex: 'http://localhost:3000/callback')
  state: true,
  scope: ["openid", "profile", "email"]  // Scopes par défaut
}, (accessToken, refreshToken, extraParams, profile, done) => {
  return done(null, profile);
}));