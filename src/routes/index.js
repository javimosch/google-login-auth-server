const express = require('express');
const router = express.Router();
const ClientConfig = require("../models/ClientConfig");
const SsoLog = require("../models/SsoLog");

router.get('/', async (req, res) => {
  // Filter out IDP apps (those with openidProvider=1)
  let message = ''
  if (!req.query.clientId) {
    message = "Parameter clientId is missing"
  } else {
    try {
      const config = await ClientConfig.findOne({_id: req.query.clientId});
      if (!config) message = `Client ID (${req.query.clientId}) unknown`
    } catch (error) {
      message = `Client ID (${req.query.clientId}) unknown`;
    }
    const ssoLog = new SsoLog({
      message: message === '' ? `Connection attempt with config ID ${req.query.clientId}.` : message,
      clientId: req.query.clientId,
    });
    await ssoLog.save();
  }
  res.render('index', {
    apps: global.applications.filter(a => !a.openidProvider),
    message: message,
    configId: req.query.clientId ?? '',
    idps: global.applications.filter(a => a.openidProvider)
  });
});

module.exports = router;