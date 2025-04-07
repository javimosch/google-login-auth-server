const mongoose = require("mongoose");

const SsoLogSchema = new mongoose.Schema({
  dt: {
    type: Date,
    default: Date.now
  },
  message: String,
  provider: String,
  app: String,
  configId: String,
  attemptId: String,
  clientName: String,
  error: {
    type: Boolean,
    default: false
  },
  data: {},
});

SsoLogSchema.index({ dt:1, app: 1 });
SsoLogSchema.index({ dt:1, clientName: 1 });
SsoLogSchema.index({ dt:1, provider: 1 });
SsoLogSchema.index({ dt:1, error: 1, clientName: 1 });
SsoLogSchema.index({ attemptId: 1 });

module.exports = mongoose.model("SsoLog", SsoLogSchema);

async function saveSsoLog(data) {
  try {
    ssoLog = new mongoose.model('SsoLog')(data)
    await ssoLog.save()
  } catch (error) {
    console.error('error when trying to save log in mongo', error)
  }
}

global.saveSsoLog = saveSsoLog