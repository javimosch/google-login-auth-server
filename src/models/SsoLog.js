const mongoose = require("mongoose");

const SsoLogSchema = new mongoose.Schema({
  dt: {
    type: Date,
    default: Date.now
  },
  message: String,
  provider: String,
  app: String,
  clientId: String,
  data: {},
});

module.exports = mongoose.model("SsoLog", SsoLogSchema);