const mongoose = require("mongoose");
const { encrypt, decrypt } = require('../utils/cryptoUtils');

const ClientConfigSchema = new mongoose.Schema({
  clientName: String,
  clientId: String,
  clientSecret: {
    type: String,
    set: function(v) {
      return encrypt(v);
    },
    get: function(v) {
      return decrypt(v);
    }
  },
  authorizationURL: String,
  tokenURL: String,
  userInfoURL: String,
  scopes: [String],
  applications: [String],
  provider: String // "google", "github", "keycloak", etc.
});
ClientConfigSchema.set('toObject', { getters: true });
ClientConfigSchema.set('toJSON', { getters: true });

module.exports = mongoose.model("ClientConfig", ClientConfigSchema);