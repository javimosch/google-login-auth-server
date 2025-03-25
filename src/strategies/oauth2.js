const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2").Strategy;

passport.use(new OAuth2Strategy({
  authorizationURL: process.env.CUSTOM_AUTH_URL,
  tokenURL: process.env.CUSTOM_TOKEN_URL,
  clientID: process.env.CUSTOM_CLIENT_ID,
  clientSecret: process.env.CUSTOM_CLIENT_SECRET,
  callbackURL: process.env.CUSTOM_CALLBACK_URL,
  scope: ["openid", "profile", "email"],  // Scopes par défaut standard OpenID Connect
  state: true
}, (accessToken, refreshToken, profile, done) => {
  // Personnalisation du profil à partir des données reçues
  return done(null, profile);
}));