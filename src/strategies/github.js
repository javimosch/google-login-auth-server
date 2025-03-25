const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  scope: ["user:email"]  // Scope par défaut pour obtenir l'email
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));