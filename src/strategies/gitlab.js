const passport = require("passport");
const GitLabStrategy = require("passport-gitlab2").Strategy;

passport.use(new GitLabStrategy({
  clientID: process.env.GITLAB_CLIENT_ID,
  clientSecret: process.env.GITLAB_CLIENT_SECRET,
  callbackURL: process.env.GITLAB_CALLBACK_URL,
  baseURL: "https://gitlab.com",
  scope: ["read_user", "email"]  // Scopes par défaut
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));