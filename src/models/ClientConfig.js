const mongoose = require("mongoose");

const ClientConfigSchema = new mongoose.Schema({
  clientName: String,
  clientId: String,
  clientSecret: String,
  domain: [String],
  authorizationURL: String,
  tokenURL: String,
  userInfoURL: String,
  redirectURI: String,
  scopes: [String],
  applications: [String],
  provider: String // "google", "github", "keycloak", etc.
});

module.exports = mongoose.model("ClientConfig", ClientConfigSchema);