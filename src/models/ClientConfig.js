const mongoose = require("mongoose");
const { encrypt, decrypt } = require('../utils/cryptoUtils');

const ClientConfigSchema = new mongoose.Schema({
  clientName: String,
  clientId: String,
  clientSecret: {
    type: String,
    set: function(v) {
      if (v) {
        return encrypt(v);
      }

      return null;
    },
    get: function(v) {
      if (v) {
        return decrypt(v);
      }

      return null;
    }
  },
  authorizationURL: String,
  tokenURL: String,
  userInfoURL: String,
  audience: String,
  scopes: [String],
  applications: [String],
  provider: String // "google", "gitlab", "keycloak", etc.
});
ClientConfigSchema.set('toObject', { getters: true });
ClientConfigSchema.set('toJSON', { getters: true });

module.exports = mongoose.model("ClientConfig", ClientConfigSchema);